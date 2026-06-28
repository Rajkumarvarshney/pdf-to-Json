import { useState, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'

// 6 Preset Schema Templates
export const SCHEMA_TEMPLATES = {
  invoice: [
    { id: '1', key: 'invoice_number', label: 'Invoice Number', type: 'string', required: true, description: 'The unique identification number of the invoice', children: [] },
    { id: '2', key: 'vendor_name', label: 'Vendor Name', type: 'string', required: true, description: 'The company or merchant supplying goods/services', children: [] },
    { id: '3', key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, description: 'Date the invoice was issued', children: [] },
    { id: '4', key: 'total_amount', label: 'Total Amount', type: 'number', required: true, description: 'Total amount due including taxes and discounts', children: [] },
    { id: '5', key: 'tax_amount', label: 'Tax Amount', type: 'number', required: false, description: 'Total tax charged', children: [] },
    {
      id: '6', key: 'line_items', label: 'Line Items', type: 'array', required: false, description: 'List of individual items purchased', children: [
        { id: '6_1', key: 'description', label: 'Description', type: 'string', required: true, description: 'Product/service item detail description', children: [] },
        { id: '6_2', key: 'quantity', label: 'Quantity', type: 'number', required: true, description: 'Number of units', children: [] },
        { id: '6_3', key: 'unit_price', label: 'Unit Price', type: 'number', required: true, description: 'Price per individual unit', children: [] },
        { id: '6_4', key: 'amount', label: 'Amount', type: 'number', required: true, description: 'Total price for this line item (qty * unit_price)', children: [] },
      ]
    }
  ],
  resume: [
    { id: '1', key: 'full_name', label: 'Full Name', type: 'string', required: true, description: 'Candidate full legal name', children: [] },
    { id: '2', key: 'email', label: 'Email', type: 'string', required: true, description: 'Contact email address', children: [] },
    { id: '3', key: 'phone', label: 'Phone', type: 'string', required: false, description: 'Contact phone number', children: [] },
    { id: '4', key: 'summary', label: 'Professional Summary', type: 'string', required: false, description: 'A brief executive profile summary', children: [] },
    { id: '5', key: 'skills', label: 'Skills', type: 'array', required: false, description: 'List of candidate skills, technologies, and certifications', children: [] },
    {
      id: '6', key: 'education', label: 'Education', type: 'array', required: false, description: 'Educational history timeline', children: [
        { id: '6_1', key: 'institution', label: 'Institution', type: 'string', required: true, description: 'Name of university/college', children: [] },
        { id: '6_2', key: 'degree', label: 'Degree', type: 'string', required: true, description: 'Degree or major studied', children: [] },
        { id: '6_3', key: 'graduation_year', label: 'Graduation Year', type: 'string', required: false, description: 'Graduation year or date range', children: [] }
      ]
    },
    {
      id: '7', key: 'work_experience', label: 'Work Experience', type: 'array', required: false, description: 'Timeline of professional jobs held', children: [
        { id: '7_1', key: 'company', label: 'Company', type: 'string', required: true, description: 'Name of company or employer', children: [] },
        { id: '7_2', key: 'role', label: 'Role/Title', type: 'string', required: true, description: 'Job title held', children: [] },
        { id: '7_3', key: 'start_date', label: 'Start Date', type: 'string', required: false, description: 'When job started', children: [] },
        { id: '7_4', key: 'end_date', label: 'End Date', type: 'string', required: false, description: 'When job ended (or Present)', children: [] },
        { id: '7_5', key: 'highlights', label: 'Highlights', type: 'array', required: false, description: 'Key accomplishments and descriptions of roles held', children: [] }
      ]
    }
  ],
  research_paper: [
    { id: '1', key: 'title', label: 'Title', type: 'string', required: true, description: 'Title of the research paper', children: [] },
    { id: '2', key: 'authors', label: 'Authors', type: 'array', required: true, description: 'List of authors and academic affiliations', children: [] },
    { id: '3', key: 'abstract', label: 'Abstract', type: 'string', required: true, description: 'Executive abstract or study overview description', children: [] },
    { id: '4', key: 'key_contributions', label: 'Key Contributions', type: 'array', required: false, description: 'List of main theoretical or practical insights claimed', children: [] },
    { id: '5', key: 'methodology', label: 'Methodology', type: 'string', required: false, description: 'Description of studies, datasets, algorithms or testing models used', children: [] },
    { id: '6', key: 'conclusions', label: 'Conclusions', type: 'string', required: false, description: 'Summary of results and future work suggestions', children: [] }
  ],
  legal_contract: [
    { id: '1', key: 'contract_title', label: 'Contract Title', type: 'string', required: true, description: 'Official title or heading of the agreement', children: [] },
    { id: '2', key: 'effective_date', label: 'Effective Date', type: 'date', required: true, description: 'The date the contract takes effect', children: [] },
    { id: '3', key: 'parties', label: 'Parties Involved', type: 'array', required: true, description: 'List of legal names of individuals or organizations signing the agreement', children: [] },
    { id: '4', key: 'governing_law', label: 'Governing Law', type: 'string', required: false, description: 'The jurisdiction or state laws that apply to this agreement', children: [] },
    { id: '5', key: 'confidentiality_terms', label: 'Confidentiality Terms', type: 'string', required: false, description: 'Brief summary of NDA/Confidentiality terms', children: [] },
    { id: '6', key: 'termination_clause', label: 'Termination Clause', type: 'string', required: false, description: 'Conditions under which contract can be cancelled', children: [] }
  ],
  product: [
    { id: '1', key: 'product_name', label: 'Product Name', type: 'string', required: true, description: 'Full marketing title or retail name', children: [] },
    { id: '2', key: 'sku', label: 'SKU/Model Number', type: 'string', required: false, description: 'Stock keeping unit or parts serial ID', children: [] },
    { id: '3', key: 'price', label: 'Price', type: 'number', required: true, description: 'Selling price of product', children: [] },
    { id: '4', key: 'description', label: 'Description', type: 'string', required: true, description: 'Retail listing detailed summary description', children: [] },
    { id: '5', key: 'specifications', label: 'Specifications', type: 'array', required: false, description: 'Details like dimensions, weights, colors, capacities', children: [] },
    { id: '6', key: 'warranty', label: 'Warranty Info', type: 'string', required: false, description: 'Manufacturer warranty terms', children: [] }
  ],
  exam: [
    { id: '1', key: 'subject', label: 'Subject', type: 'string', required: true, description: 'Name of exam subject', children: [] },
    { id: '2', key: 'grade_level', label: 'Grade Level', type: 'string', required: false, description: 'Class grade or target students', children: [] },
    { id: '3', key: 'total_marks', label: 'Total Marks', type: 'number', required: false, description: 'Cumulative marks possible', children: [] },
    { id: '4', key: 'instructions', label: 'Instructions', type: 'string', required: false, description: 'Exam candidate test rules', children: [] },
    {
      id: '5', key: 'questions', label: 'Questions', type: 'array', required: true, description: 'List of exam paper questions', children: [
        { id: '5_1', key: 'question_number', label: 'Number', type: 'string', required: true, description: 'Question index, e.g. "1" or "2a"', children: [] },
        { id: '5_2', key: 'text', label: 'Question Text', type: 'string', required: true, description: 'Main body content of the question', children: [] },
        { id: '5_3', key: 'type', label: 'Type', type: 'string', required: true, description: 'multiple_choice, essay, short_answer, matching', children: [] },
        { id: '5_4', key: 'options', label: 'Options', type: 'array', required: false, description: 'MCQ options list if applicable', children: [] },
        { id: '5_5', key: 'correct_answer', label: 'Correct Answer', type: 'string', required: false, description: 'The correct key option or answer text', children: [] },
        { id: '5_6', key: 'marks', label: 'Marks', type: 'number', required: false, description: 'Weight or points for this question', children: [] }
      ]
    }
  ]
}

// Helper to update a field in the nested tree
function updateFieldInTree(fields, id, updates) {
  return fields.map(f => {
    if (f.id === id) {
      return { ...f, ...updates }
    }
    if (f.children && f.children.length > 0) {
      return { ...f, children: updateFieldInTree(f.children, id, updates) }
    }
    return f
  })
}

// Helper to delete a field in the nested tree
function deleteFieldFromTree(fields, id) {
  return fields
    .filter(f => f.id !== id)
    .map(f => {
      if (f.children && f.children.length > 0) {
        return { ...f, children: deleteFieldFromTree(f.children, id) }
      }
      return f
    })
}

// Helper to add a field to the nested tree
function addFieldToTree(fields, parentId, newField) {
  if (!parentId) {
    return [...fields, newField]
  }
  return fields.map(f => {
    if (f.id === parentId) {
      return { ...f, children: [...(f.children || []), newField] }
    }
    if (f.children && f.children.length > 0) {
      return { ...f, children: addFieldToTree(f.children, parentId, newField) }
    }
    return f
  })
}

// Helper to locate a node in the tree
function findFieldInTree(fields, id) {
  for (const f of fields) {
    if (f.id === id) return f
    if (f.children && f.children.length > 0) {
      const found = findFieldInTree(f.children, id)
      if (found) return found
    }
  }
  return null
}

export function useSchemaStore() {
  const [fields, setFields] = useState(() => {
    const saved = localStorage.getItem('docparse_custom_schema')
    return saved ? JSON.parse(saved) : SCHEMA_TEMPLATES.invoice
  })

  // Debounced save to localStorage
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('docparse_custom_schema', JSON.stringify(fields))
    }, 500)
    return () => clearTimeout(handler)
  }, [fields])

  const addField = useCallback((parentId = null, type = 'string') => {
    const id = nanoid()
    const index = Math.floor(Math.random() * 100)
    const newField = {
      id,
      key: `field_${index}`,
      label: `Field ${index}`,
      type,
      required: false,
      description: '',
      example: '',
      children: []
    }
    setFields(prev => addFieldToTree(prev, parentId, newField))
    return id
  }, [])

  const updateField = useCallback((id, updates) => {
    setFields(prev => updateFieldInTree(prev, id, updates))
  }, [])

  const deleteField = useCallback((id) => {
    setFields(prev => deleteFieldFromTree(prev, id))
  }, [])

  const clearFields = useCallback(() => {
    setFields([])
  }, [])

  const loadTemplate = useCallback((templateName) => {
    const template = SCHEMA_TEMPLATES[templateName]
    if (template) {
      setFields(JSON.parse(JSON.stringify(template))) // deep clone template
    }
  }, [])

  const resetToSaved = useCallback(() => {
    const saved = localStorage.getItem('docparse_custom_schema')
    if (saved) {
      setFields(JSON.parse(saved))
    }
  }, [])

  // Immutably reorder items on the same level (siblings only)
  const reorderFields = useCallback((parentId, activeId, overId) => {
    const getReorderedList = (list) => {
      const activeIdx = list.findIndex(item => item.id === activeId)
      const overIdx = list.findIndex(item => item.id === overId)
      if (activeIdx !== -1 && overIdx !== -1) {
        const result = [...list]
        const [removed] = result.splice(activeIdx, 1)
        result.splice(overIdx, 0, removed)
        return result
      }
      return list
    }

    setFields(prev => {
      if (!parentId) {
        return getReorderedList(prev)
      }
      return updateFieldInTree(
        prev, 
        parentId, 
        { children: getReorderedList(findFieldInTree(prev, parentId)?.children || []) }
      )
    })
  }, [])

  // Move a field cross-parent (e.g. from sub-object to root or another parent)
  const moveField = useCallback((id, newParentId) => {
    setFields(prev => {
      const targetNode = findFieldInTree(prev, id)
      if (!targetNode) return prev
      
      // Clean clone the node
      const clonedNode = JSON.parse(JSON.stringify(targetNode))
      
      // Remove from original parent
      const treeWithoutNode = deleteFieldFromTree(prev, id)
      
      // Add to new parent
      return addFieldToTree(treeWithoutNode, newParentId === 'root' ? null : newParentId, clonedNode)
    })
  }, [])

  return {
    fields,
    setFields,
    addField,
    updateField,
    deleteField,
    clearFields,
    loadTemplate,
    resetToSaved,
    reorderFields,
    moveField
  }
}
