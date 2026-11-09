import type { EntriLogbook } from './validasiLogbook'

const KUNCI = 'monev:logbook'
type Simpanan = { aktif: string; logbook: EntriLogbook[] }

const baca = (): Simpanan | null => {
  try {
    const s = localStorage.getItem(KUNCI)
    return s ? (JSON.parse(s) as Simpanan) : null
  } catch {
    return null
  }
}

export function simpanLogbook(logbook: EntriLogbook[], aktif: string): boolean {
  try {
    localStorage.setItem(KUNCI, JSON.stringify({ aktif, logbook }))
    return true
  } catch {
    return false // penyimpanan penuh atau diblokir
  }
}

export const daftarLogbook = () => baca()?.logbook ?? []

export function pilihAktif(nama: string) {
  const s = baca()
  if (s) simpanLogbook(s.logbook, nama)
}

export function ambilLogbookAktif(): EntriLogbook | null {
  const s = baca()
  return s?.logbook.find((e) => e.header.namaKetua === s.aktif) ?? null
}

export function hapusLogbook() {
  localStorage.removeItem(KUNCI)
}