/**
 * groqVisionService.js
 * Sends video frames to Groq Vision AI.
 * Supports two modes:
 *   1. Generic per-frame JSON (scene descriptions per frame)
 *   2. Educational Script mode → produces the full structured video script JSON
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const TEXT_MODEL = 'llama-3.3-70b-versatile'

function getApiKey() {
  const envKey = import.meta.env.VITE_GROQ_API_KEY
  const localKey = localStorage.getItem('groq_api_key')
  const isValid = (k) => k && k.trim() !== '' && k.trim() !== 'your_groq_api_key_here'
  if (isValid(envKey)) return envKey.trim()
  if (isValid(localKey)) return localKey.trim()
  return null
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1]
}

async function callGroqVision(messages, maxTokens = 4096, retriesLeft = 3) {
  const apiKey = getApiKey()
  const endpoint = apiKey ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/completion'

  const headers = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const errorMsg = err?.error?.message || `Groq Vision API error ${response.status}`

      // Catch rate limits (429 status code or message indicating rate limit)
      if (response.status === 429 || errorMsg.toLowerCase().includes('rate limit')) {
        if (retriesLeft > 0) {
          // Exponential backoff: 2^attempt * 3000ms + random jitter
          let waitMs = Math.pow(2, 3 - retriesLeft) * 3000 + Math.ceil(Math.random() * 1000)
          const match = errorMsg.match(/try again in ([\d\.]+)\s*s/i)
          if (match && match[1]) {
            waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 2000 // add 2s buffer
          }
          console.warn(`[Groq Vision API] Rate limit hit. Waiting ${waitMs}ms before retry (Exponential Backoff). Retries left: ${retriesLeft}`)
          await new Promise(resolve => setTimeout(resolve, waitMs))
          return callGroqVision(messages, maxTokens, retriesLeft - 1)
        }
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (err) {
    if (retriesLeft > 0 && err.message.toLowerCase().includes('rate limit')) {
      let waitMs = Math.pow(2, 3 - retriesLeft) * 4000 + Math.ceil(Math.random() * 1000)
      const match = err.message.match(/try again in ([\d\.]+)\s*s/i)
      if (match && match[1]) {
        waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 2000
      }
      console.warn(`[Groq Vision API] Rate limit error caught. Waiting ${waitMs}ms before retry (Exponential Backoff). Retries left: ${retriesLeft}`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      return callGroqVision(messages, maxTokens, retriesLeft - 1)
    }
    throw err
  }
}

async function callGroqText(messages, maxTokens = 8192, retriesLeft = 3) {
  const apiKey = getApiKey()
  const endpoint = apiKey ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/completion'

  const headers = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const errorMsg = err?.error?.message || `Groq API error ${response.status}`

      if (response.status === 429 || errorMsg.toLowerCase().includes('rate limit')) {
        if (retriesLeft > 0) {
          let waitMs = Math.pow(2, 3 - retriesLeft) * 3000 + Math.ceil(Math.random() * 1000)
          const match = errorMsg.match(/try again in ([\d\.]+)\s*s/i)
          if (match && match[1]) {
            waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 2000
          }
          console.warn(`[Groq Text API] Rate limit hit. Waiting ${waitMs}ms before retry (Exponential Backoff). Retries left: ${retriesLeft}`)
          await new Promise(resolve => setTimeout(resolve, waitMs))
          return callGroqText(messages, maxTokens, retriesLeft - 1)
        }
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    try {
      return JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      throw new Error('Could not parse JSON response')
    }
  } catch (err) {
    if (retriesLeft > 0 && err.message.toLowerCase().includes('rate limit')) {
      let waitMs = Math.pow(2, 3 - retriesLeft) * 4000 + Math.ceil(Math.random() * 1000)
      const match = err.message.match(/try again in ([\d\.]+)\s*s/i)
      if (match && match[1]) {
        waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 2000
      }
      console.warn(`[Groq Text API] Rate limit error caught. Waiting ${waitMs}ms before retry (Exponential Backoff). Retries left: ${retriesLeft}`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      return callGroqText(messages, maxTokens, retriesLeft - 1)
    }
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────
// MODE 1: Generic per-frame analysis
// ─────────────────────────────────────────────────────────────────

export async function analyzeVideoFrame(frameDataUrl, timestampSeconds, frameIndex) {
  const base64 = dataUrlToBase64(frameDataUrl)
  const text = await callGroqVision([
    {
      role: 'system',
      content: 'You are a video intelligence system. Analyze video frames and return ONLY valid JSON. No markdown.',
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        {
          type: 'text',
          text: `Analyze frame #${frameIndex + 1} at ${timestampSeconds.toFixed(1)}s and return JSON:
{
  "frame_number": ${frameIndex + 1},
  "timestamp_seconds": ${timestampSeconds},
  "scene_description": "1-2 sentence description",
  "scene_type": "presentation|interview|tutorial|outdoor|indoor|animation|text_heavy|meeting|other",
  "detected_objects": ["list of visible objects"],
  "text_on_screen": "any visible text or empty string",
  "dominant_colors": ["2-3 color names"],
  "people_count": 0,
  "key_actions": "main action happening",
  "extracted_data": {},
  "confidence": 0.9
}`,
        },
      ],
    },
  ])

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    return {
      frame_number: frameIndex + 1,
      timestamp_seconds: timestampSeconds,
      scene_description: text.slice(0, 200),
      parse_error: true,
    }
  }
}

export async function processVideoFrames(frames, onFrameComplete, onError) {
  const results = []
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    try {
      const result = await analyzeVideoFrame(frame.dataUrl, frame.timestampSeconds, frame.frameIndex)
      results.push({ ...result, _frame: frame })
      onFrameComplete?.(i + 1, frames.length, result)
    } catch (err) {
      results.push({
        frame_number: frame.frameIndex + 1,
        timestamp_seconds: frame.timestampSeconds,
        scene_description: 'Analysis failed',
        error: err.message,
        _frame: frame,
      })
      onError?.(i + 1, err)
    }
    if (i < frames.length - 1) await new Promise(r => setTimeout(r, 200))
  }
  return results
}

// ─────────────────────────────────────────────────────────────────
// MODE 2: Educational Video Script Generator
// ─────────────────────────────────────────────────────────────────

const EDUCATIONAL_SCRIPT_SCHEMA = `{
  "video_name": "string — concise descriptive title of the video content",
  "topics": [
    {
      "scenes": [
        // SCENE TYPES (use the right type for each section):
        
        // Opening (first scene only):
        {
          "type": "opening",
          "title": "Catchy title for the video",
          "title_speech": "Engaging hook sentence spoken aloud",
          "subtitle": "Brief subtitle describing what will be covered",
          "subtitle_speech": "Expanded spoken version of the subtitle"
        },
        
        // Table of contents (second scene only):
        {
          "type": "table_of_contents",
          "topics": ["Topic 1", "Topic 2", "..."],
          "speech": "Overview speech introducing the topics"
        },
        
        // Topic introduction (first scene of each new topic):
        {
          "type": "topic_intro",
          "title": "Topic title",
          "subtitle": "What this topic covers",
          "speech": "Engaging intro speech for this topic"
        },
        
        // Definition hook:
        {
          "type": "engagement_hook_definition",
          "illustrations": [],
          "term": "Term being defined",
          "definition": "Clear definition (use LaTeX \\\\( ... \\\\) for math)",
          "speech": "Spoken explanation of the definition"
        },
        
        // Real-life problem hook:
        {
          "type": "engagement_hook_real_life_problem",
          "illustrations": ["checklist|lock|key|star|graphing-calculator"],
          "title": "Hook title",
          "problem": "The real-world problem or question",
          "speech": "Spoken narrative connecting the problem to the topic"
        },
        
        // Shocking stat hook:
        {
          "type": "engagement_hook_shocking_stat",
          "illustrations": ["star"],
          "title": "Hook title",
          "statistic": "The surprising number or fact (LaTeX ok)",
          "explanation": "Brief explanation of why it's remarkable",
          "speech": "Full spoken narrative"
        },
        
        // Content note (main teaching content):
        {
          "type": "note",
          "illustrations": [],
          "title": "Section title",
          "items": [
            {
              "title": "Key point title",
              "description": "Explanation (use LaTeX \\\\( ... \\\\) for math formulas)",
              "speech": "Spoken version of this point",
              "image_desc": ""
            }
          ],
          "speech": "Overall speech introducing this note",
          "image_theme": "warm ochre and deep teal, cream paper background, curious and inviting mood",
          "layout": "layout_text OR layout_hero",
          "hero_image_desc": "Physical object photo description if layout_hero, else empty string"
        },
        
        // Flow chart (for algorithms/processes):
        {
          "type": "flow_chart",
          "title": "Process title",
          "speech": "Introduction to the flow",
          "nodes": [
            {
              "title": "Step title",
              "description": "Brief step description",
              "speech": "Spoken explanation of this step"
            }
          ]
        },
        
        // Closing (last scene only):
        {
          "type": "closing",
          "title": "Memorable closing title",
          "title_speech": "Closing statement spoken aloud",
          "subtitle": "Takeaway message",
          "subtitle_speech": "Spoken version of the takeaway"
        }
      ]
    }
  ]
}`

/**
 * Step 1: Describe all frames to extract the raw educational content
 */
async function transcribeFrames(frames, onProgress) {
  const descriptions = []

  // Process frames in smaller batches of 2 (to prevent hitting token per minute rate limits)
  const BATCH_SIZE = 2
  for (let i = 0; i < frames.length; i += BATCH_SIZE) {
    const batch = frames.slice(i, Math.min(i + BATCH_SIZE, frames.length))

    const imageContent = batch.map((frame) => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${dataUrlToBase64(frame.dataUrl)}` },
    }))

    const batchNums = batch.map((f, j) => `Frame ${i + j + 1} @ ${f.timestampSeconds.toFixed(1)}s`).join(', ')

    const text = await callGroqVision(
      [
        {
          role: 'system',
          content: 'You are an educational content analyst. Extract all visible text, formulas, concepts, and structure from educational video frames.',
        },
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `These are frames from an educational video (${batchNums}).
For each frame, describe:
1. ALL visible text (titles, subtitles, bullet points, formulas — transcribe exactly)
2. The type of slide/scene (intro, definition, explanation, example, diagram, conclusion)
3. Key concepts or terms shown
4. Any mathematical formulas (describe them precisely)
5. Visual layout and structure

Be thorough and exact — this will be used to reconstruct the educational content.`,
            },
          ],
        },
      ],
      2048
    )

    descriptions.push({ frames: batchNums, content: text })
    onProgress?.(Math.min(i + BATCH_SIZE, frames.length), frames.length)

    // Rate limit delay: wait 2 seconds between batches to spread token usage
    if (i + BATCH_SIZE < frames.length) await new Promise(r => setTimeout(r, 2000))
  }

  return descriptions
}

/**
 * Step 2: Synthesize frame descriptions into structured educational script JSON
 */
async function synthesizeToScript(videoName, frameDescriptions, onProgress) {
  onProgress?.('Synthesizing educational script structure...')

  const combinedContent = frameDescriptions
    .map((d, i) => `=== Batch ${i + 1} (${d.frames}) ===\n${d.content}`)
    .join('\n\n')

  const result = await callGroqText(
    [
      {
        role: 'system',
        content: `You are an expert educational content designer. Your job is to transform raw video frame descriptions into a beautifully structured educational video script JSON.
        
Rules:
- Group content logically into topics and scenes
- Always start with an "opening" scene, then "table_of_contents"  
- Each topic starts with "topic_intro", then uses engagement hooks and notes
- End with a "closing" scene
- Use LaTeX notation \\\\( ... \\\\) for ALL mathematical formulas and equations
- Write speech fields as natural, engaging narration (not bullet points)
- For "note" type: use "layout_hero" when a physical object metaphor helps, "layout_text" for pure concept slides
- illustrations field: pick from [graphing-calculator, checklist, lock, key, star] or leave empty []
- hero_image_desc: describe a REAL PHYSICAL photo (objects on table, etc.) — no diagrams
- Return ONLY valid JSON matching the schema exactly`,
      },
      {
        role: 'user',
        content: `Video title: "${videoName}"

Here are the descriptions of all frames from this educational video:

${combinedContent}

Based on these frame descriptions, generate a complete educational video script JSON following EXACTLY this schema:

${EDUCATIONAL_SCRIPT_SCHEMA}

Important:
- Capture ALL topics covered in the video
- Each concept should become appropriate scene types
- Write rich, engaging speech scripts
- Use proper LaTeX for all math
- Return ONLY the JSON object, no explanation`,
      },
    ],
    8192
  )

  return result
}

/**
 * Main entry point for educational script mode
 * @param {string} videoName - Name/title of the video
 * @param {Array} frames - Extracted frames [{frameIndex, timestampSeconds, dataUrl}]
 * @param {function} onProgress - Progress callback (phase, current, total, message)
 */
export async function generateEducationalScript(videoName, frames, onProgress) {
  // Phase 1: Transcribe all frames
  onProgress?.('transcribing', 0, frames.length, 'Reading video frames...')

  const frameDescriptions = await transcribeFrames(frames, (current, total) => {
    onProgress?.('transcribing', current, total, `Analyzing frames ${current}/${total}...`)
  })

  // Phase 2: Synthesize into structured JSON
  onProgress?.('synthesizing', 0, 1, 'Building educational script with AI...')

  const script = await synthesizeToScript(videoName, frameDescriptions, (msg) => {
    onProgress?.('synthesizing', 0, 1, msg)
  })

  onProgress?.('done', 1, 1, 'Educational script ready!')

  return script
}
