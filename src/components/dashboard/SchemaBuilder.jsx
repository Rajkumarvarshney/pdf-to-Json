import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core'
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { 
  Plus, Play, Trash2, RotateCcw, FileCode, Sparkles, AlertTriangle, 
  FolderPlus, Upload, Database, Eye, ChevronDown, Check, HelpCircle, Code
} from 'lucide-react'
import { buildJsonSchema } from '../../utils/buildJsonSchema'
import { inferSchema } from '../../utils/inferSchema'
import SchemaFieldRow from './SchemaFieldRow'

// Recursive helper to find parent of a field in the tree
function findParentId(fields, targetId, currentParentId = null) {
  for (const f of fields) {
    if (f.id === targetId) return currentParentId
    if (f.children && f.children.length > 0) {
      const found = findParentId(f.children, targetId, f.id)
      if (found !== undefined) return found
    }
  }
  return undefined
}

// Check duplicates and errors in schema fields tree
function validateFields(fieldsList, siblingKeys = []) {
  let errorsCount = 0
  for (const f of fieldsList) {
    if (!f.key || f.key.trim() === '') {
      errorsCount++
    }
    const isDuplicate = siblingKeys.filter(k => k === f.key).length > 1
    if (isDuplicate) {
      errorsCount++
    }
    if (f.type === 'object' || f.type === 'array') {
      if (!f.children || f.children.length === 0) {
        errorsCount++ // object/array must have at least 1 child
      } else {
        errorsCount += validateFields(f.children, f.children.map(c => c.key))
      }
    }
  }
  return errorsCount
}

export default function SchemaBuilder({
  mode, // 'auto' | 'custom'
  onModeChange,
  fields,
  addField,
  updateField,
  deleteField,
  clearFields,
  loadTemplate,
  resetToSaved,
  reorderFields,
  moveField,
  onExtract
}) {
  const [activePreviewTab, setActivePreviewTab] = useState('schema') // 'schema' | 'prompt'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [jsonSampleText, setJsonSampleText] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showPromptToggle, setShowPromptToggle] = useState(true)

  // Sensors for dnd-kit pointer / keyboard controls
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // prevent accidental drags when editing text
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Auto-hide toast notifications
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Generated JSON schema and prompt
  const generatedSchema = buildJsonSchema(fields)
  const generatedSchemaString = JSON.stringify(generatedSchema, null, 2)

  const promptPreview = `Extract data from the following document and return ONLY a valid JSON object that strictly conforms to this schema:

${generatedSchemaString}

Field extraction hints:
${fields.map(f => `- ${f.key}: ${f.description || f.label} ${f.example ? `(example: ${f.example})` : ''}`).join('\n')}

Return ONLY the JSON object. No explanation, no markdown fences.`

  // Sibling adding wrapper
  const handleAddSibling = (fieldId) => {
    const parentId = findParentId(fields, fieldId)
    addField(parentId === undefined ? null : parentId)
  }

  // Add child nested wrapper
  const handleAddChild = (parentId) => {
    addField(parentId)
  }

  // Drag-and-drop end reordering logic
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find parent of the active item to ensure we only sort siblings
    const parentId = findParentId(fields, active.id)
    reorderFields(parentId === undefined ? null : parentId, active.id, over.id)
  }

  // Import JSON sample handler
  const handleImportJson = () => {
    setJsonError('')
    try {
      if (!jsonSampleText.trim()) {
        setJsonError('Please paste some JSON first')
        return
      }
      const parsed = JSON.parse(jsonSampleText)
      if (typeof parsed !== 'object' || parsed === null) {
        setJsonError('JSON must be an object or list')
        return
      }
      
      const inferred = inferSchema(parsed)
      if (inferred.length === 0) {
        setJsonError('No extractable fields found in JSON')
        return
      }

      loadTemplate(null) // Reset template state
      // Set the inferred fields directly
      fields.splice(0, fields.length, ...inferred)
      setIsImportModalOpen(false)
      setJsonSampleText('')
      setToastMessage(`Inferred ${inferred.length} fields from sample JSON!`)
    } catch (err) {
      setJsonError(`Invalid JSON: ${err.message}`)
    }
  }

  // Presets load triggers
  const handleSelectPreset = (presetKey) => {
    setShowPresetsDropdown(false)
    if (fields.length > 0) {
      if (!confirm('Replace current custom schema with this preset template?')) {
        return
      }
    }
    loadTemplate(presetKey)
    setToastMessage(`Loaded preset template schema!`)
  }

  // Extraction launcher validation
  const handleExtractClick = () => {
    if (mode === 'auto') {
      onExtract(null, null)
      return
    }

    if (fields.length === 0) {
      alert('Custom Schema requires at least 1 field defined.')
      return
    }

    const errors = validateFields(fields, fields.map(c => c.key))
    if (errors > 0) {
      alert(`Fix ${errors} validation errors (empty keys, duplicates, or empty groups) before extracting.`);
      return
    }

    onExtract(fields, generatedSchema)
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header Pill Switcher */}
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/2">
        <div className="flex flex-col">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Database size={16} className="text-indigo-400" />
            <span>Extraction Mode Settings</span>
          </h2>
          <p className="text-[10px] text-gray-500 mt-0.5">Define target structured fields for parsing.</p>
        </div>

        {/* Pill selector */}
        <div className="flex p-0.5 bg-black/40 rounded-xl border border-white/5">
          <button
            onClick={() => onModeChange('auto')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'auto'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Auto-detect
          </button>
          <button
            onClick={() => onModeChange('custom')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'custom'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Custom Schema ✏️
          </button>
        </div>
      </div>

      {mode === 'auto' ? (
        /* Auto-Detect Mode Panel */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles size={24} />
          </div>
          <h3 className="text-sm font-bold text-white">AI Auto-Extraction Mode</h3>
          <p className="text-xs leading-relaxed text-gray-500">
            DocParse AI will automatically analyze your document structure (invoices, forms, resumes, papers, or Q&A papers) to infer and extract all fields, tables, and details dynamically.
          </p>
          <button
            onClick={handleExtractClick}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-6 shadow-indigo-600/10 shadow-lg"
          >
            <Play size={14} /> Extract Document
          </button>
        </div>
      ) : (
        /* Custom Schema Mode Panel */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Toast message notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-4 py-2 rounded-xl shadow-lg border border-indigo-400/20 z-50 flex items-center gap-2 font-bold"
              >
                <Check size={14} />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left: Fields Editor Workspace */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 bg-[#0d0d14]">
            {/* Toolbar */}
            <div className="p-3 border-b border-white/5 flex flex-wrap gap-2 items-center bg-black/20">
              <button
                onClick={() => addField(null, 'string')}
                className="flex items-center gap-1 bg-white/5 border border-white/8 hover:bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs transition-colors"
              >
                <Plus size={12} className="text-indigo-400" />
                <span>Add Field</span>
              </button>
              
              <button
                onClick={() => addField(null, 'object')}
                className="flex items-center gap-1 bg-white/5 border border-white/8 hover:bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs transition-colors"
              >
                <FolderPlus size={12} className="text-indigo-400" />
                <span>Add Group</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1 bg-white/5 border border-white/8 hover:bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs transition-colors"
              >
                <Upload size={12} className="text-indigo-400" />
                <span>Import JSON</span>
              </button>

              {/* Presets templates dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/8 hover:bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                >
                  <Database size={12} className="text-indigo-400" />
                  <span>Templates</span>
                  <ChevronDown size={12} />
                </button>

                <AnimatePresence>
                  {showPresetsDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowPresetsDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 mt-1.5 w-44 rounded-xl border border-white/10 bg-[#161622] shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-1.5 space-y-1">
                          <button onClick={() => handleSelectPreset('invoice')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5">Invoice / Receipt</button>
                          <button onClick={() => handleSelectPreset('resume')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5">Resume / CV</button>
                          <button onClick={() => handleSelectPreset('research_paper')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5">Research Paper</button>
                          <button onClick={() => handleSelectPreset('legal_contract')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5">Legal Contract</button>
                          <button onClick={() => handleSelectPreset('product')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5">Product Listing</button>
                          <button onClick={() => handleSelectPreset('exam')} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5">Exam / Test Paper</button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1" />

              <button
                onClick={resetToSaved}
                className="flex items-center gap-1 bg-white/3 hover:bg-white/5 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-transparent hover:border-white/5"
              >
                <RotateCcw size={12} />
                <span>Reset to saved</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all custom fields?')) {
                    clearFields()
                  }
                }}
                className="flex items-center gap-1 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-red-500/10"
              >
                <Trash2 size={12} />
                <span>Clear all</span>
              </button>
            </div>

            {/* Drag & Drop Context List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-600 border-2 border-dashed border-white/5 rounded-2xl p-4">
                  <Database size={24} className="mb-2 text-gray-700" />
                  <p className="text-xs">No custom fields defined yet.</p>
                  <button onClick={() => addField()} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold mt-1.5 underline">Create your first field</button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {fields.map(field => (
                      <SchemaFieldRow
                        key={field.id}
                        field={field}
                        allFields={fields}
                        onUpdate={updateField}
                        onDelete={deleteField}
                        onAddChild={handleAddChild}
                        onMove={moveField}
                        onReorder={reorderFields}
                        siblingKeys={fields.map(f => f.key)}
                        onAddSibling={handleAddSibling}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Bottom Extract launcher footer */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-1.5">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>Make sure key names are unique slug identifiers.</span>
              </div>
              <button
                onClick={handleExtractClick}
                className="btn-primary flex items-center gap-2 text-xs py-2 px-6 shadow-indigo-600/10 shadow-lg"
              >
                <Play size={14} /> Extract with Schema
              </button>
            </div>
          </div>

          {/* Right: Live Preview Panel (280px) */}
          <div className="w-full md:w-[280px] bg-[#08080c] flex flex-col flex-shrink-0">
            {/* Tab switchers */}
            <div className="flex border-b border-white/5 bg-black/25">
              <button
                onClick={() => setActivePreviewTab('schema')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
                  activePreviewTab === 'schema'
                    ? 'border-indigo-500 text-white bg-white/2'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                JSON Schema
              </button>
              <button
                onClick={() => setActivePreviewTab('prompt')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
                  activePreviewTab === 'prompt'
                    ? 'border-indigo-500 text-white bg-white/2'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Groq Prompt
              </button>
            </div>

            {/* Tab Views */}
            <div className="flex-1 overflow-auto p-3.5 font-mono text-[10px] leading-relaxed">
              {activePreviewTab === 'schema' ? (
                <pre className="text-gray-300 select-all whitespace-pre-wrap">{generatedSchemaString}</pre>
              ) : (
                <div className="text-gray-400 whitespace-pre-wrap select-all">{promptPreview}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121218] p-6 shadow-2xl z-50"
            >
              <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                <Code size={18} className="text-indigo-400" />
                <span>Import JSON Sample</span>
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Paste a representative JSON payload. The builder will analyze the fields and nested collections to auto-build your extraction schema structure.
              </p>
              
              <textarea
                value={jsonSampleText}
                onChange={(e) => setJsonSampleText(e.target.value)}
                placeholder={`{\n  "invoice_id": "INV-1002",\n  "date": "2026-06-25",\n  "items": [\n    { "name": "Item A", "price": 49.99 }\n  ]\n}`}
                rows={10}
                className="w-full bg-[#0a0a0f] border border-white/8 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 resize-none"
              />

              {jsonError && (
                <p className="text-red-400 text-xs mt-2 font-medium flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  <span>{jsonError}</span>
                </p>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="bg-white/5 border border-white/8 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportJson}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Parse & Infer Fields
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
