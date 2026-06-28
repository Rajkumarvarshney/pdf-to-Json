import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.VITE_GROQ_API_KEY || env.GROQ_API_KEY

  return {
    plugins: [
      react(),
      {
        name: 'groq-local-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/completion' && req.method === 'POST') {
              if (!apiKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Local VITE_GROQ_API_KEY is not configured in .env file.' }))
                return
              }

              try {
                let body = ''
                req.on('data', chunk => {
                  body += chunk
                })
                req.on('end', async () => {
                  try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                      },
                      body: body,
                    })

                    const data = await response.text()
                    res.statusCode = response.status
                    res.setHeader('Content-Type', 'application/json')
                    res.end(data)
                  } catch (err) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: err.message || 'Error proxying local request to Groq.' }))
                  }
                })
              } catch (err) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Error reading request body.' }))
              }
            } else {
              next()
            }
          })
        }
      }
    ],
    server: {
      port: 5174,
      strictPort: false,
      warmup: {
        // Pre-transform the most important files on server start
        clientFiles: [
          './src/main.jsx',
          './src/App.jsx',
          './src/pages/LandingPage.jsx',
          './src/index.css',
        ],
      },
    },
    optimizeDeps: {
      // Only exclude pdfjs-dist (it's lazy-loaded per upload)
      exclude: ['pdfjs-dist'],
    },
  }
})
