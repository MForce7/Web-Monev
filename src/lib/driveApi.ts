import { supabase } from './supabase'

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL

interface ApiError { ok: false; error?: string }

// Apps Script tidak mendukung preflight CORS, jadi kita pakai request "sederhana":
// Content-Type text/plain, tanpa header khusus, dan token dikirim di body.
async function call<T>(payload: Record<string, unknown>): Promise<T> {
  if (!APPS_SCRIPT_URL) throw new Error('VITE_APPS_SCRIPT_URL belum diisi')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Silakan login dulu')

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, token: session.access_token }),
  })
  const json = (await res.json()) as T | ApiError
  if ((json as ApiError).ok === false) {
    throw new Error((json as ApiError).error ?? 'Permintaan gagal')
  }
  return json as T
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export interface DriveUploadResult {
  ok: true
  fileId: string
  name: string
  mimeType: string
  bytes: number
}

export async function uploadToDrive(file: File, reportId: string) {
  return call<DriveUploadResult>({
    action: 'upload',
    reportId,
    fileName: file.name,
    mimeType: file.type,
    dataBase64: await fileToBase64(file),
  })
}

export async function fetchDriveFile(fileId: string) {
  const r = await call<{ ok: true; name: string; mimeType: string; dataBase64: string }>({
    action: 'get',
    fileId,
  })
  return { name: r.name, blob: base64ToBlob(r.dataBase64, r.mimeType) }
}

export async function deleteFromDrive(fileId: string) {
  await call<{ ok: true }>({ action: 'delete', fileId })
}

// Buka file di tab baru (tab dibuka dulu agar tidak diblokir popup blocker)
export async function openDriveFile(fileId: string) {
  const w = window.open('', '_blank')
  try {
    const { blob } = await fetchDriveFile(fileId)
    const url = URL.createObjectURL(blob)
    if (w) w.location.href = url
    else window.location.href = url
  } catch (e) {
    w?.close()
    throw e
  }
}