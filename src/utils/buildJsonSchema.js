/**
 * Compiles a visual Field tree into a valid JSON Schema draft-07 object.
 */
function compileProperties(fieldsList) {
  const properties = {}
  const required = []

  for (const field of fieldsList) {
    if (!field.key || field.key.trim() === '') continue

    // Resolve JSON Schema types (date becomes string with format date)
    let fieldSchema = {
      type: field.type === 'date' ? 'string' : field.type
    }
    if (field.type === 'date') {
      fieldSchema.format = 'date'
    }

    if (field.description && field.description.trim() !== '') {
      fieldSchema.description = field.description
    }

    if (field.example && field.example.trim() !== '') {
      fieldSchema.example = field.example
    }

    if (field.type === 'object') {
      const nested = compileProperties(field.children || [])
      fieldSchema.properties = nested.properties
      if (nested.required.length > 0) {
        fieldSchema.required = nested.required
      }
    } else if (field.type === 'array') {
      // If array has children, it contains objects
      if (field.children && field.children.length > 0) {
        const nested = compileProperties(field.children)
        fieldSchema.items = {
          type: 'object',
          properties: nested.properties
        }
        if (nested.required.length > 0) {
          fieldSchema.items.required = nested.required
        }
      } else {
        // Fallback to array of strings if no sub-fields defined
        fieldSchema.items = { type: 'string' }
      }
    }

    // Wrap field inside an array if list-wrap option is enabled
    if (field.isList && field.type !== 'array') {
      fieldSchema = {
        type: 'array',
        items: fieldSchema
      }
    }

    properties[field.key] = fieldSchema

    if (field.required) {
      required.push(field.key)
    }
  }

  return { properties, required }
}

export function buildJsonSchema(fields) {
  const { properties, required } = compileProperties(fields || [])
  
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties
  }

  if (required.length > 0) {
    schema.required = required
  }

  return schema
}
