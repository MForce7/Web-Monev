import { useEffect, useRef, useState } from 'react'
import { PROFILE_UPDATED_EVENT, pickStockPhoto } from '../lib/useAvatar'
import type { ChangeEvent, FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
/* ========================================================================== */
/*  Konstanta & tipe                                                          */
/* ========================================================================== */

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined
const MAX_ORIGINAL_BYTES = 8 * 1024 * 1024 // batas foto asli sebelum dikecilkan
const AVATAR_SIZE = 384 // foto dikecilkan jadi persegi 384 x 384 px
const PROFILE_COLUMNS = 'id, full_name, role, unit_kerja, satuan_kerja, avatar_file_id'

// Semua gambar di src/assets/foto_profil/ otomatis terdaftar sebagai foto bawaan
// const STOCK_PHOTOS: string[] = Object.values(
//   import.meta.glob<string>('../assets/foto_profil/*.{jpg,jpeg,png,webp}', {
//     eager: true,
//     query: '?url',
//     import: 'default',
//   }),
// )

interface ProfileRow {
  id: string
  full_name: string | null
  role: 'researcher' | 'admin'
  unit_kerja: string | null
  satuan_kerja: string | null
  avatar_file_id: string | null // ID file di Google Drive
}

interface NoticeState {
  type: 'ok' | 'err'
  text: string
}

const ROLE_LABEL: Record<ProfileRow['role'], string> = {
  researcher: 'Periset',
  admin: 'Admin',
}

/* ========================================================================== */
/*  Fungsi bantu                                                              */
/* ========================================================================== */

// // Foto bawaan: "acak" per user, tapi tetap sama setiap kali halaman dibuka
// function pickStockPhoto(userId: string): string | null {
//   if (STOCK_PHOTOS.length === 0) return null
//   let hash = 0
//   for (let i = 0; i < userId.length; i++) {
//     hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
//   }
//   return STOCK_PHOTOS[hash % STOCK_PHOTOS.length]
// }

function getInitials(name: string | null, email: string | undefined): string {
  const source = (name?.trim() || email || '?').trim()
  return (
    source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

// Potong jadi persegi dari tengah, kecilkan, lalu simpan sebagai JPEG
async function resizeToSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar')

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses gambar'))),
      'image/jpeg',
      0.85,
    )
  })
}

// Panggil Apps Script. Dipakai "text/plain" agar tidak memicu preflight CORS.
async function callScript<T>(payload: Record<string, unknown>): Promise<T> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('VITE_APPS_SCRIPT_URL belum diisi di .env.local')
  }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi login habis, silakan masuk lagi')

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, token: session.access_token }),
  })
  const json = await res.json()
  if (json.ok === false) throw new Error(json.error ?? 'Permintaan ke server file gagal')
  return json as T
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/* ========================================================================== */
/*  Komponen kecil                                                            */
/* ========================================================================== */

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 ' +
  'placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 ' +
  'focus:ring-teal-600/30 disabled:cursor-not-allowed disabled:bg-stone-100 ' +
  'disabled:text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 ' +
  'dark:placeholder:text-stone-500 dark:disabled:bg-stone-900/50'

const buttonPrimary =
  'inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm ' +
  'font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500 ' +
  'dark:focus-visible:ring-offset-stone-950'

const buttonQuiet =
  'rounded-md px-2 py-1 text-sm font-medium text-stone-700 underline-offset-4 ' +
  'hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-300'

function Notice({ notice }: { notice: NoticeState | null }) {
  if (!notice) return null
  const tone =
    notice.type === 'ok'
      ? 'text-teal-700 dark:text-teal-400'
      : 'text-red-700 dark:text-red-400'
  return (
    <p role="status" className={`text-sm ${tone}`}>
      {notice.text}
    </p>
  )
}

interface PhotoProps {
  src: string | null
  loading: boolean
  initials: string
  label: string
}

function Photo({ src, loading, initials, label }: PhotoProps) {
  if (loading) {
    return (
      <div
        className="aspect-square w-40 animate-pulse rounded-2xl bg-stone-200 motion-reduce:animate-none dark:bg-stone-800"
        role="img"
        aria-label="Memuat foto"
      />
    )
  }
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className="aspect-square w-40 rounded-2xl bg-stone-200 object-cover dark:bg-stone-800"
      />
    )
  }
  return (
    <div
      className="flex aspect-square w-40 items-center justify-center rounded-2xl bg-teal-100 text-4xl font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200"
      role="img"
      aria-label={label}
    >
      {initials}
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

function TextField({ id, label, value, onChange, required, placeholder }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-700 dark:text-red-400"> *</span>}
      </label>
      <input
        id={id}
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={120}
      />
    </div>
  )
}

/* ========================================================================== */
/*  Halaman profil                                                            */
/* ========================================================================== */

function ProfileContent({ user }: { user: User }) {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // isi form
  const [fullName, setFullName] = useState('')
  const [unitKerja, setUnitKerja] = useState('')
  const [satuanKerja, setSatuanKerja] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)

  // foto
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoNotice, setPhotoNotice] = useState<NoticeState | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const stockUrl = pickStockPhoto(user.id)

  /* ---- 1. Muat profil milik user yang sedang login ---- */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', user.id)
        .single()

      if (cancelled) return
      if (error || !data) {
        setLoadError(error?.message ?? 'Profil tidak ditemukan')
      } else {
        const row = data as ProfileRow
        setProfile(row)
        setFullName(row.full_name ?? '')
        setUnitKerja(row.unit_kerja ?? '')
        setSatuanKerja(row.satuan_kerja ?? '')
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user.id])

  /* ---- 2. Muat foto dari Drive bila user punya foto sendiri ---- */
  const avatarFileId = profile?.avatar_file_id ?? null
  useEffect(() => {
    if (!avatarFileId) {
      setAvatarUrl(null)
      return
    }
    let cancelled = false
    let objectUrl: string | null = null
    setAvatarLoading(true)
    ;(async () => {
      try {
        const res = await callScript<{ mimeType: string; dataBase64: string }>({
          action: 'get',
          fileId: avatarFileId,
        })
        if (cancelled) return
        objectUrl = URL.createObjectURL(base64ToBlob(res.dataBase64, res.mimeType))
        setAvatarUrl(objectUrl)
      } catch {
        if (!cancelled) setAvatarUrl(null) // gagal -> jatuh ke foto bawaan
      } finally {
        if (!cancelled) setAvatarLoading(false)
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [avatarFileId])

  /* ---- 3. Simpan data diri ---- */
  async function onSave(e: FormEvent) {
    e.preventDefault()
    setNotice(null)

    if (!fullName.trim()) {
      setNotice({ type: 'err', text: 'Isi nama lengkap dulu.' })
      return
    }

    setSaving(true)
    // "role" sengaja tidak dikirim: tidak boleh diubah dari halaman ini
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        unit_kerja: unitKerja.trim() || null,
        satuan_kerja: satuanKerja.trim() || null,
      })
      .eq('id', user.id)
      .select(PROFILE_COLUMNS)
      .single()
    setSaving(false)

    if (error || !data) {
      setNotice({
        type: 'err',
        text: 'Perubahan belum tersimpan: ' + (error?.message ?? 'tidak ada baris yang berubah'),
      })
      return
    }
    setProfile(data as ProfileRow)
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
    setNotice({ type: 'ok', text: 'Perubahan tersimpan.' })
  }

  /* ---- 4. Ganti foto ---- */
  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // supaya file yang sama bisa dipilih lagi
    if (!file || !profile) return

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setPhotoNotice({ type: 'err', text: 'Pilih foto berformat JPG, PNG, atau WebP.' })
      return
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setPhotoNotice({ type: 'err', text: 'Ukuran foto maksimal 8 MB.' })
      return
    }

    setPhotoBusy(true)
    setPhotoNotice(null)
    let newFileId: string | null = null
    try {
      const resized = await resizeToSquareJpeg(file)
      const up = await callScript<{ fileId: string }>({
        action: 'upload_avatar',
        mimeType: 'image/jpeg',
        dataBase64: await blobToBase64(resized),
      })
      newFileId = up.fileId

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_file_id: newFileId })
        .eq('id', user.id)
        .select(PROFILE_COLUMNS)
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Foto belum tersimpan di profil')

      const oldFileId = profile.avatar_file_id
      newFileId = null // sudah terpakai, jangan dibersihkan
      setProfile(data as ProfileRow)
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
      if (oldFileId) callScript({ action: 'delete', fileId: oldFileId }).catch(() => {})
      setPhotoNotice({ type: 'ok', text: 'Foto diperbarui.' })
    } catch (err) {
      // jangan tinggalkan file yatim di Drive
      if (newFileId) callScript({ action: 'delete', fileId: newFileId }).catch(() => {})
      setPhotoNotice({ type: 'err', text: 'Foto gagal diunggah: ' + errorMessage(err) })
    } finally {
      setPhotoBusy(false)
    }
  }

  /* ---- 5. Hapus foto sendiri (kembali ke foto bawaan) ---- */
  async function onRemovePhoto() {
    if (!profile?.avatar_file_id) return
    setPhotoBusy(true)
    setPhotoNotice(null)
    try {
      const oldFileId = profile.avatar_file_id
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_file_id: null })
        .eq('id', user.id)
        .select(PROFILE_COLUMNS)
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Foto belum terhapus dari profil')

      setProfile(data as ProfileRow)
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
      callScript({ action: 'delete', fileId: oldFileId }).catch(() => {})
      setPhotoNotice({ type: 'ok', text: 'Foto dihapus. Menampilkan foto bawaan.' })
    } catch (err) {
      setPhotoNotice({ type: 'err', text: 'Foto gagal dihapus: ' + errorMessage(err) })
    } finally {
      setPhotoBusy(false)
    }
  }

  /* ---- Tampilan ---- */
  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm sm:px-6">Memuat profil...</p>
  }
  if (!profile) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-red-700 sm:px-6 dark:text-red-400">
        Profil belum bisa dimuat: {loadError}
      </p>
    )
  }

  const hasOwnPhoto = Boolean(profile.avatar_file_id)
  const shownPhoto = avatarUrl ?? stockUrl
  const photoLabel = `Foto profil ${profile.full_name || user.email || ''}`.trim()

  let photoCaption: string
  if (hasOwnPhoto && avatarUrl) {
    photoCaption = 'Foto kamu sendiri.'
  } else if (hasOwnPhoto && !avatarLoading) {
    photoCaption = 'Foto tersimpan belum bisa dimuat. Sementara memakai foto bawaan.'
  } else if (!hasOwnPhoto && stockUrl) {
    photoCaption = 'Foto bawaan. Unggah fotomu sendiri untuk menggantinya.'
  } else {
    photoCaption = 'Belum ada foto.'
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 mt-16">
      <h1 className="text-2xl font-semibold tracking-tight">Profil saya</h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Perbarui foto dan identitas unit kerjamu.
      </p>

      <div className="mt-8 grid gap-10 sm:grid-cols-[10rem_1fr]">
        {/* Kolom kiri: foto dan identitas tetap */}
        <section aria-label="Foto dan akun">
          <Photo
            src={shownPhoto}
            loading={avatarLoading}
            initials={getInitials(profile.full_name, user.email)}
            label={photoLabel}
          />

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPickPhoto}
          />
          <div className="-ml-2 mt-3 flex flex-wrap gap-x-1">
            <button
              type="button"
              className={buttonQuiet}
              disabled={photoBusy}
              onClick={() => fileInput.current?.click()}
            >
              {photoBusy ? 'Memproses...' : 'Ganti foto'}
            </button>
            {hasOwnPhoto && (
              <button
                type="button"
                className={buttonQuiet}
                disabled={photoBusy}
                onClick={onRemovePhoto}
              >
                Hapus foto
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{photoCaption}</p>
          <div className="mt-2">
            <Notice notice={photoNotice} />
          </div>

          <dl className="mt-6 space-y-4 border-t border-stone-200 pt-4 text-sm dark:border-stone-800">
            <div>
              <dt className="text-stone-500 dark:text-stone-400">Email</dt>
              <dd className="break-all font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-stone-500 dark:text-stone-400">Peran</dt>
              <dd className="font-medium">{ROLE_LABEL[profile.role]}</dd>
            </div>
          </dl>
        </section>

        {/* Kolom kanan: data yang bisa diubah */}
        <form onSubmit={onSave} className="space-y-5" aria-label="Data diri">
          <TextField
            id="full_name"
            label="Nama lengkap"
            value={fullName}
            onChange={setFullName}
            required
            placeholder="Contoh: Dr. Nama Ketua, M.Si."
          />
          <TextField
            id="unit_kerja"
            label="Unit kerja"
            value={unitKerja}
            onChange={setUnitKerja}
            placeholder="Contoh: Pusat Riset Teknologi"
          />
          <TextField
            id="satuan_kerja"
            label="Satuan kerja"
            value={satuanKerja}
            onChange={setSatuanKerja}
            placeholder="Contoh: Direktorat Penelitian"
          />

          <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-5 dark:border-stone-800">
            <button type="submit" className={buttonPrimary} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan perubahan'}
            </button>
            <Notice notice={notice} />
          </div>
        </form>
      </div>
    </main>
  )
}



export default function Profile() {
  const { session } = useSession()
  if (!session) return null // sudah dijaga ProtectedRoute, ini hanya pengaman
  return <ProfileContent user={session.user} />
}