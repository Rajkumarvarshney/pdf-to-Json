import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileJson, BookOpen, Key, Terminal, Code2, Cpu, Copy, Check, CheckCircle2,
  ChevronRight, ArrowRight, CornerDownRight, Play, ExternalLink, HelpCircle, Menu, X
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
          <Link to="/#features" className="hover:text-white transition-colors duration-200">Features</Link>
          <Link to="/#how-it-works" className="hover:text-white transition-colors duration-200">How it Works</Link>
          <Link to="/pricing" className="hover:text-white transition-colors duration-200">Pricing</Link>
          <Link to="/docs" className="text-white transition-colors duration-200">Docs</Link>
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
          <Link to="/pricing" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-sm">Pricing</Link>
          <Link to="/docs" onClick={() => setMenuOpen(false)} className="text-white text-sm font-semibold">Docs</Link>
          <button onClick={onEnterApp} className="btn-primary text-sm text-center w-full">Get Started</button>
        </motion.div>
      )}
    </motion.nav>
  )
}

const CodeSection = ({ code, language }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative glass-card overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02] text-xs">
        <span className="text-gray-500 font-mono font-medium lowercase">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs md:text-sm font-mono overflow-auto text-gray-300 leading-relaxed max-h-[300px]">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function DocsPage({ onEnterApp }) {
  const [activeTab, setActiveTab] = useState('quickstart')
  const [sdkLang, setSdkLang] = useState('python')

  const sdks = {
    python: {
      lang: 'python',
      code: `import requests
import json

# Define the endpoint and your API key
url = "https://api.docparse.ai/v1/parse"
headers = {
    "Authorization": "Bearer dpa_live_58c21a4f00db7fe31",
}

# Load the file and parameters
files = {
    "file": open("examination_paper_2026.pdf", "rb")
}
data = {
    "mode": "exam",
    "extract_images": "true"
}

# Make the post request
response = requests.post(url, headers=headers, files=files, data=data)

# Process structured response
if response.status_code == 200:
    result = response.json()
    print(f"Parsed {len(result['questions'])} MCQ questions successfully!")
    print(json.dumps(result['questions'][0], indent=2))
else:
    print("Error:", response.text)`
    },
    node: {
      lang: 'javascript',
      code: `import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const url = 'https://api.docparse.ai/v1/parse';
const apiKey = 'dpa_live_58c21a4f00db7fe31';

// Setup file form data
const form = new FormData();
form.append('file', fs.createReadStream('exam_paper.pdf'));
form.append('mode', 'exam');
form.append('extract_images', 'true');

try {
  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': \`Bearer \${apiKey}\`
    }
  });
  
  console.log('Extraction success:', response.data.questions.length, 'questions found.');
  console.log('Sample Question:', response.data.questions[0]);
} catch (error) {
  console.error('Request failed:', error.response?.data || error.message);
}`
    },
    curl: {
      lang: 'bash',
      code: `curl -X POST https://api.docparse.ai/v1/parse \\
  -H "Authorization: Bearer dpa_live_58c21a4f00db7fe31" \\
  -F "file=@/path/to/exam_paper.pdf" \\
  -F "mode=exam" \\
  -F "extract_images=true"`
    }
  }

  const sidebarItems = [
    { id: 'quickstart', label: 'Quick Start', icon: BookOpen },
    { id: 'core-api', label: 'Core API Reference', icon: Terminal },
    { id: 'exam-parsing', label: 'Exam & MCQ Parsing', icon: Cpu },
    { id: 'sdks', label: 'SDK Snippets', icon: Code2 },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />

      <Navbar onEnterApp={onEnterApp} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-1">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Developer Guide
              </div>
              {sidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
              <hr className="border-white/5 my-6" />
              <div className="glass-card p-4 border-white/5 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Key size={12} className="text-yellow-500" />
                  <span>API Status</span>
                </div>
                <div className="text-[11px] text-gray-500 leading-relaxed">
                  Generate your keys in the dashboard under the "API Keys" section.
                </div>
                <button
                  onClick={onEnterApp}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:translate-x-0.5 transition-transform"
                >
                  Go to Dashboard <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="glass-card p-8 md:p-12 border-white/5 bg-[#0f0f18]/60 min-h-[500px]">
              
              <AnimatePresence mode="wait">
                {activeTab === 'quickstart' && (
                  <motion.div
                    key="quickstart"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-black text-white">Quick Start Guide</h1>
                      <p className="text-gray-400">Get up and running with DocParse AI in under 5 minutes.</p>
                    </div>
                    <hr className="border-white/5" />

                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-sm flex items-center justify-center font-bold">1</span>
                        Get your API Key
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed pl-8">
                        Sign up/In to the dashboard to claim your developer account. Under the <strong>API Keys</strong> panel, click <strong>Create Test Key</strong> to generate a key prefixed with <code>dpa_test_</code>. Keep this key secret.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-sm flex items-center justify-center font-bold">2</span>
                        Prepare your Documents
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed pl-8">
                        DocParse supports standard PDF files (text-based or scanned) up to 50MB. Make sure equations, tables, and images are legible for the AI agent to crop or render correctly.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-sm flex items-center justify-center font-bold">3</span>
                        Parse your First PDF
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed pl-8">
                        Trigger a POST request to <code>/v1/parse</code> with form-data. Here is a simple cURL execution to check:
                      </p>
                      <div className="pl-8">
                        <CodeSection 
                          code={`curl -X POST https://api.docparse.ai/v1/parse \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@sample_invoice.pdf"`} 
                          language="bash" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-sm flex items-center justify-center font-bold">4</span>
                        Receive Structured Response
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed pl-8">
                        The API parses the structure and returns an intelligent layout schema with key-value outputs:
                      </p>
                      <div className="pl-8">
                        <CodeSection 
                          code={`{
  "status": "success",
  "document_id": "doc_9281a8f",
  "pages_processed": 1,
  "data": {
    "invoice_number": "INV-2026-081",
    "vendor": "Acme Corp",
    "total_amount": 1450.00,
    "items": [
      { "description": "Cloud hosting", "qty": 1, "price": 1450.00 }
    ]
  }
}`} 
                          language="json" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'core-api' && (
                  <motion.div
                    key="core-api"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-black text-white">Core API Reference</h1>
                      <p className="text-gray-400">Detailed endpoint payloads and properties specifications.</p>
                    </div>
                    <hr className="border-white/5" />

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">POST</span>
                        <code className="text-white text-base font-mono">https://api.docparse.ai/v1/parse</code>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Parse an uploaded PDF document using the default schemas or specific configurations. Content should be transmitted as <code>multipart/form-data</code>.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white">Request Parameters</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-gray-400">
                              <th className="py-3 font-semibold">Parameter</th>
                              <th className="py-3 font-semibold">Type</th>
                              <th className="py-3 font-semibold">Required</th>
                              <th className="py-3 font-semibold">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300">
                            <tr>
                              <td className="py-3 font-mono text-indigo-400">file</td>
                              <td className="py-3 text-xs text-gray-400">Binary</td>
                              <td className="py-3 text-red-400">Yes</td>
                              <td className="py-3 text-gray-400">The PDF file to upload. Maximum size 50MB.</td>
                            </tr>
                            <tr>
                              <td className="py-3 font-mono text-indigo-400">mode</td>
                              <td className="py-3 text-xs text-gray-400">String</td>
                              <td className="py-3 text-gray-500">No</td>
                              <td className="py-3 text-gray-400">
                                <code>general</code> (default) or <code>exam</code> (specialized educational parser).
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 font-mono text-indigo-400">extract_images</td>
                              <td className="py-3 text-xs text-gray-400">Boolean</td>
                              <td className="py-3 text-gray-500">No</td>
                              <td className="py-3 text-gray-400">
                                Set to <code>true</code> to crop & save diagrams, charts and graphs (defaults to true in exam mode).
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 font-mono text-indigo-400">schema</td>
                              <td className="py-3 text-xs text-gray-400">Object</td>
                              <td className="py-3 text-gray-500">No</td>
                              <td className="py-3 text-gray-400">
                                Optional customized JSON schema to force key layouts in general parsing mode.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white">HTTP Headers</h3>
                      <div className="bg-[#0b0b12] rounded-lg p-4 font-mono text-xs text-gray-400 space-y-2">
                        <div>
                          <span className="text-indigo-400">Authorization:</span> Bearer &lt;YOUR_API_KEY&gt;
                        </div>
                        <div>
                          <span className="text-indigo-400">Content-Type:</span> multipart/form-data
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'exam-parsing' && (
                  <motion.div
                    key="exam-parsing"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-black text-white">Exam & MCQ Parsing</h1>
                      <p className="text-gray-400">Extract equations, passages, images and multiple choice options with high accuracy.</p>
                    </div>
                    <hr className="border-white/5" />

                    <p className="text-gray-400 text-sm leading-relaxed">
                      By setting <code>mode="exam"</code>, the parser switches from generalized schema generation to standard curriculum mapping. 
                      It parses questions, option layouts, answers, and visual items, then maps them into a robust schema.
                    </p>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white">LaTeX Mathematical Syntax</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Educational exams frequently use complex math expressions. DocParse AI automatically detects mathematical notations and formats them as standard LaTeX strings delimited with <code>$</code> (inline) or <code>$$</code> (block).
                      </p>
                      <div className="bg-[#0b0b12] rounded-lg p-4 border border-indigo-500/10">
                        <div className="text-xs text-indigo-400 font-mono mb-2">JSON Extracted Output:</div>
                        <code className="text-xs md:text-sm font-mono text-gray-300">
                          "question_text": "Find the roots of the equation $x^2 + 5x + 6 = 0$."
                        </code>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white">Programmatic Image Cropping</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        If <code>extract_images</code> is enabled, the pipeline identifies bounding coordinates of figures, diagrams, and tables associated with a specific question. 
                        It crops the canvas bounding box, saves it as a high-resolution base64 data URL or host URL, and associates it in the JSON array:
                      </p>
                      <CodeSection 
                        code={`"questions": [
  {
    "id": 1,
    "question_text": "For the circuit shown below, calculate the equivalent resistance across terminals AB.",
    "options": ["A) 5 ohms", "B) 10 ohms", "C) 15 ohms", "D) 20 ohms"],
    "correct_answer": "B",
    "images": [
      {
        "id": "img_q1_0",
        "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "width": 450,
        "height": 220
      }
    ]
  }
]`} 
                        language="json" 
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'sdks' && (
                  <motion.div
                    key="sdks"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-black text-white">SDK Integrations</h1>
                      <p className="text-gray-400">Copy copyable code snippets in Python, Node.js, and cURL to trigger executions.</p>
                    </div>
                    <hr className="border-white/5" />

                    {/* SDK Languages Toggle */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5 w-fit">
                      {['python', 'node', 'curl'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSdkLang(lang)}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                            sdkLang === lang
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {lang === 'node' ? 'Node.js' : lang}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4">
                      <CodeSection 
                        code={sdks[sdkLang].code} 
                        language={sdks[sdkLang].lang} 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
            </div>
          </main>

        </div>
      </div>

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
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/docs" className="text-white transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
