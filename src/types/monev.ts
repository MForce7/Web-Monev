/* ───────── Tipe & konstanta bersama untuk ActivityHeader dan MonevRow ───────── */

export interface TargetOutput {
  jenis: string
  jumlah: number
}

export interface HeaderData {
  namaKetua: string
  unitKerja: string
  satuanKerja: string
  judulAktivitas: string
  targetOutputs: TargetOutput[]
  progresTotal: number
  progresKeterangan: string
  statusPelaksanaan: string
  kategoriPendanaan: string
  skemaMitraProgram: string

  // Field khusus saat kategoriPendanaan === 'PNBP'
  judulKontrak: string
  targetPenerimaan: number
  targetPenggunaan: number
  banyakTermin: number
  statusKontrak: string
}

/** Daftar status baku untuk referensi/tampilan (mis. legenda warna). Status aktual per output BEBAS (string), lihat MonthOutput. */
export type OutputStatus = 'Belum Mulai' | 'Berjalan' | 'Selesai' | 'Terlambat'

export interface Attachment {
  label: string
  url: string
}

/**
 * Satu baris output dalam log bulanan.
 * `status` sengaja bertipe string bebas (bukan union OutputStatus) karena pilihan status
 * tergantung `jenis` output, ditentukan dinamis lewat statusOptions()/defaultStatus() di lib/config.
 * `keterangan` hanya relevan untuk jenis tertentu (mis. Purwarupa/Model), lihat hasKeterangan().
 */
export interface MonthOutput {
  jenis: string
  judul: string
  status: string
  capaian: number
  dataDukung: Attachment[]
  keterangan?: string
}

export interface MonevMonth {
  bulan: string
  aktivitas: {
    uraian: string
    kendala: string
    mitigasi: string
    dataDukung: Attachment[]
  }
  /** Output pertama/utama bulan ini */
  output: MonthOutput
  /** Output tambahan di bulan yang sama (opsional, ditambahkan lewat tombol "Tambah Output") */
  outputTambahan?: MonthOutput[]
}

export interface MonevData {
  header: HeaderData
  bulanan: MonevMonth[]
}

export interface MetricItem {
  title: string
  color?: string // hex, mis. "#5b21cd"; kalau kosong dipakai warna default
  target: number
  realisasi: number
}

export interface MetricsData {
  total: number
  items: MetricItem[]
}

/* ───────── Tipe untuk struktur multi-aktivitas per periset ───────── */

export interface PerisetInfo {
  id: string
  nama: string
  unitKerja: string
  satuanKerja: string
}

export interface ActivityEntry {
  id: string
  header: HeaderData
  bulanan: MonevMonth[]
}

/** Bentuk file JSON / respons API: satu periset, banyak aktivitas */
export interface PerisetData {
  periset: PerisetInfo
  activities: ActivityEntry[]
}

/** Header seperti tersimpan di file JSON — TANPA identitas periset (digabung belakangan) */
export type HeaderDataJson = Omit<HeaderData, 'namaKetua' | 'unitKerja' | 'satuanKerja'>

export interface ActivityEntryJson {
  id: string
  header: HeaderDataJson
  bulanan: MonevMonth[]
}

/** Bentuk file JSON mentah, sebelum identitas periset digabungkan ke tiap header */
export interface PerisetDataJson {
  periset: PerisetInfo
  activities: ActivityEntryJson[]
}

/* ───────── Konstanta ───────── */

export const JENIS_OUTPUT = [
  'Purwarupa',
  'Publikasi',
  'KI (Kekayaan Intelektual)',
  'Model',
  'Naskah Kebijakan',
] as const

export const STATUS_PELAKSANAAN = [
  'Perencanaan',
  'Pelaksanaan / Berjalan',
  'Selesai',
  'Terkendala',
] as const

export const STATUS_OUTPUT: OutputStatus[] = ['Belum Mulai', 'Berjalan', 'Selesai', 'Terlambat']

export const BULAN_URUT = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const

export const KATEGORI_PENDANAAN = [
  { value: 'Rupiah Murni', label: 'Rupiah Murni' },
  { value: 'PNBP', label: 'PNBP' },
] as const

/* ───────── Helper functions ───────── */

export const emptyMonth = (bulan: string): MonevMonth => ({
  bulan,
  aktivitas: { uraian: '', kendala: '', mitigasi: '', dataDukung: [] },
  output: { jenis: '', judul: '', status: '', capaian: 0, dataDukung: [], keterangan: '' },
})

/** Bantuan untuk membuat HeaderData kosong dengan default kategori pendanaan Rupiah Murni */
export const emptyHeaderData = (): HeaderData => ({
  namaKetua: '',
  unitKerja: '',
  satuanKerja: '',
  judulAktivitas: '',
  targetOutputs: [],
  progresTotal: 0,
  progresKeterangan: '',
  statusPelaksanaan: '',
  kategoriPendanaan: 'Rupiah Murni',
  skemaMitraProgram: '',
  judulKontrak: '',
  targetPenerimaan: 0,
  targetPenggunaan: 0,
  banyakTermin: 0,
  statusKontrak: '',
})

/** Satu aktivitas kosong baru (dipakai saat periset menambah aktivitas baru) */
export const emptyActivityEntry = (id: string): ActivityEntry => ({
  id,
  header: emptyHeaderData(),
  bulanan: BULAN_URUT.map((bulan) => emptyMonth(bulan)),
})

export const clampPercent = (n: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0))