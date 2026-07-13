import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, Settings, Trash2, ChevronDown, ChevronRight, Plus, 
  ArrowRightLeft, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react'

// Helper to compile target objects where a field can be moved
function getValidParents(fieldsList, currentId, level = 0, prefix = '') {
  let parents = []
  if (level === 0) {
    parents.push({ id: 'root', label: 'Root Level' })
  }
  for (const f of fieldsList) {
    if (f.id === currentId) continue
    if (f.type === 'object' || f.type === 'array') {
      const displayLabel = prefix ? `${prefix} > ${f.label || f.key}` : (f.label || f.key)
      parents.push({ id: f.id, label: displayLabel })
      if (f.children && f.children.length > 0) {
        parents = parents.concat(getValidParents(f.children, currentId, level + 1, displayLabel))
      }
    }
  }
  return parents
}

export default function SchemaFieldRow({
  field,
  level = 1,
  allFields,
  onUpdate,
  onDelete,
  onAddChild,
  onMove,
  onReorder,
  siblingKeys = [],
  onAddSibling
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  // useSortable hook configuration for dnd-kit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    paddingLeft: `${(level - 1) * 24}px`
  }

  // Keyboard shortcut listener for key inputs
  const handleInputKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onAddSibling(field.id)
    }
    if (e.key === 'Backspace' && field.key === '') {
      e.preventDefault()
      if (confirm('Delete this empty field?')) {
        onDelete(field.id)
      }
    }
  }

  // Auto-slugify on blur: lowercase, underscores, no spaces
  const handleKeyBlur = (e) => {
    const raw = e.target.value
    const slugified = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
    onUpdate(field.id, { key: slugified || `field_${field.id.slice(0, 4)}` })
  }

  // Key validation checks
  const isKeyEmpty = !field.key || field.key.trim() === ''
  const isKeyDuplicate = siblingKeys.filter(k => k === field.key).length > 1
  const hasError = isKeyEmpty || isKeyDuplicate

  // Shake before delete
  const handleDeleteClick = () => {
    setIsShaking(true)
    setTimeout(() => {
      setIsShaking(false)
      onDelete(field.id)
    }, 150)
  }

  const validTargetParents = getValidParents(allFields, field.id)

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group/row relative select-none ${isShaking ? 'shake-input' : ''}`}
    >
      {/* Indentation line markers */}
      {level > 1 && (
        <div 
          className="absolute border-l border-white/10 top-0 bottom-0 pointer-events-none" 
          style={{ left: `${(level - 2) * 24 + 12}px` }}
        />
      )}

      {/* Main Row Content Box */}
      <div 
        className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white/3 border hover:bg-white/5 p-3 sm:p-2 rounded-xl mb-1.5 transition-all duration-200 ${
          hasError 
            ? 'border-red-500/40 bg-red-500/5' 
            : 'border-white/5'
        }`}
      >
        {/* Top/Left Row on mobile: Drag handle, Key input */}
        <div className="flex items-center gap-2 flex-1">
          {/* Sortable drag handle */}
          <button 
            {...attributes} 
            {...listeners} 
            className="cursor-grab text-gray-500 hover:text-white p-1 flex-shrink-0"
          >
            <GripVertical size={14} />
          </button>

          {/* Key Input */}
          <div className="flex-1 min-w-[100px] relative">
            <input
              type="text"
              value={field.key}
              placeholder="Key name..."
              onChange={(e) => onUpdate(field.id, { key: e.target.value })}
              onBlur={handleKeyBlur}
              onKeyDown={handleInputKeyDown}
              className={`w-full bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                hasError ? 'border-red-500/60 focus:border-red-500' : ''
              }`}
            />
            {hasError && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400" title={isKeyDuplicate ? "Duplicate key at this level" : "Key cannot be empty"}>
                <AlertCircle size={12} />
              </span>
            )}
          </div>
        </div>

        {/* Bottom/Right Row: Label, Type, Req, and other controls */}
        <div className="flex flex-wrap items-center gap-2 sm:contents">
          {/* Label Input */}
          <div className="flex-1 min-w-[120px]">
            <input
              type="text"
              value={field.label}
              placeholder="Display Label..."
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              onKeyDown={handleInputKeyDown}
              className="w-full bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Type Selector */}
          <div className="flex-shrink-0">
            <select
              value={field.type}
              onChange={(e) => onUpdate(field.id, { type: e.target.value })}
              className="bg-[#181824] border border-white/8 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
              <option value="array">List (Array)</option>
              <option value="object">Group (Object)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto sm:ml-0 flex-shrink-0">
            {/* Required Toggle */}
            <button
              onClick={() => onUpdate(field.id, { required: !field.required })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                field.required 
                  ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 font-bold' 
                  : 'border-white/8 text-gray-500 hover:text-gray-400'
              }`}
            >
              {field.required ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              <span>Req</span>
            </button>

            {/* Detail Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isExpanded 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'border-white/5 text-gray-500 hover:text-gray-400'
              }`}
            >
              <Settings size={14} />
            </button>

            {/* Add nested child field (groups/arrays only, limit level < 3) */}
            {(field.type === 'object' || field.type === 'array') && (
              <button
                onClick={() => onAddChild(field.id)}
                disabled={level >= 3}
                title={level >= 3 ? "Nesting limit reached (max 3 levels)" : "Add nested field"}
                className="p-1.5 rounded-lg border border-white/5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              >
                <Plus size={14} />
              </button>
            )}

            {/* Delete Row Button */}
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg border border-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Inline Detail Settings Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-2 ml-4 rounded-xl border border-white/5 bg-white/2 p-3 text-xs space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Description */}
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Extraction Description / Prompt Hint
                </label>
                <textarea
                  value={field.description}
                  placeholder="e.g. Find the invoice total price at the bottom..."
                  onChange={(e) => onUpdate(field.id, { description: e.target.value })}
                  rows={2}
                  className="w-full bg-[#181824] border border-white/8 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              {/* Example & Parenting */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Example Value
                  </label>
                  <input
                    type="text"
                    value={field.example || ''}
                    placeholder="e.g. INV-1004"
                    onChange={(e) => onUpdate(field.id, { example: e.target.value })}
                    className="w-full bg-[#181824] border border-white/8 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                {/* Array Wrapping Toggle */}
                {field.type !== 'array' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`list-wrap-${field.id}`}
                      checked={field.isList || false}
                      onChange={(e) => onUpdate(field.id, { isList: e.target.checked })}
                      className="accent-indigo-500 rounded bg-[#181824] border-white/8 cursor-pointer"
                    />
                    <label 
                      htmlFor={`list-wrap-${field.id}`}
                      className="text-gray-400 cursor-pointer select-none text-[11px]"
                    >
                      Extract as list (wrap field output inside an array)
                    </label>
                  </div>
                )}

                {/* Move to another parent selector */}
                {validTargetParents.length > 0 && (
                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                      Move Field To Parent
                    </label>
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft size={12} className="text-gray-600" />
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onMove(field.id, e.target.value)
                            setIsExpanded(false)
                          }
                        }}
                        className="bg-[#181824] border border-white/8 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer w-full"
                      >
                        <option value="">Move field to...</option>
                        {validTargetParents.map(parent => (
                          <option key={parent.id} value={parent.id}>{parent.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render children sub-fields context recursively (only for array and object types) */}
      <AnimatePresence>
        {(field.type === 'object' || field.type === 'array') && field.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-6 border-l border-white/8 relative">
              <SortableContext
                items={field.children.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {field.children.map(child => (
                  <SchemaFieldRow
                    key={child.id}
                    field={child}
                    level={level + 1}
                    allFields={allFields}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddChild={onAddChild}
                    onMove={onMove}
                    onReorder={onReorder}
                    siblingKeys={(field.children || []).map(c => c.key)}
                    onAddSibling={onAddSibling}
                  />
                ))}
              </SortableContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
