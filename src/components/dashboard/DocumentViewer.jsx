import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Code2, FileJson, Table2, Network,
  Download, Copy, CheckCircle2, RefreshCw, Tag, BarChart3,
  Database, Search, Brain, Image as ImageIcon, Award, Eye, EyeOff, AlertCircle, MessageSquare, Zap
} from 'lucide-react'
import DocChat from './DocChat'
import WebhookPanel from './WebhookPanel'

// ─── Syntax-highlighted JSON ─────────────────────────────────────────────────
const JsonView = ({ data }) => {
  const lines = JSON.stringify(data, null, 2).split('\n')

  const colorize = (raw) => {
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return escaped
      .replace(/("[\w$_ ]+")(\s*:)/g, '<span class="json-key">$1</span>$2')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
  }

  return (
    <pre className="text-xs leading-relaxed p-4 overflow-auto h-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {lines.map((line, i) => (
        <div
          key={i}
          className="hover:bg-white/2 rounded px-1 -mx-1"
          dangerouslySetInnerHTML={{ __html: colorize(line) }}
        />
      ))}
    </pre>
  )
}

// ─── Copy button ─────────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
      {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Tab button ──────────────────────────────────────────────────────────────
const TabButton = ({ id, label, icon: Icon, isActive, onClick, showDot }) => (
  <button
    id={`tab-${id}`}
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap relative ${
      isActive
        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
        : 'border-transparent text-gray-500 hover:text-gray-300'
    }`}
  >
    <Icon size={14} />
    <span>{label}</span>
    {showDot && (
      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
    )}
  </button>
)

// ─── PDF Preview panel ───────────────────────────────────────────────────────
const PDFPreview = ({ docData }) => {
  const text = docData?.fullText || docData?.rawText || 'No text extracted.'
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex items-center gap-2 flex-shrink-0">
        <FileText size={14} className="text-gray-400" />
        <span className="text-sm text-gray-400 truncate">{docData?.name || 'document.pdf'}</span>
        <span className="ml-auto text-xs status-completed px-2 py-0.5 rounded-full">✓ {docData?.pageCount || '?'}p</span>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="bg-white rounded-lg p-5 shadow-xl">
          <pre className="whitespace-pre-wrap font-sans text-gray-800 text-xs leading-5 break-words">
            {text}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ─── Schema tab ──────────────────────────────────────────────────────────────
const SchemaTab = ({ docData }) => {
  const schema = docData?.schema || {}
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-indigo-400" />
          <span className="text-sm text-gray-300 font-medium">Auto-Generated JSON Schema</span>
          {docData?.documentType && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
              {docData.documentType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <CopyButton text={schema} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col code-block rounded-none rounded-b-xl">
        <JsonView data={schema} />
      </div>
    </div>
  )
}

// ─── JSON tab ────────────────────────────────────────────────────────────────
const JSONTab = ({ docData }) => {
  const data = docData?.extractedData || {}

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(docData?.name || 'document').replace('.pdf', '')}_extracted.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-400" />
          <span className="text-sm text-gray-300 font-medium">Extracted JSON</span>
        </div>
        <div className="flex items-center gap-3">
          <CopyButton text={data} />
          <button
            id="download-json-btn"
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Download size={12} /> Download
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col code-block rounded-none rounded-b-xl">
        <JsonView data={data} />
      </div>
    </div>
  )
}

// ─── Raw text tab ─────────────────────────────────────────────────────────────
const RawTextTab = ({ docData }) => {
  const text = docData?.fullText || docData?.rawText || ''
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-300 font-medium">Raw Extracted Text</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{text.length} chars</span>
          <CopyButton text={text} />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono break-words">
          {text || 'No text extracted.'}
        </pre>
      </div>
    </div>
  )
}

// ─── CSV preview tab ─────────────────────────────────────────────────────────
const CSVTab = ({ docData }) => {
  const data = docData?.extractedData || {}

  // Flatten top-level fields only (strings/numbers)
  const flatEntries = Object.entries(data).filter(([, v]) =>
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  )

  const handleDownload = () => {
    const header = flatEntries.map(([k]) => k).join(',')
    const row = flatEntries.map(([, v]) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    const csv = header + '\n' + row
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(docData?.name || 'document').replace('.pdf', '')}_extracted.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (flatEntries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <Table2 size={32} className="mx-auto mb-3 opacity-30" />
          <p>No flat fields to display as CSV.</p>
          <p className="text-xs mt-1">Use the JSON tab for nested data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-300 font-medium">CSV Preview</span>
        <button
          id="download-csv-btn"
          onClick={handleDownload}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Download size={12} /> Download CSV
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {flatEntries.map(([k]) => (
                  <th key={k} className="text-left py-2 px-3 text-indigo-400 font-semibold border-b border-white/5 whitespace-nowrap">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {flatEntries.map(([k, v]) => (
                  <td key={k} className="py-2 px-3 text-gray-300 border-b border-white/3 whitespace-nowrap max-w-xs truncate">
                    {String(v ?? '')}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── RAG Chunks tab ──────────────────────────────────────────────────────────
const RAGTab = ({ docData }) => {
  const chunks = docData?.ragChunks || []
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(chunks)

  const handleSearch = () => {
    if (!query.trim()) return setResults(chunks)
    const q = query.toLowerCase()
    setResults(chunks.filter(c => c.text.toLowerCase().includes(q)))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-cyan-400" />
            <span className="text-sm text-gray-300 font-medium">RAG Chunks</span>
            <span className="text-xs text-cyan-400">{chunks.length} chunks</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search chunks..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/8 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary text-xs px-3 py-1.5">Search</button>
          {query && <button onClick={() => { setQuery(''); setResults(chunks) }} className="text-xs text-gray-500 hover:text-white">Clear</button>}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No chunks match</p>
          </div>
        )}
        {results.map((chunk, i) => (
          <motion.div
            key={chunk.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs text-gray-600 font-mono">{chunk.id}</code>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">p.{chunk.metadata.page}</span>
                <Tag size={9} className="text-gray-600" />
                <span className="text-xs text-gray-600">{chunk.metadata.section}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.min(chunk.similarity, 1) * 100}%` }} />
                </div>
                <span className="text-xs text-cyan-400">{(chunk.similarity * 100).toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed break-words">{chunk.text}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-600">
              <span className="flex items-center gap-1"><BarChart3 size={9} /> {chunk.metadata.tokens} tokens</span>
              <span className="flex items-center gap-1"><Database size={9} /> dim {chunk.metadata.embedding_dim}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Simple LaTeX renderer ──────────────────────────────────────────────────
const LaTeXText = ({ text }) => {
  if (!text) return null
  const parts = text.split(/(\$[^\$]+\$)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1)
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-xs italic border border-indigo-500/20"
            >
              {formula}
            </code>
          )
        }
        return part
      })}
    </span>
  )
}

// ─── Question Card Component ────────────────────────────────────────────────
const QuestionCard = ({ question, pageImages }) => {
  const [selectedOption, setSelectedOption] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const questionImages = pageImages.filter(img => img.pageNum === question.page_number)

  const handleOptionClick = (optLetter) => {
    setSelectedOption(optLetter)
    setRevealed(true)
  }

  const getOptionLetter = (optStr) => {
    const match = optStr.match(/^\s*([A-D])\s*[\):.]/i)
    return match ? match[1].toUpperCase() : optStr.slice(0, 1).toUpperCase()
  }

  const getOptionText = (optStr) => {
    const match = optStr.match(/^\s*([A-D])\s*[\):.](.*)/i)
    return match ? match[2].trim() : optStr
  }

  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm">
            Q{question.question_number}
          </span>
          <span className="text-xs bg-white/5 text-gray-400 px-2.5 py-0.5 rounded-full border border-white/5 uppercase">
            {question.type.replace('_', ' ')}
          </span>
          {question.page_number && (
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
              Page {question.page_number}
            </span>
          )}
        </div>
        {question.marks && (
          <div className="flex items-center gap-1 text-xs text-yellow-500 font-medium">
            <Award size={12} /> {question.marks} Marks
          </div>
        )}
      </div>

      <div className="text-sm text-gray-200 leading-relaxed font-medium">
        <LaTeXText text={question.text} />
      </div>

      {questionImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 bg-white/2 p-3 rounded-lg border border-white/5">
          {questionImages.map((img) => (
            <div key={img.id} className="relative rounded overflow-hidden bg-black/40 flex flex-col items-center p-2 border border-white/5">
              <img src={img.dataUrl} alt="Extracted diagram" className="max-h-48 object-contain rounded" />
              <div className="absolute top-2 right-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-gray-300">
                Diagram (p. {img.pageNum})
              </div>
            </div>
          ))}
        </div>
      )}

      {question.type === 'multiple_choice' && question.options && (
        <div className="grid grid-cols-1 gap-2.5">
          {question.options.map((opt) => {
            const letter = getOptionLetter(opt)
            const text = getOptionText(opt)
            const isSelected = selectedOption === letter
            const isCorrect = letter === question.correct_answer?.toUpperCase()
            
            let btnClass = 'border-white/5 bg-white/2 hover:bg-white/5 text-gray-300'
            if (revealed) {
              if (isCorrect) {
                btnClass = 'border-green-500/30 bg-green-500/10 text-green-300'
              } else if (isSelected) {
                btnClass = 'border-red-500/30 bg-red-500/10 text-red-300'
              }
            }

            return (
              <button
                key={opt}
                disabled={revealed}
                onClick={() => handleOptionClick(letter)}
                className={`w-full text-left p-3 rounded-lg border text-xs flex items-center gap-3 transition-all ${btnClass}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  revealed && isCorrect
                    ? 'border-green-500 bg-green-500 text-white'
                    : revealed && isSelected
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-white/20 bg-white/5'
                }`}>
                  {letter}
                </div>
                <div className="flex-1"><LaTeXText text={text} /></div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <button
          onClick={() => setRevealed(!revealed)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 font-medium"
        >
          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          {revealed ? 'Hide Answer & Explanation' : 'Reveal Answer & Explanation'}
        </button>
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white/2 rounded-lg border border-white/5 p-4 flex flex-col gap-2.5"
          >
            {question.correct_answer && (
              <div className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Correct Answer: Option {question.correct_answer}
              </div>
            )}
            {question.explanation && (
              <div className="text-xs leading-relaxed text-gray-400">
                <div className="font-semibold text-gray-300 mb-1">Explanation:</div>
                <LaTeXText text={question.explanation} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Exam Q&A Tab ───────────────────────────────────────────────────────────
const ExamQATab = ({ docData }) => {
  const data = docData?.extractedData || {}
  const questions = data.questions || []
  const pageImages = docData?.images || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/5 flex-shrink-0 bg-white/2">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Subject: <span className="text-indigo-400 font-semibold">{data.subject || 'Not specified'}</span>
            </h3>
            {data.grade_level && (
              <span className="text-xs text-gray-500">Grade: {data.grade_level}</span>
            )}
          </div>
          <div className="flex gap-4 text-xs">
            {data.total_marks && (
              <div>
                <span className="text-gray-500">Total Marks:</span>{' '}
                <span className="text-yellow-500 font-semibold">{data.total_marks}</span>
              </div>
            )}
            {data.duration && (
              <div>
                <span className="text-gray-500">Duration:</span>{' '}
                <span className="text-white font-medium">{data.duration}</span>
              </div>
            )}
          </div>
        </div>
        {data.instructions && (
          <div className="mt-3 p-2.5 rounded bg-black/30 border border-white/5 text-xs text-gray-400">
            <span className="font-semibold text-gray-300 block mb-0.5">Instructions:</span>
            {data.instructions}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Brain size={32} className="mx-auto mb-3 opacity-30 animate-pulse text-indigo-400" />
            <p className="text-sm font-medium text-white">No exam questions extracted yet.</p>
            <p className="text-xs mt-1 text-gray-500">Make sure you uploaded an exam document in Exam Mode.</p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionCard key={question.question_number} question={question} pageImages={pageImages} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Extracted Images Tab ───────────────────────────────────────────────────
const ExtractedImagesTab = ({ docData }) => {
  const images = docData?.images || []

  const handleDownload = (img) => {
    const link = document.createElement('a')
    link.href = img.dataUrl
    link.download = `extracted_page_${img.pageNum}_${img.id}.png`
    link.click()
  }

  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <ImageIcon size={32} className="mx-auto mb-3 opacity-30 text-indigo-400" />
          <p className="text-white font-medium">No diagrams or figures found in this PDF.</p>
          <p className="text-xs mt-1 text-gray-500">Image extraction works with PDF files containing embedded images.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-indigo-400" />
          <span className="text-sm text-gray-300 font-semibold">Extracted Diagrams & Figures</span>
          <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {images.length} assets
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <motion.div
              key={img.id}
              className="glass-card overflow-hidden border border-white/5 hover:border-white/10 transition-all flex flex-col bg-black/20"
              whileHover={{ y: -2 }}
            >
              <div className="aspect-video bg-black/40 flex items-center justify-center p-3 relative group">
                <img src={img.dataUrl} alt="Extracted element" className="max-h-full max-w-full object-contain rounded" />
                <div className="absolute top-2 right-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-gray-400">
                  {img.width} × {img.height} px
                </div>
              </div>
              <div className="p-3 flex items-center justify-between border-t border-white/5">
                <div>
                  <div className="text-xs font-semibold text-white">Figure {img.id.split('_').pop()}</div>
                  <div className="text-[10px] text-gray-500">Page {img.pageNum}</div>
                </div>
                <button
                  onClick={() => handleDownload(img)}
                  className="p-1.5 rounded bg-indigo-500/15 border border-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1 text-[10px]"
                >
                  <Download size={11} /> Save
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main DocumentViewer ─────────────────────────────────────────────────────
export default function DocumentViewer({ docData }) {
  const isExam = docData?.parseMode === 'exam' || docData?.documentType === 'exam_paper'
  const [activeTab, setActiveTab] = useState(isExam ? 'exam' : 'json')
  
  // Webhook subtle pulsing notification indicator
  const [showWebhookDot, setShowWebhookDot] = useState(() => {
    if (typeof window === 'undefined') return false
    return !sessionStorage.getItem('docparse_webhook_viewed')
  })

  // DocChat Parent State
  const [chatOpen, setChatOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Keyboard Shortcuts: Cmd/Ctrl + K to toggle chat, Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setChatOpen(prev => {
          if (!prev) setUnreadCount(0)
          return !prev
        })
      }
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chatOpen])

  const tabs = [
    ...(isExam ? [
      { id: 'exam', label: 'Exam Q&A', icon: Brain },
      { id: 'images', label: 'Extracted Images', icon: ImageIcon }
    ] : []),
    { id: 'raw', label: 'Raw Text', icon: FileText },
    { id: 'schema', label: 'Schema', icon: Code2 },
    { id: 'json', label: 'JSON', icon: FileJson },
    { id: 'csv', label: 'CSV Preview', icon: Table2 },
    { id: 'rag', label: 'RAG Chunks', icon: Network },
    { id: 'webhook', label: '⚡ Export & Send', icon: Zap }
  ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'webhook') {
      setShowWebhookDot(false)
      sessionStorage.setItem('docparse_webhook_viewed', 'true')
    }
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'exam': return <ExamQATab docData={docData} />
      case 'images': return <ExtractedImagesTab docData={docData} />
      case 'raw': return <RawTextTab docData={docData} />
      case 'schema': return <SchemaTab docData={docData} />
      case 'json': return <JSONTab docData={docData} />
      case 'csv': return <CSVTab docData={docData} />
      case 'rag': return <RAGTab docData={docData} />
      case 'webhook': return <WebhookPanel extractedJson={docData?.extractedData} metadata={{ fileType, fileName: docData?.name, totalPages: docData?.pageCount }} />
      default: return null
    }
  }

  const docType = docData?.documentType?.replace(/_/g, ' ') || 'Document'
  const fileType = docData?.fileType || docData?.name?.split('.').pop()?.toLowerCase() || 'pdf'
  
  const fileTypeBadges = {
    pdf: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    docx: 'bg-green-500/10 text-green-400 border border-green-500/20',
    pptx: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  }
  const badgeStyle = fileTypeBadges[fileType] || fileTypeBadges.pdf

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <motion.div
        animate={{ marginRight: chatOpen && !isMobile ? '376px' : '0px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col h-full w-full gap-4 p-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white truncate max-w-lg">{docData?.name || 'document.pdf'}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-400 mt-1 flex-wrap">
              <span className="status-completed text-xs px-2 py-0.5 rounded-full">✓ Processed by Groq AI</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-semibold ${badgeStyle}`}>
                {fileType}
              </span>
              <span className="capitalize text-indigo-400 text-xs">{docType}</span>
              {docData?.pageCount && <span>{docData.pageCount} page{docData.pageCount > 1 ? 's' : ''}</span>}
              {docData?.size && <span>{docData.size}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setChatOpen(prev => {
                  if (!prev) setUnreadCount(0)
                  return !prev
                })
              }}
              className={`btn-secondary flex items-center gap-2 text-sm py-2 px-4 transition-all ${
                chatOpen ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 font-bold' : ''
              }`}
            >
              <MessageSquare size={14} className={chatOpen ? 'text-indigo-400' : 'text-gray-400'} />
              <span>Ask your doc</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            <button id="btn-regenerate" className="btn-secondary flex items-center gap-2 text-sm py-2">
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
        </div>
   
        {/* Failure Manifest Warning Banner */}
        {docData?.failedPages && docData.failedPages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 flex items-start gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs"
          >
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-red-200">
              <span className="font-bold text-red-400">Partial Extraction Alert: </span>
              The extraction completed, but {docData.failedPages.length} pages were skipped due to API rate limits or processing errors:
              <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-2">
                {docData.failedPages.map((fp, i) => (
                  <span
                    key={i}
                    title={fp.error}
                    className="bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] text-red-300 font-mono"
                  >
                    Page {fp.pageNum}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
  
        {/* Split view */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
          {/* Left: PDF text preview */}
          <div className="w-full lg:w-2/5 lg:flex-shrink-0 glass-card rounded-xl overflow-hidden flex flex-col min-h-0 h-[350px] lg:h-full">
            <PDFPreview docData={docData} />
          </div>
  
          {/* Right: Tabs */}
          <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col min-h-0 h-[500px] lg:h-full">
            <div className="flex border-b border-white/5 overflow-x-auto flex-shrink-0">
              {tabs.map(tab => (
                <TabButton key={tab.id} id={tab.id} label={tab.label} icon={tab.icon}
                  isActive={activeTab === tab.id} onClick={handleTabClick} showDot={tab.id === 'webhook' && showWebhookDot} />
              ))}
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col min-h-0"
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Backdrop Overlay */}
      {chatOpen && isMobile && (
        <div
          onClick={() => setChatOpen(false)}
          className="fixed inset-0 bg-black/60 z-45 md:hidden"
        />
      )}

      {/* DocChat Sidebar */}
      <DocChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        extractedJson={docData?.extractedData}
        metadata={{
          fileType: fileType,
          fileName: docData?.name || 'document',
          totalPages: docData?.pageCount || 0
        }}
        history={chatHistory}
        onHistory={setChatHistory}
        onUnread={setUnreadCount}
      />
    </div>
  )
}
