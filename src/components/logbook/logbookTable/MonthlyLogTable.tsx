import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyMonth } from '../../../types/monev'
import { updateMonthlyReport } from '../../../lib/supabaseLogbookData'
import MonthRow, { type MonthData } from './MonthRow'
import { PrintStyles, WRAP } from '../shared'

export type { MonthData }

// Urutan kolom: Bulan | Uraian | Kendala | Mitigasi | Data Dukung Progres |
// Jenis | Judul | Status | Capaian | Data Dukung Output | Tindakan  (total 100)
const WIDTHS = [7, 13, 11, 11, 7, 8, 11, 9, 7, 6, 10]

const AKTIVITAS = ['Uraian Kemajuan Aktivitas', 'Kendala Ditemui', 'Mitigasi / Rencana Tindak Lanjut', 'Data Dukung Progres']
const OUTPUT = ['Jenis Output', 'Judul Output', 'Status', 'Capaian (%)', 'Data Dukung Output']

interface Props {
  /**
   * ID aktivitas pemilik log bulanan ini, dipakai untuk menyimpan ke Supabase.
   * Kosongkan untuk mode lokal (mis. pratinjau import): perubahan hanya ke tampilan, tidak dikirim ke server.
   */
  activityId?: string
  initialData: MonthData[]
  onSave?(updatedData: MonthData[]): void
}

export default function MonthlyLogTable({ activityId, initialData, onSave }: Props) {
  const [rows, setRows] = useState(initialData)
  const [savingIndex, setSavingIndex] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Bayangan petunjuk scroll horizontal
  const scrollRef = useRef<HTMLDivElement>(null)
  const [shadow, setShadow] = useState({ left: false, right: false })
  const scrollable = shadow.left || shadow.right

  const updateShadow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setShadow({
      left: el.scrollLeft > 1,
      right: el.scrollLeft < maxScroll - 1,
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateShadow()
    const ro = new ResizeObserver(updateShadow)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [updateShadow])

  const commit = async (i: number, next: MonthData) => {
    setSaveError(null)

    if (activityId) {
      setSavingIndex(i)
      try {
        await updateMonthlyReport(activityId, next)
      } catch (err) {
        setSaveError((err as Error).message)
        setSavingIndex(null)
        return // gagal simpan ke server -> jangan update tampilan, biar user tahu belum tersimpan
      }
      setSavingIndex(null)
    }

    const updated = rows.map((r, idx) => (idx === i ? next : r))
    setRows(updated)
    onSave?.(updated)
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
      <PrintStyles />

      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 no-print">
        <h3 className="font-bold text-slate-700 text-sm sm:text-base min-w-0">
          <i className="fa-solid fa-calendar-days mr-2 text-gov-600" /> Log Progres Bulanan (Januari - Desember)
        </h3>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto justify-center px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5 shrink-0"
        >
          <i className="fa-solid fa-print" /> Cetak Laporan
        </button>
      </div>

      {/* Petunjuk geser: hanya muncul kalau tabel memang melebihi lebar layar */}
      {scrollable && (
        <p className="px-3 py-1.5 text-[11px] text-slate-500 bg-slate-50 border-b border-slate-200 no-print">
          <i className="fa-solid fa-arrows-left-right mr-1.5" />
          Geser tabel ke samping untuk melihat semua kolom
        </p>
      )}

      {saveError && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 no-print">
          <i className="fa-solid fa-triangle-exclamation mr-1.5" />
          Gagal menyimpan: {saveError}
        </div>
      )}

      {/* Pembungkus relatif: bayangan diletakkan di atas area scroll, tidak ikut bergeser */}
      <div className="relative">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-6 sm:w-8 bg-gradient-to-r from-slate-900/25 to-transparent transition-opacity duration-200 no-print ${shadow.left ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-6 sm:w-8 bg-gradient-to-l from-slate-900/25 to-transparent transition-opacity duration-200 no-print ${shadow.right ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Di layar sempit tabel di-scroll ke samping, bukan dipadatkan sampai kata terpotong */}
        <div ref={scrollRef} onScroll={updateShadow} className="w-full overflow-x-auto overscroll-x-contain">
          <table
            id="mainTable"
            className="w-full min-w-[1200px] print:min-w-0 table-fixed text-left text-[11px] border-collapse"
          >
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
                <MonthRow
                  key={m.bulan}
                  month={m}
                  onSave={(next) => commit(i, next)}
                  onClear={() => commit(i, emptyMonth(m.bulan))}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {savingIndex !== null && (
        <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 no-print">
          <i className="fa-solid fa-spinner fa-spin mr-1.5" />
          Menyimpan {rows[savingIndex]?.bulan}...
        </div>
      )}
    </div>
  )
}