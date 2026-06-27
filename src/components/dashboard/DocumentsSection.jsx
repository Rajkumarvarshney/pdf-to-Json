import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Files, Search, Filter, ChevronRight, FileText, Clock,
  CheckCircle2, Loader2, AlertCircle, Download, Trash2,
  MoreHorizontal, Eye, RefreshCw
} from 'lucide-react'
import { mockDocuments } from '../../data/mockData'

const statusConfig = {
  completed: { label: 'Completed', icon: CheckCircle2, cls: 'status-completed' },
  processing: { label: 'Processing', icon: Loader2, cls: 'status-processing' },
  error: { label: 'Error', icon: AlertCircle, cls: 'status-error' },
}

const typeColors = {
  resume: 'from-blue-500/20 to-indigo-500/10',
  invoice: 'from-green-500/20 to-emerald-500/10',
  research: 'from-purple-500/20 to-pink-500/10',
  contract: 'from-orange-500/20 to-amber-500/10',
}

const typeEmojis = { resume: '📄', invoice: '🧾', research: '📚', contract: '📋' }

function DocCard({ doc, onView, delay }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const status = statusConfig[doc.status] || statusConfig.completed
  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-5 hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 group relative"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeColors[doc.type] || 'from-gray-500/20 to-gray-600/10'} flex items-center justify-center flex-shrink-0 text-2xl`}>
          {typeEmojis[doc.type] || '📄'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-white font-semibold text-sm truncate">{doc.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{doc.pages}p</span>
                <span>·</span>
                <span>{doc.size}</span>
                <span>·</span>
                <Clock size={10} />
                <span>{uploadDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.cls} flex items-center gap-1`}>
                {doc.status === 'processing' && <Loader2 size={9} className="animate-spin" />}
                {status.label}
              </span>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
        <button
          id={`view-doc-${doc.id}`}
          onClick={() => onView(doc)}
          className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 flex-1 justify-center"
        >
          <Eye size={12} /> View
        </button>
        <button className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 flex-1 justify-center">
          <Download size={12} /> Export
        </button>
        <button className="text-gray-600 hover:text-red-400 transition-colors px-2">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div className="absolute top-12 right-4 glass-card p-1 rounded-lg z-10 min-w-32">
          {[
            { icon: Eye, label: 'View' },
            { icon: Download, label: 'Export JSON' },
            { icon: RefreshCw, label: 'Reprocess' },
            { icon: Trash2, label: 'Delete', cls: 'text-red-400' },
          ].map(({ icon: Icon, label, cls }) => (
            <button
              key={label}
              onClick={() => setMenuOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-white/5 transition-colors ${cls || 'text-gray-300'}`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function DocumentsSection({ onViewDocument }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = mockDocuments.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || doc.status === filter || doc.type === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-white/5 flex-shrink-0">
        <h1 className="text-2xl font-black text-white mb-4">Documents</h1>

        {/* Search and filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              id="document-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <select
            id="document-filter"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="resume">Resumes</option>
            <option value="invoice">Invoices</option>
            <option value="research">Research</option>
          </select>
        </div>
      </div>

      {/* Document grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((doc, i) => (
              <DocCard
                key={doc.id}
                doc={doc}
                delay={i * 0.08}
                onView={(doc) => onViewDocument({ name: doc.name })}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Files size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No documents found</p>
          </div>
        )}
      </div>
    </div>
  )
}
