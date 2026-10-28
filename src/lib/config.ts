export const JENIS_OUTPUT = ['Purwarupa', 'Model', 'Publikasi', 'KI', 'Paten', 'Hak Cipta'] as const

const PRODUK = ['Design', 'Manufakturing', 'Testing', 'FINISHED']
const PUBLIKASI = ['Design', 'Manufakturing', 'Testing', 'Drafting', 'Submitting', 'In-Review', 'Accepted', 'Published']
const KI = ['Pengembangan', 'Submitting', 'In-Review', 'Registered']

const STATUS_BY_JENIS: Record<string, string[]> = {
  Purwarupa: PRODUK, Model: PRODUK, Publikasi: PUBLIKASI, KI, Paten: KI, 'Hak Cipta': KI,
}

/** Hanya Purwarupa & Model yang punya kolom keterangan */
export const hasKeterangan = (jenis: string) => jenis === 'Purwarupa' || jenis === 'Model'

/** Saat jenis diganti: pertahankan status lama bila masih valid, kalau tidak ambil yang pertama */
export function defaultStatus(jenis: string, current: string) {
  const list = STATUS_BY_JENIS[jenis]
  if (!list) return jenis ? current : ''
  return list.includes(current) ? current : list[0]
}

/** Status lama di luar daftar tetap ditampilkan agar tidak hilang */
export function statusOptions(jenis: string, current: string) {
  const list = STATUS_BY_JENIS[jenis] ?? []
  return current && !list.includes(current) ? [current, ...list] : list
}

const TONE = {
  awal: 'bg-slate-100 text-slate-600 border-slate-300',
  proses: 'bg-amber-50 text-amber-700 border-amber-300',
  selesai: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  telat: 'bg-red-50 text-red-700 border-red-300',
}
const tone = (cls: string, names: string[]) => Object.fromEntries(names.map((n) => [n, cls]))

const STATUS_TONE: Record<string, string> = {
  ...tone(TONE.awal, ['Belum Mulai', 'Design', 'Pengembangan', 'Drafting']),
  ...tone(TONE.proses, ['Manufakturing', 'Testing', 'Submitting', 'In-Review', 'Berjalan']),
  ...tone(TONE.selesai, ['FINISHED', 'Accepted', 'Published', 'Registered', 'Selesai']),
  Terlambat: TONE.telat,
}

export const statusTone = (status: string) => STATUS_TONE[status] ?? TONE.awal