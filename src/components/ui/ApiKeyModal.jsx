import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, ExternalLink, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import { saveApiKey, hasApiKey } from '../../utils/groqService'

export default function ApiKeyModal({ onKeySet }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)

  const handleSave = async () => {
    const trimmed = key.trim()
    if (!trimmed) return setError('Please enter your Groq API key.')
    if (!trimmed.startsWith('gsk_')) return setError('Groq keys start with "gsk_". Please check your key.')

    setTesting(true)
    setError('')

    // Quick test call
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${trimmed}` },
      })
      if (!res.ok) {
        setError('Invalid API key — the server rejected it.')
        setTesting(false)
        return
      }
      saveApiKey(trimmed)
      onKeySet()
    } catch {
      setError('Could not reach Groq API. Check your internet connection.')
    }
    setTesting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-card w-full max-w-md p-8 rounded-2xl"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
          <Key size={26} className="text-indigo-400" />
        </div>

        <h2 className="text-2xl font-black text-white text-center mb-2">Add Groq API Key</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Required to parse your real PDFs with AI. It's <span className="text-green-400 font-medium">free</span> — no credit card needed.
        </p>

        {/* Get key link */}
        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between glass-card p-3 rounded-xl mb-5 hover:border-indigo-500/40 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-sm text-white font-medium">Get free API key at console.groq.com</span>
          </div>
          <ExternalLink size={14} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
        </a>

        {/* Input */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">
            Groq API Key
          </label>
          <input
            id="groq-api-key-input"
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="gsk_••••••••••••••••••••••••••"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            autoFocus
          />
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
          >
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Save button */}
        <button
          id="save-api-key-btn"
          onClick={handleSave}
          disabled={testing}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying key...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Save &amp; Continue
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-600 mt-4">
          Stored locally in your browser only. Never sent to our servers.
        </p>
      </motion.div>
    </div>
  )
}
