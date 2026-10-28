import { useState, type ReactNode } from 'react'
import { clampPercent } from '../types/monev'
import { JENIS_OUTPUT } from './config'

export const WRAP = '[overflow-wrap:anywhere]'
const FOCUS = 'focus:ring-2 focus:ring-amber-500 focus:outline-none'
export const HEADER_INPUT = `min-w-0 p-1.5 border border-slate-300 rounded text-xs ${FOCUS}`
export const CELL_INPUT = `w-full min-w-0 p-1 border border-slate-300 rounded text-[11px] ${FOCUS}`

export const Dash = () => <span className="text-slate-400">–</span>

const PRINT_CSS = `@media print {
  @page { size: A4 landscape; margin: 8mm; }
  html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  #headerCard, #mainTable { width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
  #headerCard { margin-bottom: 4mm; break-inside: avoid; }
  #mainTable { table-layout: fixed; font-size: 8.5px; line-height: 1.25; }
  #mainTable th, #mainTable td { padding: 2px 3px !important; }
  #mainTable thead { display: table-header-group; }
  #mainTable tr { break-inside: avoid; }
}`
export const PrintStyles = () => <style>{PRINT_CSS}</style>

/** Baris label + isi di tabel header */
export function Row({ label, children, last, alignTop }: {
  label: string; children: ReactNode; last?: boolean; alignTop?: boolean
}) {
  return (
    <tr className={last ? '' : 'border-b border-slate-100'}>
      <td className={`w-[28%] py-2 px-4 font-medium text-slate-500 bg-slate-50/50 ${WRAP} ${alignTop ? 'align-top' : ''}`}>{label}</td>
      <td className={`min-w-0 py-2 px-4 ${WRAP}`}>{children}</td>
    </tr>
  )
}

/** Opsi jenis output; nilai lama yang tidak ada di daftar tetap muncul */
export function JenisOptions({ current }: { current: string }) {
  const legacy = current !== '' && !(JENIS_OUTPUT as readonly string[]).includes(current)
  return (
    <>
      {legacy && <option value={current}>{current} (lama)</option>}
      {JENIS_OUTPUT.map((j) => <option key={j} value={j}>{j}</option>)}
    </>
  )
}

/** Input 0–100: boleh kosong saat mengetik, nol di depan dibuang, maks 100, kosong → 0 saat blur */
export function PercentInput({ value, onChange, className }: {
  value: number; onChange: (next: number) => void; className?: string
}) {
  const [text, setText] = useState(String(clampPercent(value)))
  const [prev, setPrev] = useState(value)

  if (value !== prev) {
    setPrev(value)
    if ((text === '' ? 0 : Number(text)) !== value) setText(String(clampPercent(value)))
  }

  const handleChange = (raw: string) => {
    let digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    if (digits !== '' && Number(digits) > 100) digits = '100'
    const next = digits === '' ? 0 : Number(digits)
    setText(digits)
    setPrev(next)
    onChange(next)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => text === '' && setText('0')}
      className={className}
    />
  )
}