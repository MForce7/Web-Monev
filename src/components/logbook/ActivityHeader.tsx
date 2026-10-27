import { useState } from 'react'
import type { HeaderData, TargetOutput } from '../../types/monev.ts'
import { JENIS_OUTPUT } from '../../lib/config.ts'
import HeaderBar from './HeaderBar'
import InfoRows from './InfoRows'
import TargetProgressRows from './TargetProgressRows'

interface Props {
  initialData: HeaderData
  onSave?: (updatedData: HeaderData) => void
}

export default function ActivityHeader({ initialData, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState<HeaderData>(initialData)
  const [draft, setDraft] = useState<HeaderData>(initialData)

  const data = isEditing ? draft : saved

  const setField = <K extends keyof HeaderData>(field: K, value: HeaderData[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }))

  const setOutput = (index: number, patch: Partial<TargetOutput>) =>
    setDraft((prev) => ({
      ...prev,
      targetOutputs: prev.targetOutputs.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }))

  const addOutput = () =>
    setDraft((prev) => ({ ...prev, targetOutputs: [...prev.targetOutputs, { jenis: JENIS_OUTPUT[0], jumlah: 1 }] }))

  const removeOutput = (index: number) =>
    setDraft((prev) => ({ ...prev, targetOutputs: prev.targetOutputs.filter((_, i) => i !== index) }))

  const startEdit = () => { setDraft(saved); setIsEditing(true) }
  const cancelEdit = () => { setDraft(saved); setIsEditing(false) }
  const handleSave = () => { setSaved(draft); setIsEditing(false); onSave?.(draft) }

  return (
    <div id="headerCard" className="bg-white shadow-md rounded-lg overflow-hidden border border-slate-200 w-full max-w-full min-w-0">
      <HeaderBar isEditing={isEditing} onEdit={startEdit} />

      <div className={`p-4 ${isEditing ? 'bg-amber-50/30' : ''}`}>
        <table className="w-full table-fixed text-sm border-collapse">
          <tbody>
            <InfoRows data={data} isEditing={isEditing} onChange={setField} />
            <TargetProgressRows
              data={data}
              isEditing={isEditing}
              onChange={setField}
              onOutputChange={setOutput}
              onOutputAdd={addOutput}
              onOutputRemove={removeOutput}
            />
          </tbody>
        </table>

        {isEditing && (
          <div className="mt-4 flex justify-end gap-2 no-print">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-gov-700 hover:bg-gov-800 text-white rounded text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-check" /> Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded text-xs font-semibold transition"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}