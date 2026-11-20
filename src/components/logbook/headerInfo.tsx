import { useEffect } from 'react'
import type { HeaderData } from '../../types/monev'
import { STATUS_PELAKSANAAN } from '../../types/monev'
import { KATEGORI_PENDANAAN, UNIT_PENGAMPU_DIFA, PROGRAM_SKEMA_PENDANAAN } from '../../lib/config'
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

/* ───────────────── Dropdown sederhana TANPA opsi "Lainnya" ───────────────── */

interface PresetOption {
  readonly value: string
  readonly label: string
}

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

/* ───────────────── Teks terkunci (dipakai saat pilihan dipaksa oleh field lain) ───────────────── */

function LockedField({ value }: { value: string }) {
  return (
    <span className="text-slate-800">
      {value}
      <span className="ml-2 text-xs text-slate-400">(terkunci)</span>
    </span>
  )
}

/* ───────────────────────── Baris info (dulu InfoRows.tsx) ───────────────────────── */

interface InfoRowsProps {
  data: HeaderData
  isEditing: boolean
  onChange: <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => void
}

export function InfoRows({ data, isEditing, onChange }: InfoRowsProps) {
  const kategori = data.kategoriPendanaan || 'Rupiah Murni'
  const isPnbp = kategori === 'PNBP'

  // Jaga konsistensi tiap kali masuk mode edit: PNBP -> Unit wajib ORPA, DFRI -> Program wajib SBKU
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isEditing) return
    if (isPnbp && data.unitPengampuDifa !== 'ORPA') {
      onChange('unitPengampuDifa', 'ORPA')
    }
  }, [isEditing, isPnbp])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isEditing) return
    if (data.unitPengampuDifa === 'DFRI' && data.programSkemaPendanaan !== 'SBKU') {
      onChange('programSkemaPendanaan', 'SBKU')
    }
  }, [isEditing, data.unitPengampuDifa])

  const handleKategoriChange = (v: string) => {
    onChange('kategoriPendanaan', v)
    if (v === 'PNBP') {
      onChange('unitPengampuDifa', 'ORPA')
      if (data.programSkemaPendanaan === 'SBKU') onChange('programSkemaPendanaan', '')
    }
  }

  const handleUnitChange = (v: string) => {
    onChange('unitPengampuDifa', v)
    if (v === 'DFRI') {
      onChange('programSkemaPendanaan', 'SBKU')
    } else if (data.programSkemaPendanaan === 'SBKU') {
      onChange('programSkemaPendanaan', '')
    }
  }

  return (
    <>
      <PlainSelect
        label="Kategori Pendanaan"
        value={kategori}
        options={KATEGORI_PENDANAAN}
        isEditing={isEditing}
        onChange={handleKategoriChange}
      />

      <Row label="Unit Pengampu DIFA">
        {isEditing ? (
          isPnbp ? (
            <LockedField value="ORPA (Organisasi Riset Penerbangan dan Antariksa)" />
          ) : (
            <select
              aria-label="Unit Pengampu DIFA"
              value={data.unitPengampuDifa || ''}
              onChange={(e) => handleUnitChange(e.target.value)}
              className={`w-full p-2 text-sm ${HEADER_INPUT}`}
            >
              <option value="" disabled>
                Pilih salah satu
              </option>
              {UNIT_PENGAMPU_DIFA.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )
        ) : (
          <span className={`text-slate-800 ${WRAP}`}>
            {UNIT_PENGAMPU_DIFA.find((o) => o.value === data.unitPengampuDifa)?.label ||
              data.unitPengampuDifa ||
              '-'}
          </span>
        )}
      </Row>

      <Row label="Program / Skema Pendanaan">
        {isEditing ? (
          data.unitPengampuDifa === 'DFRI' ? (
            <LockedField value="SBKU" />
          ) : (
            <select
              aria-label="Program / Skema Pendanaan"
              value={data.programSkemaPendanaan || ''}
              onChange={(e) => onChange('programSkemaPendanaan', e.target.value)}
              className={`w-full p-2 text-sm ${HEADER_INPUT}`}
            >
              <option value="" disabled>
                Pilih salah satu
              </option>
              {PROGRAM_SKEMA_PENDANAAN.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )
        ) : (
          <span className={`text-slate-800 ${WRAP}`}>
            {data.programSkemaPendanaan === 'SBKU'
              ? 'SBKU'
              : PROGRAM_SKEMA_PENDANAAN.find((o) => o.value === data.programSkemaPendanaan)?.label ||
                data.programSkemaPendanaan ||
                '-'}
          </span>
        )}
      </Row>

      {isPnbp ? (
        <>
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
      )}
    </>
  )
}