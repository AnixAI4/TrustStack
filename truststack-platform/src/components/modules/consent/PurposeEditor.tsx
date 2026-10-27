'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Lock } from 'lucide-react'
import { DPDP_BASES } from '@/lib/constants'

export interface PurposeFormData {
  purpose_key: string
  name_en: string
  name_hi: string
  name_ta: string
  name_te: string
  description_en: string
  required: boolean
  dpdp_basis: string
}

interface PurposeEditorProps {
  purposes: PurposeFormData[]
  onChange: (purposes: PurposeFormData[]) => void
}

const EMPTY_PURPOSE: PurposeFormData = {
  purpose_key: '',
  name_en: '',
  name_hi: '',
  name_ta: '',
  name_te: '',
  description_en: '',
  required: false,
  dpdp_basis: 'consent_s6',
}

export default function PurposeEditor({ purposes, onChange }: PurposeEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<PurposeFormData>(EMPTY_PURPOSE)

  const startEdit = (index: number) => {
    setAdding(false)
    setEditingIndex(index)
    setForm({ ...purposes[index] })
  }

  const startAdd = () => {
    setEditingIndex(null)
    setAdding(true)
    setForm(EMPTY_PURPOSE)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setAdding(false)
    setForm(EMPTY_PURPOSE)
  }

  const saveEdit = () => {
    if (!form.purpose_key.trim() || !form.name_en.trim() || !form.description_en.trim()) return
    if (editingIndex !== null) {
      const updated = [...purposes]
      updated[editingIndex] = form
      onChange(updated)
    } else if (adding) {
      onChange([...purposes, form])
    }
    cancelEdit()
  }

  const removePurpose = (index: number) => {
    onChange(purposes.filter((_, i) => i !== index))
  }

  const updateForm = (field: keyof PurposeFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-3">
      {purposes.map((p, i) => (
        <div key={p.purpose_key || i} className="border border-gray-100 rounded-xl bg-white">
          {editingIndex === i ? (
            <PurposeForm form={form} onChange={updateForm} onSave={saveEdit} onCancel={cancelEdit} />
          ) : (
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#1A1A2E]">{p.name_en}</span>
                  <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{p.purpose_key}</span>
                  {p.required && (
                    <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />Required
                    </span>
                  )}
                  <span className="text-xs text-[#003366] bg-blue-50 px-2 py-0.5 rounded-full">
                    {DPDP_BASES.find(b => b.id === p.dpdp_basis)?.label || p.dpdp_basis}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-snug">{p.description_en}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(i)}
                  className="p-1.5 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {!p.required && (
                  <button
                    onClick={() => removePurpose(i)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {adding && (
        <div className="border border-[#003366]/20 rounded-xl bg-white">
          <PurposeForm form={form} onChange={updateForm} onSave={saveEdit} onCancel={cancelEdit} isNew />
        </div>
      )}

      {!adding && editingIndex === null && (
        <button
          onClick={startAdd}
          className="flex items-center gap-2 text-sm text-[#003366] border border-dashed border-[#003366]/40 rounded-xl px-4 py-3 w-full hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add purpose
        </button>
      )}
    </div>
  )
}

function PurposeForm({
  form,
  onChange,
  onSave,
  onCancel,
  isNew,
}: {
  form: PurposeFormData
  onChange: (field: keyof PurposeFormData, value: string | boolean) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {isNew ? 'New Purpose' : 'Edit Purpose'}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Key (unique identifier) *</label>
          <input
            value={form.purpose_key}
            onChange={e => onChange('purpose_key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="e.g. analytics"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] font-mono"
            disabled={!isNew}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">DPDP Basis *</label>
          <select
            value={form.dpdp_basis}
            onChange={e => onChange('dpdp_basis', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
          >
            {DPDP_BASES.map(b => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Name (English) *</label>
        <input
          value={form.name_en}
          onChange={e => onChange('name_en', e.target.value)}
          placeholder="Analytics"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Description (English) *</label>
        <textarea
          value={form.description_en}
          onChange={e => onChange('description_en', e.target.value)}
          rows={2}
          placeholder="Describe what this purpose is used for..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['name_hi', 'name_ta', 'name_te'] as const).map(field => (
          <div key={field}>
            <label className="block text-xs text-gray-500 mb-1">
              {field === 'name_hi' ? 'Name (Hindi)' : field === 'name_ta' ? 'Name (Tamil)' : 'Name (Telugu)'}
            </label>
            <input
              value={form[field]}
              onChange={e => onChange(field, e.target.value)}
              placeholder="Optional"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required-toggle"
          checked={form.required}
          onChange={e => onChange('required', e.target.checked)}
          className="w-4 h-4 accent-[#003366]"
        />
        <label htmlFor="required-toggle" className="text-sm text-gray-700">
          Required (user cannot opt out)
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm rounded-lg hover:bg-[#1A5276] transition-colors"
        >
          <Check className="w-4 h-4" />Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />Cancel
        </button>
      </div>
    </div>
  )
}
