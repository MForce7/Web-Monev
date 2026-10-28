import type { HeaderData } from '../../types/monev'
import { HEADER_INPUT, Row } from './shared'

const LOCKED = [
  ['Nama Ketua', 'namaKetua'],
  ['Unit Kerja', 'unitKerja'],
  ['Satuan Kerja', 'satuanKerja'],
] as const

interface Props {
  data: HeaderData
  isEditing: boolean
  onChange: <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => void
}

export default function InfoRows({ data, isEditing, onChange }: Props) {
  return (
    <>
      {LOCKED.map(([label, key]) => (
        <Row key={key} label={label}>
          <span className={key === 'namaKetua' ? 'font-semibold text-slate-800' : 'text-slate-800'}>{data[key]}</span>
          {isEditing && <span className="text-[10px] text-slate-400 font-normal ml-2">(Terkunci)</span>}
        </Row>
      ))}

      <Row label="Judul Aktivitas">
        {isEditing ? (
          <input
            type="text"
            value={data.judulAktivitas}
            onChange={(e) => onChange('judulAktivitas', e.target.value)}
            className={`w-full p-2 text-sm ${HEADER_INPUT}`}
          />
        ) : (
          <span className="font-medium text-slate-800">{data.judulAktivitas}</span>
        )}
      </Row>
    </>
  )
}