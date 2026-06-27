import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, FileJson, Eye, Copy, CheckCircle2, Zap, Brain } from 'lucide-react'
import { mockSchemas, mockDocuments } from '../../data/mockData'

const SchemaCard = ({ doc, schema, delay, onView }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fieldCount = Object.keys(schema.properties || {}).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-5 hover:border-white/15 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Code2 size={18} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{schema.title}</h3>
            <div className="text-xs text-gray-500 mt-0.5">{doc?.name}</div>
          </div>
        </div>
        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
          {fieldCount} fields
        </span>
      </div>

      {/* Properties preview */}
      <div className="bg-black/30 rounded-lg p-3 mb-4 font-mono text-xs space-y-1 overflow-hidden" style={{ maxHeight: '120px' }}>
        {Object.entries(schema.properties || {}).slice(0, 6).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="json-key">"{key}"</span>
            <span className="text-gray-600">:</span>
            <span className="json-string">
              "{Array.isArray(val?.items) ? 'array' : val?.type || 'object'}"
            </span>
          </div>
        ))}
        {fieldCount > 6 && (
          <div className="text-gray-600 text-xs">... +{fieldCount - 6} more fields</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          id={`view-schema-${schema.title?.toLowerCase()}`}
          onClick={() => onView(schema)}
          className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 flex-1 justify-center"
        >
          <Eye size={12} /> View Schema
        </button>
        <button
          onClick={handleCopy}
          className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
        >
          {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </motion.div>
  )
}

const SchemaModal = ({ schema, onClose }) => {
  if (!schema) return null

  const json = JSON.stringify(schema, null, 2)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-indigo-400" />
            <span className="text-white font-medium">{schema.title} Schema</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs font-mono text-gray-300 leading-relaxed">
            {json.split('\n').map((line, i) => {
              const colored = line
                .replace(/("[\w_]+")/g, (m) => `<span class="json-key">${m}</span>`)
                .replace(/: ("(?:[^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>')
                .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
              return (
                <div key={i} dangerouslySetInnerHTML={{
                  __html: colored.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                    .replace(/&lt;span class=/g, '<span class=')
                    .replace(/&gt;/g, match => match)
                }} />
              )
            })}
          </pre>
        </div>
      </motion.div>
    </div>
  )
}

export default function SchemasSection() {
  const [selectedSchema, setSelectedSchema] = useState(null)

  const schemaList = [
    { doc: mockDocuments[0], schema: mockSchemas.resume },
    { doc: mockDocuments[1], schema: mockSchemas.invoice },
    { doc: mockDocuments[2], schema: mockSchemas.research },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-white">Schemas</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Brain size={14} className="text-purple-400" />
            Auto-generated by Groq AI
          </div>
        </div>
        <p className="text-gray-400 text-sm">JSON schemas automatically inferred from your documents</p>
      </div>

      {/* Schema info banner */}
      <div className="mx-6 mt-6 flex-shrink-0">
        <div className="glass-card p-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/10 border-indigo-500/20">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">How schemas are generated</p>
              <p className="text-gray-400 text-xs mt-1">
                Groq analyzes the semantic structure of your document — field types, nested objects,
                arrays, and relationships — then generates a precise JSON Schema following the draft-07 specification.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schemaList.map(({ doc, schema }, i) => (
            <SchemaCard
              key={schema.title}
              doc={doc}
              schema={schema}
              delay={i * 0.1}
              onView={setSelectedSchema}
            />
          ))}
        </div>
      </div>

      {selectedSchema && (
        <SchemaModal schema={selectedSchema} onClose={() => setSelectedSchema(null)} />
      )}
    </div>
  )
}
