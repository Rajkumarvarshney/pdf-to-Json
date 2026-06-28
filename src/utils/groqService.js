// Groq API Service
// Uses Groq's free OpenAI-compatible API to analyze PDFs

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
function getModel() {
  const m = localStorage.getItem('groq_model') || 'llama-3.3-70b-versatile'
  if (m === 'llama3-8b-8192') return 'llama-3.1-8b-instant'
  return m
}

function getApiKey() {
  // Check env first, then localStorage (for runtime key entry)
  const envKey = import.meta.env.VITE_GROQ_API_KEY
  const localKey = localStorage.getItem('groq_api_key')

  const isValidKey = (k) => k && k.trim() !== '' && k.trim() !== 'your_groq_api_key_here';

  if (isValidKey(envKey)) return envKey.trim()
  if (isValidKey(localKey)) return localKey.trim()

  return null
}

export function hasApiKey() {
  return !!getApiKey()
}

export function saveApiKey(key) {
  localStorage.setItem('groq_api_key', key)
}

export async function callGroq(messages, { temperature = 0.1, maxTokens = 4096, jsonMode = true } = {}, retriesLeft = 3) {
  const apiKey = getApiKey()
  const endpoint = apiKey ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/completion'

  const headers = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  try {
    const payload = {
      model: getModel(),
      messages,
      temperature,
      max_tokens: maxTokens,
    }
    if (jsonMode) {
      payload.response_format = { type: 'json_object' }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const errorMsg = err?.error?.message || `Groq API error ${response.status}`

      // Check for rate limit error
      if (response.status === 429 || errorMsg.toLowerCase().includes('rate limit')) {
        if (retriesLeft > 0) {
          // Exponential backoff: 2^attempt * 3000ms + random jitter
          let waitMs = Math.pow(2, 3 - retriesLeft) * 3000 + Math.ceil(Math.random() * 1000)
          const match = errorMsg.match(/try again in ([\d\.]+)\s*s/i)
          if (match && match[1]) {
            waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 2000 // add 2s buffer
          }
          console.warn(`[Groq API] Rate limit hit. Waiting ${waitMs}ms before retry (Exponential Backoff). Retries left: ${retriesLeft}`)
          await new Promise(resolve => setTimeout(resolve, waitMs))
          return callGroq(messages, { temperature, maxTokens, jsonMode }, retriesLeft - 1)
        }
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    if (!jsonMode) {
      return text
    }

    try {
      return JSON.parse(text)
    } catch {
      // Try to extract JSON from text if not pure JSON
      const match = text.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      throw new Error('Could not parse Groq response as JSON')
    }
  } catch (err) {
    if (retriesLeft > 0 && err.message.toLowerCase().includes('rate limit')) {
      let waitMs = Math.pow(2, 3 - retriesLeft) * 4000 + Math.ceil(Math.random() * 1000)
      const match = err.message.match(/try again in ([\d\.]+)\s*s/i)
      if (match && match[1]) {
        waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 2000
      }
      console.warn(`[Groq API] Rate limit error caught. Waiting ${waitMs}ms before retry (Exponential Backoff). Retries left: ${retriesLeft}`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      return callGroq(messages, { temperature, maxTokens, jsonMode }, retriesLeft - 1)
    }
    throw err
  }
}

/**
 * Merge two JSON objects:
 * - Arrays are concatenated (preventing exact duplicates)
 * - Objects are merged recursively
 * - Primitives: prefers source value if target value is empty/falsy
 */
function mergeExtractedData(target, source) {
  if (!target) return source
  if (!source) return target

  const merged = { ...target }

  for (const key in source) {
    if (source[key] === null || source[key] === undefined) {
      continue
    }

    if (target[key] === null || target[key] === undefined) {
      merged[key] = source[key]
      continue
    }

    if (Array.isArray(target[key]) && Array.isArray(source[key])) {
      const targetStrings = target[key].map(item => typeof item === 'object' ? JSON.stringify(item) : String(item))
      const newItems = source[key].filter(item => {
        const str = typeof item === 'object' ? JSON.stringify(item) : String(item)
        return !targetStrings.includes(str)
      })
      merged[key] = [...target[key], ...newItems]
    } else if (typeof target[key] === 'object' && typeof source[key] === 'object' && target[key] !== null && source[key] !== null) {
      merged[key] = mergeExtractedData(target[key], source[key])
    } else {
      if (!target[key] && source[key]) {
        merged[key] = source[key]
      }
    }
  }

  return merged
}

/**
 * Step 1: Detect document type and auto-generate JSON Schema
 */
export async function generateSchema(fullText) {
  // Capture a larger portion of the start of the document (up to 16,000 chars)
  const truncated = fullText.slice(0, 16000) 

  const result = await callGroq([
    {
      role: 'system',
      content: `You are a document intelligence system. Analyze document text and return ONLY valid JSON.`,
    },
    {
      role: 'user',
      content: `Analyze this document and return a JSON object with exactly these two fields:
1. "documentType": a short string identifying the document type (e.g. "resume", "invoice", "research_paper", "contract", "form", "report", "letter", "medical_record", etc.)
2. "schema": a JSON Schema (draft-07) object with "type": "object" and a "properties" field that captures ALL data fields present in the document. Use appropriate types: string, number, boolean, array, object. Add a "description" to each field.

CRITICAL DESIGN RULES FOR SCHEMAS:
- If the document is section-based or multi-page (such as a research paper, manual, report, or contract), the schema MUST include an array property (e.g., "sections", "clauses", "articles", "key_points") containing objects (e.g., with fields like "section_name", "title", "content", "text"). This allows content from later pages to be appended during batch extraction.
- For research papers, always include properties like "title", "authors", "abstract", "sections" (array of section title and content), and "references" (array of strings).

Return ONLY the JSON object, no markdown, no explanation.

Document text:
${truncated}`,
    },
  ])

  return {
    documentType: result.documentType || 'document',
    schema: result.schema || {},
  }
}

/**
 * Helper to flatten tree fields for prompt instruction hints
 */
function flattenFields(fieldsList, prefix = '') {
  let list = []
  for (const f of fieldsList) {
    const fullKey = prefix ? `${prefix}.${f.key}` : f.key
    list.push({
      key: fullKey,
      label: f.label,
      description: f.description,
      example: f.example
    })
    if (f.children && f.children.length > 0) {
      list = list.concat(flattenFields(f.children, fullKey))
    }
  }
  return list
}

/**
 * Step 2: Extract structured JSON data from the document text using the generated schema
 */
export async function extractStructuredData(fullText, schema, documentType, isCustomSchema = false, fieldsTree = null) {
  // Allow up to 40,000 characters (covers 5 full pages easily) without truncating
  const truncated = fullText.slice(0, 40000)
  const schemaStr = JSON.stringify(schema, null, 2)

  let messages = []
  if (isCustomSchema) {
    const flatFields = fieldsTree ? flattenFields(fieldsTree) : []
    const fieldHints = flatFields.map(f => {
      let hint = `- ${f.key}: ${f.description || f.label}`
      if (f.example) {
        hint += ` (example: ${f.example})`
      }
      return hint
    }).join('\n')

    messages = [
      {
        role: 'system',
        content: `Extract data from the following document and return ONLY a valid JSON object that strictly conforms to this schema:

${schemaStr}

Field extraction hints:
${fieldHints}

Return ONLY the JSON object. No explanation, no markdown fences.`
      },
      {
        role: 'user',
        content: `Document text:\n${truncated}`
      }
    ]
  } else {
    messages = [
      {
        role: 'system',
        content: `You are a precise data extraction engine. Extract data from documents into structured JSON. Return ONLY valid JSON, no extra text.`,
      },
      {
        role: 'user',
        content: `Extract ALL data from this ${documentType} into structured JSON.

Follow this JSON Schema exactly:
${schemaStr}

Return a single JSON object with all fields populated from the document. Use null for fields not found. Do not add fields not in the schema. Return ONLY valid JSON.

Document text:
${truncated}`,
      }
    ]
  }

  const result = await callGroq(messages)
  return result
}

/**
 * Combined: run both steps with progress callbacks and support multi-page batch parsing.
 */
export async function processDocumentWithGroq(pagesOrText, onProgress, customSchema = null, customDocType = null, fieldsTree = null) {
  const pages = Array.isArray(pagesOrText)
    ? pagesOrText
    : [{ pageNum: 1, text: pagesOrText }]

  let documentType = customDocType || 'document'
  let schema = customSchema

  // Step 1: Detect type and generate schema using the first 3 pages (if not custom schema mode)
  if (!schema) {
    onProgress?.('Detecting document type...')
    const sampleText = pages.slice(0, 3).map(p => p.text).join('\n\n')
    const generated = await generateSchema(sampleText)
    documentType = generated.documentType
    schema = generated.schema
  }

  // Step 2: Extract structured data page-by-page in batches of 5 pages
  const BATCH_SIZE = 5
  let extractedData = null
  const failedPages = []

  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batchPages = pages.slice(i, i + BATCH_SIZE)
    const startPage = batchPages[0].pageNum
    const endPage = batchPages[batchPages.length - 1].pageNum
    const batchText = batchPages.map(p => p.text).join('\n\n')

    onProgress?.(`Extracting data (pages ${startPage}-${endPage} of ${pages.length})...`)
    try {
      const batchData = await extractStructuredData(
        batchText, 
        schema, 
        documentType, 
        !!customSchema, 
        fieldsTree
      )
      extractedData = mergeExtractedData(extractedData, batchData)
    } catch (err) {
      console.error(`Failed to extract data for pages ${startPage}-${endPage}:`, err)
      for (const bp of batchPages) {
        failedPages.push({
          pageNum: bp.pageNum,
          error: err.message || 'Unknown extraction error'
        })
      }
    }
    
    // Tiny delay to avoid rate limit spikes
    if (i + BATCH_SIZE < pages.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return {
    documentType,
    schema,
    extractedData: extractedData || {},
    failedPages
  }
}

export const EXAM_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Exam Paper',
  type: 'object',
  properties: {
    subject: { type: 'string', description: 'Subject name' },
    grade_level: { type: 'string', description: 'Grade or class level' },
    total_marks: { type: 'number', description: 'Total marks for the exam' },
    duration: { type: 'string', description: 'Allowed duration, e.g. 2 hours' },
    instructions: { type: 'string', description: 'General instructions for candidates' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question_number: { type: 'string', description: 'Question number, e.g. "1", "2a"' },
          text: { type: 'string', description: 'The full text of the question, including reading comprehension passages if applicable' },
          type: { type: 'string', enum: ['multiple_choice', 'short_answer', 'essay', 'matching', 'fill_in_the_blank'], description: 'Type of the question' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Multiple choice options if applicable, e.g. ["A) Option 1", "B) Option 2"]'
          },
          correct_answer: { type: 'string', description: 'Correct option letter or key answer' },
          explanation: { type: 'string', description: 'Detailed explanation of the solution or answer key' },
          marks: { type: 'number', description: 'Marks allocated to this question' },
          page_number: { type: 'number', description: 'The page number (1-based) where this question starts' },
          has_diagram: { type: 'boolean', description: 'True if the question references or relies on a diagram, image, table, or graph' },
          diagram_reference: { type: 'string', description: 'Name or text referencing the diagram, e.g. "Figure 1", "the graph below"' }
        },
        required: ['question_number', 'text', 'type']
      }
    }
  },
  required: ['subject', 'questions']
}

export async function processExamWithGroq(pagesOrText, onProgress) {
  const pages = Array.isArray(pagesOrText)
    ? pagesOrText
    : [{ pageNum: 1, text: pagesOrText }]

  const BATCH_SIZE = 5
  let extractedData = null
  const failedPages = []

  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batchPages = pages.slice(i, i + BATCH_SIZE)
    const startPage = batchPages[0].pageNum
    const endPage = batchPages[batchPages.length - 1].pageNum
    const batchText = batchPages.map(p => p.text).join('\n\n')

    onProgress?.(`Extracting questions (pages ${startPage}-${endPage} of ${pages.length})...`)
    try {
      const batchData = await extractExamBatch(batchText)
      extractedData = mergeExtractedData(extractedData, batchData)
    } catch (err) {
      console.error(`Failed to extract questions for pages ${startPage}-${endPage}:`, err)
      for (const bp of batchPages) {
        failedPages.push({
          pageNum: bp.pageNum,
          error: err.message || 'Unknown extraction error'
        })
      }
    }
    
    // Tiny delay to avoid rate limit spikes
    if (i + BATCH_SIZE < pages.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return {
    documentType: 'exam_paper',
    schema: EXAM_SCHEMA,
    extractedData: extractedData || { subject: 'Unknown', questions: [] },
    failedPages
  }
}

async function extractExamBatch(batchText) {
  const schemaStr = JSON.stringify(EXAM_SCHEMA, null, 2)
  return await callGroq([
    {
      role: 'system',
      content: `You are an educational document intelligence system specializing in parsing exam and test papers. 
Extract text, multiple-choice options, correct answers, math formulas, and reading comprehension passages.
Reconstruct multi-column layouts into linear reading flow.
Stitch questions that span across page boundaries.
Represent all math formulas and equations using standard LaTeX notation enclosed in dollar signs (e.g. $x^2 + y^2 = r^2$ or $\\frac{a}{b}$).
Format output strictly as a JSON object matching the provided JSON schema.`
    },
    {
      role: 'user',
      content: `Extract ALL questions and structured metadata from this exam paper text.
      
Follow this JSON Schema exactly:
${schemaStr}

Return a single JSON object with all fields populated from the exam paper. Return ONLY valid JSON, no extra text.

Exam paper text:
${batchText}`
    }
  ])
}
