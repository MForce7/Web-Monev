import { useState } from 'react'
import { emptyMonth } from '../../types/monev'
import MonthRow, { type MonthData } from './MonthRow'
import { PrintStyles, WRAP } from './shared'

export type { MonthData }

/** Lebar kolom (%), total 100; kolom terakhir (Tindakan) disembunyikan saat cetak */
const WIDTHS = [6, 12, 9, 9, 8, 8, 11, 10, 8, 8, 11]

const AKTIVITAS = ['Uraian Kemajuan Aktivitas', 'Kendala Ditemui', 'Mitigasi / Rencana Tindak Lanjut', 'Data Dukung Progres']
const OUTPUT = ['Jenis Output', 'Judul Output', 'Status', 'Capaian (%)', 'Data Dukung Output']

interface Props {
  initialData: MonthData[]
  onSave?(updatedData: MonthData[]): void
}

export default function MonthlyLogTable({ initialData, onSave }: Props) {
  const [rows, setRows] = useState(initialData)

  const commit = (i: number, next: MonthData) => {
    const updated = rows.map((r, idx) => (idx === i ? next : r))
    setRows(updated)
    onSave?.(updated)
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
      <PrintStyles />

      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-3 no-print">
        <h3 className="font-bold text-slate-700 text-base min-w-0">
          <i className="fa-solid fa-calendar-days mr-2 text-gov-600" /> Log Progres Bulanan (Januari - Desember)
        </h3>
        <button type="button" onClick={() => window.print()} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5 shrink-0">
          <i className="fa-solid fa-print" /> Cetak Laporan
        </button>
      </div>

      <table id="mainTable" className="w-full max-w-full table-fixed text-left text-[11px] border-collapse">
        <colgroup>
          {WIDTHS.map((w, i) => <col key={i} style={{ width: `${w}%` }} className={i === WIDTHS.length - 1 ? 'no-print' : undefined} />)}
        </colgroup>

        <thead>
          <tr className="bg-gov-700 text-white text-center font-semibold border-b border-gov-800">
            <th rowSpan={2} className={`p-2 border-r border-gov-600 ${WRAP}`}>Bulan</th>
            <th colSpan={AKTIVITAS.length} className="p-2 border-r border-gov-600 bg-gov-800 uppercase tracking-wider">Progres Aktivitas / Kegiatan</th>
            <th colSpan={OUTPUT.length} className="p-2 border-r border-gov-600 bg-slate-800 uppercase tracking-wider">Progres Capaian Output</th>
            <th rowSpan={2} className="p-2 no-print">Tindakan</th>
          </tr>
          <tr className="bg-gov-600 text-white text-center font-medium">
            {AKTIVITAS.map((l) => <th key={l} className={`p-1.5 border-r border-gov-500 ${WRAP}`}>{l}</th>)}
            {OUTPUT.map((l) => <th key={l} className={`p-1.5 border-r border-slate-700 ${WRAP}`}>{l}</th>)}
          </tr>
        </thead>

        <tbody id="tableBody">
          {rows.map((m, i) => (
            <MonthRow key={m.bulan} month={m} onSave={(next) => commit(i, next)} onClear={() => commit(i, emptyMonth(m.bulan))} />
          ))}
        </tbody>
      </table>
    </div>
  )
}