import { useState } from 'react'
import { idMasalah, type Masalah } from '../../lib/validasiLogbook'
import { bacaSelesai, simpanSelesai } from '../../lib/logbookStore'

/** Id masalah yang sudah ditandai selesai, tersimpan di localStorage lewat logbookStore. Panggil di komponen induk. */
export function useSelesai() {
  const [selesai, setSelesai] = useState<Set<string>>(() => bacaSelesai())
  const toggle = (id: string) =>
    setSelesai((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      simpanSelesai(next)
      return next
    })
  return { selesai, toggle }
}

interface Props {
  nama: string
  masalah: Masalah[]
  selesai: Set<string>
  onToggle(id: string): void
}

export default function DaftarMasalah({ nama, masalah, selesai, onToggle }: Props) {
  const [bukaSelesai, setBukaSelesai] = useState(false)
  if (!masalah.length) return null

  const item = masalah.map((m) => ({ m, id: idMasalah(nama, m) }))
  const belum = item.filter((x) => !selesai.has(x.id))
  const sudah = item.filter((x) => selesai.has(x.id))

  const baris = ({ m, id }: { m: Masalah; id: string }) => {
    const beres = selesai.has(id)
    const warna = m.level === 'galat' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'
    return (
      <li
        key={id}
        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] ${
          beres ? 'border-slate-200 bg-slate-50 text-slate-400' : warna
        }`}
      >
        <span className={`flex-1 whitespace-pre-line ${beres ? 'line-through' : ''}`}>{m.pesan}</span>
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={`shrink-0 rounded-full px-3 py-0.5 text-[10px] font-bold ${
            beres
              ? 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
              : 'border border-current bg-white/70 hover:bg-white'
          }`}
        >
          {beres ? 'Buka lagi' : '✓ Tandai selesai'}
        </button>
      </li>
    )
  }

  return (
    <div className="mt-2">
      <div className="mb-1 text-[11px] font-bold text-slate-600">
        {sudah.length} dari {item.length} selesai
        {belum.length === 0 && <span className="ml-2 text-emerald-600">✓ Semua beres</span>}
      </div>
      <ul className="space-y-1">{belum.map(baris)}</ul>

      {sudah.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setBukaSelesai((v) => !v)}
            className="text-[11px] font-semibold text-slate-500 underline"
          >
            {bukaSelesai ? 'Sembunyikan' : 'Tampilkan'} yang selesai ({sudah.length})
          </button>
          {bukaSelesai && <ul className="mt-1 space-y-1">{sudah.map(baris)}</ul>}
        </div>
      )}
    </div>
  )
}