import { supabase } from './supabase'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export type Kategori = 'aktivitas' | 'output'

export interface SupportFile {
  id: string
  monthly_report_id: string
  kategori: Kategori
  label: string
  url: string | null
  cloudinary_public_id: string | null
  resource_type: string | null
  bytes: number | null
  created_at: string
}

interface SignResponse {
  signature: string
  timestamp: number
  public_id: string
  allowed_formats: string
  api_key: string
  cloud_name: string
}

interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  resource_type: string
  bytes: number
  error?: { message: string }
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

  // 1. Minta tanda tangan ke Edge Function (token login terkirim otomatis)
  const { data: sign, error: signErr } =
    await supabase.functions.invoke<SignResponse>('cloudinary-sign', {
      body: { reportId },
    })
  if (signErr || !sign) {
    throw new Error('Tidak diizinkan mengunggah: ' + (signErr?.message ?? 'tanpa respons'))
  }

  // 2. Kirim file langsung ke Cloudinary
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', sign.api_key)
  form.append('timestamp', String(sign.timestamp))
  form.append('signature', sign.signature)
  form.append('public_id', sign.public_id)
  form.append('allowed_formats', sign.allowed_formats)

  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloud_name}/auto/upload`,
    { method: 'POST', body: form },
  )
  const up: CloudinaryUploadResult = await upRes.json()
  if (!upRes.ok) throw new Error(up.error?.message ?? 'Upload ke Cloudinary gagal')

  // 3. Catat hasilnya di database
  const { data, error } = await supabase
    .from('support_files')
    .insert({
      monthly_report_id: reportId,
      kategori,
      label: file.name,
      url: up.secure_url,
      cloudinary_public_id: up.public_id,
      resource_type: up.resource_type,
      bytes: up.bytes,
    })
    .select()
    .single()
  if (error) throw error

  return data as SupportFile
}