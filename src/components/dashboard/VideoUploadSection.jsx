import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, CheckCircle2, Loader2, Sparkles,
  AlertCircle, RefreshCw, Play, Clock, Layers,
  BookOpen, LayoutGrid
} from 'lucide-react'
import { extractVideoFrames, getVideoMetadata, estimateFrameCount } from '../../utils/videoFrameExtractor'
import { processVideoFrames, generateEducationalScript } from '../../utils/groqVisionService'
import { hasApiKey } from '../../utils/groqService'
import ApiKeyModal from '../ui/ApiKeyModal'

const INTERVAL_OPTIONS = [
  { value: 1, label: 'Every 1s', desc: 'Very detailed' },
  { value: 2, label: 'Every 2s', desc: 'Recommended' },
  { value: 5, label: 'Every 5s', desc: 'Quick scan' },
  { value: 10, label: 'Every 10s', desc: 'Overview only' },
]

const MODES = [
  {
    id: 'educational',
    icon: BookOpen,
    title: 'Educational Script',
    desc: 'Generates a structured video script JSON with topics, scenes, speech scripts, and LaTeX formulas — perfect for educational content.',
    badge: 'Recommended',
    color: 'purple',
  },
  {
    id: 'generic',
    icon: LayoutGrid,
    title: 'Per-Frame JSON',
    desc: 'Analyzes each frame individually and returns structured JSON describing objects, text, and scene details for every frame.',
    badge: null,
    color: 'indigo',
  },
]

const MAX_VIDEO_SIZE_MB = 200
const MAX_FRAMES_GENERIC = 60
const MAX_FRAMES_EDUCATIONAL = 30 // educational mode uses batches, fewer is fine

function formatDuration(seconds) {
  if (!isFinite(seconds)) return '--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function VideoUploadSection({ onVideoReady }) {
  const [uploadState, setUploadState] = useState('idle')
  const [videoFile, setVideoFile] = useState(null)
  const [videoMeta, setVideoMeta] = useState(null)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const [mode, setMode] = useState('educational')
  const [isDragOver, setIsDragOver] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyReady, setApiKeyReady] = useState(hasApiKey())

  // Progress state
  const [phase, setPhase] = useState('')
  const [phaseMsg, setPhaseMsg] = useState('')
  const [extractProgress, setExtractProgress] = useState({ current: 0, total: 0 })
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 })
  const [errorMsg, setErrorMsg] = useState('')
  const [latestFrame, setLatestFrame] = useState(null)

  const fileInputRef = useRef(null)

  const handleFileSelect = async (file) => {
    if (!file) return
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
      setErrorMsg('Unsupported file. Please upload MP4, WebM, MOV, or AVI.')
      setUploadState('error')
      return
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File too large. Max ${MAX_VIDEO_SIZE_MB}MB.`)
      setUploadState('error')
      return
    }
    setVideoFile(file)
    setErrorMsg('')
    try {
      const meta = await getVideoMetadata(file)
      setVideoMeta(meta)
      setUploadState('preview')
    } catch (err) {
      setErrorMsg(err.message)
      setUploadState('error')
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }, [apiKeyReady])

  const startProcessing = async () => {
    if (!videoFile || !videoMeta) return

    const maxFrames = mode === 'educational' ? MAX_FRAMES_EDUCATIONAL : MAX_FRAMES_GENERIC
    setUploadState('processing')
    setPhase('extracting')
    setPhaseMsg('Extracting frames from video...')
    setExtractProgress({ current: 0, total: 0 })
    setAnalyzeProgress({ current: 0, total: 0 })
    setLatestFrame(null)

    try {
      // Phase 1: Extract frames
      const frames = await extractVideoFrames(
        videoFile,
        intervalSecs,
        (current, total, dataUrl) => {
          setExtractProgress({ current, total })
          setLatestFrame(dataUrl)
        }
      )
      const cappedFrames = frames.slice(0, maxFrames)

      if (mode === 'educational') {
        // ── EDUCATIONAL SCRIPT MODE ──────────────────────────────
        setPhase('transcribing')
        setPhaseMsg('Reading video content with AI Vision...')
        setAnalyzeProgress({ current: 0, total: cappedFrames.length })

        const videoName = videoFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

        const script = await generateEducationalScript(
          videoName,
          cappedFrames,
          (subPhase, current, total, msg) => {
            setPhase(subPhase)
            setPhaseMsg(msg)
            if (subPhase === 'transcribing') {
              setAnalyzeProgress({ current, total })
            }
          }
        )

        setUploadState('done')
        setTimeout(() => {
          onVideoReady({
            mode: 'educational',
            file: videoFile,
            meta: videoMeta,
            intervalSecs,
            frames: cappedFrames,
            script,
            name: videoFile.name,
          })
        }, 500)

      } else {
        // ── GENERIC PER-FRAME MODE ───────────────────────────────
        setPhase('analyzing')
        setPhaseMsg('Analyzing frames with Groq Vision...')
        setAnalyzeProgress({ current: 0, total: cappedFrames.length })

        const frameResults = await processVideoFrames(
          cappedFrames,
          (current, total) => setAnalyzeProgress({ current, total }),
          (idx, err) => console.warn(`Frame ${idx} failed:`, err.message)
        )

        setUploadState('done')
        setTimeout(() => {
          onVideoReady({
            mode: 'generic',
            file: videoFile,
            meta: videoMeta,
            intervalSecs,
            frames: cappedFrames,
            frameResults,
            name: videoFile.name,
          })
        }, 500)
      }

    } catch (err) {
      setErrorMsg(err.message || 'Processing failed.')
      setUploadState('error')
    }
  }

  const reset = () => {
    setUploadState('idle')
    setVideoFile(null)
    setVideoMeta(null)
    setExtractProgress({ current: 0, total: 0 })
    setAnalyzeProgress({ current: 0, total: 0 })
    setPhase('')
    setPhaseMsg('')
    setErrorMsg('')
    setLatestFrame(null)
  }

  const maxFrames = mode === 'educational' ? MAX_FRAMES_EDUCATIONAL : MAX_FRAMES_GENERIC
  const estimatedFrames = videoMeta
    ? Math.min(estimateFrameCount(videoMeta.duration, intervalSecs), maxFrames)
    : 0

  // ── Phase label helper ────────────────────────────────────────
  const phaseLabel = {
    extracting: 'Extracting Frames',
    transcribing: 'AI Vision — Reading Content',
    synthesizing: 'Building Script with AI',
    analyzing: 'Analyzing Frames (Groq Vision)',
    done: 'Complete',
  }[phase] || 'Processing...'

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 overflow-y-auto h-full">
      {showApiKeyModal && (
        <ApiKeyModal onKeySet={() => {
          setApiKeyReady(true)
          setShowApiKeyModal(false)
          if (videoFile) handleFileSelect(videoFile)
        }} />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Video → JSON</h1>
        <p className="text-gray-400">Upload an educational or any video — AI will analyze and extract structured JSON</p>
      </div>

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
              Using secure Server API Proxy — Video parsing active. You can add a custom key in Settings.
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {uploadState === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-4">
              {MODES.map((m) => {
                const Icon = m.icon
                const isSelected = mode === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`relative p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? m.color === 'purple'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/8 hover:border-white/15'
                    }`}
                  >
                    {m.badge && (
                      <span className="absolute top-3 right-3 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        {m.badge}
                      </span>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      isSelected
                        ? m.color === 'purple' ? 'bg-purple-500/20' : 'bg-indigo-500/20'
                        : 'bg-white/5'
                    }`}>
                      <Icon size={20} className={isSelected
                        ? m.color === 'purple' ? 'text-purple-400' : 'text-indigo-400'
                        : 'text-gray-500'
                      } />
                    </div>
                    <div className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {m.title}
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">{m.desc}</div>
                  </button>
                )
              })}
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              id="video-dropzone"
              className={`relative border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${
                isDragOver ? 'border-purple-500 bg-purple-500/5 scale-[1.01]' : 'border-white/10 hover:border-purple-500/40 hover:bg-white/2'
              }`}
            >
              <input ref={fileInputRef} type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi,.mkv"
                className="hidden" id="video-file-input"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              <motion.div
                animate={isDragOver ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center mx-auto mb-5"
              >
                <Video size={30} className={isDragOver ? 'text-purple-400' : 'text-gray-500'} />
              </motion.div>
              {isDragOver ? (
                <p className="text-purple-400 font-semibold text-lg">Drop your video!</p>
              ) : (
                <>
                  <p className="text-white font-semibold text-lg mb-2">Drag & drop your video here</p>
                  <p className="text-gray-500 text-sm mb-4">or click to browse · MP4, WebM, MOV, AVI</p>
                  <div className="flex items-center justify-center gap-5 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Groq Vision AI</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> LaTeX formulas</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Up to {MAX_VIDEO_SIZE_MB}MB</span>
                  </div>
                </>
              )}
            </div>

            {/* Format chips */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { fmt: 'MP4', emoji: '🎬' },
                { fmt: 'WebM', emoji: '🌐' },
                { fmt: 'MOV', emoji: '🎥' },
                { fmt: 'AVI', emoji: '📹' },
              ].map(({ fmt, emoji }) => (
                <div key={fmt} className="glass-card p-3 text-center">
                  <div className="text-xl mb-1">{emoji}</div>
                  <div className="text-white text-xs font-medium">{fmt}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── PREVIEW ── */}
        {uploadState === 'preview' && videoMeta && (
          <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* File info */}
            <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Video size={26} className="text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate">{videoFile?.name}</div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(videoMeta.duration)}</span>
                  <span>{videoMeta.width}×{videoMeta.height}</span>
                  <span>{formatFileSize(videoFile?.size)}</span>
                </div>
              </div>
              <button onClick={reset} className="text-gray-600 hover:text-gray-400 text-xs underline">Change</button>
            </div>

            {/* Mode badge */}
            <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                {mode === 'educational' ? <BookOpen size={16} className="text-purple-400" /> : <LayoutGrid size={16} className="text-indigo-400" />}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">
                  {mode === 'educational' ? 'Educational Script Mode' : 'Per-Frame Analysis Mode'}
                </div>
                <div className="text-gray-500 text-xs">
                  {mode === 'educational'
                    ? 'Will produce structured video_name/topics/scenes JSON with speech scripts'
                    : 'Will produce per-frame JSON with scene descriptions'}
                </div>
              </div>
              <button onClick={() => setUploadState('idle')} className="ml-auto text-xs text-gray-600 hover:text-gray-400 underline">Change mode</button>
            </div>

            {/* Interval selector */}
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={15} className="text-purple-400" />
                <span className="text-white font-semibold text-sm">Frame Extraction Interval</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setIntervalSecs(opt.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      intervalSecs === opt.value
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-white/8 text-gray-400 hover:border-white/15'
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <div className={`rounded-xl p-4 flex items-center gap-3 ${
                estimatedFrames > 20 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-purple-500/10 border border-purple-500/20'
              }`}>
                <Sparkles size={15} className={estimatedFrames > 20 ? 'text-yellow-400' : 'text-purple-400'} />
                <div className="text-sm">
                  <span className="text-white font-semibold">{estimatedFrames} frames</span>
                  <span className="text-gray-400"> will be extracted</span>
                  {mode === 'educational' && (
                    <span className="text-purple-400"> → synthesized into structured script</span>
                  )}
                </div>
              </div>
            </div>

            <button id="start-video-processing" onClick={startProcessing}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base"
            >
              <Play size={18} />
              {mode === 'educational' ? 'Generate Educational Script' : `Analyze ${estimatedFrames} Frames`}
            </button>
          </motion.div>
        )}

        {/* ── PROCESSING ── */}
        {uploadState === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Live frame preview */}
            {latestFrame && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card rounded-2xl overflow-hidden aspect-video relative"
              >
                <img src={latestFrame} alt="Frame" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-white text-xs font-medium">{phaseMsg}</span>
                </div>
              </motion.div>
            )}

            {/* Progress card */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="text-purple-400 animate-spin" />
                  <span className="text-white font-semibold">{phaseLabel}</span>
                </div>
              </div>

              {/* Steps */}
              {[
                {
                  label: 'Phase 1 · Extract Frames',
                  progress: extractProgress,
                  color: 'from-purple-500 to-pink-500',
                  active: phase === 'extracting',
                  done: extractProgress.current > 0 && extractProgress.current >= extractProgress.total,
                },
                ...(mode === 'educational' ? [
                  {
                    label: 'Phase 2 · AI Vision — Read Content',
                    progress: analyzeProgress,
                    color: 'from-indigo-500 to-cyan-500',
                    active: phase === 'transcribing',
                    done: phase === 'synthesizing' || phase === 'done',
                  },
                  {
                    label: 'Phase 3 · Synthesize Script',
                    progress: { current: phase === 'synthesizing' ? 1 : 0, total: 1 },
                    color: 'from-green-500 to-emerald-500',
                    active: phase === 'synthesizing',
                    done: phase === 'done',
                  },
                ] : [
                  {
                    label: 'Phase 2 · Groq Vision Analysis',
                    progress: analyzeProgress,
                    color: 'from-indigo-500 to-cyan-500',
                    active: phase === 'analyzing',
                    done: analyzeProgress.current > 0 && analyzeProgress.current >= analyzeProgress.total,
                  },
                ]),
              ].map((step, i) => (
                <div key={i} className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      {step.done
                        ? <CheckCircle2 size={11} className="text-green-400" />
                        : step.active
                          ? <Loader2 size={11} className="animate-spin text-purple-400" />
                          : <div className="w-2.5 h-2.5 rounded-full bg-white/10" />}
                      {step.label}
                    </span>
                    {step.progress.total > 0 && (
                      <span>{step.progress.current}/{step.progress.total}</span>
                    )}
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                      animate={{
                        width: step.done ? '100%'
                          : step.active && step.progress.total > 0
                            ? `${(step.progress.current / step.progress.total) * 100}%`
                            : step.active ? '60%'
                            : '0%'
                      }}
                      transition={{ ease: 'linear', duration: 0.4 }}
                    />
                  </div>
                </div>
              ))}

              {phaseMsg && (
                <p className="text-xs text-gray-500 text-center mt-4">{phaseMsg}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {uploadState === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 text-center rounded-2xl"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 size={38} className="text-green-400" />
            </motion.div>
            <h3 className="text-white text-2xl font-black mb-2">
              {mode === 'educational' ? 'Script Generated!' : 'Analysis Complete!'}
            </h3>
            <p className="text-gray-400 mb-6">
              {mode === 'educational'
                ? 'Your educational video script is ready with topics, scenes, and speech scripts.'
                : `${analyzeProgress.total} frames analyzed successfully.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button id="view-video-results-btn" className="btn-primary flex items-center gap-2"
                onClick={() => onVideoReady(null)}>
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
          <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center rounded-2xl border border-red-500/20"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Processing Failed</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-sm mx-auto">{errorMsg}</p>
            <button className="btn-secondary flex items-center gap-2 mx-auto" onClick={reset}>
              <RefreshCw size={14} /> Try Again
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
