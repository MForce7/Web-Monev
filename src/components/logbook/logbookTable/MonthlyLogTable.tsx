import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyMonth } from '../../../types/monev'
import { updateMonthlyReport } from '../../../lib/supabaseLogbookData'
import MonthRow, { type MonthData } from './MonthRow'
import { PrintStyles, WRAP } from '../shared'

export type { MonthData }

/** Lebar minimum tiap kolom (px): Bulan, 4 kolom aktivitas, 5 kolom output, Tindakan */
const WIDTHS_PX = [88, 150, 120, 130, 100, 100, 130, 100, 80, 100, 100]
const TABLE_MIN_WIDTH = WIDTHS_PX.reduce((sum, w) => sum + w, 0)

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

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollState) : null
    observer?.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      observer?.disconnect()
    }
  }, [updateScrollState])

  const scrollByDirection = (direction: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: 'smooth' })
  }

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

      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center sm:gap-3 no-print">
        <h3 className="font-bold text-slate-700 text-sm sm:text-base min-w-0">
          <i className="fa-solid fa-calendar-days mr-2 text-gov-600" /> Log Progres Bulanan (Januari - Desember)
        </h3>
        <button type="button" onClick={() => window.print()} className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5 shrink-0">
          <i className="fa-solid fa-print" /> Cetak Laporan
        </button>
      </div>

      {/* Petunjuk geser, hanya muncul selama tabel masih bisa digeser ke kanan */}
      {canScrollRight && (
        <div className="flex items-center justify-center gap-2 bg-blue-50 border-b border-blue-100 px-3 py-1.5 text-[11px] font-medium text-blue-700 no-print">
          <span>Geser tabel ke kanan untuk melihat kolom lainnya</span>
          <i className="fa-solid fa-arrow-right animate-pulse" />
        </div>
      )}

      {saveError && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 break-words no-print">
          <i className="fa-solid fa-triangle-exclamation mr-1.5" />
          Gagal menyimpan: {saveError}
        </div>
      )}

      <div className="relative">
        {/* Bayangan tipis + tombol panah kiri */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-5 bg-gradient-to-r from-slate-500/25 to-transparent no-print">
            <button
              type="button"
              aria-label="Geser ke kiri"
              onClick={() => scrollByDirection(-1)}
              className="pointer-events-auto absolute left-0.5 top-16 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-300 transition hover:bg-white"
            >
              <i className="fa-solid fa-chevron-left text-[10px]" />
            </button>
          </div>
        )}

        {/* Bayangan tipis + tombol panah kanan */}
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-5 bg-gradient-to-l from-slate-500/25 to-transparent no-print">
            <button
              type="button"
              aria-label="Geser ke kanan"
              onClick={() => scrollByDirection(1)}
              className="pointer-events-auto absolute right-0.5 top-16 flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-blue-600/90 text-white shadow ring-1 ring-white transition hover:bg-blue-700"
            >
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-2 print:overflow-visible print:pb-0"
        >
          <table
            id="mainTable"
            style={{ minWidth: TABLE_MIN_WIDTH }}
            className="
              w-full table-fixed text-left text-[11px] border-collapse
              print:!min-w-0
              [&_td:first-child]:whitespace-nowrap
              [&_td:first-child]:[word-break:normal]
              [&_td:first-child]:[overflow-wrap:normal]
              [&_th:first-child]:whitespace-nowrap
              [&_th:first-child]:[word-break:normal]
              [&_th:first-child]:[overflow-wrap:normal]
              print:[&_td:first-child]:whitespace-normal
              print:[&_th:first-child]:whitespace-normal
            "
          >
            <colgroup>
              {WIDTHS_PX.map((w, i) => (
                <col key={i} style={{ width: `${w}px` }} className={i === WIDTHS_PX.length - 1 ? 'no-print' : undefined} />
              ))}
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