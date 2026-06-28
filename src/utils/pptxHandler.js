import JSZip from 'jszip'

/**
 * Extracts plain text, speaker notes, and embedded images from a PPTX File object in the browser.
 * Treats each slide as a logical "page".
 * Returns unified extractor response.
 */
export async function extractTextFromPPTX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    
    // Find all slides in the zip file
    const slideFiles = Object.keys(zip.files).filter(path => 
      path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
    )
    
    // Sort slide files numerically (slide1.xml, slide2.xml, ..., slide10.xml)
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/[^\d]/g, ''), 10)
      const numB = parseInt(b.replace(/[^\d]/g, ''), 10)
      return numA - numB
    })
    
    const pages = []
    const parser = new DOMParser()
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i]
      const slideIndex = parseInt(slidePath.replace(/[^\d]/g, ''), 10)
      const pageNumber = i + 1
      
      // 1. Resolve relationships (rels) to find mapped images for this slide
      const relsPath = `ppt/slides/_rels/slide${slideIndex}.xml.rels`
      const relsFile = zip.file(relsPath)
      const relsMap = {}
      
      if (relsFile) {
        const relsXml = await relsFile.async('string')
        const relsDoc = parser.parseFromString(relsXml, 'application/xml')
        const relationships = relsDoc.getElementsByTagName('Relationship')
        
        for (const rel of Array.from(relationships)) {
          const id = rel.getAttribute('Id')
          const target = rel.getAttribute('Target')
          const type = rel.getAttribute('Type')
          
          if (id && target && type && type.includes('/image')) {
            // Target is relative to ppt/slides/ (e.g. "../media/image1.png")
            // Resolve it relative to root zip paths (e.g. "ppt/media/image1.png")
            const resolvedPath = target.replace(/^\.\.\//, 'ppt/')
            relsMap[id] = resolvedPath
          }
        }
      }
      
      // 2. Parse Slide XML for text nodes and image blips
      const slideFile = zip.file(slidePath)
      let slideText = ''
      const slideImages = []
      
      if (slideFile) {
        const slideXml = await slideFile.async('string')
        const slideDoc = parser.parseFromString(slideXml, 'application/xml')
        
        // Extract text elements: look for elements with localName === 't' (matching <a:t>)
        const allTags = slideDoc.getElementsByTagName('*')
        const textParts = []
        
        for (const tag of Array.from(allTags)) {
          const localName = tag.localName || tag.tagName.split(':').pop()
          if (localName === 't') {
            const textVal = tag.textContent.trim()
            if (textVal) textParts.push(textVal)
          }
        }
        slideText = textParts.join(' ')
        
        // Extract blips: look for localName === 'blip'
        for (const tag of Array.from(allTags)) {
          const localName = tag.localName || tag.tagName.split(':').pop()
          if (localName === 'blip') {
            const embedId = tag.getAttribute('r:embed') || tag.getAttribute('embed')
            if (embedId && relsMap[embedId]) {
              const mediaPath = relsMap[embedId]
              const mediaFile = zip.file(mediaPath)
              
              if (mediaFile) {
                const base64Data = await mediaFile.async('base64')
                const ext = mediaPath.split('.').pop().toLowerCase()
                const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg'
                slideImages.push(`data:${mime};base64,${base64Data}`)
              }
            }
          }
        }
      }
      
      // 3. Extract speaker notes
      let notesText = ''
      const notesPath = `ppt/notesSlides/notesSlide${slideIndex}.xml`
      const notesFile = zip.file(notesPath)
      
      if (notesFile) {
        const notesXml = await notesFile.async('string')
        const notesDoc = parser.parseFromString(notesXml, 'application/xml')
        const notesTags = notesDoc.getElementsByTagName('*')
        const notesParts = []
        
        for (const tag of Array.from(notesTags)) {
          const localName = tag.localName || tag.tagName.split(':').pop()
          if (localName === 't') {
            const textVal = tag.textContent.trim()
            if (textVal) notesParts.push(textVal)
          }
        }
        notesText = notesParts.join(' ')
      }
      
      // Append speaker notes to slide text if they exist (separated clearly)
      let combinedText = slideText
      if (notesText) {
        combinedText += `\n\n[Speaker Notes]\n${notesText}`
      }
      
      pages.push({
        pageNumber,
        pageNum: pageNumber, // legacy compatibility
        text: combinedText.trim(),
        tables: [], // PowerPoint tables are parsed inside slideText shapes
        imageBase64: slideImages
      })
    }
    
    const fullText = pages.map(p => p.text).join('\n\n')
    
    return {
      pages,
      fullText,
      pageCount: pages.length, // legacy compatibility
      metadata: {
        fileType: 'pptx',
        fileName: file.name,
        totalPages: pages.length
      }
    }
  } catch (err) {
    console.error('Error parsing PPTX file:', err)
    throw new Error('Could not parse PPTX — ensure the file is a valid PowerPoint presentation')
  }
}
