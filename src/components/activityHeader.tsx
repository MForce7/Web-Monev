import { useState, type ReactNode } from 'react'
import {
  JENIS_OUTPUT,
  STATUS_PELAKSANAAN,
  clampPercent,
  type HeaderData,
  type TargetOutput,
} from '../types/monev'

interface ActivityHeaderProps {
  initialData: HeaderData
  onSave?: (updatedData: HeaderData) => void
}

/* ───────────────────────── Styles ───────────────────────── */

const INPUT = 'p-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none'
const LABEL_CELL = 'py-2.5 px-4 font-medium text-slate-500 bg-slate-50/50'
const ROW = 'border-b border-slate-100'

/* ───────────────────────── Small pieces ───────────────────────── */

function Row({ label, children, last = false, top = false }: {
  label: string
  children: ReactNode
  last?: boolean
  top?: boolean
}) {
  return (
    <tr className={last ? '' : ROW}>
      <td className={`${LABEL_CELL} w-1/3 ${top ? 'align-top' : ''}`}>{label}</td>
      <td className="py-2.5 px-4">{children}</td>
    </tr>
  )
}

function Locked({ show }: { show: boolean }) {
  return show ? <span className="text-[10px] text-slate-400 font-normal ml-2">(Terkunci)</span> : null
}

/* ───────────────────────── Main component ───────────────────────── */

export default function ActivityHeader({ initialData, onSave }: ActivityHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState<HeaderData>(initialData) // data terakhir yang disimpan
  const [draft, setDraft] = useState<HeaderData>(initialData) // data yang sedang diedit

  const data = isEditing ? draft : saved

  /* ── Handlers ── */
  const setField = <K extends keyof HeaderData>(field: K, value: HeaderData[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }))

  const setOutput = (index: number, patch: Partial<TargetOutput>) =>
    setDraft((prev) => ({
      ...prev,
      targetOutputs: prev.targetOutputs.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }))

  const addOutput = () =>
    setDraft((prev) => ({
      ...prev,
      targetOutputs: [...prev.targetOutputs, { jenis: JENIS_OUTPUT[0], jumlah: 1 }],
    }))

  const removeOutput = (index: number) =>
    setDraft((prev) => ({ ...prev, targetOutputs: prev.targetOutputs.filter((_, i) => i !== index) }))

  const startEdit = () => {
    setDraft(saved)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(saved) // buang perubahan
    setIsEditing(false)
  }

  const handleSave = () => {
    setSaved(draft)
    setIsEditing(false)
    onSave?.(draft)
  }

  /* ── Render ── */
  return (
    <div id="headerCard" className="bg-white shadow-md rounded-lg overflow-hidden border border-slate-200">
      {/* Bar judul */}
      <div
        className={`px-6 py-4 font-semibold text-lg flex items-center justify-between text-white ${
          isEditing ? 'bg-amber-600' : 'bg-gov-700'
        }`}
      >
        <span>
          <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-folder-open'} mr-2`} />
          {isEditing ? 'Edit Detail Aktivitas' : 'Detail Aktivitas & Progres Kegiatan'}
        </span>

        <div className="flex items-center gap-2 no-print">
          {isEditing ? (
            <span className="text-xs bg-amber-700 px-3 py-1 rounded-full text-amber-100">Mode Edit</span>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="px-3 py-1 bg-gov-800 hover:bg-gov-900 border border-gov-500 rounded text-xs text-white transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-pen-to-square" /> Edit Detail
            </button>
          )}
        </div>
      </div>

      {/* Isi */}
      <div className={`p-6 ${isEditing ? 'bg-amber-50/30' : ''}`}>
        <table className="w-full text-sm border-collapse">
          <tbody>
            <Row label="Nama Ketua">
              <span className="font-semibold text-slate-800">{data.namaKetua}</span>
              <Locked show={isEditing} />
            </Row>

            <Row label="Unit Kerja">
              <span className="text-slate-800">{data.unitKerja}</span>
              <Locked show={isEditing} />
            </Row>

            <Row label="Satuan Kerja">
              <span className="text-slate-800">{data.satuanKerja}</span>
              <Locked show={isEditing} />
            </Row>

            <Row label="Judul Aktivitas">
              {isEditing ? (
                <input
                  type="text"
                  value={data.judulAktivitas}
                  onChange={(e) => setField('judulAktivitas', e.target.value)}
                  className={`w-full p-2 text-sm ${INPUT}`}
                />
              ) : (
                <span className="font-medium text-slate-800">{data.judulAktivitas}</span>
              )}
            </Row>

            <Row label="Target Output Utama" top>
              {isEditing ? (
                <div>
                  <div className="space-y-2">
                    {data.targetOutputs.map((out, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={out.jenis}
                          onChange={(e) => setOutput(idx, { jenis: e.target.value })}
                          className={INPUT}
                        >
                          {JENIS_OUTPUT.map((j) => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={out.jumlah}
                          onChange={(e) => setOutput(idx, { jumlah: parseInt(e.target.value) || 1 })}
                          className={`w-20 text-center ${INPUT}`}
                        />
                        <span className="text-xs text-slate-500">buah</span>
                        {data.targetOutputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOutput(idx)}
                            aria-label="Hapus target output"
                            className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addOutput}
                    className="mt-2 text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded font-medium transition flex items-center gap-1"
                  >
                    <i className="fa-solid fa-plus" /> Tambah Target Output
                  </button>
                </div>
              ) : (
                <table className="w-full text-xs border border-slate-200 rounded-md overflow-hidden max-w-lg">
                  <tbody>
                    <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="p-2 text-left">Jenis Output</th>
                      <th className="p-2 text-center w-28">Jumlah</th>
                    </tr>
                    {data.targetOutputs.map((out, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-700">{out.jenis}</td>
                        <td className="p-2 text-center font-semibold text-slate-800">{out.jumlah} buah</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Row>

            <Row label="Progres Total Aktivitas">
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={data.progresTotal}
                      onChange={(e) => setField('progresTotal', clampPercent(parseInt(e.target.value)))}
                      className={`w-20 text-sm text-center font-bold text-emerald-600 ${INPUT}`}
                    />
                    <span className="font-bold text-slate-600">%</span>
                  </div>
                  <input
                    type="text"
                    value={data.progresKeterangan}
                    onChange={(e) => setField('progresKeterangan', e.target.value)}
                    placeholder="Keterangan progres..."
                    className={`w-full ${INPUT}`}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-xs">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full"
                      style={{ width: `${clampPercent(data.progresTotal)}%` }}
                    />
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {data.progresTotal}%{' '}
                    <span className="font-normal text-slate-500 text-xs">({data.progresKeterangan})</span>
                  </span>
                </div>
              )}
            </Row>

            <Row label="Status Pelaksanaan" last>
              {isEditing ? (
                <select
                  value={data.statusPelaksanaan}
                  onChange={(e) => setField('statusPelaksanaan', e.target.value)}
                  className={`p-2 ${INPUT}`}
                >
                  {STATUS_PELAKSANAAN.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                  {data.statusPelaksanaan}
                </span>
              )}
            </Row>
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