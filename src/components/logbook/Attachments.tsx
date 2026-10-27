import { createContext, useContext, useRef, useState, type MouseEvent } from 'react'
import type { Attachment } from '../../types/monev.ts'
import { WRAP } from './shared'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

export type UploadFn = (file: File) => Promise<string>

/** Bawaan: file jadi data URL (tersimpan di data, tanpa server) */
export const readAsDataUrl: UploadFn = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export const UploadContext = createContext<UploadFn>(readAsDataUrl)

const isDataUrl = (url: string) => url.startsWith('data:') || url.startsWith('blob:')
const isImageUrl = (url: string) =>
  url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url)

/** Browser memblokir navigasi langsung ke data: URL, jadi dibuka lewat blob */
async function openDataUrl(url: string, e: MouseEvent) {
  e.preventDefault()
  if (url.startsWith('blob:')) {
    window.open(url, '_blank')
    return
  }
  const win = window.open('', '_blank')
  try {
    const blob = await (await fetch(url)).blob()
    const objectUrl = URL.createObjectURL(blob)
    if (win) win.location.href = objectUrl
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  } catch {
    win?.close()
  }
}

export const CELL_INPUT =
  'w-full min-w-0 p-1 border border-slate-300 rounded text-[11px] focus:ring-2 focus:ring-amber-500 focus:outline-none'

export const Dash = () => <span className="text-slate-400">–</span>

/** Mode lihat: link atau file terunggah, gambar tampil sebagai thumbnail */
export function AttachmentList({ items }: { items: Attachment[] }) {
  if (!items.length) return <Dash />
  return (
    <ul className="space-y-1 min-w-0">
      {items.map((item, i) => {
        const isFile = isDataUrl(item.url)
        const name = item.label || (isFile ? 'Berkas' : item.url)
        return (
          <li key={`${item.label}-${i}`} className="min-w-0">
            {isImageUrl(item.url) && (
              <img src={item.url} alt={name} className="mb-1 max-h-16 max-w-full rounded border border-slate-200 object-cover" />
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={isFile ? (e) => openDataUrl(item.url, e) : undefined}
              className={`text-gov-600 hover:underline inline-flex items-start gap-1 max-w-full ${WRAP}`}
            >
              <i className={`fa-solid ${isFile ? 'fa-file' : 'fa-paperclip'} text-[10px] mt-0.5 shrink-0`} />
              <span className="min-w-0">{name}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/** Mode edit: tambah link atau upload file/gambar (bisa banyak sekaligus) */
export function AttachmentEditor({ items, onChange }: { items: Attachment[]; onChange: (next: Attachment[]) => void }) {
  const upload = useContext(UploadContext)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (i: number, patch: Partial<Attachment>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    setError('')
    const added: Attachment[] = []
    const failed: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        failed.push(`${file.name} (melebihi ${MAX_FILE_BYTES / 1024 / 1024} MB)`)
        continue
      }
      try {
        added.push({ label: file.name, url: await upload(file) })
      } catch {
        failed.push(`${file.name} (gagal diunggah)`)
      }
    }

    if (added.length) onChange([...items, ...added])
    if (failed.length) setError(`Tidak bisa diunggah: ${failed.join(', ')}`)
    if (fileRef.current) fileRef.current.value = ''
    setBusy(false)
  }

  return (
    <div className="space-y-2 min-w-0">
      {items.map((item, i) => {
        const isFile = isDataUrl(item.url)
        return (
          <div key={i} className="space-y-1 p-1 border border-slate-200 rounded bg-white min-w-0">
            {isFile && isImageUrl(item.url) && (
              <img src={item.url} alt={item.label} className="max-h-16 max-w-full rounded border border-slate-200 object-cover" />
            )}
            <input
              type="text"
              value={item.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Nama berkas"
              className={CELL_INPUT}
            />
            <div className="flex items-center gap-1 min-w-0">
              {isFile ? (
                <span className="flex-1 min-w-0 text-[10px] text-slate-500 flex items-center gap-1">
                  <i className="fa-solid fa-file shrink-0" /> File terunggah
                </span>
              ) : (
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="https://..."
                  className={CELL_INPUT}
                />
              )}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label="Hapus data dukung"
                className="text-rose-500 hover:text-rose-700 p-1 text-xs shrink-0"
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onChange([...items, { label: '', url: '' }])}
          className="text-[11px] text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded font-medium transition flex items-center gap-1"
        >
          <i className="fa-solid fa-link" /> Tambah Link
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="text-[11px] text-sky-700 bg-sky-100 hover:bg-sky-200 disabled:opacity-50 px-2 py-1 rounded font-medium transition flex items-center gap-1"
        >
          <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-upload'}`} />
          {busy ? 'Mengunggah...' : 'Upload File'}
        </button>
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {error && <p className="text-[10px] text-rose-600">{error}</p>}
    </div>
  )
}