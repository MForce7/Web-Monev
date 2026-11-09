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
  initialData: HeaderData
  onSave?: (updatedData: HeaderData) => void

  initialMonthlyData?: MonthData[]
  onMonthlySave?: (updatedData: MonthData[]) => void
}

export default function ActivityHeader({
  initialData,
  onSave,
  initialMonthlyData,
  onMonthlySave
}: Props) {

  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(initialData)
  const [draft, setDraft] = useState(initialData)

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

  const handleSave = () => {
    setSaved(draft)
    setIsEditing(false)
    onSave?.(draft)
  }

  return (
    <div
      id="headerCard"
      className={`
        w-full mx-auto min-w-0
        bg-white rounded-2xl shadow-xl
        overflow-hidden border transition-all duration-300
        ${isEditing
          ? 'border-orange-300 shadow-orange-100'
          : 'border-slate-200'
        }
      `}
    >
      {/* HEADER BIRU TUA */}
      <div className={`
        px-5 sm:px-6 py-4
        flex flex-col sm:flex-row
        items-start sm:items-center
        justify-between gap-3
        text-white transition-colors duration-300
        ${isEditing ? 'bg-orange-700' : 'bg-[#1e3a8a]'}
      `}>
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-wide">
            Detail Aktivitas & Progres Kegiatan
          </h2>

          <p className="text-blue-200 text-xs mt-1">
            Informasi aktivitas dan capaian program mitra
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className="
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
          p-4 sm:p-6 md:p-8
          space-y-6 transition-colors duration-300
          ${isEditing ? 'bg-orange-50/50' : 'bg-white'}
        `}
      >
        {/* INFORMASI AKTIVITAS DAN TARGET OUTPUT */}
        <div className="w-full overflow-x-auto">
          <table className="
            w-full min-w-[320px]
            table-fixed text-sm
            border-collapse
          ">
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
            mt-6 pt-5 border-t border-slate-200
            flex flex-col-reverse sm:flex-row
            justify-end gap-3 no-print
          ">
            <button
              type="button"
              onClick={cancelEdit}
              className="
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
              className="
                px-5 py-2.5
                bg-[#1e3a8a] hover:bg-blue-900
                text-white rounded-xl
                text-sm font-semibold shadow-md
                transition-all
              "
            >
              <i className="fa-solid fa-check mr-1.5" />
              Simpan Perubahan
            </button>
          </div>
        )}

        {/* AREA TAMBAHAN / INFORMASI PENDUKUNG */}
        <div className="
          bg-slate-100/80
          border border-slate-200
          rounded-2xl
          min-h-25
          p-5
        ">

          {/* LOG PROGRES BULANAN */}
          <div className="w-full min-w-0 mt-6">
            <MonthlyLogTable
              initialData={monthlyData}
              onSave={onMonthlySave}
              isEditing={isEditing}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
