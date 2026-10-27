import { STATUS_PELAKSANAAN, clampPercent, type HeaderData, type TargetOutput } from '../../types/monev'
import { HEADER_INPUT, JenisOptions, PercentInput, Row, WRAP } from './shared'

interface Props {
  data: HeaderData
  isEditing: boolean
  onChange: <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => void
  onOutputChange: (index: number, patch: Partial<TargetOutput>) => void
  onOutputAdd: () => void
  onOutputRemove: (index: number) => void
}

export default function TargetProgressRows({ data, isEditing, onChange, onOutputChange, onOutputAdd, onOutputRemove }: Props) {
  const outputs = data.targetOutputs

  return (
    <>
      {/* Target Output Utama */}
      <Row label="Target Output Utama" alignTop>
        {isEditing ? (
          <div>
            <div className="space-y-2">
              {outputs.map((o, i) => (
                <div key={i} className="flex items-center gap-2 min-w-0">
                  <select value={o.jenis} onChange={(e) => onOutputChange(i, { jenis: e.target.value })} className={`flex-1 ${HEADER_INPUT}`}>
                    <JenisOptions current={o.jenis} />
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={o.jumlah}
                    onChange={(e) => onOutputChange(i, { jumlah: parseInt(e.target.value) || 1 })}
                    className={`w-20 shrink-0 text-center ${HEADER_INPUT}`}
                  />
                  <span className="text-xs text-slate-500 shrink-0">buah</span>
                  {outputs.length > 1 && (
                    <button type="button" onClick={() => onOutputRemove(i)} aria-label="Hapus target output" className="text-rose-500 hover:text-rose-700 p-1 text-xs shrink-0">
                      <i className="fa-solid fa-trash" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onOutputAdd}
              className="mt-2 text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded font-medium transition flex items-center gap-1"
            >
              <i className="fa-solid fa-plus" /> Tambah Target Output
            </button>
          </div>
        ) : (
          <table className="w-full max-w-lg table-fixed text-xs border border-slate-200 rounded-md overflow-hidden">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600">
                <th className="p-2 text-left">Jenis Output</th>
                <th className="p-2 text-center w-28">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {outputs.map((o, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className={`p-2 font-medium text-slate-700 ${WRAP}`}>{o.jenis}</td>
                  <td className="p-2 text-center font-semibold text-slate-800">{o.jumlah} buah</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Row>

      {/* Progres Total Aktivitas */}
      <Row label="Progres Total Aktivitas">
        {isEditing ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <PercentInput
                value={data.progresTotal}
                onChange={(n) => onChange('progresTotal', n)}
                className={`w-20 text-sm text-center font-bold text-emerald-600 ${HEADER_INPUT}`}
              />
              <span className="font-bold text-slate-600">%</span>
            </div>
            <input
              type="text"
              value={data.progresKeterangan}
              onChange={(e) => onChange('progresKeterangan', e.target.value)}
              placeholder="Keterangan progres..."
              className={`flex-1 ${HEADER_INPUT}`}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${clampPercent(data.progresTotal)}%` }} />
            </div>
            <span className={`min-w-0 font-semibold text-emerald-600 ${WRAP}`}>
              {data.progresTotal}% <span className="font-normal text-slate-500 text-xs">({data.progresKeterangan})</span>
            </span>
          </div>
        )}
      </Row>

      {/* Status Pelaksanaan */}
      <Row label="Status Pelaksanaan" last>
        {isEditing ? (
          <select value={data.statusPelaksanaan} onChange={(e) => onChange('statusPelaksanaan', e.target.value)} className={`max-w-full p-2 ${HEADER_INPUT}`}>
            {STATUS_PELAKSANAAN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">{data.statusPelaksanaan}</span>
        )}
      </Row>
    </>
  )
}