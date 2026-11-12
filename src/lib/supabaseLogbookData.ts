// import { BULAN_URUT, clampPercent } from '../types/monev'
import { supabase } from './supabase'
import type { MonthData } from '../components/logbook/logbookTable/MonthlyLogTable'

import {
  BULAN_URUT,
  clampPercent,
  emptyMonth,
  type ActivityEntry,
  type Attachment,
  type HeaderData,
  type MonevMonth,
} from '../types/monev'

export interface ProfileInfo {
  id: string
  fullName: string
  unitKerja: string
  satuanKerja: string
  role: string
  avatarFileId: string | null
}

interface SupportFileRow {
  kategori: 'aktivitas' | 'output'
  label: string
  url: string | null
  storage_path: string | null
}

interface MonthlyReportRow {
  bulan: number
  uraian: string
  kendala: string
  mitigasi: string
  output_jenis: string
  output_judul: string
  output_status: string
  output_capaian: number
  support_files: SupportFileRow[] | null
}

interface TargetOutputRow {
  jenis: string
  jumlah: number
}

interface ActivityRow {
  id: string
  nama_ketua: string
  unit_kerja: string
  satuan_kerja: string
  judul_aktivitas: string
  progres_total: number
  progres_keterangan: string
  status_pelaksanaan: string
  kategori_pendanaan: string
  skema_mitra_program: string
  judul_kontrak: string
  target_penerimaan: number
  target_penggunaan: number
  banyak_termin: number
  status_kontrak: string
  target_outputs: TargetOutputRow[] | null
  monthly_reports: MonthlyReportRow[] | null
}

interface ProfileRow {
  id: string
  full_name: string | null
  unit_kerja: string | null
  satuan_kerja: string | null
  role: string | null
  avatar_file_id: string | null
  activities: ActivityRow[] | null
}

const SELECT_QUERY = `
  id, full_name, unit_kerja, satuan_kerja, role, avatar_file_id,
  activities (
    id, nama_ketua, unit_kerja, satuan_kerja, judul_aktivitas,
    progres_total, progres_keterangan, status_pelaksanaan,
    kategori_pendanaan, skema_mitra_program, judul_kontrak,
    target_penerimaan, target_penggunaan, banyak_termin, status_kontrak,
    target_outputs ( jenis, jumlah ),
    monthly_reports (
      bulan, uraian, kendala, mitigasi,
      output_jenis, output_judul, output_status, output_capaian,
      support_files ( kategori, label, url, storage_path )
    )
  )
`


/**
 * Update header satu aktivitas (tabel activities) + sinkronkan target_outputs-nya.
 * Dipakai saat user klik "Simpan Perubahan" di ActivityHeader.
 */
export async function updateActivityHeaderInDb(activityId: string, header: HeaderData): Promise<void> {
  const { error: headerError } = await supabase
    .from('activities')
    .update({
      nama_ketua: header.namaKetua,
      unit_kerja: header.unitKerja,
      satuan_kerja: header.satuanKerja,
      judul_aktivitas: header.judulAktivitas,
      progres_total: clampPercent(header.progresTotal),
      progres_keterangan: header.progresKeterangan,
      status_pelaksanaan: header.statusPelaksanaan,
      kategori_pendanaan: header.kategoriPendanaan,
      skema_mitra_program: header.skemaMitraProgram,
      judul_kontrak: header.judulKontrak,
      target_penerimaan: header.targetPenerimaan,
      target_penggunaan: header.targetPenggunaan,
      banyak_termin: header.banyakTermin,
      status_kontrak: header.statusKontrak,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)

  if (headerError) throw new Error(headerError.message)

  // Sinkronkan target_outputs: hapus semua baris lama, insert ulang yang sekarang ada
  const { error: deleteError } = await supabase
    .from('target_outputs')
    .delete()
    .eq('activity_id', activityId)

  if (deleteError) throw new Error(deleteError.message)

  const rowsToInsert = header.targetOutputs
    .filter((t) => t.jenis) // skip baris kosong tanpa jenis
    .map((t) => ({ activity_id: activityId, jenis: t.jenis, jumlah: t.jumlah }))

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('target_outputs')
      .insert(rowsToInsert)

    if (insertError) throw new Error(insertError.message)
  }
}



export async function updateMonthlyReport(activityId: string, month: MonthData): Promise<void> {

  // debug purpose
  console.log('[updateMonthlyReport] activityId diterima =', activityId, typeof activityId)




  const bulanIndex = BULAN_URUT.findIndex((b) => b === month.bulan)
  if (bulanIndex === -1) {
    throw new Error(`Nama bulan tidak dikenali: "${month.bulan}"`)
  }
  const bulanNumber = bulanIndex + 1

  const { error } = await supabase
    .from('monthly_reports')
    .update({
      uraian: month.aktivitas.uraian,
      kendala: month.aktivitas.kendala,
      mitigasi: month.aktivitas.mitigasi,
      output_jenis: month.output.jenis,
      output_judul: month.output.judul,
      output_status: month.output.status,
      output_capaian: clampPercent(month.output.capaian),
      updated_at: new Date().toISOString(),
    })
    .eq('activity_id', activityId)
    .eq('bulan', bulanNumber)

  if (error) throw new Error(error.message)
}



function toAttachments(files: SupportFileRow[] | null, kategori: 'aktivitas' | 'output'): Attachment[] {
  if (!files) return []
  return files
    .filter((f) => f.kategori === kategori)
    .map((f) => ({ label: f.label, url: f.url ?? f.storage_path ?? '' }))
}

function toMonevMonth(bulanIndex: number, row: MonthlyReportRow | undefined): MonevMonth {
  const bulan = BULAN_URUT[bulanIndex]
  if (!row) return emptyMonth(bulan)

  return {
    bulan,
    aktivitas: {
      uraian: row.uraian,
      kendala: row.kendala,
      mitigasi: row.mitigasi,
      dataDukung: toAttachments(row.support_files, 'aktivitas'),
    },
    output: {
      jenis: row.output_jenis,
      judul: row.output_judul,
      status: row.output_status,
      capaian: row.output_capaian,
      dataDukung: toAttachments(row.support_files, 'output'),
      // Catatan: monthly_reports belum punya kolom "keterangan", dan hanya 1 output/bulan
      // (belum ada tabel untuk outputTambahan). Lihat catatan di balasan utama.
    },
  }
}

function toActivityEntry(row: ActivityRow): ActivityEntry {
  const header: HeaderData = {
    namaKetua: row.nama_ketua,
    unitKerja: row.unit_kerja,
    satuanKerja: row.satuan_kerja,
    judulAktivitas: row.judul_aktivitas,
    targetOutputs: (row.target_outputs ?? []).map((t) => ({ jenis: t.jenis, jumlah: t.jumlah })),
    progresTotal: row.progres_total,
    progresKeterangan: row.progres_keterangan,
    statusPelaksanaan: row.status_pelaksanaan,
    kategoriPendanaan: row.kategori_pendanaan,
    skemaMitraProgram: row.skema_mitra_program,
    judulKontrak: row.judul_kontrak,
    targetPenerimaan: row.target_penerimaan,
    targetPenggunaan: row.target_penggunaan,
    banyakTermin: row.banyak_termin,
    statusKontrak: row.status_kontrak,
  }

  const byBulan = new Map((row.monthly_reports ?? []).map((m) => [m.bulan, m]))
  const bulanan = BULAN_URUT.map((_, idx) => toMonevMonth(idx, byBulan.get(idx + 1)))

  return { id: row.id, header, bulanan }
}

export interface ProfileWithActivities {
  profile: ProfileInfo
  activities: ActivityEntry[]
}

/** Satu query: ambil profil (identitas periset) + seluruh aktivitas + log bulanan milik satu user. */
export async function fetchProfileWithActivities(userId: string): Promise<ProfileWithActivities> {
  const { data, error } = await supabase
    .from('profiles')
    .select(SELECT_QUERY)
    .eq('id', userId)
    .single<ProfileRow>()

  if (error) throw new Error(error.message)
  if (!data) throw new Error(`Profil dengan id "${userId}" tidak ditemukan`)

  return {
    profile: {
      id: data.id,
      fullName: data.full_name ?? '',
      unitKerja: data.unit_kerja ?? '',
      satuanKerja: data.satuan_kerja ?? '',
      role: data.role ?? 'researcher',
      avatarFileId: data.avatar_file_id,
    },
    activities: (data.activities ?? []).map(toActivityEntry),
  }
}

/* ═════════ Daftar & hapus periset (dipakai halaman Formbaru) ═════════ */

export interface AktivitasRingkas {
  id: string
  judul: string
  status: string
  progres: number
}

export interface PerisetRingkas {
  id: string
  nama: string
  unitKerja: string
  aktivitas: AktivitasRingkas[]
}

interface ResearcherRow {
  id: string
  full_name: string | null
  unit_kerja: string | null
  activities:
    | {
        id: string
        nama_ketua: string | null
        judul_aktivitas: string | null
        status_pelaksanaan: string | null
        progres_total: number | null
      }[]
    | null
}

/**
 * Ambil semua periset beserta judul aktivitasnya (query ringan, tanpa log bulanan).
 * Catatan: yang terlihat tergantung aturan akses (RLS) di Supabase. Kalau RLS hanya mengizinkan
 * baca data sendiri, daftar ini hanya berisi akun yang sedang login.
 */
export async function fetchAllResearchers(): Promise<PerisetRingkas[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id, full_name, unit_kerja,
       activities ( id, nama_ketua, judul_aktivitas, status_pelaksanaan, progres_total )`,
    )
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as ResearcherRow[]
  return rows.map((r) => {
    const aktivitas = (r.activities ?? []).map((a) => ({
      id: a.id,
      judul: a.judul_aktivitas ?? '',
      status: a.status_pelaksanaan ?? '',
      progres: a.progres_total ?? 0,
    }))
    return {
      id: r.id,
      nama: r.full_name || r.activities?.[0]?.nama_ketua || '',
      unitKerja: r.unit_kerja ?? '',
      aktivitas,
    }
  })
}

const PESAN_TIDAK_TERHAPUS =
  'Tidak ada data yang terhapus. Kemungkinan akun ini tidak diizinkan menghapus (aturan akses/RLS di Supabase), atau aktivitasnya sudah tidak ada.'

/**
 * Hapus satu aktivitas.
 * Dicoba langsung dulu. Kalau database menolak karena masih ada data turunan (error 23503, foreign key),
 * target_outputs dan monthly_reports aktivitas itu dihapus dulu lalu dicoba lagi.
 * Hasil penghapusan diperiksa lewat .select('id'): RLS yang menolak tidak memberi error, hanya 0 baris.
 */
export async function deleteActivityInDb(activityId: string): Promise<void> {
  let res = await supabase.from('activities').delete().eq('id', activityId).select('id')

  if (res.error?.code === '23503') {
    const t = await supabase.from('target_outputs').delete().eq('activity_id', activityId)
    if (t.error) throw new Error(t.error.message)

    const m = await supabase.from('monthly_reports').delete().eq('activity_id', activityId)
    if (m.error) throw new Error(m.error.message)

    res = await supabase.from('activities').delete().eq('id', activityId).select('id')
  }

  if (res.error) throw new Error(res.error.message)
  if (!res.data || res.data.length === 0) throw new Error(PESAN_TIDAK_TERHAPUS)
}

/** Hapus beberapa aktivitas satu per satu (dipakai untuk "hapus periset"). */
export async function deleteActivitiesInDb(activityIds: string[]): Promise<void> {
  let selesai = 0
  for (const id of activityIds) {
    try {
      await deleteActivityInDb(id)
      selesai += 1
    } catch (err) {
      throw new Error(
        `${selesai} dari ${activityIds.length} aktivitas sudah terhapus, lalu gagal: ${(err as Error).message}`,
      )
    }
  }
}