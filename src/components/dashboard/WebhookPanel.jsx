import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Link, Key, Plus, Trash2, ChevronDown, ChevronUp, Copy, Check, 
  Download, AlertTriangle, FileJson, Table2, FileText, Code2, FileCode, 
  Sheet, RefreshCw, X, AlertCircle, Info, CheckCircle2
} from 'lucide-react'

import { useWebhookConfig } from '../../hooks/useWebhookConfig'
import { 
  flattenJsonForCsv, 
  convertJsonToMarkdown, 
  convertJsonToXml, 
  convertJsonToYaml, 
  convertJsonToExcel 
} from '../../utils/exportFormatters'

// URL input cycle placeholders
const PLACEHOLDERS = [
  'https://hooks.zapier.com/hooks/catch/...',
  'https://hook.eu1.make.com/...',
  'https://your-n8n-instance.com/webhook/...',
  'https://api.yourapp.com/ingest'
]

export default function WebhookPanel({ extractedJson, metadata }) {
  const {
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
  } = useWebhookConfig(extractedJson, metadata)

  // Local UI States
  const [activePlaceholderIdx, setActivePlaceholderIdx] = useState(0)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [urlBlurred, setUrlBlurred] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [advancedExpanded, setAdvancedExpanded] = useState(false)
  const [payloadFullExpanded, setPayloadFullExpanded] = useState(false)
  const [activePresetModal, setActivePresetModal] = useState(null) // 'zapier' | 'make' | 'n8n' | null
  const [copiedPresetUrl, setCopiedPresetUrl] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState(null)
  
  // Format download click timers
  const [downloadingFormat, setDownloadingFormat] = useState(null) // 'json' | 'csv' | 'md' | 'xml' | 'yaml' | 'xlsx' | null

  // Input placeholder cycler
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // Webhook URL Validation
  const validateUrl = (urlStr) => {
    if (!urlStr.trim()) {
      setIsUrlValid(false)
      setUrlError('')
      return
    }
    if (!urlStr.toLowerCase().startsWith('https://')) {
      setIsUrlValid(false)
      setUrlError('Webhook URL must use HTTPS')
    } else {
      setIsUrlValid(true)
      setUrlError('')
    }
  }

  const handleUrlChange = (e) => {
    const val = e.target.value
    setWebhookUrl(val)
    validateUrl(val)
  }

  const handleUrlBlur = () => {
    setUrlBlurred(true)
    validateUrl(webhookUrl)
  }

  // Pre-calculate export file sizes
  const [fileSizes, setFileSizes] = useState({
    json: '~0 KB',
    csv: '~0 KB',
    md: '~0 KB',
    xml: '~0 KB',
    yaml: '~0 KB',
    xlsx: '~32 KB'
  })

  useEffect(() => {
    if (!extractedJson) return
    
    try {
      const jsonStr = JSON.stringify(extractedJson, null, 2)
      const jsonSize = `~${(new Blob([jsonStr]).size / 1024).toFixed(1)} KB`

      const csvStr = flattenJsonForCsv(extractedJson)
      const csvBytes = new Blob([csvStr]).size
      const csvSize = `~${(csvBytes / 1024).toFixed(1)} KB`

      const mdStr = convertJsonToMarkdown(extractedJson, metadata?.fileName || 'doc', metadata?.fileType || 'pdf')
      const mdSize = `~${(new Blob([mdStr]).size / 1024).toFixed(1)} KB`

      const xmlStr = convertJsonToXml(extractedJson)
      const xmlSize = `~${(new Blob([xmlStr]).size / 1024).toFixed(1)} KB`

      const yamlStr = convertJsonToYaml(extractedJson)
      const yamlSize = `~${(new Blob([yamlStr]).size / 1024).toFixed(1)} KB`

      // Estimate excel size to avoid loading the massive xlsx library synchronously
      const xlsxSize = `~${((csvBytes * 1.2 + 8000) / 1024).toFixed(1)} KB`

      setFileSizes({
        json: jsonSize,
        csv: csvSize,
        md: mdSize,
        xml: xmlSize,
        yaml: yamlSize,
        xlsx: xlsxSize
      })
    } catch (err) {
      console.error('Error estimating file sizes:', err)
    }
  }, [extractedJson, metadata])

  const getFileSizeEstimate = (format) => {
    return fileSizes[format] || '~0 KB'
  }

  // File Download triggers
  const triggerFormatDownload = (format) => {
    if (!extractedJson) return
    setDownloadingFormat(format)
    
    setTimeout(async () => {
      try {
        const baseName = metadata?.fileName?.slice(0, metadata.fileName.lastIndexOf('.')) || 'extracted_data'
        let blob, url, a, contentStr
        
        switch (format) {
          case 'json':
            contentStr = JSON.stringify(extractedJson, null, 2)
            blob = new Blob([contentStr], { type: 'application/json' })
            url = URL.createObjectURL(blob)
            a = document.createElement('a')
            a.href = url
            a.download = `${baseName}_extracted.json`
            a.click()
            URL.revokeObjectURL(url)
            break
            
          case 'csv':
            contentStr = flattenJsonForCsv(extractedJson)
            blob = new Blob([contentStr], { type: 'text/csv;charset=utf-8;' })
            url = URL.createObjectURL(blob)
            a = document.createElement('a')
            a.href = url
            a.download = `${baseName}_extracted.csv`
            a.click()
            URL.revokeObjectURL(url)
            break
            
          case 'md':
            contentStr = convertJsonToMarkdown(extractedJson, metadata?.fileName || 'doc', metadata?.fileType || 'pdf')
            blob = new Blob([contentStr], { type: 'text/markdown' })
            url = URL.createObjectURL(blob)
            a = document.createElement('a')
            a.href = url
            a.download = `${baseName}_extracted.md`
            a.click()
            URL.revokeObjectURL(url)
            break
            
          case 'xml':
            contentStr = convertJsonToXml(extractedJson)
            blob = new Blob([contentStr], { type: 'application/xml' })
            url = URL.createObjectURL(blob)
            a = document.createElement('a')
            a.href = url
            a.download = `${baseName}_extracted.xml`
            a.click()
            URL.revokeObjectURL(url)
            break
            
          case 'yaml':
            contentStr = convertJsonToYaml(extractedJson)
            blob = new Blob([contentStr], { type: 'text/yaml' })
            url = URL.createObjectURL(blob)
            a = document.createElement('a')
            a.href = url
            a.download = `${baseName}_extracted.yaml`
            a.click()
            URL.revokeObjectURL(url)
            break
            
          case 'xlsx': {
            const [wb, XLSX] = await Promise.all([
              convertJsonToExcel(extractedJson),
              import('xlsx')
            ])
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            url = URL.createObjectURL(blob)
            a = document.createElement('a')
            a.href = url
            a.download = `${baseName}_extracted.xlsx`
            a.click()
            URL.revokeObjectURL(url)
            break
          }
        }
      } catch (err) {
        console.error(`Download fail for ${format}:`, err)
      } finally {
        setDownloadingFormat(null)
      }
    }, 800)
  }

  // Copy URL Preset Helper
  const copyPresetUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedPresetUrl(true)
    setTimeout(() => setCopiedPresetUrl(false), 2000)
  }

  // Render variables
  const payloadData = buildPayload()
  const payloadString = JSON.stringify(payloadData, null, 2)
  const payloadLines = payloadString.split('\n')
  const displayedPayload = payloadFullExpanded 
    ? payloadString 
    : payloadLines.slice(0, 40).join('\n') + (payloadLines.length > 40 ? '\n...[click "Show full payload" below]' : '')

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 h-full min-h-0 overflow-y-auto lg:overflow-hidden bg-[#0d0d14]">
      
      {/* ── LEFT COLUMN: Webhook + Logs (flex: 1) ── */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 min-h-0 lg:overflow-y-auto pr-1">
        
        {/* Presets and Webhook Form Box */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Zap size={16} className="text-indigo-400" />
              <span>Send to webhook</span>
            </h3>
            
            {/* Presets Quick Toggles */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Presets:</span>
              <button 
                onClick={() => setActivePresetModal('zapier')}
                className="bg-[#ff4f00]/10 hover:bg-[#ff4f00]/25 text-[#ff4f00] text-[10px] font-black px-2 py-1 rounded-md border border-[#ff4f00]/20 transition-colors"
              >
                Zapier
              </button>
              <button 
                onClick={() => setActivePresetModal('make')}
                className="bg-[#430099]/20 hover:bg-[#430099]/40 text-[#b380ff] text-[10px] font-black px-2 py-1 rounded-md border border-[#430099]/30 transition-colors"
              >
                Make
              </button>
              <button 
                onClick={() => setActivePresetModal('n8n')}
                className="bg-[#ff6d5a]/10 hover:bg-[#ff6d5a]/25 text-[#ff6d5a] text-[10px] font-black px-2 py-1 rounded-md border border-[#ff6d5a]/20 transition-colors"
              >
                n8n
              </button>
            </div>
          </div>

          {/* Webhook Input Row */}
          <div className="space-y-1.5 relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Link size={12} />
                </span>
                
                {/* Cycles cycle placeholders */}
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={handleUrlChange}
                  onBlur={handleUrlBlur}
                  disabled={config.isDryRun}
                  placeholder={PLACEHOLDERS[activePlaceholderIdx]}
                  className={`w-full bg-[#161622] border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-600 focus:outline-none transition-all ${
                    config.isDryRun 
                      ? 'opacity-40 cursor-not-allowed border-white/5' 
                      : urlError && urlBlurred
                        ? 'border-red-500 focus:border-red-500'
                        : isUrlValid
                          ? 'border-green-500/40 focus:border-indigo-500/50'
                          : 'border-white/8 focus:border-indigo-500/50'
                  }`}
                />

                {isUrlValid && !config.isDryRun && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                    <CheckCircle2 size={12} />
                  </span>
                )}
              </div>

              {/* Main Submit Action Trigger Button */}
              <button
                onClick={sendWebhook}
                disabled={sendStatus === 'LOADING' || (sendStatus === 'SUCCESS' && !config.isDryRun)}
                className={`px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 min-w-[120px] transition-all ${
                  config.isDryRun
                    ? sendStatus === 'SUCCESS'
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : sendStatus === 'ERROR'
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : sendStatus === 'LOADING'
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : sendStatus === 'SUCCESS'
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : sendStatus === 'ERROR'
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
                }`}
              >
                {sendStatus === 'LOADING' && <RefreshCw size={12} className="animate-spin" />}
                {sendStatus === 'SUCCESS' && <Check size={12} />}
                {sendStatus === 'ERROR' && <X size={12} />}
                
                <span>
                  {config.isDryRun
                    ? sendStatus === 'LOADING'
                      ? 'Validating...'
                      : sendStatus === 'SUCCESS'
                        ? 'Validated'
                        : sendStatus === 'ERROR'
                          ? 'Failed — Retry'
                          : '🧪 Validate payload'
                    : sendStatus === 'LOADING'
                      ? 'Sending...'
                      : sendStatus === 'SUCCESS'
                        ? 'Delivered'
                        : sendStatus === 'ERROR'
                          ? 'Failed — Retry'
                          : '⚡ Send to webhook'}
                </span>
              </button>
            </div>

            {/* Inline Input URL Error display */}
            {urlError && urlBlurred && (
              <p className="text-red-400 text-[10px] font-bold flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{urlError}</span>
              </p>
            )}
          </div>

          {/* Dismissible Error Alert */}
          {sendError && (
            <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-xl flex items-start justify-between gap-2 text-xs text-red-200">
              <div className="flex gap-2 items-start">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>{sendError}</span>
              </div>
              <button onClick={() => setSendError(null)} className="text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Dry Run Success Validation Alert */}
          {dryRunPanel && dryRunPanel.success && (
            <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-xl flex items-start gap-2 text-xs text-green-200">
              <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>{dryRunPanel.message}</span>
            </div>
          )}

          {/* Collapsible Advanced Parameters Setup */}
          <div className="border border-white/5 rounded-xl bg-black/15 overflow-hidden text-xs">
            <button
              onClick={() => setAdvancedExpanded(!advancedExpanded)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-400 hover:text-white font-bold transition-colors"
            >
              <span>Advanced Webhook Options</span>
              {advancedExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {advancedExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 pt-1 border-t border-white/5 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Method */}
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">HTTP Method</label>
                      <select
                        value={config.method}
                        onChange={(e) => updateConfig({ method: e.target.value })}
                        className="w-full bg-[#161622] border border-white/8 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </div>

                    {/* Auth Header Type */}
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Authorization</label>
                      <select
                        value={config.authType}
                        onChange={(e) => updateConfig({ authType: e.target.value })}
                        className="w-full bg-[#161622] border border-white/8 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="none">None</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="apikey">API Key (x-api-key)</option>
                      </select>
                    </div>
                  </div>

                  {/* Auth Token Value input */}
                  {config.authType !== 'none' && (
                    <div className="relative">
                      <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                        {config.authType === 'bearer' ? 'Bearer Token Value' : 'API Key Header Value'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <Key size={12} />
                        </span>
                        <input
                          type="password"
                          value={config.authToken}
                          onChange={(e) => updateConfig({ authToken: e.target.value })}
                          placeholder="e.g. key_abc123..."
                          className="w-full bg-[#161622] border border-white/8 rounded-lg pl-9 pr-4 py-1.5 text-white placeholder-gray-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payload Wrapper Key */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                        Payload Wrapper Key
                      </label>
                      <input
                        type="text"
                        value={config.payloadWrapper}
                        onChange={(e) => updateConfig({ payloadWrapper: e.target.value })}
                        placeholder="e.g. data (leave empty to spread)"
                        className="w-full bg-[#161622] border border-white/8 rounded-lg px-2.5 py-1.5 text-white placeholder-gray-600 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Dry Run Toggle Switch */}
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                        Test Mode
                      </label>
                      <label className="flex items-center gap-2 h-[29px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.isDryRun}
                          onChange={(e) => updateConfig({ isDryRun: e.target.checked })}
                          className="accent-indigo-500 rounded bg-[#161622] border-white/8 cursor-pointer w-4 h-4"
                        />
                        <span className="text-gray-400 font-bold">Dry run (validate only)</span>
                      </label>
                    </div>
                  </div>

                  {/* Metadata Checkboxes */}
                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">
                      Include Metadata Properties
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                        <input
                          type="checkbox"
                          checked={config.metadata.fileName}
                          onChange={(e) => updateMetadataConfig('fileName', e.target.checked)}
                          className="accent-indigo-500 rounded border-white/8 w-3.5 h-3.5"
                        />
                        <span>fileName ({metadata?.fileName || 'document'})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                        <input
                          type="checkbox"
                          checked={config.metadata.fileType}
                          onChange={(e) => updateMetadataConfig('fileType', e.target.checked)}
                          className="accent-indigo-500 rounded border-white/8 w-3.5 h-3.5"
                        />
                        <span>fileType ({metadata?.fileType || 'pdf'})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                        <input
                          type="checkbox"
                          checked={config.metadata.timestamp}
                          onChange={(e) => updateMetadataConfig('timestamp', e.target.checked)}
                          className="accent-indigo-500 rounded border-white/8 w-3.5 h-3.5"
                        />
                        <span>extractedAt (ISO timestamp)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                        <input
                          type="checkbox"
                          checked={config.metadata.totalPages}
                          onChange={(e) => updateMetadataConfig('totalPages', e.target.checked)}
                          className="accent-indigo-500 rounded border-white/8 w-3.5 h-3.5"
                        />
                        <span>totalPages ({metadata?.totalPages || 0})</span>
                      </label>
                    </div>
                  </div>

                  {/* Custom Header Key-Values */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Custom Request Headers
                      </label>
                      <button
                        onClick={addCustomHeader}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                      >
                        <Plus size={10} /> Add Header
                      </button>
                    </div>

                    {config.customHeaders.length === 0 ? (
                      <p className="text-[10px] text-gray-600">No custom headers configured.</p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {config.customHeaders.map(h => (
                          <div key={h.id} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={h.key}
                              placeholder="Header name (e.g. Client-ID)"
                              onChange={(e) => updateCustomHeader(h.id, e.target.value, h.value)}
                              className="flex-1 bg-[#161622] border border-white/8 rounded-lg px-2 py-1 text-white placeholder-gray-600 font-mono text-[11px]"
                            />
                            <input
                              type="text"
                              value={h.value}
                              placeholder="Value..."
                              onChange={(e) => updateCustomHeader(h.id, h.key, e.target.value)}
                              className="flex-1 bg-[#161622] border border-white/8 rounded-lg px-2 py-1 text-white placeholder-gray-600 text-[11px]"
                            />
                            <button
                              onClick={() => removeCustomHeader(h.id)}
                              className="text-gray-500 hover:text-red-400 p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live Payload Preview Block */}
          <div className="border border-white/5 rounded-xl overflow-hidden font-mono text-[10px] bg-black/40">
            <div className="bg-black/25 px-4 py-2 border-b border-white/5 flex items-center justify-between text-gray-500">
              <span className="font-bold uppercase tracking-wider text-[9px]">Live Payload Preview ({payloadLines.length} lines)</span>
              <button 
                onClick={() => setPayloadFullExpanded(!payloadFullExpanded)}
                className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
              >
                {payloadFullExpanded ? 'Show less' : 'Show full payload'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-gray-300 max-h-56 leading-normal select-all">{displayedPayload}</pre>
          </div>
        </div>

        {/* ── DELIVERY HISTORY LOG ── */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex-1 flex flex-col min-h-[160px] lg:min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <RefreshCw size={14} className="text-indigo-400" />
              <span>Delivery Log</span>
            </h3>
            {deliveryLog.length > 0 && (
              <button
                onClick={clearDeliveryLog}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold border border-red-500/10 hover:border-red-500/20 bg-red-500/5 px-2.5 py-1 rounded-lg transition-all"
              >
                Clear log
              </button>
            )}
          </div>

          {deliveryLog.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-600 border border-dashed border-white/5 rounded-xl">
              <Info size={16} className="text-gray-700 mb-1" />
              <p className="text-[11px]">No delivery history recorded in this session.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[220px] pr-1">
              {deliveryLog.map((log) => {
                const isExpanded = expandedLogId === log.id
                const date = new Date(log.timestamp)
                const formattedTime = date.toTimeString().split(' ')[0]
                
                return (
                  <div 
                    key={log.id} 
                    className="border border-white/5 rounded-xl overflow-hidden bg-black/15 text-[11px]"
                  >
                    {/* Log Row Summary */}
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-white/2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={log.success ? 'text-green-400 font-black' : 'text-red-400 font-black'}>
                          {log.success ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-500 font-mono">{formattedTime}</span>
                        <span className="text-gray-400 font-bold">{log.method}</span>
                        <span className="text-gray-600">→</span>
                        <span className="text-white truncate max-w-[140px]" title={log.details?.url}>
                          {log.urlShort}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold ${log.success ? 'text-green-400' : 'text-red-400'}`}>
                          {log.status === 'DRY' ? 'DRY OK' : log.status === 'ERR' ? 'ERR' : log.status}
                        </span>
                        <span className="text-gray-500 font-mono">{log.durationMs}ms</span>
                        {isExpanded ? <ChevronUp size={12} className="text-gray-600" /> : <ChevronDown size={12} className="text-gray-600" />}
                      </div>
                    </button>

                    {/* Log Row Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-[#09090e] border-t border-white/5 text-[10px] p-3 text-gray-400 space-y-2 font-mono leading-normal"
                        >
                          <div className="break-all">
                            <span className="text-gray-600">URL:</span> <span className="text-white">{log.details?.url}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Headers:</span>
                            {log.details?.headers && log.details.headers.length > 0 ? (
                              <div className="pl-3 mt-0.5 space-y-0.5 text-gray-500">
                                {log.details.headers.map((h, i) => (
                                  <div key={i}><span className="text-indigo-400">{h.key}</span>: {h.value}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-700 ml-1">None</span>
                            )}
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <span className="text-gray-600">Payload Size:</span>{' '}
                              <span className="text-gray-300">
                                {log.details?.payloadSize ? `${(log.details.payloadSize / 1024).toFixed(1)} KB` : '0 KB'}
                              </span>
                            </div>
                            {log.details?.error && (
                              <div className="text-red-400">
                                <span className="text-gray-600">Error:</span> {log.details.error}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Export Download Formats (300px) ── */}
      <div className="w-full lg:w-[300px] flex flex-col flex-shrink-0 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/5 h-full flex flex-col overflow-hidden">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4 pb-1 flex-shrink-0">
            <Download size={16} className="text-indigo-400" />
            <span>Export as</span>
          </h3>

          {/* Export Formats Grid */}
          <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
            {[
              { id: 'json', label: 'JSON', icon: FileJson, color: 'from-blue-600 to-indigo-600 border-blue-500/20' },
              { id: 'csv', label: 'CSV', icon: Table2, color: 'from-green-600 to-emerald-600 border-green-500/20' },
              { id: 'md', label: 'Markdown', icon: FileText, color: 'from-purple-600 to-violet-600 border-purple-500/20' },
              { id: 'xml', label: 'XML', icon: Code2, color: 'from-amber-600 to-orange-600 border-amber-500/20' },
              { id: 'yaml', label: 'YAML', icon: FileCode, color: 'from-pink-600 to-rose-600 border-pink-500/20' },
              { id: 'xlsx', label: 'Excel (.xlsx)', icon: Sheet, color: 'from-emerald-600 to-teal-600 border-emerald-500/20' }
            ].map((fmt) => {
              const isWorking = downloadingFormat === fmt.id
              const sizeText = getFileSizeEstimate(fmt.id)
              
              return (
                <button
                  key={fmt.id}
                  onClick={() => triggerFormatDownload(fmt.id)}
                  disabled={downloadingFormat !== null}
                  className={`flex flex-col items-start p-3 bg-gradient-to-br bg-[#14141f] border border-white/5 hover:border-white/10 hover:bg-white/2 rounded-xl text-left transition-all relative overflow-hidden group select-none ${
                    downloadingFormat !== null ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${fmt.color} flex items-center justify-center mb-3 text-white border flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <fmt.icon size={16} />
                  </div>
                  <div className="text-white font-bold text-xs mb-0.5 truncate w-full">{fmt.label}</div>
                  <div className="text-gray-500 text-[10px] mb-3">{sizeText}</div>
                  
                  <div className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 mt-auto">
                    {isWorking ? (
                      <>
                        <RefreshCw size={10} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Download size={10} />
                        <span>Download</span>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Preset Modal Overlays */}
      <AnimatePresence>
        {activePresetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePresetModal(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121218] p-5 shadow-2xl z-50 text-xs"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h4 className="text-white font-black text-sm flex items-center gap-2">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white ${
                    activePresetModal === 'zapier' ? 'bg-[#ff4f00]' : activePresetModal === 'make' ? 'bg-[#b380ff]' : 'bg-[#ff6d5a]'
                  }`}>
                    {activePresetModal.slice(0,1).toUpperCase()}
                  </span>
                  <span>Set up {activePresetModal.replace(/^\w/, c => c.toUpperCase())} Integration</span>
                </h4>
                <button onClick={() => setActivePresetModal(null)} className="text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              {/* Platform specific details */}
              {activePresetModal === 'zapier' && (
                <ol className="list-decimal pl-4 text-gray-400 space-y-2.5 leading-relaxed">
                  <li>Go to <a href="https://zapier.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">zapier.com</a> and sign in. Click **Create Zap**.</li>
                  <li>Set the trigger node to: **Webhooks by Zapier** → **Catch Hook**.</li>
                  <li>Click **Continue**, copy the unique Webhook URL provided by Zapier, and paste it into the Webhook URL field here in DocParse AI.</li>
                  <li>Click **Send to webhook** to push a test payload. In Zapier, click **Test Trigger** to verify receipt, then map your fields!</li>
                </ol>
              )}

              {activePresetModal === 'make' && (
                <ol className="list-decimal pl-4 text-gray-400 space-y-2.5 leading-relaxed">
                  <li>Log in at <a href="https://make.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">make.com</a>. Click **Create scenario**.</li>
                  <li>Add a node module: search for **Webhooks** and select **Custom Webhook** → click **Add**.</li>
                  <li>Copy the webhook URL generated by Make, and paste it into the URL field in DocParse AI.</li>
                  <li>Trigger a payload send using **Send to webhook** to auto-determine the payload schema structure in Make.</li>
                </ol>
              )}

              {activePresetModal === 'n8n' && (
                <ol className="list-decimal pl-4 text-gray-400 space-y-2.5 leading-relaxed">
                  <li>In your n8n workspace, add a **Webhook** node.</li>
                  <li>Set HTTP Method parameter to **POST** and set respond to **Using Respond to Webhook Node**.</li>
                  <li>Copy the webhook URL (Production or Test) and paste it into the URL input in DocParse AI.</li>
                  <li>Send a test payload to trigger and model the node fields, then activate your workflow.</li>
                </ol>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 justify-end mt-5 pt-3 border-t border-white/5">
                <button
                  onClick={copyPresetUrl}
                  disabled={!webhookUrl.trim()}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all border ${
                    !webhookUrl.trim() 
                      ? 'opacity-30 cursor-not-allowed border-white/5 text-gray-600'
                      : copiedPresetUrl
                        ? 'bg-green-600/10 border-green-500/20 text-green-400'
                        : 'bg-white/5 border-white/8 hover:bg-white/10 text-white'
                  }`}
                >
                  {copiedPresetUrl ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPresetUrl ? 'Copied URL!' : 'Copy Webhook URL'}</span>
                </button>
                <button
                  onClick={() => setActivePresetModal(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-lg"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
