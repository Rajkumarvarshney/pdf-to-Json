// Mock data for DocParse AI demo

export const mockDocuments = [
  {
    id: '1',
    name: 'Resume_John_Doe.pdf',
    size: '245 KB',
    pages: 2,
    uploadedAt: '2024-01-15T10:30:00Z',
    status: 'completed',
    type: 'resume',
    thumbnail: null,
  },
  {
    id: '2',
    name: 'Invoice_Q4_2023.pdf',
    size: '128 KB',
    pages: 1,
    uploadedAt: '2024-01-14T14:22:00Z',
    status: 'completed',
    type: 'invoice',
    thumbnail: null,
  },
  {
    id: '3',
    name: 'Research_Paper_ML.pdf',
    size: '1.2 MB',
    pages: 12,
    uploadedAt: '2024-01-13T09:15:00Z',
    status: 'processing',
    type: 'research',
    thumbnail: null,
  },
  {
    id: '4',
    name: 'Contract_Services_2024.pdf',
    size: '389 KB',
    pages: 8,
    uploadedAt: '2024-01-12T16:45:00Z',
    status: 'completed',
    type: 'contract',
    thumbnail: null,
  },
];

export const mockSchemas = {
  resume: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Resume",
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Full name of the candidate" },
      "email": { "type": "string", "format": "email" },
      "phone": { "type": "string" },
      "location": { "type": "string" },
      "summary": { "type": "string" },
      "skills": {
        "type": "array",
        "items": { "type": "string" }
      },
      "experience": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "company": { "type": "string" },
            "role": { "type": "string" },
            "duration": { "type": "string" },
            "description": { "type": "string" }
          }
        }
      },
      "education": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "institution": { "type": "string" },
            "degree": { "type": "string" },
            "year": { "type": "string" }
          }
        }
      }
    }
  },
  invoice: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Invoice",
    "type": "object",
    "properties": {
      "invoice_number": { "type": "string" },
      "date": { "type": "string", "format": "date" },
      "due_date": { "type": "string", "format": "date" },
      "vendor": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "address": { "type": "string" },
          "email": { "type": "string" }
        }
      },
      "client": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "address": { "type": "string" }
        }
      },
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "description": { "type": "string" },
            "quantity": { "type": "number" },
            "unit_price": { "type": "number" },
            "total": { "type": "number" }
          }
        }
      },
      "subtotal": { "type": "number" },
      "tax": { "type": "number" },
      "total_amount": { "type": "number" },
      "currency": { "type": "string" }
    }
  },
  research: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Research Paper",
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "authors": {
        "type": "array",
        "items": { "type": "string" }
      },
      "abstract": { "type": "string" },
      "keywords": {
        "type": "array",
        "items": { "type": "string" }
      },
      "sections": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "heading": { "type": "string" },
            "content": { "type": "string" }
          }
        }
      },
      "references": {
        "type": "array",
        "items": { "type": "string" }
      },
      "doi": { "type": "string" },
      "publication_date": { "type": "string" }
    }
  }
};

export const mockExtractedData = {
  resume: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    summary: "Senior Software Engineer with 8+ years of experience in full-stack development, specializing in React, Node.js, and cloud architecture.",
    skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "GraphQL", "PostgreSQL"],
    experience: [
      {
        company: "TechCorp Inc.",
        role: "Senior Software Engineer",
        duration: "2020 - Present",
        description: "Led development of microservices architecture serving 2M+ users"
      },
      {
        company: "StartupXYZ",
        role: "Full Stack Developer",
        duration: "2018 - 2020",
        description: "Built real-time collaboration features using WebSockets and React"
      }
    ],
    education: [
      {
        institution: "UC Berkeley",
        degree: "B.S. Computer Science",
        year: "2016"
      }
    ]
  },
  invoice: {
    invoice_number: "INV-2023-Q4-0042",
    date: "2023-12-01",
    due_date: "2023-12-31",
    vendor: {
      name: "Acme Services LLC",
      address: "123 Business Ave, New York, NY 10001",
      email: "billing@acmeservices.com"
    },
    client: {
      name: "Global Enterprises Inc.",
      address: "456 Corporate Blvd, Chicago, IL 60601"
    },
    items: [
      { description: "Software Development Services", quantity: 40, unit_price: 150, total: 6000 },
      { description: "UI/UX Design", quantity: 20, unit_price: 120, total: 2400 },
      { description: "DevOps Consulting", quantity: 10, unit_price: 200, total: 2000 }
    ],
    subtotal: 10400,
    tax: 832,
    total_amount: 11232,
    currency: "USD"
  }
};

export const mockRawText = {
  resume: `JOHN DOE
Senior Software Engineer
john.doe@example.com | +1 (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
Senior Software Engineer with 8+ years of experience in full-stack development, specializing in React, Node.js, and cloud architecture. Proven track record of building scalable systems serving millions of users.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Go
Frameworks: React, Node.js, Express, FastAPI
Cloud: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes
Databases: PostgreSQL, MongoDB, Redis

PROFESSIONAL EXPERIENCE

TechCorp Inc. — Senior Software Engineer
January 2020 – Present
• Led development of microservices architecture serving 2M+ users
• Reduced API latency by 40% through caching optimizations
• Mentored team of 5 junior developers

StartupXYZ — Full Stack Developer  
March 2018 – December 2020
• Built real-time collaboration features using WebSockets
• Developed React frontend with 98% test coverage

EDUCATION
University of California, Berkeley
B.S. Computer Science, 2016
GPA: 3.8/4.0`,
  invoice: `INVOICE

ACME SERVICES LLC
123 Business Ave, New York, NY 10001
billing@acmeservices.com

Invoice Number: INV-2023-Q4-0042
Invoice Date: December 1, 2023
Due Date: December 31, 2023

BILL TO:
Global Enterprises Inc.
456 Corporate Blvd
Chicago, IL 60601

SERVICES RENDERED:
Description                          Qty    Rate      Amount
Software Development Services         40   $150.00   $6,000.00
UI/UX Design                          20   $120.00   $2,400.00
DevOps Consulting                     10   $200.00   $2,000.00

                                          Subtotal:  $10,400.00
                                          Tax (8%):     $832.00
                                          TOTAL:     $11,232.00

Payment Terms: Net 30
Please make checks payable to Acme Services LLC`
};

export const mockRAGChunks = [
  {
    id: 'chunk_001',
    text: "John Doe is a Senior Software Engineer with 8+ years of experience in full-stack development, specializing in React, Node.js, and cloud architecture.",
    metadata: { page: 1, section: "Summary", tokens: 32, embedding_dim: 1536 },
    similarity: 0.94
  },
  {
    id: 'chunk_002',
    text: "Technical Skills: JavaScript, TypeScript, Python, Go, React, Node.js, Express, FastAPI, AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, PostgreSQL, MongoDB, Redis.",
    metadata: { page: 1, section: "Skills", tokens: 38, embedding_dim: 1536 },
    similarity: 0.91
  },
  {
    id: 'chunk_003',
    text: "At TechCorp Inc. as Senior Software Engineer (January 2020 – Present), led development of microservices architecture serving 2M+ users. Reduced API latency by 40% through caching optimizations.",
    metadata: { page: 1, section: "Experience", tokens: 45, embedding_dim: 1536 },
    similarity: 0.88
  },
  {
    id: 'chunk_004',
    text: "At StartupXYZ as Full Stack Developer (March 2018 – December 2020), built real-time collaboration features using WebSockets and developed React frontend with 98% test coverage.",
    metadata: { page: 1, section: "Experience", tokens: 41, embedding_dim: 1536 },
    similarity: 0.85
  },
  {
    id: 'chunk_005',
    text: "Education: University of California, Berkeley. B.S. Computer Science, 2016. GPA: 3.8/4.0.",
    metadata: { page: 2, section: "Education", tokens: 22, embedding_dim: 1536 },
    similarity: 0.79
  },
];

export const mockStats = {
  documents: 47,
  schemasGenerated: 47,
  exportsCreated: 128,
  ragChunks: 2847,
};

export const mockCSVData = [
  ["Name", "Email", "Phone", "Location", "Skills"],
  ["John Doe", "john.doe@example.com", "+1 (555) 123-4567", "San Francisco, CA", "React, TypeScript, Node.js"],
];

export const processingSteps = [
  { id: 1, label: 'Parsing PDF structure', duration: 800 },
  { id: 2, label: 'Extracting text & layout', duration: 1200 },
  { id: 3, label: 'Analyzing with Groq AI', duration: 2000 },
  { id: 4, label: 'Generating JSON Schema', duration: 600 },
  { id: 5, label: 'Converting to structured JSON', duration: 900 },
  { id: 6, label: 'Creating embeddings', duration: 1500 },
  { id: 7, label: 'Building RAG pipeline', duration: 700 },
];
