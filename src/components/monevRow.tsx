import { useState } from 'react'
import {
  JENIS_OUTPUT,
  STATUS_OUTPUT,
  clampPercent,
  emptyMonth,
  type Attachment,
  type MonevMonth,
  type OutputStatus,
} from '../types/monev'

interface MonevRowProps {
  /** Data 12 bulan dari parent (sama seperti pola ActivityHeader) */
  initialData: MonevMonth[]
  /** Dipanggil setiap ada baris yang disimpan atau dikosongkan, berisi seluruh data bulanan terbaru */
  onSave?: (updatedData: MonevMonth[]) => void
}

/* ───────────────────────── Styles ───────────────────────── */

const CARD = 'bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden'
const CELL = 'p-2.5 border-r border-slate-200 align-top'
const INPUT = 'w-full p-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none'

const STATUS_STYLE: Record<OutputStatus, string> = {
  'Belum Mulai': 'bg-slate-100 text-slate-600 border-slate-300',
  Berjalan: 'bg-amber-50 text-amber-700 border-amber-300',
  Selesai: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  Terlambat: 'bg-red-50 text-red-700 border-red-300',
}

/* ───────────────────────── Small pieces ───────────────────────── */

const Dash = () => <span className="text-slate-400">–</span>

function AttachmentList({ items }: { items: Attachment[] }) {
  if (!items.length) return <Dash />
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={`${item.url}-${i}`}>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-gov-600 hover:underline inline-flex items-center gap-1.5"
          >
            <i className="fa-solid fa-paperclip text-[10px]" />
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

function AttachmentEditor({ items, onChange }: { items: Attachment[]; onChange: (next: Attachment[]) => void }) {
  const update = (i: number, patch: Partial<Attachment>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="space-y-1 p-1.5 border border-slate-200 rounded bg-white">
          <input
            type="text"
            value={item.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Nama berkas"
            className={INPUT}
          />
          <div className="flex items-center gap-1">
            <input
              type="url"
              value={item.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="https://..."
              className={INPUT}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Hapus data dukung"
              className="text-rose-500 hover:text-rose-700 p-1 text-xs"
            >
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { label: '', url: '' }])}
        className="text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded font-medium transition flex items-center gap-1"
      >
        <i className="fa-solid fa-plus" /> Tambah
      </button>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const pct = clampPercent(value)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right font-semibold text-slate-700">{pct}%</span>
    </div>
  )
}

/* ───────────────────────── Satu baris bulan ───────────────────────── */

interface MonthRowProps {
  month: MonevMonth
  onSave: (next: MonevMonth) => void
  onClear: () => void
}

function MonthRow({ month, onSave, onClear }: MonthRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<MonevMonth>(month)

  const data = isEditing ? draft : month
  const { aktivitas, output } = data

  const setAktivitas = (patch: Partial<MonevMonth['aktivitas']>) =>
    setDraft((prev) => ({ ...prev, aktivitas: { ...prev.aktivitas, ...patch } }))

  const setOutput = (patch: Partial<MonevMonth['output']>) =>
    setDraft((prev) => ({ ...prev, output: { ...prev.output, ...patch } }))

  const startEdit = () => {
    setDraft(month)
    setIsEditing(true)
  }

  const handleSave = () => {
    onSave(draft)
    setIsEditing(false)
  }

  const handleClear = () => {
    if (window.confirm(`Kosongkan seluruh isian bulan ${month.bulan}?`)) onClear()
  }

  return (
    <tr className={isEditing ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'}>
      <td className={`${CELL} font-semibold text-slate-800`}>{data.bulan}</td>

      {/* Progres aktivitas */}
      <td className={CELL}>
        {isEditing ? (
          <textarea rows={3} value={aktivitas.uraian} onChange={(e) => setAktivitas({ uraian: e.target.value })} className={INPUT} />
        ) : (
          aktivitas.uraian || <Dash />
        )}
      </td>
      <td className={CELL}>
        {isEditing ? (
          <textarea rows={3} value={aktivitas.kendala} onChange={(e) => setAktivitas({ kendala: e.target.value })} className={INPUT} />
        ) : (
          aktivitas.kendala || <Dash />
        )}
      </td>
      <td className={CELL}>
        {isEditing ? (
          <textarea rows={3} value={aktivitas.mitigasi} onChange={(e) => setAktivitas({ mitigasi: e.target.value })} className={INPUT} />
        ) : (
          aktivitas.mitigasi || <Dash />
        )}
      </td>
      <td className={CELL}>
        {isEditing ? (
          <AttachmentEditor items={aktivitas.dataDukung} onChange={(dataDukung) => setAktivitas({ dataDukung })} />
        ) : (
          <AttachmentList items={aktivitas.dataDukung} />
        )}
      </td>

      {/* Capaian output */}
      <td className={CELL}>
        {isEditing ? (
          <select value={output.jenis} onChange={(e) => setOutput({ jenis: e.target.value })} className={INPUT}>
            <option value="">– Pilih –</option>
            {JENIS_OUTPUT.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        ) : (
          output.jenis || <Dash />
        )}
      </td>
      <td className={CELL}>
        {isEditing ? (
          <input type="text" value={output.judul} onChange={(e) => setOutput({ judul: e.target.value })} className={INPUT} />
        ) : (
          output.judul || <Dash />
        )}
      </td>
      <td className={CELL}>
        {isEditing ? (
          <select value={output.status} onChange={(e) => setOutput({ status: e.target.value as OutputStatus })} className={INPUT}>
            {STATUS_OUTPUT.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-medium ${STATUS_STYLE[output.status]}`}>
            {output.status}
          </span>
        )}
      </td>
      <td className={CELL}>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={output.capaian}
              onChange={(e) => setOutput({ capaian: clampPercent(parseInt(e.target.value)) })}
              className={`${INPUT} text-center font-bold text-emerald-600`}
            />
            <span className="font-bold text-slate-600">%</span>
          </div>
        ) : (
          <ProgressBar value={output.capaian} />
        )}
      </td>
      <td className={CELL}>
        {isEditing ? (
          <AttachmentEditor items={output.dataDukung} onChange={(dataDukung) => setOutput({ dataDukung })} />
        ) : (
          <AttachmentList items={output.dataDukung} />
        )}
      </td>

      {/* Tindakan */}
      <td className="p-2.5 align-top no-print">
        <div className="flex flex-col gap-1.5">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="px-2 py-1 rounded bg-gov-700 hover:bg-gov-800 text-white text-[11px] font-semibold transition"
              >
                <i className="fa-solid fa-check mr-1" />
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 rounded bg-slate-300 hover:bg-slate-400 text-slate-700 text-[11px] font-semibold transition"
              >
                Batal
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="px-2 py-1 rounded bg-gov-600 hover:bg-gov-700 text-white text-[11px] font-medium transition"
              >
                <i className="fa-solid fa-pen mr-1" />
                Ubah
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 rounded bg-white hover:bg-red-50 text-red-600 border border-red-200 text-[11px] font-medium transition"
              >
                <i className="fa-solid fa-eraser mr-1" />
                Kosongkan
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

/* ───────────────────────── Main component ───────────────────────── */

export default function MonevRow({ initialData, onSave }: MonevRowProps) {
  const [rows, setRows] = useState<MonevMonth[]>(initialData)

  const commit = (index: number, next: MonevMonth) => {
    const updated = rows.map((r, i) => (i === index ? next : r))
    setRows(updated)
    onSave?.(updated)
  }

  const th = 'p-2.5 border-r'

  return (
    <div className={`${CARD} w-max-screen`}>
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
        <h3 className="font-bold text-slate-700 text-base">
          <i className="fa-solid fa-calendar-days mr-2 text-gov-600" />
          Log Progres Bulanan (Januari - Desember)
        </h3>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5"
        >
          <i className="fa-solid fa-print" /> Cetak Laporan
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table id="mainTable" className="w-full text-left text-xs border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-gov-700 text-white text-center font-semibold border-b border-gov-800">
              <th rowSpan={2} className="p-3 border-r border-gov-600 w-24">Bulan</th>
              <th colSpan={4} className="p-2.5 border-r border-gov-600 bg-gov-800 uppercase tracking-wider">
                Progres Aktivitas / Kegiatan
              </th>
              <th colSpan={5} className="p-2.5 border-r border-gov-600 bg-slate-800 uppercase tracking-wider">
                Progres Capaian Output
              </th>
              <th rowSpan={2} className="p-3 w-32 no-print">Tindakan</th>
            </tr>
            <tr className="bg-gov-600 text-white text-center font-medium">
              <th className={`${th} border-gov-500 min-w-[200px]`}>Uraian Kemajuan Aktivitas</th>
              <th className={`${th} border-gov-500 min-w-[150px]`}>Kendala Ditemui</th>
              <th className={`${th} border-gov-500 min-w-[150px]`}>Mitigasi / Rencana Tindak Lanjut</th>
              <th className={`${th} border-gov-500 min-w-[160px]`}>Data Dukung Progres</th>

              <th className={`${th} border-slate-700 min-w-[140px]`}>Jenis Output</th>
              <th className={`${th} border-slate-700 min-w-[160px]`}>Judul Output</th>
              <th className={`${th} border-slate-700 w-28`}>Status</th>
              <th className={`${th} border-slate-700 w-32`}>Capaian (%)</th>
              <th className={`${th} border-slate-700 min-w-[160px]`}>Data Dukung Output</th>
            </tr>
          </thead>

          <tbody id="tableBody" className="divide-y divide-slate-200">
            {rows.map((month, i) => (
              <MonthRow
                key={month.bulan}
                month={month}
                onSave={(next) => commit(i, next)}
                onClear={() => commit(i, emptyMonth(month.bulan))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}