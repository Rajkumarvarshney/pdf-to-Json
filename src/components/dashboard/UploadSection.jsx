import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle2, Loader2, Sparkles,
  AlertCircle, Key, RefreshCw
} from 'lucide-react'
import { extractTextFromPDF, createRAGChunks } from '../../utils/pdfExtractor'
import { extractTextFromDOCX } from '../../utils/docxHandler'
import { extractTextFromPPTX } from '../../utils/pptxHandler'
import { processDocumentWithGroq, processExamWithGroq, hasApiKey } from '../../utils/groqService'
import ApiKeyModal from '../ui/ApiKeyModal'
import SchemaBuilder from './SchemaBuilder'
import { useSchemaStore } from '../../hooks/useSchemaStore'

// ─── Real processing steps shown during AI pipeline ──────────────────────────
const STEPS = [
  { id: 0, label: 'Reading document pages...' },
  { id: 1, label: 'Extracting text & layout...' },
  { id: 2, label: 'Detecting document type...' },
  { id: 3, label: 'Generating JSON Schema with Groq AI...' },
  { id: 4, label: 'Extracting structured data...' },
  { id: 5, label: 'Creating RAG chunks...' },
  { id: 6, label: 'Finalising results...' },
]

const ProcessingStep = ({ label, isActive, isComplete, isError }) => (
  <div className={`flex items-center gap-3 py-1.5 transition-all ${
    isActive ? 'opacity-100' : isComplete ? 'opacity-50' : isError ? 'opacity-80' : 'opacity-25'
  }`}>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
      isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : isActive ? 'bg-indigo-500' : 'bg-white/10'
    }`}>
      {isError ? (
        <AlertCircle size={11} className="text-white" />
      ) : isComplete ? (
        <CheckCircle2 size={11} className="text-white" />
      ) : isActive ? (
        <Loader2 size={11} className="text-white animate-spin" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-white/30" />
      )}
    </div>
    <span className={`text-sm ${
      isError ? 'text-red-400' : isActive ? 'text-white font-medium' : isComplete ? 'text-gray-400' : 'text-gray-600'
    }`}>
      {label}
    </span>
  </div>
)

export default function UploadSection({ onDocumentReady }) {
  const [uploadState, setUploadState] = useState('idle') // idle | schema_setup | processing | done | error
  const [uploadedFile, setUploadedFile] = useState(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyReady, setApiKeyReady] = useState(hasApiKey())
  const [parseMode, setParseMode] = useState('general') // general | exam

  // Schema Builder State & Store Configuration
  const [schemaMode, setSchemaMode] = useState('auto')
  const {
    fields,
    addField,
    updateField,
    deleteField,
    clearFields,
    loadTemplate,
    resetToSaved,
    reorderFields,
    moveField
  } = useSchemaStore()

  // On mount, auto-restore custom schema mode if custom fields exist in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('docparse_custom_schema')
    if (saved) {
      setSchemaMode('custom')
    }
  }, [])

  // ─── REAL DOCUMENT PROCESSING ───────────────────────────────────────────────
  const processRealPDF = async (file, customSchema = null, fieldsTree = null) => {
    setUploadState('processing')
    setUploadedFile(file)
    setCompletedSteps([])
    setCurrentStep(0)
    setErrorMsg('')

    const advance = (step) => {
      setCurrentStep(step)
      setCompletedSteps(prev => [...prev, step - 1].filter(s => s >= 0))
    }

    try {
      // Step 0-1: Extract text based on file format
      advance(0)
      await delay(300)
      advance(1)
      
      const fileExtension = file.name.split('.').pop().toLowerCase()
      let extractedDataResult

      if (fileExtension === 'docx') {
        extractedDataResult = await extractTextFromDOCX(file)
      } else if (fileExtension === 'pptx') {
        extractedDataResult = await extractTextFromPPTX(file)
      } else if (fileExtension === 'pdf') {
        extractedDataResult = await extractTextFromPDF(file)
      } else {
        throw new Error('Unsupported file format. Please upload PDF, DOCX, or PPTX.')
      }

      const { fullText, pages, pageCount, images } = {
        fullText: extractedDataResult.fullText,
        pages: extractedDataResult.pages,
        pageCount: extractedDataResult.pageCount || extractedDataResult.pages.length,
        images: extractedDataResult.images || extractedDataResult.pages.flatMap((p) => 
          (p.imageBase64 || []).map((imgBase64, imgIdx) => ({
            id: `${p.pageNumber}_img_${imgIdx}`,
            pageNum: p.pageNumber,
            dataUrl: imgBase64
          }))
        )
      }

      if (!fullText || fullText.trim().length < 20) {
        throw new Error('Could not extract text from this document. Ensure it contains parseable content.')
      }

      // Step 2: Detecting doc type (calls Groq internally if not custom schema)
      if (customSchema) {
        advance(2)
        await delay(100)
        advance(3)
      } else {
        advance(2)
        await delay(200)
        advance(3)
      }

      // Step 3: Generate schema + Step 4: Extract data (single Groq call combo)
      let docResult
      if (parseMode === 'exam') {
        docResult = await processExamWithGroq(pages, (msg) => {
          if (msg.includes('Extracting')) advance(4)
        })
      } else {
        docResult = await processDocumentWithGroq(
          pages, 
          (msg) => { if (msg.includes('Extracting')) advance(4) },
          customSchema,
          customSchema ? 'custom_document' : 'document',
          fieldsTree
        )
      }
      const { documentType, schema, extractedData, failedPages } = docResult

      // Step 5: Chunk for RAG
      advance(5)
      await delay(300)
      const ragChunks = createRAGChunks(fullText, documentType)

      // Step 6: Finalise
      advance(6)
      setCompletedSteps([0, 1, 2, 3, 4, 5, 6])
      await delay(500)

      setUploadState('done')

      // Pass complete real document data to parent
      const documentData = {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        pageCount,
        file,
        fullText,
        pages,
        images,
        parseMode,
        documentType,
        fileType: fileExtension,
        schema: {
          ...schema,
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: documentType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        },
        extractedData,
        ragChunks,
        failedPages,
        isReal: true,
      }

      setTimeout(() => onDocumentReady(documentData), 600)

    } catch (err) {
      setCurrentStep(-1)
      setUploadState('error')
      setErrorMsg(err.message || 'An unexpected error occurred.')
    }
  }

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploadedFile(file)
    setUploadState('schema_setup')
  }

  const handleApiKeySet = () => {
    setApiKeyReady(true)
    setShowApiKeyModal(false)
    if (uploadedFile && uploadState !== 'processing') {
      processRealPDF(uploadedFile)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    multiple: false,
    disabled: uploadState === 'processing',
  })

  const reset = () => {
    setUploadState('idle')
    setUploadedFile(null)
    setCurrentStep(-1)
    setCompletedSteps([])
    setErrorMsg('')
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 overflow-y-auto h-full">
      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal onKeySet={handleApiKeySet} />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Upload Document</h1>
        <p className="text-gray-400">Upload any PDF — the AI will extract real structured data from it</p>
      </div>

      {/* API Key status banner */}
      {uploadState === 'idle' && (
        <div className="mb-4">
          {apiKeyReady ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-green-400"
            >
              <CheckCircle2 size={12} />
              Groq AI ready — Client API Key configured
              <button
                onClick={() => { setApiKeyReady(false); localStorage.removeItem('groq_api_key') }}
                className="text-gray-600 hover:text-gray-400 ml-2 underline"
              >
                Change key
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-indigo-400"
            >
              <CheckCircle2 size={12} />
              Using secure Server API Proxy — PDF parsing active. You can add a custom key in Settings.
            </motion.div>
          )}
        </div>
      )}

      {/* Mode Selector */}
      {uploadState === 'idle' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            id="mode-btn-general"
            onClick={() => setParseMode('general')}
            className={`flex-1 p-4 rounded-xl border text-left transition-all ${
              parseMode === 'general'
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-white/5 bg-white/2 text-gray-400 hover:border-white/10'
            }`}
          >
            <div className="font-bold text-sm">General Document Mode</div>
            <div className="text-xs text-gray-500 mt-1">Extract key-value fields with dynamic schema generation</div>
          </button>
          <button
            id="mode-btn-exam"
            onClick={() => setParseMode('exam')}
            className={`flex-1 p-4 rounded-xl border text-left transition-all ${
              parseMode === 'exam'
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-white/5 bg-white/2 text-gray-400 hover:border-white/10'
            }`}
          >
            <div className="font-bold text-sm">Exam / Test Paper Mode</div>
            <div className="text-xs text-gray-500 mt-1">Extract Q&A, MCQs, math LaTeX formulas, and auto-crop diagrams</div>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── SCHEMA SETUP: Custom Schema Builder ── */}
        {uploadState === 'schema_setup' && (
          <motion.div
            key="schema_setup"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            {/* Small File Header Summary before builder */}
            <div className="flex items-center justify-between p-3.5 bg-[#14141f] border border-white/5 rounded-xl mb-4 text-xs">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-indigo-400" />
                <span className="font-bold text-white truncate max-w-[150px] sm:max-w-xs" title={uploadedFile?.name}>{uploadedFile?.name}</span>
                <span className="text-gray-500">({uploadedFile?.size ? `${Math.round(uploadedFile.size / 1024)} KB` : ''})</span>
              </div>
              <button 
                onClick={() => { setUploadState('idle'); setUploadedFile(null) }}
                className="text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                Upload a different file
              </button>
            </div>

            <SchemaBuilder
              mode={schemaMode}
              onModeChange={setSchemaMode}
              fields={fields}
              addField={addField}
              updateField={updateField}
              deleteField={deleteField}
              clearFields={clearFields}
              loadTemplate={loadTemplate}
              resetToSaved={resetToSaved}
              reorderFields={reorderFields}
              moveField={moveField}
              onExtract={(customFields, customSchema) => {
                processRealPDF(
                  uploadedFile, 
                  schemaMode === 'custom' ? customSchema : null, 
                  schemaMode === 'custom' ? customFields : null
                )
              }}
            />
          </motion.div>
        )}

        {/* ── IDLE: Drop zone ── */}
        {uploadState === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              id="pdf-dropzone"
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-16 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]'
                  : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/2'
              }`}
            >
              <input {...getInputProps()} id="pdf-file-input" />

              <motion.div
                animate={isDragActive ? { scale: 1.2, y: -10 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20"
              >
                <Upload size={36} className={isDragActive ? 'text-indigo-400' : 'text-gray-500'} />
              </motion.div>

              {isDragActive ? (
                <p className="text-indigo-400 font-semibold text-lg">Drop it here!</p>
              ) : (
                <>
                  <p className="text-white font-semibold text-xl mb-1">Drag & drop your file here</p>
                  <p className="text-gray-500 mb-4 text-sm">or click to browse your files · PDF, DOCX, or PPTX</p>
                  
                  {/* File type badges */}
                  <div className="flex justify-center gap-2 mb-5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">PDF</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md">DOCX</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md">PPTX</span>
                  </div>

                  <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Real AI extraction</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Layout aware</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Up to 50MB</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── PROCESSING: AI Pipeline ── */}
        {uploadState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-8 rounded-2xl"
          >
            {/* File info */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <FileText size={22} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">{uploadedFile?.name}</div>
                <div className="text-gray-500 text-sm">
                  {uploadedFile?.size ? `${Math.round(uploadedFile.size / 1024)} KB` : ''}
                </div>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" />
                Processing with Groq AI
              </div>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-sm text-gray-300 font-medium">AI Extraction Pipeline</span>
            </div>

            <div className="space-y-0.5">
              {STEPS.map((step, i) => (
                <ProcessingStep
                  key={step.id}
                  label={step.label}
                  isActive={currentStep === i}
                  isComplete={completedSteps.includes(i)}
                  isError={false}
                />
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-5 text-center">
              This may take 10–30 seconds depending on document size
            </p>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {uploadState === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 text-center rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 size={38} className="text-green-400" />
            </motion.div>
            <h3 className="text-white text-2xl font-black mb-2">Extraction Complete!</h3>
            <p className="text-gray-400 mb-6">
              <span className="text-indigo-400 font-medium">{uploadedFile?.name}</span> has been parsed and structured by Groq AI.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                id="view-results-btn"
                className="btn-primary flex items-center gap-2"
                onClick={() => onDocumentReady(null)} // data already sent in processRealPDF
              >
                View Results
              </button>
              <button className="btn-secondary flex items-center gap-2" onClick={reset}>
                <RefreshCw size={14} /> Upload Another
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {uploadState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center rounded-2xl border border-red-500/20"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Processing Failed</h3>
            <p className="text-gray-400 text-sm mb-2 max-w-sm mx-auto">{errorMsg}</p>
            {errorMsg.includes('API key') && (
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="text-sm text-indigo-400 underline mb-4 block mx-auto"
              >
                Configure Groq API key
              </button>
            )}
            <button className="btn-secondary flex items-center gap-2 mx-auto mt-4" onClick={reset}>
              <RefreshCw size={14} /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supported formats guide */}
      {uploadState === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { type: 'Resume', color: 'from-blue-500/20 to-indigo-500/10', emoji: '📄' },
            { type: 'Invoice', color: 'from-green-500/20 to-emerald-500/10', emoji: '🧾' },
            { type: 'Research', color: 'from-purple-500/20 to-pink-500/10', emoji: '📚' },
            { type: 'Contract', color: 'from-orange-500/20 to-amber-500/10', emoji: '📋' },
          ].map(({ type, color, emoji }) => (
            <div key={type} className={`glass-card p-4 text-center bg-gradient-to-br ${color} hover:-translate-y-0.5 transition-transform`}>
              <div className="text-2xl mb-2">{emoji}</div>
              <div className="text-white text-sm font-medium">{type}</div>
              <div className="text-gray-500 text-xs">Supported</div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms))
}
