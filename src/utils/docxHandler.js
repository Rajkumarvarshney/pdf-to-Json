
/**
 * Parses an HTML table element into a 2D string array.
 */
function parseHtmlTable(tableEl) {
  const rows = []
  const trs = Array.from(tableEl.querySelectorAll('tr'))
  for (const tr of trs) {
    const row = []
    const cells = Array.from(tr.querySelectorAll('td, th'))
    for (const cell of cells) {
      row.push(cell.textContent.trim() || '')
    }
    if (row.length > 0) {
      rows.push(row)
    }
  }
  return rows
}

/**
 * Formats a 2D table array into a readable plain-text representation for Groq prompts.
 */
function tableToText(parsedTable) {
  return parsedTable.map(row => row.join(' | ')).join('\n')
}

/**
 * Extracts plain text, tables, and images from a DOCX File object.
 * Maps heading-delimited sections and large blocks into logical "pages".
 * Returns unified extractor response.
 */
export async function extractTextFromDOCX(file) {
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    
    // Convert to HTML (preserves tables and images as inline base64 data URIs)
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const pages = []
    let currentPageText = ''
    let currentPageTables = []
    let currentPageImages = []
    
    const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']
    
    for (const child of Array.from(doc.body.children)) {
      const tagName = child.tagName.toUpperCase()
      const isHeading = headingTags.includes(tagName)
      const elementText = child.textContent.trim()
      
      // Split page on heading (if we already have content) or if current block is too large
      if ((isHeading && currentPageText.length > 0) || (currentPageText.length > 3000)) {
        pages.push({
          pageNumber: pages.length + 1,
          pageNum: pages.length + 1, // legacy compatibility
          text: currentPageText.trim(),
          tables: currentPageTables,
          imageBase64: currentPageImages
        })
        currentPageText = ''
        currentPageTables = []
        currentPageImages = []
      }
      
      if (tagName === 'TABLE') {
        const parsedTable = parseHtmlTable(child)
        if (parsedTable.length > 0) {
          currentPageTables.push(parsedTable)
          currentPageText += `\n[Table]\n${tableToText(parsedTable)}\n`
        }
      } else {
        // Look for inline images in mammoth's HTML output
        const imgs = Array.from(child.getElementsByTagName('img'))
        if (tagName === 'IMG') imgs.push(child)
        
        for (const img of imgs) {
          if (img.src && img.src.startsWith('data:')) {
            currentPageImages.push(img.src)
          }
        }
        
        if (elementText.length > 0) {
          currentPageText += `\n${elementText}\n`
        }
      }
    }
    
    // Push the final remaining page
    if (currentPageText.trim().length > 0 || currentPageTables.length > 0 || currentPageImages.length > 0 || pages.length === 0) {
      pages.push({
        pageNumber: pages.length + 1,
        pageNum: pages.length + 1, // legacy compatibility
        text: currentPageText.trim(),
        tables: currentPageTables,
        imageBase64: currentPageImages
      })
    }
    
    const fullText = pages.map(p => p.text).join('\n\n')
    
    return {
      pages,
      fullText,
      pageCount: pages.length, // legacy compatibility
      metadata: {
        fileType: 'docx',
        fileName: file.name,
        totalPages: pages.length
      }
    }
  } catch (err) {
    console.error('Error parsing DOCX file:', err)
    throw new Error('Could not read DOCX — file may be corrupted or password-protected')
  }
}
