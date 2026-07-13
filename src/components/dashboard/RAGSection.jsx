import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network, CheckCircle2, Layers, Database, Zap,
  Search, Play, RotateCcw, ChevronRight, Info,
  BarChart3, Clock, Tag
} from 'lucide-react'
import { mockRAGChunks } from '../../data/mockData'

const PipelineStep = ({ step, isActive, isComplete, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`glass-card p-5 transition-all duration-500 ${
      isComplete ? 'border-green-500/20' : isActive ? 'border-indigo-500/30 glow-primary' : ''
    }`}
  >
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isComplete ? 'bg-green-500/20' : isActive ? 'bg-indigo-500/20' : 'bg-white/5'
      }`}>
        {isComplete ? (
          <CheckCircle2 size={20} className="text-green-400" />
        ) : (
          <step.icon size={20} className={isActive ? 'text-indigo-400 animate-pulse' : 'text-gray-600'} />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${isComplete ? 'text-green-400' : isActive ? 'text-indigo-300' : 'text-gray-500'}`}>
            {step.label}
          </h3>
          {isComplete && (
            <span className="text-xs status-completed px-2 py-0.5 rounded-full">Done</span>
          )}
        </div>
        <p className="text-gray-500 text-xs mt-1">{step.description}</p>
        {isComplete && (
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            {step.stats?.map(stat => (
              <span key={stat} className="flex items-center gap-1">
                <span className="text-indigo-400">✓</span> {stat}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </motion.div>
)

const ChunkViewer = ({ chunks }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(chunks)
  const [searching, setSearching] = useState(false)

  const handleSearch = () => {
    if (!query) return setResults(chunks)
    setSearching(true)
    setTimeout(() => {
      setResults(chunks.filter(c => c.text.toLowerCase().includes(query.toLowerCase())))
      setSearching(false)
    }, 500)
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Layers size={16} className="text-cyan-400" />
          Chunk Viewer
          <span className="text-xs text-gray-500 font-normal ml-1">— Semantic search across chunks</span>
        </h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              id="rag-search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search chunks semantically..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            id="rag-search-btn"
            onClick={handleSearch}
            className="btn-primary text-sm py-2 px-4"
          >
            {searching ? <RotateCcw size={14} className="animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-80 overflow-auto">
        {results.map((chunk, i) => (
          <motion.div
            key={chunk.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/12 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-600 font-mono">{chunk.id}</code>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">
                  Page {chunk.metadata.page}
                </span>
                <Tag size={10} className="text-gray-600" />
                <span className="text-xs text-gray-600">{chunk.metadata.section}</span>
              </div>

              {/* Similarity score */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    style={{ width: `${chunk.similarity * 100}%` }}
                  />
                </div>
                <span className="text-xs text-cyan-400">{(chunk.similarity * 100).toFixed(0)}%</span>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">{chunk.text}</p>

            <div className="flex gap-4 mt-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><BarChart3 size={10} /> {chunk.metadata.tokens} tokens</span>
              <span className="flex items-center gap-1"><Database size={10} /> dim {chunk.metadata.embedding_dim}</span>
            </div>
          </motion.div>
        ))}

        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No chunks match your query</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RAGSection() {
  const [pipelineStep, setPipelineStep] = useState(0)
  const [running, setRunning] = useState(false)

  const pipelineSteps = [
    {
      icon: Layers,
      label: 'Document Chunking',
      description: 'Smart segmentation into meaningful units preserving context boundaries',
      stats: ['5 chunks created', 'Avg 36 tokens/chunk', 'Context-aware splits'],
    },
    {
      icon: Zap,
      label: 'Embedding Generation',
      description: 'Converting text chunks into high-dimensional vector representations using text-embedding-004',
      stats: ['5 embeddings', '1536 dimensions', 'Cosine similarity'],
    },
    {
      icon: Database,
      label: 'Vector Store Indexing',
      description: 'HNSW index built for sub-millisecond approximate nearest neighbor search',
      stats: ['HNSW index built', '< 1ms query time', 'Persistent storage'],
    },
    {
      icon: Network,
      label: 'RAG Pipeline Ready',
      description: 'Your document is ready for retrieval-augmented generation queries',
      stats: ['API endpoint live', 'Top-K retrieval', 'Metadata filtering'],
    },
  ]

  const runPipeline = () => {
    setRunning(true)
    setPipelineStep(0)
    let step = 0
    const advance = () => {
      if (step < pipelineSteps.length) {
        setPipelineStep(step + 1)
        step++
        setTimeout(advance, 1000)
      } else {
        setRunning(false)
      }
    }
    setTimeout(advance, 800)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-white/5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">RAG Pipeline</h1>
            <p className="text-gray-400 text-sm">Retrieval-Augmented Generation infrastructure for your documents</p>
          </div>
          <button
            id="run-rag-pipeline"
            onClick={runPipeline}
            disabled={running}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {running ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Chunks Created', value: '5', icon: Layers, color: 'text-indigo-400' },
            { label: 'Embeddings', value: '5', icon: Zap, color: 'text-purple-400' },
            { label: 'Vector Dims', value: '1536', icon: Database, color: 'text-cyan-400' },
            { label: 'Avg Similarity', value: '87%', icon: BarChart3, color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4 text-center"
            >
              <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline steps */}
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <Network size={16} className="text-cyan-400" />
          Pipeline Status
        </h2>
        <div className="space-y-3 mb-6">
          {pipelineSteps.map((step, i) => (
            <PipelineStep
              key={step.label}
              step={step}
              isActive={pipelineStep === i && running}
              isComplete={pipelineStep > i}
              delay={i * 0.08}
            />
          ))}
        </div>

        {/* Chunk viewer */}
        {pipelineStep > 0 && <ChunkViewer chunks={mockRAGChunks} />}
        {pipelineStep === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Network size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Run the pipeline to see chunks and embeddings</p>
            <button onClick={runPipeline} className="mt-4 btn-primary text-sm">
              <Play size={14} className="inline mr-2" />
              Start Pipeline
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
