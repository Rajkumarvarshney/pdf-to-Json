import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download, FileJson, Table2, FileSpreadsheet,
  CheckCircle2, Clock, HardDrive, Zap
} from 'lucide-react'
import { mockDocuments, mockExtractedData } from '../../data/mockData'

const ExportCard = ({ format, icon: Icon, color, description, size, onClick }) => (
  <motion.button
    id={`export-${format.toLowerCase().replace(' ', '-')}`}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`glass-card p-6 text-left w-full hover:border-white/20 transition-all group`}
  >
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
      <Icon size={26} className="text-white" />
    </div>
    <div className="text-white font-bold text-lg mb-1">{format}</div>
    <div className="text-gray-400 text-sm mb-3">{description}</div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{size}</span>
      <span className="flex items-center gap-1 text-indigo-400">
        <Download size={11} /> Download
      </span>
    </div>
  </motion.button>
)

const ExportHistoryItem = ({ doc, format, time, size, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2 px-4 rounded-lg transition-colors"
  >
    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
      <FileJson size={14} className="text-indigo-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm text-white font-medium truncate">{doc}</div>
      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
        <Clock size={10} /> {time}
      </div>
    </div>
    <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded font-mono">.{format}</span>
    <span className="text-xs text-gray-500">{size}</span>
    <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
  </motion.div>
)

export default function ExportsSection() {
  const [selectedDoc, setSelectedDoc] = useState('0')
  const [downloading, setDownloading] = useState(null)

  const handleExport = (format) => {
    setDownloading(format)
    setTimeout(() => {
      setDownloading(null)
      // In a real app, this would trigger actual file download
      const data = mockExtractedData.resume
      if (format === 'JSON') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'document_extracted.json'
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'CSV') {
        const csv = Object.entries(data)
          .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
          .map(([k, v]) => `${k},${v}`)
          .join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'document_extracted.csv'
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 1200)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-white/5 flex-shrink-0">
        <h1 className="text-2xl font-black text-white mb-2">Exports</h1>
        <p className="text-gray-400 text-sm">Download your extracted data in multiple formats</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Document selector */}
        <div className="glass-card p-4 mb-6 rounded-xl">
          <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">
            Select Document to Export
          </label>
          <select
            id="export-doc-select"
            value={selectedDoc}
            onChange={e => setSelectedDoc(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            {mockDocuments.filter(d => d.status === 'completed').map((doc, i) => (
              <option key={doc.id} value={i}>{doc.name}</option>
            ))}
          </select>
        </div>

        {/* Export format cards */}
        <h2 className="text-white font-bold mb-4">Export Format</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ExportCard
            format={downloading === 'JSON' ? 'Downloading...' : 'Download JSON'}
            icon={downloading === 'JSON' ? Zap : FileJson}
            color="from-indigo-500 to-blue-600"
            description="Raw structured data as JSON with full schema compliance"
            size="~18 KB"
            onClick={() => handleExport('JSON')}
          />
          <ExportCard
            format={downloading === 'CSV' ? 'Downloading...' : 'Download CSV'}
            icon={Table2}
            color="from-emerald-500 to-green-600"
            description="Flat spreadsheet-compatible CSV format for Excel/Sheets"
            size="~4 KB"
            onClick={() => handleExport('CSV')}
          />
          <ExportCard
            format={downloading === 'XLSX' ? 'Downloading...' : 'Download XLSX'}
            icon={FileSpreadsheet}
            color="from-orange-500 to-amber-600"
            description="Excel workbook with formatted tables and multiple sheets"
            size="~32 KB"
            onClick={() => handleExport('XLSX')}
          />
        </div>

        {/* Export options */}
        <div className="glass-card p-5 mb-6 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Export Options</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'opt-schema', label: 'Include schema', desc: 'Attach JSON Schema to export', default: true },
              { id: 'opt-meta', label: 'Include metadata', desc: 'Page numbers, confidence scores', default: true },
              { id: 'opt-flatten', label: 'Flatten nested', desc: 'Unnest objects for CSV compat', default: false },
              { id: 'opt-nulls', label: 'Include null fields', desc: 'Keep fields with no value', default: false },
            ].map(opt => (
              <label key={opt.id} className="flex items-start gap-3 cursor-pointer group">
                <input
                  id={opt.id}
                  type="checkbox"
                  defaultChecked={opt.default}
                  className="mt-0.5 rounded border-white/20 bg-white/5 accent-indigo-500"
                />
                <div>
                  <div className="text-sm text-white">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Export history */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white font-semibold">Export History</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <HardDrive size={12} />
              128 exports total
            </div>
          </div>
          <div className="p-2">
            {[
              { doc: 'Resume_John_Doe.pdf', format: 'json', time: '2 min ago', size: '18 KB' },
              { doc: 'Invoice_Q4_2023.pdf', format: 'csv', time: '1 hour ago', size: '4 KB' },
              { doc: 'Resume_John_Doe.pdf', format: 'xlsx', time: '3 hours ago', size: '32 KB' },
              { doc: 'Contract_Services_2024.pdf', format: 'json', time: 'Yesterday', size: '24 KB' },
              { doc: 'Research_Paper_ML.pdf', format: 'csv', time: '2 days ago', size: '8 KB' },
            ].map((item, i) => (
              <ExportHistoryItem key={i} {...item} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
