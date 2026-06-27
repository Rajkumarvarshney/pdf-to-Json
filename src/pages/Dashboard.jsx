import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/dashboard/Sidebar'
import UploadSection from '../components/dashboard/UploadSection'
import DocumentViewer from '../components/dashboard/DocumentViewer'
import DocumentsSection from '../components/dashboard/DocumentsSection'
import SchemasSection from '../components/dashboard/SchemasSection'
import ExportsSection from '../components/dashboard/ExportsSection'
import RAGSection from '../components/dashboard/RAGSection'
import AnalyticsSection from '../components/dashboard/AnalyticsSection'
import SettingsSection from '../components/dashboard/SettingsSection'
import VideoUploadSection from '../components/dashboard/VideoUploadSection'
import VideoResultsViewer from '../components/dashboard/VideoResultsViewer'
import { mockStats } from '../data/mockData'
import { Bell, Search, Command } from 'lucide-react'

function TopBar({ activeSection }) {
  const titles = {
    upload: 'Upload Document',
    video: 'Video → JSON',
    documents: 'Documents',
    schemas: 'JSON Schemas',
    exports: 'Export Data',
    rag: 'RAG Pipeline',
    analytics: 'Analytics',
    settings: 'Settings',
  }

  return (
    <div
      className="h-14 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0"
      style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Dashboard</span>
        <span className="text-gray-700">/</span>
        <span className="text-white">{titles[activeSection]}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Search shortcut */}
        <button className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <Search size={12} />
          <span>Search...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 ml-2 text-gray-600">
            <Command size={10} />K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative text-gray-500 hover:text-white transition-colors">
          <Bell size={16} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500" />
        </button>
      </div>
    </div>
  )
}

export default function Dashboard({ onBack }) {
  const [activeSection, setActiveSection] = useState('upload')
  const [docData, setDocData] = useState(null)
  const [videoData, setVideoData] = useState(null)

  const handleDocumentReady = (data) => {
    // data is the full object from UploadSection: { name, fullText, schema, extractedData, ragChunks, ... }
    if (data) setDocData(data)
    setActiveSection('viewer')
  }

  const handleViewDocument = (doc) => {
    // doc from the Documents list — wraps as minimal docData for mock docs
    setDocData(doc)
    setActiveSection('viewer')
  }

  const handleVideoReady = (data) => {
    if (data) setVideoData(data)
    setActiveSection('video-results')
  }

  const renderMain = () => {
    if (activeSection === 'viewer' && docData) {
      return <DocumentViewer docData={docData} />
    }

    if (activeSection === 'video-results' && videoData) {
      return <VideoResultsViewer videoData={videoData} />
    }

    switch (activeSection) {
      case 'upload':
        return <UploadSection onDocumentReady={handleDocumentReady} />
      case 'video':
        return <VideoUploadSection onVideoReady={handleVideoReady} />
      case 'documents':
        return <DocumentsSection onViewDocument={handleViewDocument} />
      case 'schemas':
        return <SchemasSection />
      case 'exports':
        return <ExportsSection />
      case 'rag':
        return <RAGSection />
      case 'analytics':
        return <AnalyticsSection />
      case 'settings':
        return <SettingsSection />
      default:
        return <UploadSection onDocumentReady={handleDocumentReady} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Sidebar */}
      <Sidebar
        activeSection={['viewer', 'video-results'].includes(activeSection)
          ? (activeSection === 'video-results' ? 'video' : 'documents')
          : activeSection}
        setActiveSection={(s) => {
          setActiveSection(s)
          if (s !== 'documents' && s !== 'upload') setDocData(null)
          if (s !== 'video') setVideoData(null)
        }}
        onBack={onBack}
        stats={mockStats}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar activeSection={
          activeSection === 'viewer' ? 'documents'
          : activeSection === 'video-results' ? 'video'
          : activeSection
        } />

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection + (docData?.name || '')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {renderMain()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
