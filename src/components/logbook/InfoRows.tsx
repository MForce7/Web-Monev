import type { HeaderData } from '../../types/monev'
import { HEADER_INPUT, Row } from './shared'

function LockedRow({ label, value, bold = false, editing }: {
  label: string
  value: string
  bold?: boolean
  editing: boolean
}) {
  return (
    <Row label={label}>
      <span className={bold ? 'font-semibold text-slate-800' : 'text-slate-800'}>{value}</span>
      {editing && <span className="text-[10px] text-slate-400 font-normal ml-2">(Terkunci)</span>}
    </Row>
  )
}

interface Props {
  data: HeaderData
  isEditing: boolean
  onChange: <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => void
}

export default function InfoRows({ data, isEditing, onChange }: Props) {
  return (
    <>
      <LockedRow label="Nama Ketua" value={data.namaKetua} bold editing={isEditing} />
      <LockedRow label="Unit Kerja" value={data.unitKerja} editing={isEditing} />
      <LockedRow label="Satuan Kerja" value={data.satuanKerja} editing={isEditing} />

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