// import { supabase } from './supabase'
// import { periksaIsi } from '../components/dashboard_2/pemantauan/periksaIsi'
// import { BULAN, type BarisPantau, type Sel } from '../components/dashboard_2/pemantauan/types'

// interface SupportFileKategoriRow {
//   kategori: 'aktivitas' | 'output'
// }

// interface MonthlyReportRow {
//   bulan: number
//   uraian: string | null
//   kendala: string | null
//   mitigasi: string | null
//   output_jenis: string | null
//   output_judul: string | null
//   output_status: string | null
//   output_capaian: number | null
//   support_files: SupportFileKategoriRow[] | null
// }

// interface ActivityRow {
//   id: string
//   nama_ketua: string | null
//   unit_kerja: string | null
//   monthly_reports: MonthlyReportRow[] | null
// }

// const SELECT_QUERY = `
//   id, nama_ketua, unit_kerja,
//   monthly_reports (
//     bulan, uraian, kendala, mitigasi,
//     output_jenis, output_judul, output_status, output_capaian,
//     support_files ( kategori )
//   )
// `

// /** Cek apakah ada file dukung dengan kategori tertentu di satu baris monthly_report. */
// function adaFile(files: SupportFileKategoriRow[] | null, kategori: 'aktivitas' | 'output'): boolean {
//   return !!files?.some((f) => f.kategori === kategori)
// }

// /**
//  * Ubah satu baris monthly_reports menjadi objek "isi" yang dikenali periksaIsi(),
//  * dengan nama kunci persis sama seperti KOLOM_WAJIB di periksaIsi.ts.
//  */
// function toIsi(row: MonthlyReportRow | undefined): Partial<Record<string, string | number | null>> | undefined {
//   if (!row) return undefined

//   return {
//     'Uraian Kemajuan Aktivitas': row.uraian,
//     'Kendala Ditemui': row.kendala,
//     'Mitigasi / Rencana Tindak Lanjut': row.mitigasi,
//     'Data Dukung Progres': adaFile(row.support_files, 'aktivitas') ? 'ada' : '',
//     'Jenis Output': row.output_jenis,
//     'Judul Output': row.output_judul,
//     'Status': row.output_status,
//     'Presentase Progress (%)': row.output_capaian,
//     'Output Data Dukung': adaFile(row.support_files, 'output') ? 'ada' : '',
//   }
// }

// function toBarisPantau(row: ActivityRow): BarisPantau {
//   const byBulan = new Map((row.monthly_reports ?? []).map((m) => [m.bulan, m]))

//   const bulan: Record<string, Sel> = {}
//   BULAN.forEach((namaBulan, idx) => {
//     bulan[namaBulan] = periksaIsi(toIsi(byBulan.get(idx + 1)))
//   })

//   return {
//     id: row.id,
//     nama: row.nama_ketua ?? '',
//     pusatRiset: row.unit_kerja ?? '',
//     bulan,
//   }
// }

// /**
//  * Ambil data pemantauan pengisian logbook untuk seluruh aktivitas yang ada.
//  * Satu baris = satu aktivitas (bukan satu periset), karena satu periset bisa
//  * punya beberapa aktivitas dengan logbook bulanan masing-masing.
//  * Dipakai oleh TabelPemantauan (khusus admin).
//  */
// export async function fetchPemantauanData(): Promise<BarisPantau[]> {
//   const { data, error } = await supabase
//     .from('activities')
//     .select(SELECT_QUERY)
//     .order('nama_ketua', { ascending: true })

//   if (error) throw new Error(error.message)

//   const rows = (data ?? []) as unknown as ActivityRow[]
//   return rows.map(toBarisPantau)
// }




import { supabase } from './supabase'
import type { BarisPantau } from '../components/dashboard_2/pemantauan/types'

/**
 * Ambil status pemantauan pengisian logbook lewat edge function "pemantauan-status".
 *
 * Kenapa lewat edge function, bukan query tabel langsung dari client:
 * - Edge function jalan dengan service role di server, jadi tidak perlu RLS tambahan
 *   yang membuka akses baca penuh tabel activities/monthly_reports/support_files
 *   untuk semua user.
 * - Yang dikirim balik ke client HANYA status per bulan (Lengkap/Belum Lengkap/Kosong
 *   + daftar kolom yang masih kosong), bukan isi asli logbook (uraian, kendala,
 *   mitigasi, dll). Jadi walau dibuka untuk semua user yang login (bukan cuma admin),
 *   isi detail logbook orang lain tetap tidak ikut terkirim.
 * - Boleh dipanggil siapa saja yang sedang login (tidak dibatasi role admin), karena
 *   tabel pemantauan ini memang untuk dilihat semua user.
 */
export async function fetchPemantauanData(): Promise<BarisPantau[]> {
  const { data, error } = await supabase.functions.invoke('pemantauan-status')

  if (error) {
    let pesan = error.message || 'Gagal memuat data pemantauan.'

    if ('context' in error && error.context instanceof Response) {
      try {
        const body = await error.context.clone().json()
        pesan = body?.error || body?.message || pesan
      } catch {
        // Respons bukan JSON atau tidak dapat dibaca
      }
    }

    throw new Error(pesan)
  }

  if (data?.error) throw new Error(data.error)

  return (data?.data ?? []) as BarisPantau[]
}