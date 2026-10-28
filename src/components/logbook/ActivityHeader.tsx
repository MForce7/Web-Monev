import { useState } from 'react'
import type { HeaderData, TargetOutput } from '../../types/monev'
import { JENIS_OUTPUT } from '../../lib/config'
import HeaderBar from './HeaderBar'
import InfoRows from './InfoRows'
import Safe from './Safe'
import TargetProgressRows from './TargetProgressRows'

interface Props {
  initialData: HeaderData
  onSave?: (updatedData: HeaderData) => void
}

export default function ActivityHeader({ initialData, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(initialData) // data terakhir yang disimpan
  const [draft, setDraft] = useState(initialData) // data yang sedang diedit

  const data = isEditing ? draft : saved

  const setField = <K extends keyof HeaderData>(field: K, value: HeaderData[K]) =>
    setDraft((p) => ({ ...p, [field]: value }))

  const setOutputs = (fn: (list: TargetOutput[]) => TargetOutput[]) =>
    setDraft((p) => ({ ...p, targetOutputs: fn(p.targetOutputs) }))

  const setOutput = (i: number, patch: Partial<TargetOutput>) =>
    setOutputs((l) => l.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  const addOutput = () => setOutputs((l) => [...l, { jenis: JENIS_OUTPUT[0], jumlah: 1 }])
  const removeOutput = (i: number) => setOutputs((l) => l.filter((_, idx) => idx !== i))

  const startEdit = () => { setDraft(saved); setIsEditing(true) }
  const cancelEdit = () => { setDraft(saved); setIsEditing(false) }
  const handleSave = () => { setSaved(draft); setIsEditing(false); onSave?.(draft) }

  return (
    <div id="headerCard" className="bg-white shadow-md rounded-lg overflow-hidden border border-slate-200 w-full max-w-full min-w-0">
      <Safe name="HeaderBar">
        <HeaderBar isEditing={isEditing} onEdit={startEdit} />
      </Safe>

      <div className={`p-4 ${isEditing ? 'bg-amber-50/30' : ''}`}>
        <table className="w-full table-fixed text-sm border-collapse">
          <tbody>
            <Safe name="InfoRows" row>
              <InfoRows data={data} isEditing={isEditing} onChange={setField} />
            </Safe>
            <Safe name="TargetProgressRows" row>
              <TargetProgressRows
                data={data}
                isEditing={isEditing}
                onChange={setField}
                onOutputChange={setOutput}
                onOutputAdd={addOutput}
                onOutputRemove={removeOutput}
              />
            </Safe>
          </tbody>
        </table>

        {isEditing && (
          <div className="mt-4 flex justify-end gap-2 no-print">
            <button type="button" onClick={handleSave} className="px-4 py-2 bg-gov-700 hover:bg-gov-800 text-white rounded text-xs font-semibold shadow transition flex items-center gap-1.5">
              <i className="fa-solid fa-check" /> Simpan Perubahan
            </button>
            <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded text-xs font-semibold transition">
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}