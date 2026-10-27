export const JENIS_OUTPUT = ['Purwarupa', 'Model', 'Publikasi', 'KI', 'Paten', 'Hak Cipta'] as const

const STATUS_PRODUK = ['Design', 'Manufakturing', 'Testing', 'FINISHED'] as const
const STATUS_PUBLIKASI = ['Design', 'Manufakturing', 'Testing', 'Drafting', 'Submitting', 'In-Review', 'Accepted', 'Published'] as const
const STATUS_KI = ['Pengembangan', 'Submitting', 'In-Review', 'Registered'] as const

const STATUS_BY_JENIS: Record<string, readonly string[]> = {
  Purwarupa: STATUS_PRODUK,
  Model: STATUS_PRODUK,
  Publikasi: STATUS_PUBLIKASI,
  KI: STATUS_KI,
  Paten: STATUS_KI,
  'Hak Cipta': STATUS_KI,
}

export const hasKeterangan = (jenis: string) => ['Purwarupa', 'Model'].includes(jenis)

/** Pertahankan status lama bila masih valid, kalau tidak ambil yang pertama */
export function defaultStatus(jenis: string, current: string): string {
  const list = STATUS_BY_JENIS[jenis]
  if (!list) return jenis ? current : ''
  return list.includes(current) ? current : list[0]
}

/** Status lama di luar daftar tetap ditampilkan agar tidak hilang */
export function statusOptions(jenis: string, current: string): string[] {
  const list = STATUS_BY_JENIS[jenis] ?? []
  return current && !list.includes(current) ? [current, ...list] : [...list]
}

const AWAL = 'bg-slate-100 text-slate-600 border-slate-300'
const PROSES = 'bg-amber-50 text-amber-700 border-amber-300'
const SELESAI = 'bg-emerald-50 text-emerald-700 border-emerald-300'
const TERLAMBAT = 'bg-red-50 text-red-700 border-red-300'

const STATUS_TONE: Record<string, string> = {
  'Belum Mulai': AWAL, Design: AWAL, Pengembangan: AWAL, Drafting: AWAL,
  Manufakturing: PROSES, Testing: PROSES, Submitting: PROSES, 'In-Review': PROSES, Berjalan: PROSES,
  FINISHED: SELESAI, Accepted: SELESAI, Published: SELESAI, Registered: SELESAI, Selesai: SELESAI,
  Terlambat: TERLAMBAT,
}
export const statusTone = (status: string) => STATUS_TONE[status] ?? AWAL