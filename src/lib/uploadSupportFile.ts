import { supabase } from './supabase'
import { uploadToDrive, deleteFromDrive } from './driveApi'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export type Kategori = 'aktivitas' | 'output'

export interface SupportFile {
  id: string
  monthly_report_id: string
  kategori: Kategori
  label: string
  url: string | null
  storage_path: string | null // = ID file Google Drive
  mime_type: string | null
  bytes: number | null
  created_at: string
}

interface UploadParams {
  file: File
  reportId: string
  kategori: Kategori
}

export async function uploadSupportFile({
  file,
  reportId,
  kategori,
}: UploadParams): Promise<SupportFile> {
  if (file.size > MAX_BYTES) throw new Error('Ukuran file maksimal 10 MB')

  // 1. Simpan file ke Drive lewat Apps Script
  const up = await uploadToDrive(file, reportId)

  // 2. Catat di database
  const { data, error } = await supabase
    .from('support_files')
    .insert({
      monthly_report_id: reportId,
      kategori,
      label: file.name,
      storage_path: up.fileId,
      mime_type: up.mimeType,
      bytes: up.bytes,
    })
    .select()
    .single()

  if (error) {
    // Jangan tinggalkan file yatim di Drive
    await deleteFromDrive(up.fileId).catch(() => {})
    throw error
  }
  return data as SupportFile
}

export async function deleteSupportFile(f: SupportFile) {
  const { error } = await supabase.from('support_files').delete().eq('id', f.id)
  if (error) throw error
  if (f.storage_path) await deleteFromDrive(f.storage_path).catch(() => {})
}