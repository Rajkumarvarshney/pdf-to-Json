import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Files, Code2, Download, Network, Settings,
  FileJson, ChevronLeft, Zap, BarChart3, X, Video
} from 'lucide-react'

const navItems = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'video', label: 'Video', icon: Video, badge: 'New' },
  { id: 'documents', label: 'Documents', icon: Files },
  { id: 'schemas', label: 'Schemas', icon: Code2 },
  { id: 'exports', label: 'Exports', icon: Download },
  { id: 'rag', label: 'RAG Pipeline', icon: Network },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ activeSection, setActiveSection, onBack, stats, onClose, className = '' }) {
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className={`w-64 flex-shrink-0 h-screen flex flex-col ${className}`}
      style={{
        background: 'rgba(10,10,20,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FileJson size={16} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-tight">DocParse <span className="text-indigo-400">AI</span></span>
              <div className="text-gray-600 text-xs">Document Intelligence</div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Back to landing */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full"
        >
          <ChevronLeft size={12} />
          Back to Home
        </button>
      </div>

      {/* Quick stats */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Docs', value: stats?.documents || 47 },
            { label: 'Exports', value: stats?.exportsCreated || 128 },
          ].map(s => (
            <div key={s.label} className="glass-card p-2 text-center rounded-lg">
              <div className="text-indigo-400 font-bold text-lg">{s.value}</div>
              <div className="text-gray-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="text-xs text-gray-600 font-semibold uppercase tracking-widest mb-3 px-2">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <button
                  id={`sidebar-${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left relative ${
                    isActive
                      ? 'text-indigo-300'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/4'
                  }`}
                  style={isActive ? {
                    background: 'rgba(99,102,241,0.12)',
                    borderLeft: '2px solid #6366f1',
                  } : {}}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.08)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon size={16} className={isActive ? 'text-indigo-400' : ''} />
                  <span className="relative">{item.label}</span>
                  {item.id === 'rag' && (
                    <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-medium">New</span>
                  )}
                  {item.id === 'video' && (
                    <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-medium">New</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-xs text-white font-medium">Free Plan</span>
          </div>
          <div className="progress-bar mb-2">
            <div className="progress-fill" style={{ width: '47%' }} />
          </div>
          <div className="text-xs text-gray-500">47 / 100 pages used</div>
          <button className="btn-primary w-full mt-2 text-xs py-2">Upgrade Plan</button>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            J
          </div>
          <div>
            <div className="text-xs text-white font-medium">John Doe</div>
            <div className="text-xs text-gray-500">john@example.com</div>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
