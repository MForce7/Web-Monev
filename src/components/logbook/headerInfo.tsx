import { useState } from 'react'
import type { HeaderData } from '../../types/monev'
import { STATUS_PELAKSANAAN } from '../../types/monev'
import { KATEGORI_PENDANAAN, SKEMA_MITRA_PROGRAM } from '../../lib/config'
import { HEADER_INPUT, Row, WRAP } from './shared'

/* ───────────────────────── Bar judul (dulu HeaderBar.tsx) ───────────────────────── */

export function HeaderBar({ isEditing, onEdit }: { isEditing: boolean; onEdit: () => void }) {
  return (
    <div
      className={`px-6 py-3 font-semibold text-lg flex items-center justify-between gap-3 text-white ${
        isEditing ? 'bg-amber-600' : 'bg-gov-700'
      }`}
    >
      <span className={`min-w-0 ${WRAP}`}>
        <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-folder-open'} mr-2`} />
        {isEditing ? 'Edit Detail Aktivitas' : 'Detail Aktivitas & Progres Kegiatan'}
      </span>

      <div className="flex items-center gap-2 shrink-0 no-print">
        {isEditing ? (
          <span className="text-xs bg-amber-700 px-3 py-1 rounded-full text-amber-100">Mode Edit</span>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1 bg-gov-800 hover:bg-gov-900 border border-gov-500 rounded text-xs text-white transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-pen-to-square" /> Edit Detail
          </button>
        )}
      </div>
    </div>
  )
}

/* ───────────────── Dropdown dengan pilihan "Lainnya" + kolom isian ───────────────── */

interface PresetOption {
  readonly value: string // yang disimpan, contoh: "RM"
  readonly label: string // yang ditampilkan, contoh: "Rupiah Murni (RM)"
}

interface SelectWithOtherProps {
  label: string
  value: string
  options: readonly PresetOption[]
  otherLabel: string
  otherPlaceholder: string
  isEditing: boolean
  onChange: (value: string) => void
}

const OTHER = '__other__'

function SelectWithOther({
  label,
  value,
  options,
  otherLabel,
  otherPlaceholder,
  isEditing,
  onChange,
}: SelectWithOtherProps) {
  const preset = options.find((o) => o.value === value)

  // True saat user memilih "Lainnya" tapi kolomnya masih kosong
  const [otherMode, setOtherMode] = useState(false)

  // Nilai yang bukan salah satu pilihan baku dianggap isian "Lainnya"
  const isOther = otherMode || (value !== '' && !preset)
  const selectValue = isOther ? OTHER : (preset?.value ?? '')

  const handleSelect = (next: string) => {
    if (next === OTHER) {
      setOtherMode(true)
      if (preset) onChange('') // dari pilihan baku -> kosongkan agar user mengetik sendiri
      return
    }
    setOtherMode(false)
    onChange(next)
  }

  return (
    <Row label={label}>
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <select
            aria-label={label}
            value={selectValue}
            onChange={(e) => handleSelect(e.target.value)}
            className={`w-full p-2 text-sm ${HEADER_INPUT}`}
          >
            <option value="" disabled>
              Pilih salah satu
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            <option value={OTHER}>{otherLabel}</option>
          </select>

          {isOther && (
            <input
              type="text"
              aria-label={`${label} (isian lainnya)`}
              value={value}
              placeholder={otherPlaceholder}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full p-2 text-sm ${HEADER_INPUT}`}
            />
          )}
        </div>
      ) : (
        <span className={`text-slate-800 ${WRAP}`}>{(preset?.label ?? value) || '-'}</span>
      )}
    </Row>
  )
}

/* ───────────────── Dropdown sederhana TANPA opsi "Lainnya" ───────────────── */
/* Dipakai untuk Kategori Pendanaan: pilihannya memang dikunci hanya 2 opsi */

interface PlainSelectProps {
  label: string
  value: string
  options: readonly PresetOption[]
  isEditing: boolean
  onChange: (value: string) => void
}

function PlainSelect({ label, value, options, isEditing, onChange }: PlainSelectProps) {
  const current = options.find((o) => o.value === value)

  return (
    <Row label={label}>
      {isEditing ? (
        <select
          aria-label={label}
          value={current?.value ?? options[0]?.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-2 text-sm ${HEADER_INPUT}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <span className={`text-slate-800 ${WRAP}`}>{current?.label ?? value ?? '-'}</span>
      )}
    </Row>
  )
}

/* ───────────────────────── Baris info (dulu InfoRows.tsx) ───────────────────────── */

interface InfoRowsProps {
  data: HeaderData
  isEditing: boolean
  onChange: <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => void
}

export function InfoRows({ data, isEditing, onChange }: InfoRowsProps) {
  // Default aman kalau data lama belum punya field ini (string kosong dianggap Rupiah Murni)
  const kategori = data.kategoriPendanaan || 'Rupiah Murni'
  const isPnbp = kategori === 'PNBP'

  return (
    <>
      {/* KATEGORI PENDANAAN — hanya 2 opsi, default Rupiah Murni */}
      <PlainSelect
        label="Kategori Pendanaan"
        value={kategori}
        options={KATEGORI_PENDANAAN}
        isEditing={isEditing}
        onChange={(v) => onChange('kategoriPendanaan', v)}
      />

      {isPnbp ? (
        /* ───────────── Isian khusus PNBP ───────────── */
        <>
          <SelectWithOther
            key={`skema-pnbp-${isEditing}`}
            label="Skema Mitra Program"
            value={data.skemaMitraProgram}
            options={SKEMA_MITRA_PROGRAM}
            otherLabel="Mitra External / Lainnya"
            otherPlaceholder="Tulis nama mitra / skema lainnya"
            isEditing={isEditing}
            onChange={(v) => onChange('skemaMitraProgram', v)}
          />

          <Row label="Judul Kontrak">
            {isEditing ? (
              <input
                type="text"
                aria-label="Judul Kontrak"
                value={data.judulKontrak}
                onChange={(e) => onChange('judulKontrak', e.target.value)}
                className={`w-full p-2 text-sm ${HEADER_INPUT}`}
              />
            ) : (
              <span className={`font-medium text-slate-800 ${WRAP}`}>{data.judulKontrak || '-'}</span>
            )}
          </Row>

          <Row label="Target Penerimaan">
            {isEditing ? (
              <input
                type="number"
                min={0}
                aria-label="Target Penerimaan"
                value={data.targetPenerimaan}
                onChange={(e) => onChange('targetPenerimaan', Number(e.target.value))}
                className={`w-full p-2 text-sm ${HEADER_INPUT}`}
              />
            ) : (
              <span className={`text-slate-800 ${WRAP}`}>
                Rp {Number(data.targetPenerimaan || 0).toLocaleString('id-ID')}
              </span>
            )}
          </Row>

          <Row label="Target Penggunaan">
            {isEditing ? (
              <input
                type="number"
                min={0}
                aria-label="Target Penggunaan"
                value={data.targetPenggunaan}
                onChange={(e) => onChange('targetPenggunaan', Number(e.target.value))}
                className={`w-full p-2 text-sm ${HEADER_INPUT}`}
              />
            ) : (
              <span className={`text-slate-800 ${WRAP}`}>
                Rp {Number(data.targetPenggunaan || 0).toLocaleString('id-ID')}
              </span>
            )}
          </Row>

          <Row label="Banyak Termin">
            {isEditing ? (
              <input
                type="number"
                min={0}
                step={1}
                aria-label="Banyak Termin"
                value={data.banyakTermin}
                onChange={(e) => onChange('banyakTermin', Number(e.target.value))}
                className={`w-full p-2 text-sm ${HEADER_INPUT}`}
              />
            ) : (
              <span className={`text-slate-800 ${WRAP}`}>{data.banyakTermin ?? 0} termin</span>
            )}
          </Row>

          <Row label="Status">
            {isEditing ? (
              <select
                aria-label="Status"
                value={data.statusKontrak}
                onChange={(e) => onChange('statusKontrak', e.target.value)}
                className={`w-full p-2 text-sm ${HEADER_INPUT}`}
              >
                <option value="" disabled>
                  Pilih status
                </option>
                {STATUS_PELAKSANAAN.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-slate-800 ${WRAP}`}>{data.statusKontrak || '-'}</span>
            )}
          </Row>
        </>
      ) : (
        /* ───────────── Isian default (Rupiah Murni) ───────────── */
        <>
          <SelectWithOther
            key={`skema-rm-${isEditing}`}
            label="Skema Mitra Program"
            value={data.skemaMitraProgram}
            options={SKEMA_MITRA_PROGRAM}
            otherLabel="Mitra External / Lainnya"
            otherPlaceholder="Tulis nama mitra / skema lainnya"
            isEditing={isEditing}
            onChange={(v) => onChange('skemaMitraProgram', v)}
          />

          <Row label="Judul">
            {isEditing ? (
              <input
                type="text"
                aria-label="Judul"
                value={data.judulAktivitas}
                onChange={(e) => onChange('judulAktivitas', e.target.value)}
                className={`w-full p-2 text-sm ${HEADER_INPUT}`}
              />
            ) : (
              <span className={`font-medium text-slate-800 ${WRAP}`}>{data.judulAktivitas || '-'}</span>
            )}
          </Row>
        </>
      )}
    </>
  )
}