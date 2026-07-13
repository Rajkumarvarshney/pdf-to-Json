import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Key, Bell, Shield, Palette, Code2, Save, Eye, EyeOff } from 'lucide-react'

const SettingRow = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-white/5 last:border-0 gap-3">
    <div>
      <div className="text-sm text-white font-medium">{label}</div>
      {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
    </div>
    <div className="w-full sm:w-auto flex justify-end flex-shrink-0">{children}</div>
  </div>
)

const Toggle = ({ id, defaultOn }) => {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      id={id}
      onClick={() => setOn(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-white/10'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

const Section = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 rounded-xl mb-4"
  >
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-indigo-400" />
      <h2 className="text-white font-bold">{title}</h2>
    </div>
    {children}
  </motion.div>
)

export default function SettingsSection() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [saved, setSaved] = useState(false)
  const [model, setModel] = useState(localStorage.getItem('groq_model') || 'llama-3.3-70b-versatile')
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '')

  const handleSave = () => {
    localStorage.setItem('groq_model', model)
    localStorage.setItem('groq_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Settings</h1>
          <p className="text-gray-400 text-sm">Configure your DocParse AI workspace</p>
        </div>
        <button
          id="save-settings"
          onClick={handleSave}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Profile */}
        <Section title="Profile" icon={User}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white">
              J
            </div>
            <button className="btn-secondary text-sm">Change Avatar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'setting-name', label: 'Full Name', defaultValue: 'John Doe' },
              { id: 'setting-email', label: 'Email', defaultValue: 'john@example.com' },
              { id: 'setting-org', label: 'Organization', defaultValue: 'TechCorp Inc.' },
              { id: 'setting-role', label: 'Role', defaultValue: 'Developer' },
            ].map(f => (
              <div key={f.id}>
                <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                <input
                  id={f.id}
                  type="text"
                  defaultValue={f.defaultValue}
                  className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* API Configuration */}
        <Section title="API Configuration" icon={Key}>
          <SettingRow label="Groq API Key" description="Used for AI extraction and schema generation">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative flex-1 sm:flex-none">
                <input
                  id="setting-api-key"
                  type={apiKeyVisible ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="bg-white/5 border border-white/8 rounded-lg pl-3 pr-10 py-2 text-white text-sm w-full sm:w-64 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button className="btn-secondary text-xs py-2">Verify</button>
            </div>
          </SettingRow>
          <SettingRow label="Model" description="Groq model for extraction">
            <select
              id="setting-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
            </select>
          </SettingRow>
          <SettingRow label="Embedding Model" description="Model for RAG embeddings">
            <select
              id="setting-embedding-model"
              className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option>nomic-embed-text</option>
              <option>bge-large-en-v1.5</option>
            </select>
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          <SettingRow label="Processing complete" description="Alert when PDF parsing is done">
            <Toggle id="notif-complete" defaultOn={true} />
          </SettingRow>
          <SettingRow label="Export ready" description="Notify when file export is available">
            <Toggle id="notif-export" defaultOn={true} />
          </SettingRow>
          <SettingRow label="Weekly summary" description="Weekly usage and activity report">
            <Toggle id="notif-weekly" defaultOn={false} />
          </SettingRow>
        </Section>

        {/* Extraction Settings */}
        <Section title="Extraction Settings" icon={Code2}>
          <SettingRow label="Auto-generate schema" description="Automatically infer schema from document">
            <Toggle id="setting-auto-schema" defaultOn={true} />
          </SettingRow>
          <SettingRow label="Extract tables" description="Detect and parse tabular data structures">
            <Toggle id="setting-tables" defaultOn={true} />
          </SettingRow>
          <SettingRow label="Preserve formatting" description="Keep whitespace and line breaks in text">
            <Toggle id="setting-formatting" defaultOn={false} />
          </SettingRow>
          <SettingRow label="Chunk size (tokens)">
            <input
              id="setting-chunk-size"
              type="number"
              defaultValue={512}
              className="w-24 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </SettingRow>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={Palette}>
          <SettingRow label="Theme">
            <div className="flex gap-2">
              {['Dark', 'Darker', 'OLED'].map(t => (
                <button
                  key={t}
                  id={`theme-${t.toLowerCase()}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${t === 'Dark' ? 'bg-indigo-600 text-white' : 'glass-card text-gray-400 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Compact mode" description="Reduce spacing in sidebar and panels">
            <Toggle id="setting-compact" defaultOn={false} />
          </SettingRow>
          <SettingRow label="Syntax highlighting" description="Colorize JSON and schema output">
            <Toggle id="setting-syntax" defaultOn={true} />
          </SettingRow>
        </Section>
      </div>
    </div>
  )
}
