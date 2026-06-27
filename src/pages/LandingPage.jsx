import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useAnimation, useInView } from 'framer-motion'
import {
  FileJson, Brain, Table2, Network, Files, Sparkles,
  ArrowRight, Upload, Code2, ExternalLink, Zap, Shield, Clock,
  ChevronRight, Star, CheckCircle2, Menu, X
} from 'lucide-react'

const Navbar = ({ onEnterApp, onScroll }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleScroll = (id) => {
    setMenuOpen(false)
    if (onScroll) {
      onScroll(id)
    }
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-3 backdrop-blur-xl bg-black/40 border-b border-white/5' : 'py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FileJson size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">DocParse<span className="text-indigo-400"> AI</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
          <button onClick={() => handleScroll('#features')} className="hover:text-white transition-colors duration-200">Features</button>
          <button onClick={() => handleScroll('#how-it-works')} className="hover:text-white transition-colors duration-200">How it Works</button>
          <Link to="/pricing" className="hover:text-white transition-colors duration-200">Pricing</Link>
          <Link to="/docs" className="hover:text-white transition-colors duration-200">Docs</Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onEnterApp}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            id="nav-get-started"
            onClick={onEnterApp}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            Get Started <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-card mx-4 mt-2 p-4 flex flex-col gap-4"
        >
          <button onClick={() => handleScroll('#features')} className="text-left text-gray-400 hover:text-white text-sm">Features</button>
          <button onClick={() => handleScroll('#how-it-works')} className="text-left text-gray-400 hover:text-white text-sm">How it Works</button>
          <Link to="/pricing" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-sm">Pricing</Link>
          <Link to="/docs" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-sm">Docs</Link>
          <button onClick={onEnterApp} className="btn-primary text-sm text-center">Get Started</button>
        </motion.div>
      )}
    </motion.nav>
  )
}

const FloatingOrbs = () => (
  <>
    <div className="orb w-96 h-96 bg-indigo-600 top-10 -left-32" style={{ animationDelay: '0s' }} />
    <div className="orb w-80 h-80 bg-purple-600 top-40 right-10" style={{ animationDelay: '2s', animationDuration: '10s' }} />
    <div className="orb w-64 h-64 bg-cyan-600 bottom-20 left-1/3" style={{ animationDelay: '4s', animationDuration: '12s' }} />
  </>
)

const HeroSection = ({ onEnterApp }) => {
  const [typedText, setTypedText] = useState('')
  const fullText = 'Turn Any PDF Into Structured Data'

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
      <FloatingOrbs />

      {/* Radial glow center */}
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/20 via-transparent to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-gray-300">Powered by Groq Llama 3</span>
          <span className="text-indigo-400">· Now in Beta</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
        >
          <span className="gradient-text">{typedText}</span>
          <span className="animate-pulse text-indigo-400">|</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI-powered document intelligence with automatic schema generation,
          exports, and RAG-ready pipelines. Built for developers and data teams.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            id="hero-try-demo"
            onClick={onEnterApp}
            className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
          >
            <Sparkles size={18} />
            Try Demo
          </button>
          <button
            id="hero-upload-pdf"
            onClick={onEnterApp}
            className="btn-secondary flex items-center gap-2 px-8 py-3 text-base"
          >
            <Upload size={18} />
            Upload PDF
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex items-center justify-center gap-6 text-sm text-gray-500"
        >
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" className="text-yellow-500" />)}
            <span className="ml-1">4.9/5 rating</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <span>2,400+ developers</span>
          <div className="w-px h-4 bg-gray-700" />
          <span>50K+ PDFs parsed</span>
        </motion.div>

        {/* Demo visual */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, duration: 0.8, type: 'spring' }}
          className="mt-20 relative"
        >
          <div className="gradient-border">
            <div className="glass-card p-1 rounded-2xl overflow-hidden">
              <DemoPreview />
            </div>
          </div>
          {/* Reflection */}
          <div className="absolute inset-x-10 -bottom-8 h-8 bg-indigo-500/10 blur-xl rounded-full" />
        </motion.div>
      </div>
    </section>
  )
}

const DemoPreview = () => (
  <div className="bg-[#0d0d14] rounded-xl overflow-hidden" style={{ height: '400px' }}>
    <div className="flex h-full">
      {/* Left - PDF mock */}
      <div className="w-1/2 border-r border-white/5 p-4 overflow-hidden">
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-gray-600">Resume_John_Doe.pdf</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
          <div className="h-3 bg-white/5 rounded w-2/3" />
          <div className="mt-4 h-px bg-white/5" />
          <div className="mt-2 space-y-1">
            {['PROFESSIONAL SUMMARY', 'SKILLS', 'EXPERIENCE'].map(s => (
              <div key={s}>
                <div className="h-3 bg-indigo-500/20 rounded w-1/3 mb-1" />
                <div className="h-2 bg-white/5 rounded w-full mb-1" />
                <div className="h-2 bg-white/5 rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - JSON output */}
      <div className="w-1/2 p-4 overflow-hidden">
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">JSON Output</span>
          <span className="ml-auto text-green-400 flex items-center gap-1"><CheckCircle2 size={10} /> Ready</span>
        </div>
        <pre className="text-xs leading-relaxed">
          <code>
            <span className="json-bracket">{'{'}</span>{'\n'}
            {'  '}<span className="json-key">"name"</span>: <span className="json-string">"John Doe"</span>,{'\n'}
            {'  '}<span className="json-key">"email"</span>: <span className="json-string">"john@example.com"</span>,{'\n'}
            {'  '}<span className="json-key">"skills"</span>: <span className="json-bracket">[</span>{'\n'}
            {'    '}<span className="json-string">"React"</span>, <span className="json-string">"TypeScript"</span>,{'\n'}
            {'    '}<span className="json-string">"Node.js"</span>, <span className="json-string">"AWS"</span>{'\n'}
            {'  '}<span className="json-bracket">]</span>,{'\n'}
            {'  '}<span className="json-key">"experience"</span>: <span className="json-bracket">[</span><span className="json-bracket">{'{'}</span>{'\n'}
            {'    '}<span className="json-key">"company"</span>: <span className="json-string">"TechCorp"</span>,{'\n'}
            {'    '}<span className="json-key">"role"</span>: <span className="json-string">"Sr Engineer"</span>{'\n'}
            {'  '}<span className="json-bracket">{'}'}</span><span className="json-bracket">]</span>{'\n'}
            <span className="json-bracket">{'}'}</span>
          </code>
        </pre>
      </div>
    </div>
  </div>
)

const features = [
  {
    icon: FileJson,
    title: 'PDF → JSON',
    desc: 'Automatically extract and convert any PDF content into clean, structured JSON with zero manual effort.',
    color: 'from-indigo-500/20 to-blue-500/10',
    iconColor: 'text-indigo-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]'
  },
  {
    icon: Brain,
    title: 'Auto Schema Generation',
    desc: 'Groq AI analyzes your document and intelligently generates a JSON Schema that perfectly fits your data.',
    color: 'from-purple-500/20 to-pink-500/10',
    iconColor: 'text-purple-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]'
  },
  {
    icon: Table2,
    title: 'CSV & Excel Export',
    desc: 'One-click export to CSV or Excel formats. Perfect for spreadsheet workflows and data analysis.',
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]'
  },
  {
    icon: Network,
    title: 'RAG Pipeline Ready',
    desc: 'Automatic chunking, embedding generation, and vector store integration for AI-powered retrieval.',
    color: 'from-cyan-500/20 to-blue-500/10',
    iconColor: 'text-cyan-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]'
  },
  {
    icon: Files,
    title: 'Multi-document Processing',
    desc: 'Process multiple PDFs simultaneously. Batch operations with real-time progress tracking.',
    color: 'from-orange-500/20 to-amber-500/10',
    iconColor: 'text-orange-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(251,146,60,0.2)]'
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Extraction',
    desc: 'Beyond OCR — Groq Llama 3 understands context, tables, nested structures, and ambiguous formatting.',
    color: 'from-rose-500/20 to-pink-500/10',
    iconColor: 'text-rose-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]'
  },
]

const FeaturesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-32 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-sm">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-gray-400">Everything you need</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A complete platform for transforming unstructured documents into structured intelligence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`glass-card p-6 group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${feat.glow}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <feat.icon size={22} className={feat.iconColor} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feat.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const HowItWorksSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const steps = [
    { num: '01', title: 'Upload Your PDF', desc: 'Drag & drop any PDF — resumes, invoices, contracts, research papers, forms.', icon: Upload },
    { num: '02', title: 'AI Analyzes Document', desc: 'Groq Llama 3 reads structure, layout, tables, and semantic content to understand the document.', icon: Brain },
    { num: '03', title: 'Schema Generated', desc: 'A precise JSON Schema is automatically generated matching your document\'s structure.', icon: FileJson },
    { num: '04', title: 'Export & Integrate', desc: 'Download JSON, CSV, Excel or plug into your RAG pipeline via API.', icon: Zap },
  ]

  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-gray-400 text-lg">Four simple steps to structured data</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30" />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              className="text-center relative"
            >
              <div className="w-24 h-24 rounded-2xl glass-card mx-auto mb-6 flex items-center justify-center relative">
                <step.icon size={28} className="text-indigo-400" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
              </div>
              <div className="text-5xl font-black text-white/5 mb-2 font-mono">{step.num}</div>
              <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const SchemaSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeType, setActiveType] = useState('resume')

  const schemas = {
    resume: `{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "experience": [{
    "company": "string",
    "role": "string",
    "duration": "string"
  }]
}`,
    invoice: `{
  "invoice_number": "string",
  "date": "date",
  "vendor": {
    "name": "string",
    "address": "string"
  },
  "amount": "number",
  "currency": "string"
}`,
    research: `{
  "title": "string",
  "authors": ["string"],
  "abstract": "string",
  "keywords": ["string"],
  "sections": [{
    "heading": "string",
    "content": "string"
  }]
}`,
  }

  return (
    <section className="py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-sm">
              <Brain size={14} className="text-purple-400" />
              <span className="text-gray-400">Smart Schema Generation</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-6">
              Schemas That <span className="gradient-text">Understand</span> Your Documents
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              DocParse AI doesn't just extract text — it understands document types. 
              Whether it's a resume, invoice, research paper, or contract, 
              the AI generates a schema that perfectly captures the structure.
            </p>
            <div className="flex gap-3 flex-wrap">
              {Object.keys(schemas).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeType === type
                      ? 'bg-indigo-600 text-white'
                      : 'glass-card text-gray-400 hover:text-white'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-500 ml-2">schema.json</span>
                <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Auto-generated
                </span>
              </div>
              <motion.pre
                key={activeType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 text-sm font-mono text-gray-300 leading-relaxed overflow-auto"
              >
                {schemas[activeType].split('\n').map((line, i) => (
                  <div key={i}>
                    {line.includes('"') ? (
                      <span>
                        {line.replace(/("[\w_]+")/g, '<KEY>$1</KEY>')
                             .replace(/: "([^"]+)"/g, ': <STRING>"$1"</STRING>')
                             .replace(/: (\d+)/g, ': <NUM>$1</NUM>')
                             .split('<KEY>').map((part, j) => {
                               if (j === 0) return <span key={j} className="text-gray-500">{part}</span>
                               const [key, rest] = part.split('</KEY>')
                               return (
                                 <span key={j}>
                                   <span className="json-key">{key}</span>
                                   <span className="text-gray-300">{rest}</span>
                                 </span>
                               )
                             })}
                      </span>
                    ) : (
                      <span className="text-gray-500">{line}</span>
                    )}
                    {'\n'}
                  </div>
                ))}
              </motion.pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

const StatsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const stats = [
    { value: '50K+', label: 'PDFs Processed' },
    { value: '99.2%', label: 'Extraction Accuracy' },
    { value: '<2s', label: 'Average Processing Time' },
    { value: '12+', label: 'Export Formats' },
  ]

  return (
    <section className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="glass-card p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="text-center"
              >
                <div className="text-4xl font-black gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const CTASection = ({ onEnterApp }) => (
  <section className="py-32">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="gradient-border"
      >
        <div className="glass-card p-16">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Start Parsing PDFs <span className="gradient-text">Today</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of developers and data teams who use DocParse AI to unlock the data trapped in their documents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="cta-open-app"
              onClick={onEnterApp}
              className="btn-primary flex items-center gap-2 px-10 py-4 text-base"
            >
              <Sparkles size={18} />
              Open App — Free
            </button>
            <button className="btn-secondary flex items-center gap-2 px-10 py-4 text-base">
              <Code2 size={18} />
              View on GitHub
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-6">No credit card required · 100 pages free · Cancel anytime</p>
        </div>
      </motion.div>
    </div>
  </section>
)

const Footer = ({ onScroll }) => (
  <footer className="border-t border-white/5 bg-[#08080c] py-16">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
      {/* Brand Column */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FileJson size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">DocParse<span className="text-indigo-400"> AI</span></span>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          AI-powered document intelligence. Instantly convert schemas, invoices, resumes, and exam papers to structured datasets.
        </p>
      </div>

      {/* Product Column */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Product</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          <li><button onClick={() => onScroll('#features')} className="hover:text-white transition-colors duration-200">Features</button></li>
          <li><button onClick={() => onScroll('#how-it-works')} className="hover:text-white transition-colors duration-200">How It Works</button></li>
          <li><Link to="/pricing" className="hover:text-white transition-colors duration-200">Pricing Plans</Link></li>
        </ul>
      </div>

      {/* Resources Column */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Resources</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          <li><Link to="/docs" className="hover:text-white transition-colors duration-200">Developer Docs</Link></li>
          <li><a href="#" className="hover:text-white transition-colors duration-200">API Reference</a></li>
          <li><a href="#" className="hover:text-white transition-colors duration-200">System Status</a></li>
        </ul>
      </div>

      {/* Social & Contact */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Connect</h4>
        <div className="flex gap-4 text-gray-500">
          <a href="#" className="hover:text-white transition-colors"><Code2 size={20} /></a>
          <a href="#" className="hover:text-white transition-colors"><ExternalLink size={20} /></a>
        </div>
        <p className="text-gray-600 text-xs mt-2">© 2026 DocParse AI. Powered by Groq Llama 3.</p>
      </div>
    </div>
  </footer>
)

export default function LandingPage({ onEnterApp }) {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [])

  const handleScroll = (id) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/${id}`
      return
    }
    const el = document.getElementById(id.replace('#', ''))
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onEnterApp={onEnterApp} onScroll={handleScroll} />
      <HeroSection onEnterApp={onEnterApp} />
      <FeaturesSection />
      <HowItWorksSection />
      <SchemaSection />
      <StatsSection />
      <CTASection onEnterApp={onEnterApp} />
      <Footer onScroll={handleScroll} />
    </div>
  )
}
