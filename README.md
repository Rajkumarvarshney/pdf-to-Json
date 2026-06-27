# 📄 DocParse AI — Document Intelligence & Video Script Synthesizer

DocParse AI is a premium, client-side web application designed to turn unstructured documents (PDFs) and video presentations into rich, structured JSON data using Groq AI. 

Built with a sleek, dark-mode glassmorphic UI, the app processes everything in the browser and connects directly to Groq's high-speed API keys.

---

## 🚀 Live Demo & Hosting
This project is built as a **static frontend application** and is ready to be hosted for free on platforms like **Render**, **Vercel**, or **Netlify**.

---

## ✨ Core Features

### 1. Document to JSON (PDF Extractor)
* **General Document Mode**: Automatically infers the document type (e.g. resumes, invoices, contracts, research papers) and auto-generates a custom JSON Schema to extract the fields.
* **Exam / Test Paper Mode**: Standardized educational extraction targeting subjects, grades, marks, instructions, multiple-choice options, answers, explanations, and LaTeX formatting for mathematical expressions.
* **Diagram & Asset Cropper**: Locates figures, graphs, and images embedded inside the PDF pages and crops them into downloadable PNG data URLs.

### 2. Video to JSON (Vision Storyboard Generator)
* **Educational Script Mode**: Analyzes lecture or slide videos and outputs structured scripts including:
  * Catchy Title & Subtitles
  * Narrated Speeches (what to say aloud)
  * Definitions, Real-life hooks, or Statistic slides
  * Math LaTeX equations & matching diagram scene cards
* **Per-Frame JSON Mode**: Extracts keyframe snapshots at your choice of interval (1s, 2s, 5s, 10s) and generates individual structured JSON metadata describing screen text, detected objects, and action descriptions.

### 3. Large Document Batch Processing
* Handles **100+ page PDFs** without context limits or truncation by scanning pages in batches, extracting structured segments, and performing deep recursive merging (concatenating arrays and merging sub-objects).

### 4. Interactive Document Workspace
* **JSON View**: Full syntax-highlighted editor with copy/download options.
* **Schema View**: Review the auto-generated JSON schema.
* **RAG Chunking**: Pre-calculates paragraph segments, sizes, and token scopes to test prompt embeddings for RAG vector databases.
* **CSV Preview**: Flattened tabular view for rows and sheets.

---

## 🛠️ Tech Stack
* **Framework**: React 18, Vite (Fast HMR)
* **Styling**: Tailwind CSS, Framer Motion (micro-animations), Lucide Icons
* **PDF Core**: PDF.js (In-browser canvas parsing & image extraction)
* **AI Engine**: Groq API
  * `llama-3.3-70b-versatile` & `llama-3.1-8b-instant` (Text & Schema Parsing)
  * `meta-llama/llama-4-scout-17b-16e-instruct` (Vision & Frame Parsing)

---

## ⚙️ Installation & Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Rajkumarvarshney/pdf-to-Json.git
cd pdf-to-Json
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure API Key
Create a `.env` file in the root directory:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```
*(Alternatively, you can leave it empty; the app will safely prompt you to enter your API key in the Settings page at runtime, saving it securely in your browser's local storage).*

### 4. Start the development server
```bash
npm run dev
```
Open `http://localhost:5174` in your browser.

---

## ☁️ Deploying on Render (Free Static Site)

1. Connect your GitHub repository to [Render](https://dashboard.render.com/).
2. Create a new **Static Site**.
3. Configure the build settings:
   * **Build Command**: `npm run build`
   * **Publish Directory**: `dist`
4. Add the Environment Variable `VITE_GROQ_API_KEY` under the **Environment** tab if you want to bake a key in.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
