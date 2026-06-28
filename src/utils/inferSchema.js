import { nanoid } from 'nanoid'

/**
 * Helper to convert keys like 'invoice_number' to 'Invoice Number'
 */
function toTitleCase(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Recursively infers a Field row from a key-value pair.
 */
function inferField(key, value) {
  const id = nanoid()
  const label = toTitleCase(key)
  const required = false
  const description = `Extracted value for ${label}`
  const example = ''
  
  if (value === null || value === undefined) {
    return { id, key, label, type: 'string', required, description, example, children: [] }
  }

  const valueType = typeof value

  if (valueType === 'string') {
    // Attempt simple ISO or dashed date detection
    const isDate = !isNaN(Date.parse(value)) && value.includes('-') && value.length >= 8
    return { 
      id, key, label, 
      type: isDate ? 'date' : 'string', 
      required, description, 
      example: value.slice(0, 100), 
      children: [] 
    }
  }

  if (valueType === 'number') {
    return { id, key, label, type: 'number', required, description, example: String(value), children: [] }
  }

  if (valueType === 'boolean') {
    return { id, key, label, type: 'boolean', required, description, example: String(value), children: [] }
  }

  if (Array.isArray(value)) {
    const children = []
    if (value.length > 0) {
      const firstVal = value[0]
      if (firstVal && typeof firstVal === 'object' && !Array.isArray(firstVal)) {
        for (const [subKey, subVal] of Object.entries(firstVal)) {
          children.push(inferField(subKey, subVal))
        }
      }
    }
    return { 
      id, key, label, 
      type: 'array', 
      required, description, example, 
      children 
    }
  }

  if (valueType === 'object') {
    const children = []
    for (const [subKey, subVal] of Object.entries(value)) {
      children.push(inferField(subKey, subVal))
    }
    return { 
      id, key, label, 
      type: 'object', 
      required, description, example, 
      children 
    }
  }

  return { id, key, label, type: 'string', required, description, example, children: [] }
}

/**
 * Analyzes a JSON object recursively to infer a schema Field tree.
 */
export function inferSchema(jsonObj) {
  if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
    return []
  }
  
  const fields = []
  for (const [key, value] of Object.entries(jsonObj)) {
    fields.push(inferField(key, value))
  }
  
  return fields
}
