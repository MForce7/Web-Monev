export const JENIS_OUTPUT = ['Purwarupa', 'Model', 'Publikasi', 'KI', 'Paten', 'Hak Cipta'] as const

// Indikator output Purwarupa & Model
const PRODUK = ['Desain', 'Manufaktur', 'Pengujian/Selesai Uji']
// Indikator output Publikasi
const PUBLIKASI = ['Draf', 'Submitted', 'Under Review', 'Accepted', 'Published']
// Indikator output Kekayaan Intelektual (KI, Paten, Hak Cipta)
const KI = ['Draf', 'Submit Intipdaqu', 'Terdaftar DJKI', 'Granted/Diberi']

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

// Status TERAKHIR tiap jenis output = sudah 100% -> selalu hijau.
// Otomatis mengikuti daftar status di atas, jadi kalau daftarnya diubah, warna hijaunya ikut pindah.
const STATUS_TERAKHIR = Object.values(STATUS_BY_JENIS).map((list) => list[list.length - 1])

// Nama status lama tetap didaftarkan supaya data lama tetap berwarna
const STATUS_TONE: Record<string, string> = {
  ...tone(TONE.awal, ['Belum Mulai', 'Design', 'Desain', 'Pengembangan', 'Drafting', 'Draf']),
  ...tone(TONE.proses, [
    'Manufakturing', 'Manufaktur', 'Testing', 'Submitting', 'Submitted',
    'In-Review', 'Under Review', 'Accepted', 'Submit Intipdaqu', 'Terdaftar DJKI', 'Berjalan',
  ]),
  ...tone(TONE.selesai, ['FINISHED', 'Registered', 'Selesai', ...STATUS_TERAKHIR]),
  Terlambat: TONE.telat,
}

export const statusTone = (status: string) => STATUS_TONE[status] ?? TONE.awal







export const KATEGORI_PENDANAAN = [
  { value: 'RM', label: 'Rupiah Murni (RM)' },
  { value: 'PNBP', label: 'PNBP' },
] as const

export const SKEMA_MITRA_PROGRAM = [
  { value: 'ORPA', label: 'ORPA (Organisasi Riset Penerbangan dan Antariksa)' },
  { value: 'DFRI', label: 'DFRI (Deputi Bidang Fasilitasi Riset dan Inovasi)' },
  { value: 'RIIM', label: 'RIIM (Riset dan Inovasi untuk Indonesia Maju)' },
  { value: 'PRIS', label: 'PRIS (Program Riset Inovasi Substantif / Strategis)' },
] as const