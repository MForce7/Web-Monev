import { useState } from 'react'
import { clampPercent, emptyMonth, type Attachment, type MonevMonth } from '../../types/monev'
import { AttachmentEditor, AttachmentList } from './Attachments'
import { defaultStatus, hasKeterangan, statusOptions, statusTone } from '../../lib/config'
import { CELL_INPUT, Dash, JenisOptions, PercentInput, WRAP } from '../../lib/shared'

/* Status bebas per jenis + keterangan opsional. Output pertama di `output`, tambahan di `outputTambahan`. */
type MonthOutput = Omit<MonevMonth['output'], 'status'> & { status: string; keterangan?: string }
export type MonthData = Omit<MonevMonth, 'output'> & { output: MonthOutput; outputTambahan?: MonthOutput[] }

const TEXT_FIELDS = ['uraian', 'kendala', 'mitigasi'] as const
const CELL = `p-1.5 border-r border-slate-200 align-top min-w-0 whitespace-pre-line ${WRAP}`

const BTN = {
  primary: 'bg-gov-700 hover:bg-gov-800 text-white font-semibold',
  edit: 'bg-gov-600 hover:bg-gov-700 text-white',
  add: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700',
  cancel: 'bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold',
  clear: 'bg-white hover:bg-red-50 text-red-600 border border-red-200',
}

const blankOutput = (): MonthOutput => ({ ...emptyMonth('').output, status: '', keterangan: '' })
const outputsOf = (m: MonthData) => [m.output, ...(m.outputTambahan ?? [])]

/** Teks biasa saat dilihat, input/textarea saat diedit */
function TextField({ editing, value, onChange, multiline }: {
  editing: boolean; value: string; onChange: (v: string) => void; multiline?: boolean
}) {
  if (!editing) return value ? <>{value}</> : <Dash />
  return multiline
    ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={CELL_INPUT} />
    : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={CELL_INPUT} />
}

const Attach = ({ editing, items, onChange }: { editing: boolean; items: Attachment[]; onChange: (n: Attachment[]) => void }) =>
  editing ? <AttachmentEditor items={items} onChange={onChange} /> : <AttachmentList items={items} />

function ProgressBar({ value }: { value: number }) {
  const pct = clampPercent(value)
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="h-1.5 flex-1 min-w-0 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-semibold text-slate-700 text-[11px]">{pct}%</span>
    </div>
  )
}

interface Props {
  month: MonthData
  onSave: (next: MonthData) => void
  onClear: () => void
}

export default function MonthRow({ month, onSave, onClear }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(month)

  const data = isEditing ? draft : month
  const { aktivitas } = data
  const outputs = outputsOf(data)
  const span = outputs.length

  const setAktivitas = (patch: Partial<MonevMonth['aktivitas']>) =>
    setDraft((p) => ({ ...p, aktivitas: { ...p.aktivitas, ...patch } }))

  const setOutputAt = (i: number, patch: Partial<MonthOutput>) =>
    setDraft((p) =>
      i === 0
        ? { ...p, output: { ...p.output, ...patch } }
        : { ...p, outputTambahan: (p.outputTambahan ?? []).map((o, idx) => (idx === i - 1 ? { ...o, ...patch } : o)) },
    )

  /** Ganti jenis: status menyesuaikan, keterangan hanya untuk Purwarupa/Model */
  const changeJenis = (i: number, cur: MonthOutput, jenis: string) =>
    setOutputAt(i, {
      jenis,
      status: defaultStatus(jenis, cur.status),
      keterangan: hasKeterangan(jenis) ? cur.keterangan ?? '' : '',
    })

  const removeOutput = (i: number) =>
    setDraft((p) => ({ ...p, outputTambahan: (p.outputTambahan ?? []).filter((_, idx) => idx !== i - 1) }))

  /** Tambah baris output; bila belum edit, otomatis masuk mode edit */
  const addOutput = () => {
    const base = isEditing ? draft : month
    setDraft({ ...base, outputTambahan: [...(base.outputTambahan ?? []), blankOutput()] })
    setIsEditing(true)
  }

  const startEdit = () => { setDraft(month); setIsEditing(true) }
  const handleSave = () => { onSave(draft); setIsEditing(false) }
  const handleClear = () => window.confirm(`Kosongkan seluruh isian bulan ${month.bulan}?`) && onClear()

  const actions: [string, string, () => void, string][] = isEditing
    ? [['Simpan', 'fa-check', handleSave, BTN.primary], ['Tambah Output', 'fa-plus', addOutput, BTN.add], ['Batal', 'fa-xmark', () => setIsEditing(false), BTN.cancel]]
    : [['Edit', 'fa-pen', startEdit, BTN.edit], ['Tambah Output', 'fa-plus', addOutput, BTN.add], ['Kosongkan', 'fa-eraser', handleClear, BTN.clear]]

  const merged = `${CELL} border-b border-slate-200`

  return (
    <>
      {outputs.map((out, i) => {
        const first = i === 0
        const cell = `${CELL} border-b ${i === span - 1 ? 'border-slate-200' : 'border-dashed border-slate-300'}` // antar-output putus-putus

        return (
          <tr key={i} className={isEditing ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'}>
            {/* Kolom yang di-merge: hanya di baris pertama */}
            {first && (
              <>
                <td rowSpan={span} className={`${merged} font-semibold text-slate-800`}>{data.bulan}</td>
                {TEXT_FIELDS.map((k) => (
                  <td key={k} rowSpan={span} className={merged}>
                    <TextField editing={isEditing} multiline value={aktivitas[k]} onChange={(v) => setAktivitas({ [k]: v })} />
                  </td>
                ))}
                <td rowSpan={span} className={merged}>
                  <Attach editing={isEditing} items={aktivitas.dataDukung} onChange={(dataDukung) => setAktivitas({ dataDukung })} />
                </td>
              </>
            )}

            {/* Jenis Output */}
            <td className={cell}>
              {isEditing && !first && (
                <button type="button" onClick={() => removeOutput(i)} className="mb-1 flex items-center gap-1 text-[10px] font-medium text-rose-600 hover:text-rose-800">
                  <i className="fa-solid fa-trash" /> Hapus output
                </button>
              )}
              {isEditing ? (
                <select value={out.jenis} onChange={(e) => changeJenis(i, out, e.target.value)} className={CELL_INPUT}>
                  <option value="">– Pilih –</option>
                  <JenisOptions current={out.jenis} />
                </select>
              ) : (
                out.jenis || <Dash />
              )}
            </td>

            {/* Judul Output */}
            <td className={cell}>
              <TextField editing={isEditing} value={out.judul} onChange={(judul) => setOutputAt(i, { judul })} />
            </td>

            {/* Status: pilihan mengikuti jenis; Purwarupa/Model punya keterangan */}
            <td className={cell}>
              {isEditing ? (
                <div className="space-y-1 min-w-0">
                  <select
                    value={out.jenis ? out.status : ''}
                    disabled={!out.jenis}
                    onChange={(e) => setOutputAt(i, { status: e.target.value })}
                    className={CELL_INPUT}
                  >
                    {out.jenis
                      ? statusOptions(out.jenis, out.status).map((s) => <option key={s} value={s}>{s}</option>)
                      : <option value="">Pilih jenis dulu</option>}
                  </select>
                  {hasKeterangan(out.jenis) && (
                    <textarea rows={2} value={out.keterangan ?? ''} onChange={(e) => setOutputAt(i, { keterangan: e.target.value })} placeholder="Keterangan" className={CELL_INPUT} />
                  )}
                </div>
              ) : out.jenis && out.status ? (
                <>
                  <span className={`inline-block px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${statusTone(out.status)}`}>{out.status}</span>
                  {hasKeterangan(out.jenis) && out.keterangan && (
                    <p className="mt-1 text-[10px] text-slate-500 whitespace-pre-line">{out.keterangan}</p>
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
                  <PercentInput value={out.capaian} onChange={(capaian) => setOutputAt(i, { capaian })} className={`${CELL_INPUT} text-center font-bold text-emerald-600`} />
                  <span className="font-bold text-slate-600 shrink-0">%</span>
                </div>
              ) : (
                <ProgressBar value={out.capaian} />
              )}
            </td>

            {/* Data dukung output */}
            <td className={cell}>
              <Attach editing={isEditing} items={out.dataDukung} onChange={(dataDukung) => setOutputAt(i, { dataDukung })} />
            </td>

            {/* Tindakan: satu set tombol per bulan */}
            {first && (
              <td rowSpan={span} className="p-1.5 align-top min-w-0 border-b border-slate-200 no-print">
                <div className="flex flex-col gap-1">
                  {actions.map(([label, icon, onClick, cls]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={onClick}
                      className={`w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] leading-tight font-medium transition ${cls}`}
                    >
                      <i className={`fa-solid ${icon} shrink-0`} /> <span>{label}</span>
                    </button>
                  ))}
                </div>
              </td>
            )}
          </tr>
        )
      })}
    </>
  )
}