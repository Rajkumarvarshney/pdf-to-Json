import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { callGroq } from '../../utils/groqService'

/**
 * Counts all keys in an object recursively.
 */
function countKeys(obj) {
  if (obj === null || typeof obj !== 'object') return 0
  let count = 0
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count++
      count += countKeys(obj[key])
    }
  }
  return count
}

/**
 * Truncates and prepares JSON context safely for the system prompt.
 */
function prepareJsonForPrompt(data) {
  if (!data) return '{}'
  const totalFields = countKeys(data)
  const fullString = JSON.stringify(data, null, 2)
  
  if (fullString.length <= 12000) {
    return fullString
  }
  
  // Clone and slice first 3 items from pages or questions if present
  const cloned = JSON.parse(JSON.stringify(data))
  if (cloned.pages && Array.isArray(cloned.pages) && cloned.pages.length > 3) {
    cloned.pages = cloned.pages.slice(0, 3)
    const truncatedString = JSON.stringify(cloned, null, 2)
    if (truncatedString.length <= 12000) {
      return `${truncatedString}\n\n...[truncated for context length — ${totalFields} total fields]`
    }
  }
  if (cloned.questions && Array.isArray(cloned.questions) && cloned.questions.length > 3) {
    cloned.questions = cloned.questions.slice(0, 3)
    const truncatedString = JSON.stringify(cloned, null, 2)
    if (truncatedString.length <= 12000) {
      return `${truncatedString}\n\n...[truncated for context length — ${totalFields} total fields]`
    }
  }
  
  return `${fullString.slice(0, 11500)}\n\n...[truncated for context length — ${totalFields} total fields]`
}

/**
 * Formats a message string containing basic markdown bold (**text**) and code (`text`).
 */
function formatMessageText(text) {
  if (!text) return ''
  const lines = text.split('\n')
  return lines.map((line, idx) => {
    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>')
    
    if (html.trim().startsWith('- ')) {
      html = `• ${html.trim().slice(2)}`
    }
    
    return (
      <div 
        key={idx} 
        className={`${idx > 0 ? 'mt-1' : ''} leading-relaxed text-sm break-words`} 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    )
  })
}

export default function DocChat({
  isOpen,
  onClose,
  extractedJson,
  metadata,
  history = [],
  onHistory,
  onUnread
}) {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  
  const messagesEndRef = useRef(null)
  
  useEffect(() => {
    if (isOpen) {
      onUnread(0) // Reset unread replies when chat sidebar is opened
    }
  }, [isOpen, onUnread])

  // Scroll to bottom whenever history updates or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, isLoading])

  // Suggestion questions logic
  const getSuggestions = () => {
    const suggestions = ['Summarize this document', 'What are the key fields extracted?']
    
    if (metadata?.fileType === 'pdf' || metadata?.fileType === 'docx') {
      suggestions.push('Are there any dates or deadlines mentioned?')
      suggestions.push('List all named entities (people, orgs, places)')
    } else if (metadata?.fileType === 'pptx') {
      suggestions.push('What is the main topic of this presentation?')
      suggestions.push('List all slide titles in order')
    }
    
    if (extractedJson && (extractedJson.questions || extractedJson.questions_count)) {
      suggestions.push('How many questions are in this paper?')
      suggestions.push('List all the topics covered')
    }
    
    return suggestions.slice(0, 4)
  }

  const handleSendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed) {
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 300)
      return
    }
    
    const userMessage = { role: 'user', content: trimmed }
    const updatedHistory = [...history, userMessage]
    onHistory(updatedHistory)
    setInputValue('')
    setIsLoading(true)
    
    try {
      const jsonContext = prepareJsonForPrompt(extractedJson)
      
      const systemPrompt = {
        role: 'system',
        content: `You are a document assistant. The user has parsed a document and extracted the following structured JSON data:\n\n${jsonContext}\n\nAnswer the user's questions about this document clearly and concisely. If asked for a summary, summarize the key fields. If asked about a specific field, quote its value directly. If the answer is not in the JSON, say so honestly. Format lists with dashes. Use plain language.`
      }

      // We pass the full history (system prompt + conversion turns) to maintain memory
      const response = await callGroq([systemPrompt, ...updatedHistory], { temperature: 0.2, jsonMode: false })
      
      const assistantMessageText = response?.choices?.[0]?.message?.content || 
                                   (typeof response === 'object' && response.content) || 
                                   (typeof response === 'string' ? response : null)

      if (!assistantMessageText) {
        throw new Error('Invalid empty completion payload')
      }

      onHistory([...updatedHistory, { role: 'assistant', content: assistantMessageText }])
      if (!isOpen) {
        onUnread(prev => prev + 1)
      }
    } catch (err) {
      console.error('[DocChat Error]', err)
      onHistory([
        ...updatedHistory,
        { role: 'assistant', content: "Sorry, I couldn't process that — please try again." }
      ])
      if (!isOpen) {
        onUnread(prev => prev + 1)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-input {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>

      {/* Sidebar container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? '0%' : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 right-0 h-full w-full md:w-[360px] bg-[#111118] border-l border-white/8 z-50 shadow-2xl flex flex-col ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400" />
            <h3 className="font-black text-white text-sm">Ask your doc</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors pointer-events-auto"
          >
            <X size={16} />
          </button>
        </div>

        {/* Extracted JSON validation */}
        {!extractedJson || Object.keys(extractedJson).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
            <AlertCircle size={24} className="text-gray-600 mb-2" />
            <p className="text-sm">Parse a document first to start chatting</p>
          </div>
        ) : (
          <>
            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col pointer-events-auto">
              {history.length === 0 && (
                <div className="space-y-4 my-auto">
                  <div className="text-center p-4">
                    <Sparkles size={20} className="text-indigo-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-gray-400 font-medium">Ask questions, request summaries, or query specific fields from your parsed document.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {getSuggestions().map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s)}
                        className="text-left text-xs bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 p-2.5 rounded-xl text-gray-300 hover:text-white transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {history.map((msg, idx) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-[#181824] border border-white/5 text-gray-200 rounded-tl-none'
                      }`}
                    >
                      {formatMessageText(msg.content)}
                    </div>
                  </div>
                )
              })}

              {/* 3-dot Animated Loading Bubble */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#181824] border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer Area */}
            <div className="p-4 border-t border-white/5 flex-shrink-0 pointer-events-auto bg-[#0e0e14]">
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about the JSON..."
                  rows={1}
                  className={`flex-1 bg-white/5 border border-white/8 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none resize-none max-h-24 ${
                    shouldShake ? 'shake-input border-red-500' : ''
                  }`}
                  style={{ minHeight: '38px' }}
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isLoading}
                  className="w-[38px] h-[38px] flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
  )
}
