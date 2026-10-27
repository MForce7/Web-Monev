import { useState } from 'react'
import { emptyMonth, type MonevMonth } from '../../types/monev'
import { AttachmentEditor, AttachmentList, CELL_INPUT, Dash } from './Attachments'
import { defaultStatus, hasKeterangan, statusOptions, statusTone } from '../../lib/config.ts'
import { JenisOptions, PercentInput, WRAP } from './shared'

/* Status output bebas per jenis (string) + keterangan opsional.
 * Output pertama di `output`, tambahan di `outputTambahan`. */
type MonthOutput = Omit<MonevMonth['output'], 'status'> & { status: string; keterangan?: string }
export type MonthData = Omit<MonevMonth, 'output'> & {
  output: MonthOutput
  outputTambahan?: MonthOutput[]
}

const CELL = `p-1.5 border-r border-slate-200 align-top min-w-0 whitespace-pre-line ${WRAP}`

const blankOutput = (): MonthOutput => ({ ...emptyMonth('').output, status: '', keterangan: '' })
const outputsOf = (m: MonthData): MonthOutput[] => [m.output, ...(m.outputTambahan ?? [])]

function TextField({ editing, value, onChange, multiline = false }: {
  editing: boolean
  value: string
  onChange: (next: string) => void
  multiline?: boolean
}) {
  if (!editing) return value ? <>{value}</> : <Dash />
  return multiline ? (
    <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={CELL_INPUT} />
  ) : (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={CELL_INPUT} />
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="h-1.5 flex-1 min-w-0 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-semibold text-slate-700 text-[11px]">{value}%</span>
    </div>
  )
}

function ActionButton({ label, icon, onClick, className }: {
  label: string
  icon: string
  onClick: () => void
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] leading-tight font-medium transition ${className}`}
    >
      <i className={`fa-solid ${icon} shrink-0`} />
      <span>{label}</span>
    </button>
  )
}

interface Props {
  month: MonthData
  onSave: (next: MonthData) => void
  onClear: () => void
}

export default function MonthRow({ month, onSave, onClear }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<MonthData>(month)

  const data = isEditing ? draft : month
  const { aktivitas } = data
  const outputs = outputsOf(data)
  const span = outputs.length

  const setAktivitas = (patch: Partial<MonevMonth['aktivitas']>) =>
    setDraft((prev) => ({ ...prev, aktivitas: { ...prev.aktivitas, ...patch } }))

  const setOutputAt = (index: number, patch: Partial<MonthOutput>) =>
    setDraft((prev) =>
      index === 0
        ? { ...prev, output: { ...prev.output, ...patch } }
        : {
            ...prev,
            outputTambahan: (prev.outputTambahan ?? []).map((o, i) => (i === index - 1 ? { ...o, ...patch } : o)),
          },
    )

  /** Ganti jenis: status menyesuaikan, keterangan hanya untuk Purwarupa/Model */
  const changeJenis = (index: number, current: MonthOutput, jenis: string) =>
    setOutputAt(index, {
      jenis,
      status: defaultStatus(jenis, current.status),
      keterangan: hasKeterangan(jenis) ? current.keterangan ?? '' : '',
    })

  const removeOutput = (index: number) =>
    setDraft((prev) => ({ ...prev, outputTambahan: (prev.outputTambahan ?? []).filter((_, i) => i !== index - 1) }))

  /** Tambah baris output; bila belum edit, otomatis masuk mode edit */
  const addOutput = () => {
    const base = isEditing ? draft : month
    setDraft({ ...base, outputTambahan: [...(base.outputTambahan ?? []), blankOutput()] })
    setIsEditing(true)
  }

  const startEdit = () => { setDraft(month); setIsEditing(true) }
  const handleSave = () => { onSave(draft); setIsEditing(false) }
  const handleClear = () => {
    if (window.confirm(`Kosongkan seluruh isian bulan ${month.bulan}?`)) onClear()
  }

  const rowClass = isEditing ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'
  const mergedCell = `${CELL} border-b border-slate-200`

  return (
    <>
      {outputs.map((output, idx) => {
        const isFirst = idx === 0
        const isLast = idx === span - 1
        const cell = `${CELL} border-b ${isLast ? 'border-slate-200' : 'border-dashed border-slate-300'}`

        return (
          <tr key={idx} className={rowClass}>
            {/* Kolom yang di-merge: hanya di baris pertama */}
            {isFirst && (
              <>
                <td rowSpan={span} className={`${mergedCell} font-semibold text-slate-800`}>{data.bulan}</td>
                <td rowSpan={span} className={mergedCell}>
                  <TextField editing={isEditing} multiline value={aktivitas.uraian} onChange={(uraian) => setAktivitas({ uraian })} />
                </td>
                <td rowSpan={span} className={mergedCell}>
                  <TextField editing={isEditing} multiline value={aktivitas.kendala} onChange={(kendala) => setAktivitas({ kendala })} />
                </td>
                <td rowSpan={span} className={mergedCell}>
                  <TextField editing={isEditing} multiline value={aktivitas.mitigasi} onChange={(mitigasi) => setAktivitas({ mitigasi })} />
                </td>
                <td rowSpan={span} className={mergedCell}>
                  {isEditing ? (
                    <AttachmentEditor items={aktivitas.dataDukung} onChange={(dataDukung) => setAktivitas({ dataDukung })} />
                  ) : (
                    <AttachmentList items={aktivitas.dataDukung} />
                  )}
                </td>
              </>
            )}

            {/* Jenis Output */}
            <td className={cell}>
              {isEditing && !isFirst && (
                <button
                  type="button"
                  onClick={() => removeOutput(idx)}
                  className="mb-1 flex items-center gap-1 text-[10px] font-medium text-rose-600 hover:text-rose-800"
                >
                  <i className="fa-solid fa-trash" /> Hapus output
                </button>
              )}
              {isEditing ? (
                <select value={output.jenis} onChange={(e) => changeJenis(idx, output, e.target.value)} className={CELL_INPUT}>
                  <option value="">– Pilih –</option>
                  <JenisOptions current={output.jenis} />
                </select>
              ) : (
                output.jenis || <Dash />
              )}
            </td>

            {/* Judul Output */}
            <td className={cell}>
              <TextField editing={isEditing} value={output.judul} onChange={(judul) => setOutputAt(idx, { judul })} />
            </td>

            {/* Status (+ keterangan untuk Purwarupa/Model) */}
            <td className={cell}>
              {isEditing ? (
                <div className="space-y-1 min-w-0">
                  <select
                    value={output.jenis ? output.status : ''}
                    disabled={!output.jenis}
                    onChange={(e) => setOutputAt(idx, { status: e.target.value })}
                    className={CELL_INPUT}
                  >
                    {output.jenis ? (
                      statusOptions(output.jenis, output.status).map((s) => <option key={s} value={s}>{s}</option>)
                    ) : (
                      <option value="">Pilih jenis dulu</option>
                    )}
                  </select>
                  {hasKeterangan(output.jenis) && (
                    <textarea
                      rows={2}
                      value={output.keterangan ?? ''}
                      onChange={(e) => setOutputAt(idx, { keterangan: e.target.value })}
                      placeholder="Keterangan"
                      className={CELL_INPUT}
                    />
                  )}
                </div>
              ) : output.jenis && output.status ? (
                <>
                  <span className={`inline-block px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${statusTone(output.status)}`}>
                    {output.status}
                  </span>
                  {hasKeterangan(output.jenis) && output.keterangan && (
                    <p className="mt-1 text-[10px] text-slate-500 whitespace-pre-line">{output.keterangan}</p>
                  )}
                </>
              ) : (
                <Dash />
              )}
            </td>

            {/* Capaian */}
            <td className={cell}>
              {isEditing ? (
                <div className="flex items-center gap-1 min-w-0">
                  <PercentInput
                    value={output.capaian}
                    onChange={(capaian) => setOutputAt(idx, { capaian })}
                    className={`${CELL_INPUT} text-center font-bold text-emerald-600`}
                  />
                  <span className="font-bold text-slate-600 shrink-0">%</span>
                </div>
              ) : (
                <ProgressBar value={Math.min(100, Math.max(0, output.capaian))} />
              )}
            </td>

            {/* Data dukung output */}
            <td className={cell}>
              {isEditing ? (
                <AttachmentEditor items={output.dataDukung} onChange={(dataDukung) => setOutputAt(idx, { dataDukung })} />
              ) : (
                <AttachmentList items={output.dataDukung} />
              )}
            </td>

            {/* Tindakan: satu set tombol per bulan */}
            {isFirst && (
              <td rowSpan={span} className="p-1.5 align-top min-w-0 border-b border-slate-200 no-print">
                <div className="flex flex-col gap-1">
                  {isEditing ? (
                    <>
                      <ActionButton label="Simpan" icon="fa-check" onClick={handleSave} className="bg-gov-700 hover:bg-gov-800 text-white font-semibold" />
                      <ActionButton label="Tambah Output" icon="fa-plus" onClick={addOutput} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700" />
                      <ActionButton label="Batal" icon="fa-xmark" onClick={() => setIsEditing(false)} className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold" />
                    </>
                  ) : (
                    <>
                      <ActionButton label="Edit" icon="fa-pen" onClick={startEdit} className="bg-gov-600 hover:bg-gov-700 text-white" />
                      <ActionButton label="Tambah Output" icon="fa-plus" onClick={addOutput} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700" />
                      <ActionButton label="Kosongkan" icon="fa-eraser" onClick={handleClear} className="bg-white hover:bg-red-50 text-red-600 border border-red-200" />
                    </>
                  )}
                </div>
              </td>
            )}
          </tr>
        )
      })}
    </>
  )
}