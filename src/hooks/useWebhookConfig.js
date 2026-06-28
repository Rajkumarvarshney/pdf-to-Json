import { useState, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'

const DEFAULT_CONFIG = {
  method: 'POST',
  authType: 'none', // 'none' | 'bearer' | 'apikey'
  authToken: '',
  customHeaders: [], // [{ id, key, value }]
  payloadWrapper: '',
  metadata: {
    fileName: true,
    fileType: true,
    timestamp: true,
    totalPages: false
  },
  isDryRun: false
}

export function useWebhookConfig(extractedJson, docMetadata) {
  // 1. Webhook URL State
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('docparse_webhook_url') || ''
  })

  // Save webhookUrl to localStorage
  useEffect(() => {
    localStorage.setItem('docparse_webhook_url', webhookUrl)
  }, [webhookUrl])

  // 2. Advanced Configuration State
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('docparse_webhook_config')
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG
  })

  // Debounced save for advanced configuration
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('docparse_webhook_config', JSON.stringify(config))
    }, 400)
    return () => clearTimeout(handler)
  }, [config])

  // 3. Delivery Log State (Session Storage)
  const [deliveryLog, setDeliveryLog] = useState(() => {
    const saved = sessionStorage.getItem('docparse_delivery_log')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    sessionStorage.setItem('docparse_delivery_log', JSON.stringify(deliveryLog))
  }, [deliveryLog])

  // 4. Send Status & Error Indicators
  const [sendStatus, setSendStatus] = useState('IDLE') // 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'
  const [sendError, setSendError] = useState(null)
  const [dryRunPanel, setDryRunPanel] = useState(null) // { success: boolean, message: string, sizeKb?: number, errors?: string[] }

  const updateConfig = useCallback((updates) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const updateMetadataConfig = useCallback((key, value) => {
    setConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }))
  }, [])

  const addCustomHeader = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      customHeaders: [...prev.customHeaders, { id: nanoid(), key: '', value: '' }]
    }))
  }, [])

  const updateCustomHeader = useCallback((id, key, value) => {
    setConfig(prev => ({
      ...prev,
      customHeaders: prev.customHeaders.map(h => h.id === id ? { ...h, key, value } : h)
    }))
  }, [])

  const removeCustomHeader = useCallback((id) => {
    setConfig(prev => ({
      ...prev,
      customHeaders: prev.customHeaders.filter(h => h.id !== id)
    }))
  }, [])

  const clearDeliveryLog = useCallback(() => {
    setDeliveryLog([])
    sessionStorage.removeItem('docparse_delivery_log')
  }, [])

  // 5. Payload Builder Utility
  const buildPayload = useCallback(() => {
    if (!extractedJson) return {}

    const payload = {}

    // Injected metadata
    if (config.metadata.fileName && docMetadata?.fileName) {
      payload.fileName = docMetadata.fileName
    }
    if (config.metadata.fileType && docMetadata?.fileType) {
      payload.fileType = docMetadata.fileType
    }
    if (config.metadata.timestamp) {
      payload.extractedAt = new Date().toISOString()
    }
    if (config.metadata.totalPages && docMetadata?.totalPages) {
      payload.totalPages = docMetadata.totalPages
    }

    // Wrap extraction data under a wrapper key if specified
    if (config.payloadWrapper && config.payloadWrapper.trim() !== '') {
      payload[config.payloadWrapper.trim()] = extractedJson
    } else {
      // Otherwise, spread extraction data at root level
      Object.assign(payload, extractedJson)
    }

    return payload
  }, [extractedJson, docMetadata, config])

  // 6. Webhook POST Dispatcher / Dry Run Validator
  const sendWebhook = async () => {
    setSendError(null)
    setDryRunPanel(null)
    
    // Front validation
    if (!webhookUrl.trim() && !config.isDryRun) {
      setSendError('Only HTTPS webhook URLs are allowed')
      return
    }

    if (!webhookUrl.toLowerCase().startsWith('https://') && !config.isDryRun) {
      setSendError('Webhook URL must use HTTPS')
      return
    }

    const payload = buildPayload()
    const payloadSize = new Blob([JSON.stringify(payload)]).size

    // A. Dry Run Mode
    if (config.isDryRun) {
      setSendStatus('LOADING')
      await new Promise(r => setTimeout(r, 600)) // fluid transition

      try {
        // Validation Checks
        const roundTrip = JSON.parse(JSON.stringify(payload))
        const isSerializable = JSON.stringify(payload) !== undefined
        const maxLimitBytes = 10 * 1024 * 1024 // 10MB
        
        if (!isSerializable) {
          throw new Error('Payload contains non-serializable circular fields')
        }
        
        if (payloadSize > maxLimitBytes) {
          throw new Error(`Payload size of ${(payloadSize / 1024).toFixed(1)} KB exceeds 10MB limit`)
        }

        setSendStatus('SUCCESS')
        setDryRunPanel({
          success: true,
          message: `Payload is valid JSON — ${(payloadSize / 1024).toFixed(1)} KB, ready to send`
        })

        // Log dry-run
        const newLogEntry = {
          id: nanoid(),
          timestamp: new Date(),
          method: config.method,
          urlShort: 'Dry Run Validation',
          status: 'DRY',
          statusText: 'Valid',
          durationMs: 0,
          success: true,
          details: {
            url: 'Local Dry Run Validation',
            headers: [],
            status: 'DRY',
            durationMs: 0,
            payloadSize
          }
        }
        setDeliveryLog(prev => [newLogEntry, ...prev].slice(0, 50))

        setTimeout(() => setSendStatus('IDLE'), 2000)
      } catch (err) {
        setSendStatus('ERROR')
        setDryRunPanel({
          success: false,
          errors: [err.message]
        })
      }
      return
    }

    // B. Real Delivery Mode
    setSendStatus('LOADING')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
    const startTime = performance.now()

    // Setup headers
    const headers = {
      'Content-Type': 'application/json'
    }

    if (config.authType === 'bearer' && config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`
    } else if (config.authType === 'apikey' && config.authToken) {
      headers['x-api-key'] = config.authToken
    }

    for (const h of config.customHeaders) {
      if (h.key && h.key.trim() !== '') {
        headers[h.key.trim()] = h.value || ''
      }
    }

    let urlHostname = 'unknown'
    try {
      urlHostname = new URL(webhookUrl).hostname
    } catch {
      urlHostname = webhookUrl
    }

    try {
      const response = await fetch(webhookUrl, {
        method: config.method,
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const durationMs = Math.round(performance.now() - startTime)
      const success = response.ok

      if (!success) {
        if (response.status >= 400 && response.status < 500) {
          setSendError(`Webhook rejected the request (${response.status}) — check your URL and auth`)
        } else if (response.status >= 500) {
          setSendError(`Webhook server error (${response.status}) — try again or contact the endpoint owner`)
        } else {
          setSendError(`Delivery failed with status code ${response.status}`)
        }
      } else {
        setSendStatus('SUCCESS')
        setTimeout(() => setSendStatus('IDLE'), 2000)
      }

      // Redact auth token value in log headers
      const loggedHeaders = Object.entries(headers).map(([k, v]) => {
        if (k.toLowerCase() === 'authorization' || k.toLowerCase() === 'x-api-key') {
          return { key: k, value: '****' }
        }
        return { key: k, value: String(v) }
      })

      const newLogEntry = {
        id: nanoid(),
        timestamp: new Date(),
        method: config.method,
        urlShort: urlHostname,
        status: response.status,
        statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
        durationMs,
        success,
        details: {
          url: webhookUrl,
          headers: loggedHeaders,
          status: response.status,
          durationMs,
          payloadSize
        }
      }

      setDeliveryLog(prev => [newLogEntry, ...prev].slice(0, 50))
      if (!success) setSendStatus('ERROR')

    } catch (err) {
      clearTimeout(timeoutId)
      const durationMs = Math.round(performance.now() - startTime)
      let errorMessage = 'Could not reach the webhook — check your internet connection'

      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out after 15s — the endpoint may be slow or unreachable'
      }

      setSendError(errorMessage)
      setSendStatus('ERROR')

      const loggedHeaders = Object.entries(headers).map(([k, v]) => {
        if (k.toLowerCase() === 'authorization' || k.toLowerCase() === 'x-api-key') {
          return { key: k, value: '****' }
        }
        return { key: k, value: String(v) }
      })

      const newLogEntry = {
        id: nanoid(),
        timestamp: new Date(),
        method: config.method,
        urlShort: urlHostname,
        status: 'ERR',
        statusText: err.name === 'AbortError' ? 'TIMEOUT' : 'NET_ERR',
        durationMs,
        success: false,
        details: {
          url: webhookUrl,
          headers: loggedHeaders,
          status: 'ERR',
          durationMs,
          error: err.message || errorMessage
        }
      }
      setDeliveryLog(prev => [newLogEntry, ...prev].slice(0, 50))
    }
  }

  return {
    webhookUrl,
    setWebhookUrl,
    config,
    updateConfig,
    updateMetadataConfig,
    addCustomHeader,
    updateCustomHeader,
    removeCustomHeader,
    deliveryLog,
    clearDeliveryLog,
    sendStatus,
    sendError,
    setSendError,
    dryRunPanel,
    buildPayload,
    sendWebhook
  }
}
