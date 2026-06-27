import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Copy, CheckCircle2, ChevronRight, ChevronDown,
  Layers, Code2, BookOpen, Video, AlertCircle, Play,
  Clock, FileJson, MessageSquare
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────

function formatTime(s) {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

function SceneTypeBadge({ type }) {
  const colors = {
    opening: 'bg-yellow-500/20 text-yellow-300',
    table_of_contents: 'bg-blue-500/20 text-blue-300',
    topic_intro: 'bg-purple-500/20 text-purple-300',
    engagement_hook_definition: 'bg-orange-500/20 text-orange-300',
    engagement_hook_real_life_problem: 'bg-green-500/20 text-green-300',
    engagement_hook_shocking_stat: 'bg-red-500/20 text-red-300',
    note: 'bg-indigo-500/20 text-indigo-300',
    flow_chart: 'bg-cyan-500/20 text-cyan-300',
    closing: 'bg-pink-500/20 text-pink-300',
  }
  const label = type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || 'bg-white/10 text-gray-400'}`}>
      {label}
    </span>
  )
}

// ─── Scene Card ───────────────────────────────────────────────────

function SceneCard({ scene, index, isExpanded, onToggle }) {
  const getTitle = (s) => s.title || s.term || (s.type === 'table_of_contents' ? 'Table of Contents' : s.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-gray-600 text-xs font-mono w-5 flex-shrink-0">#{index + 1}</span>
          <SceneTypeBadge type={scene.type} />
          <span className="text-white text-sm font-medium truncate">{getTitle(scene)}</span>
        </div>
        {isExpanded ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5">

              {/* Speech */}
              {(scene.speech || scene.title_speech || scene.subtitle_speech) && (
                <div className="mt-3 p-3 rounded-lg bg-white/3 border-l-2 border-purple-500/40">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare size={11} className="text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">Speech</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed italic">
                    {scene.speech || scene.title_speech}
                  </p>
                  {scene.subtitle_speech && (
                    <p className="text-gray-400 text-xs leading-relaxed italic mt-1">{scene.subtitle_speech}</p>
                  )}
                </div>
              )}

              {/* Definition */}
              {scene.definition && (
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="text-orange-400 text-xs font-semibold mb-1">Term: {scene.term}</div>
                  <div className="text-gray-300 text-sm font-mono">{scene.definition}</div>
                </div>
              )}

              {/* Problem / Statistic */}
              {scene.problem && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="text-green-400 text-xs font-semibold mb-1">Problem</div>
                  <div className="text-gray-300 text-sm">{scene.problem}</div>
                </div>
              )}
              {scene.statistic && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="text-red-400 text-xs font-semibold mb-1">Statistic</div>
                  <div className="text-white text-lg font-black font-mono">{scene.statistic}</div>
                  {scene.explanation && <div className="text-gray-400 text-xs mt-1">{scene.explanation}</div>}
                </div>
              )}

              {/* Table of contents topics */}
              {scene.topics && Array.isArray(scene.topics) && (
                <div className="space-y-1">
                  {scene.topics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      {t}
                    </div>
                  ))}
                </div>
              )}

              {/* Note items */}
              {scene.items && (
                <div className="space-y-2">
                  {scene.items.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/3">
                      <div className="text-white text-xs font-semibold mb-1">{item.title}</div>
                      <div className="text-gray-400 text-xs font-mono leading-relaxed">{item.description}</div>
                      {item.speech && <div className="text-gray-600 text-xs italic mt-1">💬 {item.speech}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Flowchart nodes */}
              {scene.nodes && (
                <div className="space-y-2">
                  {scene.nodes.map((node, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                      <div>
                        <div className="text-white text-xs font-semibold">{node.title}</div>
                        <div className="text-gray-500 text-xs">{node.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Layout and illustrations metadata */}
              {(scene.layout || scene.illustrations?.length > 0) && (
                <div className="flex gap-2 flex-wrap">
                  {scene.layout && (
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500">
                      Layout: {scene.layout}
                    </span>
                  )}
                  {scene.illustrations?.map((ill, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500">
                      🎨 {ill}
                    </span>
                  ))}
                  {scene.hero_image_desc && (
                    <span className="text-xs text-gray-600 italic w-full">📷 {scene.hero_image_desc}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Educational Script Viewer ────────────────────────────────────

function EducationalScriptViewer({ videoData }) {
  const { script, file } = videoData
  const [expandedScenes, setExpandedScenes] = useState(new Set([0]))
  const [activeTopicIdx, setActiveTopicIdx] = useState(0)
  const [viewMode, setViewMode] = useState('structured') // 'structured' | 'raw'
  const [copied, setCopied] = useState(false)

  const topics = script?.topics || []
  const allScenes = topics.flatMap((t, ti) =>
    (t.scenes || []).map((s, si) => ({ ...s, _topicIdx: ti, _sceneIdx: si }))
  )

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${script?.video_name || 'video_script'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(script, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleScene = (idx) => {
    setExpandedScenes(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen size={16} className="text-purple-400" />
          <div>
            <span className="text-white font-bold text-sm">{script?.video_name || file?.name}</span>
            <span className="text-gray-600 text-xs ml-2">· {allScenes.length} scenes · {topics.length} topics</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex glass-card rounded-lg overflow-hidden p-0.5 gap-0.5">
            {[
              { id: 'structured', icon: Layers, label: 'Scenes' },
              { id: 'raw', icon: Code2, label: 'Raw JSON' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === id ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
          <button onClick={copyJSON}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors glass-card px-3 py-1.5 rounded-lg"
          >
            {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button onClick={downloadJSON} className="btn-primary flex items-center gap-2 text-xs py-2" id="download-script-btn">
            <Download size={13} /> Download JSON
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">

        {/* Left: Topic nav */}
        <div className="w-56 flex-shrink-0 border-r border-white/5 overflow-y-auto p-3">
          <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-3 px-2">Topics</div>
          {topics.map((topic, ti) => {
            const firstScene = topic.scenes?.[0]
            const title = firstScene?.title
              || (firstScene?.type === 'opening' ? 'Opening' : '')
              || (firstScene?.type === 'table_of_contents' ? 'Contents' : '')
              || (firstScene?.type === 'closing' ? 'Closing' : '')
              || `Topic ${ti + 1}`
            return (
              <button key={ti} onClick={() => setActiveTopicIdx(ti)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all mb-1 ${
                  activeTopicIdx === ti
                    ? 'bg-purple-500/15 text-purple-300 border-l-2 border-purple-500'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'
                }`}
              >
                <div className="font-medium truncate">{title}</div>
                <div className="text-gray-600 text-xs mt-0.5">{topic.scenes?.length} scene{topic.scenes?.length !== 1 ? 's' : ''}</div>
              </button>
            )
          })}
        </div>

        {/* Right: Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'structured' && (
            <div className="space-y-3 max-w-3xl">
              {(topics[activeTopicIdx]?.scenes || []).map((scene, si) => {
                const globalIdx = topics.slice(0, activeTopicIdx).reduce((acc, t) => acc + (t.scenes?.length || 0), 0) + si
                return (
                  <SceneCard
                    key={globalIdx}
                    scene={scene}
                    index={si}
                    isExpanded={expandedScenes.has(globalIdx)}
                    onToggle={() => toggleScene(globalIdx)}
                  />
                )
              })}
            </div>
          )}

          {viewMode === 'raw' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-sm text-white font-semibold">Full JSON Script</span>
                <span className="text-xs text-gray-500">{JSON.stringify(script).length.toLocaleString()} chars</span>
              </div>
              <pre className="p-6 text-xs font-mono text-gray-300 leading-relaxed overflow-auto max-h-[60vh]">
                {JSON.stringify(script, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Generic Per-Frame Viewer ─────────────────────────────────────

function FrameViewer({ videoData }) {
  const { frames = [], frameResults = [], file } = videoData
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [viewMode, setViewMode] = useState('split')
  const [copied, setCopied] = useState(null)

  const selectedFrame = frames[selectedIdx]
  const selectedResult = frameResults[selectedIdx]
  const clean = selectedResult
    ? Object.fromEntries(Object.entries(selectedResult).filter(([k]) => !k.startsWith('_')))
    : null

  const downloadAll = () => {
    const all = frameResults.map(r => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_'))))
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name?.replace(/\.[^.]+$/, '')}_frames.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyFrame = (idx) => {
    const r = frameResults[idx]
    if (!r) return
    navigator.clipboard.writeText(JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_'))), null, 2))
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Video size={16} className="text-indigo-400" />
          <span className="text-white font-semibold text-sm">{file?.name}</span>
          <span className="text-gray-600 text-sm">· {frames.length} frames</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex glass-card rounded-lg overflow-hidden p-0.5 gap-0.5">
            {[{ id: 'split', label: 'Split' }, { id: 'grid', label: 'Grid' }, { id: 'raw', label: 'JSON' }].map(({ id, label }) => (
              <button key={id} onClick={() => setViewMode(id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === id ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
              >{label}</button>
            ))}
          </div>
          <button onClick={downloadAll} className="btn-primary flex items-center gap-2 text-xs py-2" id="download-frames-btn">
            <Download size={13} /> Download All
          </button>
        </div>
      </div>

      {/* Frame timeline */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/5 bg-black/20">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {frames.map((frame, i) => (
            <button key={i} onClick={() => setSelectedIdx(i)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border transition-all ${
                selectedIdx === i ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-white/8 hover:border-white/20'
              }`}
              style={{ width: 100 }}
            >
              <div className="aspect-video bg-black">
                {frame?.dataUrl && <img src={frame.dataUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="px-2 py-1 bg-black/40 text-xs text-gray-400">
                #{i + 1} · {formatTime(frame?.timestampSeconds)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'split' && (
          <div className="h-full flex">
            <div className="w-1/2 border-r border-white/5 p-4 flex flex-col gap-3">
              <div className="flex-1 rounded-xl bg-black overflow-hidden flex items-center justify-center relative">
                {selectedFrame?.dataUrl
                  ? <img src={selectedFrame.dataUrl} alt="" className="max-w-full max-h-full object-contain" />
                  : <span className="text-gray-600 text-sm">No preview</span>}
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono">
                  {formatTime(selectedFrame?.timestampSeconds)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setSelectedIdx(i => Math.max(0, i - 1))} disabled={selectedIdx === 0}
                  className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
                <span className="text-gray-500 text-sm">Frame {selectedIdx + 1} / {frames.length}</span>
                <button onClick={() => setSelectedIdx(i => Math.min(frames.length - 1, i + 1))} disabled={selectedIdx === frames.length - 1}
                  className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
              </div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <span className="text-xs text-gray-400">JSON · Frame #{selectedIdx + 1}</span>
                <button onClick={() => copyFrame(selectedIdx)} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                  {copied === selectedIdx ? <CheckCircle2 size={11} className="text-green-400" /> : <Copy size={11} />}
                  {copied === selectedIdx ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-xs font-mono text-gray-300 leading-relaxed">
                  {clean ? JSON.stringify(clean, null, 2) : 'No data'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="h-full overflow-auto p-6">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {frames.map((frame, i) => {
                const r = frameResults[i]
                const c = r ? Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_'))) : null
                return (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="glass-card rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all"
                    onClick={() => { setSelectedIdx(i); setViewMode('split') }}
                  >
                    <div className="aspect-video bg-black relative">
                      {frame?.dataUrl && <img src={frame.dataUrl} alt="" className="w-full h-full object-cover" />}
                      <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white font-mono">{formatTime(frame?.timestampSeconds)}</div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white text-xs font-semibold">Frame #{i + 1}</span>
                        {c?.scene_type && <span className="text-xs px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded">{c.scene_type}</span>}
                      </div>
                      {c?.scene_description && <p className="text-gray-500 text-xs line-clamp-2">{c.scene_description}</p>}
                      <button onClick={(e) => { e.stopPropagation(); copyFrame(i) }} className="text-xs text-gray-600 hover:text-gray-400 mt-2 flex items-center gap-1">
                        {copied === i ? <CheckCircle2 size={10} className="text-green-400" /> : <Copy size={10} />}
                        {copied === i ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {viewMode === 'raw' && (
          <div className="h-full overflow-auto p-6">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-sm text-white font-semibold">All Frames JSON</span>
                <button onClick={downloadAll} className="btn-primary text-xs py-1.5 flex items-center gap-1.5"><Download size={11} /> Download</button>
              </div>
              <pre className="p-6 text-xs font-mono text-gray-300 leading-relaxed overflow-auto">
                {JSON.stringify(frameResults.map(r => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_')))), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────

export default function VideoResultsViewer({ videoData }) {
  if (!videoData) return null

  if (videoData.mode === 'educational') {
    return <EducationalScriptViewer videoData={videoData} />
  }

  return <FrameViewer videoData={videoData} />
}
