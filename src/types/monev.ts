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
}

export type OutputStatus = 'Belum Mulai' | 'Berjalan' | 'Selesai' | 'Terlambat'

export interface Attachment {
  label: string
  url: string
}

export interface MonevMonth {
  bulan: string
  aktivitas: {
    uraian: string
    kendala: string
    mitigasi: string
    dataDukung: Attachment[]
  }
  output: {
    jenis: string
    judul: string
    status: OutputStatus
    capaian: number
    dataDukung: Attachment[]
  }
}

export interface MonevData {
  header: HeaderData
  bulanan: MonevMonth[]
}

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

export const emptyMonth = (bulan: string): MonevMonth => ({
  bulan,
  aktivitas: { uraian: '', kendala: '', mitigasi: '', dataDukung: [] },
  output: { jenis: '', judul: '', status: 'Belum Mulai', capaian: 0, dataDukung: [] },
})

export const clampPercent = (n: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0))