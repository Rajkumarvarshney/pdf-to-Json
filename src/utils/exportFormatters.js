
// Helper to recursively flatten an object into key-value pairs
function flattenObject(obj, prefix = '', res = {}) {
  if (obj === null || obj === undefined) {
    return res
  }

  if (Array.isArray(obj)) {
    const isPrimitive = obj.every(x => typeof x !== 'object' || x === null)
    if (isPrimitive) {
      res[prefix] = obj.map(x => (x === null ? '' : String(x))).join('; ')
    } else {
      res[prefix] = JSON.stringify(obj)
    }
    return res
  }

  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        flattenObject(v, fullKey, res)
      } else if (Array.isArray(v)) {
        const isPrimitive = v.every(x => typeof x !== 'object' || x === null)
        if (isPrimitive) {
          res[fullKey] = v.map(x => (x === null ? '' : String(x))).join('; ')
        } else {
          res[fullKey] = JSON.stringify(v)
        }
      } else {
        res[fullKey] = v === null ? '' : String(v)
      }
    }
    return res
  }

  res[prefix] = String(obj)
  return res
}

// Generates an escaped CSV string from a flat row array
function generateCsvString(flatRows) {
  if (flatRows.length === 0) return ''
  const keys = Array.from(new Set(flatRows.flatMap(row => Object.keys(row))))
  const headerRow = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',')
  
  const valueRows = flatRows.map(row => {
    return keys.map(k => {
      const val = row[k] === undefined || row[k] === null ? '' : String(row[k])
      return `"${val.replace(/"/g, '""')}"`
    }).join(',')
  })

  return [headerRow, ...valueRows].join('\n')
}

/**
 * 1. CSV Formatter: Flattens objects, primitive arrays and nestings.
 */
export function flattenJsonForCsv(data) {
  if (Array.isArray(data)) {
    const isPrimitive = data.every(x => typeof x !== 'object' || x === null)
    if (isPrimitive) {
      return `value\n${data.map(x => (x === null ? '' : String(x))).join('\n')}`
    }
    const flatRows = data.map((item, idx) => {
      const flatObj = flattenObject(item)
      return { __index: idx, ...flatObj }
    })
    return generateCsvString(flatRows)
  }

  // Un-nest first encountered top-level array of objects merging root scalars
  let mainArrayKey = null
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null) {
      mainArrayKey = k
      break
    }
  }

  if (mainArrayKey) {
    const arrayItems = data[mainArrayKey]
    const rootScalars = {}
    for (const [k, v] of Object.entries(data)) {
      if (k !== mainArrayKey && (typeof v !== 'object' || v === null)) {
        rootScalars[k] = v === null ? '' : String(v)
      }
    }

    const flatRows = arrayItems.map((item, idx) => {
      const flatItem = flattenObject(item)
      return {
        ...rootScalars,
        __index: idx,
        ...flatItem
      }
    })
    return generateCsvString(flatRows)
  }

  const flatObj = flattenObject(data)
  return generateCsvString([flatObj])
}

/**
 * 2. Markdown Formatter
 */
export function convertJsonToMarkdown(data, fileName, fileType) {
  const timestamp = new Date().toISOString()
  let md = `---\nsource: ${fileName}\nextracted: ${timestamp}\nfileType: ${fileType}\n---\n\n`

  function renderValue(val, indent = '') {
    if (val === null || val === undefined) return 'null'
    if (typeof val !== 'object') return String(val)
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]'
      const isPrimitive = val.every(x => typeof x !== 'object' || x === null)
      if (isPrimitive) {
        return val.map(x => x === null ? 'null' : String(x)).join(', ')
      }
      return val.map(item => `\n${indent}- ${renderValue(item, indent + '  ')}`).join('')
    }
    return Object.entries(val).map(([k, v]) => `\n${indent}- **${k}**: ${renderValue(v, indent + '  ')}`).join('')
  }

  for (const [key, value] of Object.entries(data)) {
    const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    md += `## ${title}\n\n`
    
    if (value === null || value === undefined) {
      md += `null\n\n`
    } else if (Array.isArray(value)) {
      const isPrimitive = value.every(x => typeof x !== 'object' || x === null)
      if (isPrimitive) {
        value.forEach(item => {
          md += `- ${item === null ? 'null' : item}\n`
        })
        md += '\n'
      } else {
        value.forEach((item, idx) => {
          md += `### Item ${idx + 1}\n`
          for (const [subKey, subVal] of Object.entries(item)) {
            md += `- **${subKey}**: ${renderValue(subVal, '  ')}\n`
          }
          md += '\n'
        })
      }
    } else if (typeof value === 'object') {
      for (const [subKey, subVal] of Object.entries(value)) {
        md += `- **${subKey}**: ${renderValue(subVal, '  ')}\n`
      }
      md += '\n'
    } else {
      md += `${value}\n\n`
    }
  }

  return md
}

/**
 * 3. XML Formatter
 */
export function convertJsonToXml(data) {
  function sanitizeTagName(name) {
    let cleaned = name.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    if (/^[0-9\-\.]/.test(cleaned)) {
      cleaned = '_' + cleaned
    }
    return cleaned || 'field'
  }

  function toXml(val, tagName = 'field', indent = '') {
    const tag = sanitizeTagName(tagName)
    
    if (val === null || val === undefined) {
      return `${indent}<${tag} xsi:nil="true"/>`
    }
    
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return `${indent}<${tag}/>`
      }
      let xml = `${indent}<${tag}>\n`
      for (const item of val) {
        xml += toXml(item, 'item', indent + '  ') + '\n'
      }
      xml += `${indent}</${tag}>`
      return xml
    }
    
    if (typeof val === 'object') {
      let xml = `${indent}<${tag}>\n`
      for (const [k, v] of Object.entries(val)) {
        xml += toXml(v, k, indent + '  ') + '\n'
      }
      xml += `${indent}</${tag}>`
      return xml
    }
    
    const escaped = String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      
    return `${indent}<${tag}>${escaped}</${tag}>`
  }

  let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xmlString += '<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
  
  if (data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) {
      xmlString += toXml(v, k, '  ') + '\n'
    }
  } else {
    xmlString += toXml(data, 'content', '  ') + '\n'
  }
  
  xmlString += '</document>'
  return xmlString
}

/**
 * 4. YAML Formatter
 */
export function convertJsonToYaml(data) {
  function formatString(str) {
    const needsQuotes = /[:#\-\{\}\[\]\*,&\|>\?%@`~'"]/g.test(str) || 
                        /^\s/g.test(str) || 
                        /\s$/g.test(str) || 
                        !isNaN(Number(str)) ||
                        str === 'true' ||
                        str === 'false' ||
                        str === 'null'
    if (needsQuotes) {
      return `"${str.replace(/"/g, '\\"')}"`
    }
    return str
  }

  function toYaml(val, indent = '') {
    if (val === null || val === undefined) {
      return 'null'
    }
    
    if (typeof val === 'boolean') {
      return val ? 'true' : 'false'
    }
    
    if (typeof val === 'number') {
      return String(val)
    }
    
    if (typeof val === 'string') {
      return formatString(val)
    }
    
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]'
      return val.map(item => {
        if (typeof item === 'object' && item !== null) {
          const nested = toYaml(item, indent + '  ')
          return `\n${indent}- ${nested.trimStart()}`
        }
        return `\n${indent}- ${toYaml(item, indent + '  ')}`
      }).join('')
    }
    
    if (typeof val === 'object') {
      const entries = Object.entries(val)
      if (entries.length === 0) return '{}'
      return entries.map(([k, v], idx) => {
        const prefix = idx === 0 ? '' : indent
        const formattedKey = formatString(k)
        if (typeof v === 'object' && v !== null) {
          return `${prefix}${formattedKey}:\n${indent}  ${toYaml(v, indent + '  ')}`
        }
        return `${prefix}${formattedKey}: ${toYaml(v, indent + '  ')}`
      }).join('\n')
    }
    
    return formatString(String(val))
  }

  return toYaml(data)
}

/**
 * 5. Excel Workbook Formatter (using SheetJS)
 */
export async function convertJsonToExcel(data) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const summaryData = []
  let hasArraySheets = false
  
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const flatRows = value.map(item => {
        const flatItem = {}
        function flatten(obj, prefix = '') {
          for (const [k, v] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${k}` : k
            if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
              flatten(v, fullKey)
            } else if (Array.isArray(v)) {
              const isPrimitive = v.every(x => typeof x !== 'object' || x === null)
              flatItem[fullKey] = isPrimitive ? v.map(x => x === null ? '' : String(x)).join('; ') : JSON.stringify(v)
            } else {
              flatItem[fullKey] = v === null ? '' : v
            }
          }
        }
        flatten(item)
        return flatItem
      })
      
      const ws = XLSX.utils.json_to_sheet(flatRows)
      autofitColumns(ws, flatRows)
      ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }
      
      const sheetName = key.replace(/[\\\/\?\*\:\[\]]/g, '_').slice(0, 30)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      hasArraySheets = true
    } else {
      let displayValue = ''
      if (value === null || value === undefined) {
        displayValue = 'null'
      } else if (Array.isArray(value)) {
        displayValue = value.map(x => x === null ? 'null' : String(x)).join(', ')
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value)
      } else {
        displayValue = value
      }
      
      summaryData.push({
        Field: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        Value: displayValue
      })
    }
  }
  
  if (summaryData.length > 0) {
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    autofitColumns(wsSummary, summaryData)
    wsSummary['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }
    XLSX.utils.book_prepend_sheet(wb, wsSummary, 'Summary')
  } else if (!hasArraySheets) {
    const wsEmpty = XLSX.utils.json_to_sheet([{ Message: 'No extractable data' }])
    XLSX.utils.book_append_sheet(wb, wsEmpty, 'Data')
  }
  
  return wb
}

function autofitColumns(ws, rows) {
  if (rows.length === 0) return
  const cols = Object.keys(rows[0])
  const colWidths = cols.map(col => {
    let maxLen = col.length
    for (const row of rows) {
      const cellVal = row[col] === undefined || row[col] === null ? '' : String(row[col])
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 50) }
  })
  ws['!cols'] = colWidths
}
