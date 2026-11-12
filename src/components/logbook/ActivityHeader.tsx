import { useState } from 'react'
import type { HeaderData, TargetOutput } from '../../types/monev'
import { JENIS_OUTPUT } from '../../lib/config'
import { InfoRows } from './headerInfo'
import { nextFreeJenis } from '../../lib/outputOptions'
import Safe from './Safe'
import TargetProgressRows from './TargetProgressRows'
import MonthlyLogTable, { type MonthData } from './logbookTable/MonthlyLogTable'
import { emptyMonth } from '../../types/monev'

/** Urutan nama bulan Januari s.d. Desember */
const BULAN_URUT = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** Bangun 12 baris kosong (Jan–Des) sebagai fallback kalau parent tidak mengirim data */
function buildDefaultMonths(): MonthData[] {
  return BULAN_URUT.map((bulan) => emptyMonth(bulan))
}

interface Props {
  activityId: string
  initialData: HeaderData
  onSave?: (updatedData: HeaderData) => void | Promise<void>
  initialMonthlyData?: MonthData[]
  onMonthlySave?: (updatedData: MonthData[]) => void
}

export default function ActivityHeader({
  activityId,
  initialData,
  onSave,
  initialMonthlyData,
  onMonthlySave
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(initialData)
  const [draft, setDraft] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const data = isEditing ? draft : saved

  // Fallback: kalau parent tidak kirim data bulanan, pakai 12 bulan kosong
  const monthlyData =
    initialMonthlyData && initialMonthlyData.length > 0
      ? initialMonthlyData
      : buildDefaultMonths()

  // Mengubah field informasi utama
  const setField = <K extends keyof HeaderData>(
    field: K,
    value: HeaderData[K]
  ) => {
    setDraft((p) => ({ ...p, [field]: value }))
  }

  // Mengelola daftar target output
  const setOutputs = (
    fn: (list: TargetOutput[]) => TargetOutput[]
  ) => {
    setDraft((p) => ({
      ...p,
      targetOutputs: fn(p.targetOutputs)
    }))
  }

  const setOutput = (
    i: number,
    patch: Partial<TargetOutput>
  ) => {
    setOutputs((list) =>
      list.map((output, idx) =>
        idx === i ? { ...output, ...patch } : output
      )
    )
  }

  const addOutput = () => {
    setOutputs((list) => {
      const next = nextFreeJenis(JENIS_OUTPUT, list)

      return next
        ? [...list, { jenis: next, jumlah: 1 }]
        : list
    })
  }

  const removeOutput = (i: number) => {
    setOutputs((list) =>
      list.filter((_, idx) => idx !== i)
    )
  }

  // Kontrol mode edit
  const startEdit = () => {
    setDraft(saved)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(saved)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave?.(draft)
      setSaved(draft)
      setIsEditing(false)
    } catch (err) {
      setSaveError((err as Error).message)
      // tetap di mode edit, draft tidak hilang, supaya user bisa coba simpan lagi
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      id="headerCard"
      className={`
        w-full mx-auto min-w-0
        bg-white rounded-xl sm:rounded-2xl shadow-xl
        overflow-hidden border transition-all duration-300
        ${isEditing
          ? 'border-orange-300 shadow-orange-100'
          : 'border-slate-200'
        }
      `}
    >
      {/* HEADER BIRU TUA */}
      <div className={`
        px-4 sm:px-6 py-4
        flex flex-col sm:flex-row
        items-stretch sm:items-center
        justify-between gap-3
        text-white transition-colors duration-300
        ${isEditing ? 'bg-orange-700' : 'bg-[#1e3a8a]'}
      `}>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold tracking-wide">
            Detail Aktivitas & Progres Kegiatan
          </h2>

          <p className="text-blue-200 text-xs mt-1">
            Informasi aktivitas dan capaian program mitra
          </p>
        </div>

        {saveError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <i className="fa-solid fa-triangle-exclamation mr-1.5" />
            Gagal menyimpan: {saveError}
          </div>
        )}

        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className="
              w-full sm:w-auto justify-center shrink-0
              bg-blue-600 hover:bg-blue-700
              text-white font-medium
              px-5 py-2 rounded-xl
              text-sm shadow-md transition-all
              duration-200 border border-blue-400/30
              flex items-center gap-2
            "
          >
            <i className="fa-solid fa-pen-to-square" />
            Edit Detail
          </button>
        )}

        {isEditing && (
          <span className="
            self-start sm:self-auto shrink-0
            px-3 py-1.5 rounded-lg
            bg-orange-400/20 text-orange-100
            border border-orange-200/40
            text-xs font-semibold
          ">
            <i className="fa-solid fa-pen mr-1.5" />
            Mode Pengeditan
          </span>
        )}
      </div>

      {/* KONTEN UTAMA */}
      <div
        className={`
          p-3 sm:p-6 lg:p-8
          space-y-5 sm:space-y-6 transition-colors duration-300
          ${isEditing ? 'bg-orange-50/50' : 'bg-white'}
        `}
      >
        {/* INFORMASI AKTIVITAS DAN TARGET OUTPUT */}
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed text-sm border-collapse">
            <tbody>
              {/* INFORMASI UMUM */}
              <Safe name="InfoRows" row>
                <InfoRows
                  data={data}
                  isEditing={isEditing}
                  onChange={setField}
                />
              </Safe>

              {/* TARGET OUTPUT DAN PROGRES */}
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
        </div>

        {/* TOMBOL AKSI EDIT */}
        {isEditing && (
          <div className="
            pt-5 border-t border-slate-200
            flex flex-col-reverse sm:flex-row
            justify-end gap-3 no-print
          ">
            <button
              type="button"
              onClick={cancelEdit}
              className="
                w-full sm:w-auto
                px-5 py-2.5
                bg-slate-200 hover:bg-slate-300
                text-slate-700 rounded-xl
                text-sm font-semibold
                transition-all
              "
            >
              <i className="fa-solid fa-xmark mr-1.5" />
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="
                w-full sm:w-auto
                px-5 py-2.5
                bg-[#1e3a8a] hover:bg-blue-900
                text-white rounded-xl
                text-sm font-semibold shadow-md
                transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-check'} mr-1.5`} />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}

        {/* LOG PROGRES BULANAN */}
        <div className="bg-slate-100/80 border border-slate-200 rounded-xl sm:rounded-2xl p-2 sm:p-4">
          <div className="w-full min-w-0">
            <MonthlyLogTable
              activityId={activityId}
              initialData={monthlyData}
              onSave={onMonthlySave}
            />
          </div>
        </div>
      </div>
    </div>
  )
}