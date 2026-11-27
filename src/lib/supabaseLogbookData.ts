// import { BULAN_URUT, clampPercent } from '../types/monev'
import { supabase } from './supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'
import type { MonthData } from '../components/logbook/logbookTable/MonthlyLogTable'

import {
  BULAN_URUT,
  clampPercent,
  emptyMonth,
  type ActivityEntry,
  type Attachment,
  type HeaderData,
  type MonevMonth,
  type MonthOutput,
} from '../types/monev'

export interface ProfileInfo {
  id: string
  fullName: string
  unitKerja: string
  satuanKerja: string
  role: string
  avatarFileId: string | null
}

export type HasilSimpanImportLogbook = {
  total: number
  berhasil: number
  gagal: number
  hasil: { nama: string; unitKerja: string; success: boolean; message: string }[]
}

export async function simpanImportLogbookDiDb(
  entries: { header: HeaderData; bulanan: MonthData[] }[],
  gabung: boolean,
): Promise<HasilSimpanImportLogbook> {
  const { data, error } = await supabase.functions.invoke<HasilSimpanImportLogbook>(
    'manage-researcher',
    { body: { action: 'import_logbook', entries, gabung } },
  )

  if (error) {
    let message = error.message
    if (error instanceof FunctionsHttpError) {
      try {
        const detail: unknown = await error.context.clone().json()
        if (
          typeof detail === 'object' &&
          detail !== null &&
          'error' in detail &&
          typeof detail.error === 'string'
        ) {
          message = detail.error
        }
      } catch {
        message = error.message
      }
    }
    throw new Error(message)
  }

  if (!data) throw new Error('Server tidak mengembalikan hasil import logbook.')
  return data
}

interface SupportFileRow {
  kategori: 'aktivitas' | 'output'
  label: string
  url: string | null
  storage_path: string | null
  monthly_report_output_id: string | null
}

interface MonthlyReportOutputRow {
  id: string
  urutan: number
  jenis: string
  judul: string
  status: string
  capaian: number
  keterangan: string
}

interface MonthlyReportRow {
  id: string
  bulan: number
  uraian: string
  kendala: string
  mitigasi: string
  output_jenis: string
  output_judul: string
  output_status: string
  output_capaian: number
  support_files: SupportFileRow[] | null
  monthly_report_outputs: MonthlyReportOutputRow[] | null
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
  tahun_pelaksanaan: number
  progres_total: number
  progres_keterangan: string
  status_pelaksanaan: string
  kategori_pendanaan: string
  unit_pengampu_difa: string        // ganti dari skema_mitra_program
  program_skema_pendanaan: string    // baru
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
    id, nama_ketua, unit_kerja, satuan_kerja, judul_aktivitas, tahun_pelaksanaan,
    progres_total, progres_keterangan, status_pelaksanaan,
    kategori_pendanaan, unit_pengampu_difa, program_skema_pendanaan, judul_kontrak,
    target_penerimaan, target_penggunaan, banyak_termin, status_kontrak,
    target_outputs ( jenis, jumlah ),
    monthly_reports (
      id, bulan, uraian, kendala, mitigasi,
      output_jenis, output_judul, output_status, output_capaian,
      support_files ( kategori, label, url, storage_path, monthly_report_output_id ),
      monthly_report_outputs ( id, urutan, jenis, judul, status, capaian, keterangan )
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
      tahun_pelaksanaan: header.tahunPelaksanaan,
      progres_total: clampPercent(header.progresTotal),
      progres_keterangan: header.progresKeterangan,
      status_pelaksanaan: header.statusPelaksanaan,
      kategori_pendanaan: header.kategoriPendanaan,
      unit_pengampu_difa: header.unitPengampuDifa,
      program_skema_pendanaan: header.programSkemaPendanaan,
      judul_kontrak: header.judulKontrak,
      target_penerimaan: header.targetPenerimaan,
      target_penggunaan: header.targetPenggunaan,
      banyak_termin: header.banyakTermin,
      status_kontrak: header.statusKontrak,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)
  // ...sisanya sama persis seperti sebelumnya

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
  const outputs = [month.output, ...(month.outputTambahan ?? [])].filter((output) =>
    output.jenis ||
    output.judul ||
    (output.status && output.status !== 'Belum Mulai') ||
    output.keterangan ||
    output.capaian > 0 ||
    output.dataDukung.length,
  )
  const outputUtama = outputs[0] ?? {
    jenis: '',
    judul: '',
    status: '',
    capaian: 0,
  }

  const { data: existingReports, error: lookupError } = await supabase
    .from('monthly_reports')
    .select('id')
    .eq('activity_id', activityId)
    .eq('bulan', bulanNumber)
    .limit(2)

  if (lookupError) throw new Error(lookupError.message)
  if ((existingReports ?? []).length > 1) {
    throw new Error(`Terdapat lebih dari satu laporan bulan ${month.bulan} untuk aktivitas ini.`)
  }

  const reportPayload = {
    uraian: month.aktivitas.uraian,
    kendala: month.aktivitas.kendala,
    mitigasi: month.aktivitas.mitigasi,
    output_jenis: outputUtama.jenis,
    output_judul: outputUtama.judul,
    output_status: outputUtama.status,
    output_capaian: clampPercent(outputUtama.capaian),
    updated_at: new Date().toISOString(),
  }

  const existingReportId = existingReports?.[0]?.id as string | undefined
  const { data: savedReport, error: saveError } = existingReportId
    ? await supabase
        .from('monthly_reports')
        .update(reportPayload)
        .eq('id', existingReportId)
        .select('id')
        .single()
    : await supabase
        .from('monthly_reports')
        .insert({ ...reportPayload, activity_id: activityId, bulan: bulanNumber })
        .select('id')
        .single()

  if (saveError) throw new Error(saveError.message)
  if (!savedReport) throw new Error(`Laporan bulan ${month.bulan} tidak berhasil disimpan.`)

  const { error: deleteOutputsError } = await supabase
    .from('monthly_report_outputs')
    .delete()
    .eq('monthly_report_id', savedReport.id)

  if (deleteOutputsError) throw new Error(deleteOutputsError.message)

  const rowsToInsert = outputs.map((output, urutan) => ({
    monthly_report_id: savedReport.id,
    urutan,
    jenis: output.jenis,
    judul: output.judul,
    status: output.status,
    capaian: clampPercent(output.capaian),
    keterangan: output.keterangan ?? '',
    updated_at: new Date().toISOString(),
  }))

  const { data: insertedOutputs, error: insertOutputsError } =
    rowsToInsert.length > 0
      ? await supabase
          .from('monthly_report_outputs')
          .insert(rowsToInsert)
          .select('id, urutan')
      : { data: [], error: null }

  if (insertOutputsError) throw new Error(insertOutputsError.message)

  const { error: deleteActivityFilesError } = await supabase
    .from('support_files')
    .delete()
    .eq('monthly_report_id', savedReport.id)
    .eq('kategori', 'aktivitas')

  if (deleteActivityFilesError) throw new Error(deleteActivityFilesError.message)

  const { error: deleteLegacyOutputFilesError } = await supabase
    .from('support_files')
    .delete()
    .eq('monthly_report_id', savedReport.id)
    .eq('kategori', 'output')
    .is('monthly_report_output_id', null)

  if (deleteLegacyOutputFilesError) throw new Error(deleteLegacyOutputFilesError.message)

  const outputIdByOrder = new Map(
    (insertedOutputs ?? []).map((output) => [output.urutan, output.id]),
  )
  const activityFiles = month.aktivitas.dataDukung.map((file) => ({
    monthly_report_id: savedReport.id,
    kategori: 'aktivitas' as const,
    label: file.label,
    url: file.url || null,
    storage_path: null,
  }))
  const outputFiles = outputs.flatMap((output, urutan) => {
    const outputId = outputIdByOrder.get(urutan)
    if (!outputId) return []
    return output.dataDukung.map((file) => ({
      monthly_report_id: savedReport.id,
      monthly_report_output_id: outputId,
      kategori: 'output' as const,
      label: file.label,
      url: file.url || null,
      storage_path: null,
    }))
  })

  const filesToInsert = [...activityFiles, ...outputFiles]
  if (filesToInsert.length > 0) {
    const { error: insertFilesError } = await supabase
      .from('support_files')
      .insert(filesToInsert)

    if (insertFilesError) throw new Error(insertFilesError.message)
  }
}



function toAttachments(
  files: SupportFileRow[] | null,
  kategori: 'aktivitas' | 'output',
  outputId?: string,
): Attachment[] {
  if (!files) return []
  return files
    .filter((f) => {
      if (f.kategori !== kategori) return false
      return kategori === 'aktivitas'
        ? true
        : outputId
          ? f.monthly_report_output_id === outputId
          : !f.monthly_report_output_id
    })
    .map((f) => ({ label: f.label, url: f.url ?? f.storage_path ?? '' }))
}

function toMonthOutput(
  row: Pick<MonthlyReportRow, 'output_jenis' | 'output_judul' | 'output_status' | 'output_capaian'>,
  files: SupportFileRow[] | null,
  outputId?: string,
): MonthOutput {
  return {
    jenis: row.output_jenis ?? '',
    judul: row.output_judul ?? '',
    status: row.output_status ?? '',
    capaian: row.output_capaian ?? 0,
    dataDukung: toAttachments(files, 'output', outputId),
  }
}

function outputTerisi(output: MonthOutput): boolean {
  return Boolean(
    output.jenis ||
      output.judul ||
      (output.status && output.status !== 'Belum Mulai') ||
      output.capaian > 0 ||
      output.keterangan ||
      output.dataDukung.length,
  )
}

function toMonevMonth(bulanIndex: number, rows: MonthlyReportRow[] | undefined): MonevMonth {
  const bulan = BULAN_URUT[bulanIndex]
  if (!rows?.length) return emptyMonth(bulan)

  const first = rows[0]
  const outputsFromRelation = rows
    .flatMap((row) => row.monthly_report_outputs ?? [])
    .sort((a, b) => a.urutan - b.urutan)
    .map((output) => ({
      jenis: output.jenis,
      judul: output.judul,
      status: output.status,
      capaian: output.capaian,
      keterangan: output.keterangan,
      dataDukung: rows.flatMap((row) =>
        toAttachments(row.support_files, 'output', output.id),
      ),
    }))

  const outputs = outputsFromRelation.length
    ? outputsFromRelation
    : rows.map((row) => toMonthOutput(row, row.support_files)).filter(outputTerisi)

  return {
    bulan,
    aktivitas: {
      uraian: first.uraian ?? '',
      kendala: first.kendala ?? '',
      mitigasi: first.mitigasi ?? '',
      dataDukung: rows.flatMap((row) => toAttachments(row.support_files, 'aktivitas')),
    },
    output: outputs[0] ?? emptyMonth(bulan).output,
    ...(outputs.length > 1 ? { outputTambahan: outputs.slice(1) } : {}),
  }
}

function toActivityEntry(row: ActivityRow): ActivityEntry {
  const header: HeaderData = {
    namaKetua: row.nama_ketua,
    unitKerja: row.unit_kerja,
    satuanKerja: row.satuan_kerja,
    judulAktivitas: row.judul_aktivitas,
    tahunPelaksanaan: row.tahun_pelaksanaan,
    targetOutputs: (row.target_outputs ?? []).map((t) => ({ jenis: t.jenis, jumlah: t.jumlah })),
    progresTotal: row.progres_total,
    progresKeterangan: row.progres_keterangan,
    statusPelaksanaan: row.status_pelaksanaan,
    kategoriPendanaan: row.kategori_pendanaan,
    unitPengampuDifa: row.unit_pengampu_difa,
    programSkemaPendanaan: row.program_skema_pendanaan,
    judulKontrak: row.judul_kontrak,
    targetPenerimaan: row.target_penerimaan,
    targetPenggunaan: row.target_penggunaan,
    banyakTermin: row.banyak_termin,
    statusKontrak: row.status_kontrak,
  }

  const byBulan = new Map<number, MonthlyReportRow[]>()
  for (const month of row.monthly_reports ?? []) {
    byBulan.set(month.bulan, [...(byBulan.get(month.bulan) ?? []), month])
  }
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
     .eq('role', 'researcher')   // ⬅️ tambahkan baris ini
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