import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, HelpCircle, ArrowRight, Zap, Shield, Sparkles, 
  FileJson, ChevronDown, Plus, Minus, Info, CheckCircle2, Menu, X
} from 'lucide-react'

const Navbar = ({ onEnterApp }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen ? 'py-3 backdrop-blur-xl bg-black/80 border-b border-white/5' : 'py-5'
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
          <Link to="/#features" className="hover:text-white transition-colors duration-200">Features</Link>
          <Link to="/#how-it-works" className="hover:text-white transition-colors duration-200">How it Works</Link>
          <Link to="/pricing" className="text-white transition-colors duration-200">Pricing</Link>
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
          <Link to="/#features" onClick={() => setMenuOpen(false)} className="text-left text-gray-400 hover:text-white text-sm">Features</Link>
          <Link to="/#how-it-works" onClick={() => setMenuOpen(false)} className="text-left text-gray-400 hover:text-white text-sm">How it Works</Link>
          <Link to="/pricing" onClick={() => setMenuOpen(false)} className="text-white text-sm font-semibold">Pricing</Link>
          <Link to="/docs" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-sm">Docs</Link>
          <button onClick={onEnterApp} className="btn-primary text-sm text-center w-full">Get Started</button>
        </motion.div>
      )}
    </motion.nav>
  )
}

const FloatingOrbs = () => (
  <>
    <div className="orb w-96 h-96 bg-indigo-600/20 top-10 -left-32" style={{ animationDelay: '0s' }} />
    <div className="orb w-80 h-80 bg-purple-600/20 top-40 right-10" style={{ animationDelay: '2s', animationDuration: '10s' }} />
    <div className="orb w-64 h-64 bg-cyan-600/20 bottom-20 left-1/3" style={{ animationDelay: '4s', animationDuration: '12s' }} />
  </>
)

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-white/5 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-2 focus:outline-none"
      >
        <span className="text-white font-medium text-base md:text-lg hover:text-indigo-300 transition-colors">{question}</span>
        <span className="text-gray-400 ml-4">
          {isOpen ? <Minus size={18} className="text-indigo-400" /> : <Plus size={18} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 text-sm md:text-base leading-relaxed py-2 pr-6">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PricingPage({ onEnterApp }) {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'yearly'
  const [calculatorPages, setCalculatorPages] = useState(5000)

  // Pricing logic configurations
  const costPerPage = 0.015 // $0.015 per page above Pro base limit
  const basePagesPro = 2000
  const basePriceProMonthly = 29
  const basePriceProYearly = 23 // effectively 20% discount on base

  const calculateCost = (pages) => {
    if (pages <= 100) return { cost: 0, plan: 'Hobby' }
    
    // Pro Plan calculations
    const basePrice = billingCycle === 'monthly' ? basePriceProMonthly : basePriceProYearly
    if (pages <= basePagesPro) {
      return { cost: basePrice, plan: 'Pro' }
    } else if (pages <= 50000) {
      const extraPages = pages - basePagesPro
      const extraCost = extraPages * costPerPage
      const discountMultiplier = billingCycle === 'yearly' ? 0.8 : 1.0 // Extra 20% off additional pages as well for yearly
      const totalPro = Math.round(basePrice + (extraCost * discountMultiplier))
      return { cost: totalPro, plan: 'Pro Custom' }
    } else {
      return { cost: 'Custom', plan: 'Enterprise' }
    }
  }

  const result = calculateCost(calculatorPages)

  const faqs = [
    {
      question: 'What counts as a processed page?',
      answer: 'Each page of a PDF document processed counts as a single page. If you upload a 10-page document, it will consume 10 pages from your quota. If you cancel or re-upload a failed page, it is not counted.'
    },
    {
      question: 'Can I cancel or change my plan at any time?',
      answer: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time from your account settings page. If you cancel, your access will continue until the end of your billing cycle.'
    },
    {
      question: 'How secure is my processed data?',
      answer: 'Extremely secure. All uploads are encrypted in transit via SSL and at rest using AES-256. We do not use your documents to train public AI models. Your files are automatically deleted after 30 days unless you choose to store them longer.'
    },
    {
      question: 'What is the difference between General and Exam parsing modes?',
      answer: 'General Mode is optimized for invoices, resumes, contracts, and research papers, returning a standard key-value schema. Exam Mode is specialized for educational testing sheets, automatically parsing MCQs, reading comprehension passages, math formulae (as LaTeX), and cropping diagrams/graphs.'
    },
    {
      question: 'Do you support OCR for scanned documents?',
      answer: 'Yes. DocParse AI automatically detects scanned PDFs and applies advanced optical character recognition (OCR) to extract text, tables, and structures, maintaining LaTeX formatting for complex symbols and mathematical equations.'
    }
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingOrbs />
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />

      <Navbar onEnterApp={onEnterApp} />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-sm"
          >
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-gray-300">Simple, transparent pricing</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white leading-tight mb-6"
          >
            Flexible Plans for <span className="gradient-text">Every Scale</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 leading-relaxed"
          >
            Start for free and scale as your data volume grows. No hidden fees. Cancel anytime.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 mt-10"
          >
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-medium' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-8 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-full p-1 transition-colors duration-200"
            >
              <div
                className={`w-6 h-6 bg-indigo-500 rounded-full shadow-lg transform transition-transform duration-200 ${
                  billingCycle === 'yearly' ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className={`text-sm flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-white font-medium' : 'text-gray-500'}`}>
              Yearly
              <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs px-2 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </span>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {/* Hobby Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 flex flex-col justify-between relative group hover:border-white/20 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">Hobby</span>
                <span className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-1 rounded">Testing</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl md:text-5xl font-black text-white">$0</span>
                <span className="text-gray-500 text-sm">/ forever</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Perfect for hobbyists and developers experimenting with PDF processing pipelines.
              </p>
              <hr className="border-white/5 mb-8" />
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>100 pages per month</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>General Document Parsing</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>JSON, CSV export formats</span>
                </li>
                <li className="flex items-center gap-3 text-gray-500 line-through">
                  <span>Educational Exam Mode</span>
                </li>
                <li className="flex items-center gap-3 text-gray-500 line-through">
                  <span>LaTeX math & graph extraction</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterApp}
              className="btn-secondary w-full py-3 justify-center text-sm font-semibold flex items-center gap-2"
            >
              Start Free Trial <ArrowRight size={14} />
            </button>
          </motion.div>

          {/* Pro Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col justify-between relative group hover:border-indigo-400 transition-all duration-300 bg-[#0f0f18]/80"
          >
            {/* Pop badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-indigo-500/20">
              <Sparkles size={12} /> Most Popular
            </div>

            <div>
              <div className="flex justify-between items-center mb-6 mt-2">
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">Developer Pro</span>
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded">SaaS</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl md:text-5xl font-black text-white">
                  ${billingCycle === 'monthly' ? basePriceProMonthly : basePriceProYearly}
                </span>
                <span className="text-gray-500 text-sm">/ month</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-8">
                Designed for teams extracting educational datasets, textbooks, exam PDFs, and complex layouts.
              </p>
              <hr className="border-white/5 mb-8" />
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">2,000 pages included</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>General & Exam Parsing Modes</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>LaTeX math & LaTeX formatting</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>Diagram, image & table crop export</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>Priority support & API key access</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterApp}
              className="btn-primary w-full py-3.5 justify-center text-sm font-semibold flex items-center gap-2"
            >
              Get Pro Now <ArrowRight size={14} />
            </button>
          </motion.div>

          {/* Enterprise Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8 flex flex-col justify-between relative group hover:border-white/20 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">Enterprise</span>
                <span className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-1 rounded">Scale</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl md:text-5xl font-black text-white">Custom</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                For institutions processing hundreds of thousands of educational publications with dedicated SLAs.
              </p>
              <hr className="border-white/5 mb-8" />
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>Custom page volume (50K+)</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>Dedicated OCR & GPU compute</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>Custom JSON schema tuning</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>On-premise deployment options</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check size={16} className="text-indigo-400 shrink-0" />
                  <span>Dedicated Slack & phone support</span>
                </li>
              </ul>
            </div>
            <a
              href="mailto:sales@docparse.ai?subject=Enterprise Query"
              className="btn-secondary w-full py-3 justify-center text-sm font-semibold flex items-center gap-2 text-center"
            >
              Contact Sales <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>

        {/* Pricing Calculator Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 md:p-12 mb-24 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 via-purple-900/5 to-transparent pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <h2 className="text-3xl font-black text-white mb-4">
                Estimate Your <span className="gradient-text">Monthly Cost</span>
              </h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
                Move the slider to estimate your costs based on actual document volume. 
                Our developer tier scales dynamically with a fixed discount on annual agreements.
              </p>

              {/* Slider Controls */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-medium">Pages Processed:</span>
                  <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold px-4 py-1.5 rounded-lg text-lg">
                    {calculatorPages.toLocaleString()} pages
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={calculatorPages}
                  onChange={(e) => setCalculatorPages(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>100 pages</span>
                  <span>25,000</span>
                  <span>50,000</span>
                  <span>75,000</span>
                  <span>100,000 pages</span>
                </div>
              </div>
            </div>

            <div className="glass-card bg-[#0b0b12]/80 p-8 border-white/5 flex flex-col justify-between h-full min-h-[220px]">
              <div>
                <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2">Recommended Plan</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-white">{result.plan} Plan</span>
                  {result.plan.includes('Pro') && (
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25">
                      ${costPerPage}/extra page
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-white/5 my-4" />

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4">
                <div>
                  <span className="text-gray-500 text-xs block mb-1">Estimated total price</span>
                  {typeof result.cost === 'number' ? (
                    <span className="text-5xl font-black text-white">
                      ${result.cost}
                      <span className="text-gray-500 text-sm font-normal">/mo</span>
                    </span>
                  ) : (
                    <span className="text-4xl font-black text-white">Custom SLA</span>
                  )}
                </div>
                <div className="w-full sm:w-auto">
                  {typeof result.cost === 'number' ? (
                    <button
                      onClick={onEnterApp}
                      className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold w-full sm:w-auto justify-center"
                    >
                      Choose Plan <ArrowRight size={14} />
                    </button>
                  ) : (
                    <a
                      href="mailto:sales@docparse.ai?subject=Enterprise Query"
                      className="btn-secondary flex items-center gap-2 px-6 py-3 text-sm font-semibold text-center w-full sm:w-auto justify-center"
                    >
                      Contact Sales <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQs Accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base">Got questions? We have answers.</p>
          </div>
          <div className="glass-card p-6 md:p-10 border-white/5 space-y-2">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#08080c] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FileJson size={12} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm">DocParse AI</span>
          </Link>
          <p className="text-gray-500 text-sm">© 2026 DocParse AI. Powered by Groq Llama 3.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link to="/#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link to="/pricing" className="text-white transition-colors">Pricing</Link>
            <Link to="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
