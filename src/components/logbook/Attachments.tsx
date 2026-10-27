import { createContext, useContext, useRef, useState, type MouseEvent } from 'react'
import type { Attachment } from '../../types/monev'
import { CELL_INPUT, Dash, WRAP } from '../../lib/shared'

const MAX_MB = 5

export type UploadFn = (file: File) => Promise<string>

/** Bawaan: file jadi data URL (tersimpan di data, tanpa server) */
export const readAsDataUrl: UploadFn = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

export const UploadContext = createContext<UploadFn>(readAsDataUrl)

const isFileUrl = (u: string) => u.startsWith('data:') || u.startsWith('blob:')
const isImageUrl = (u: string) => u.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(u)

/** Browser memblokir navigasi ke data: URL, jadi dibuka lewat blob */
async function openFile(url: string, e: MouseEvent) {
  e.preventDefault()
  if (url.startsWith('blob:')) return void window.open(url, '_blank')
  const win = window.open('', '_blank') // dibuka dulu agar tidak diblokir popup blocker
  try {
    const objectUrl = URL.createObjectURL(await (await fetch(url)).blob())
    if (win) win.location.href = objectUrl
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  } catch {
    win?.close()
  }
}

const Thumb = ({ url, alt, className = '' }: { url: string; alt: string; className?: string }) => (
  <img src={url} alt={alt} className={`max-h-16 max-w-full rounded border border-slate-200 object-cover ${className}`} />
)

/** Mode lihat */
export function AttachmentList({ items }: { items: Attachment[] }) {
  if (!items.length) return <Dash />
  return (
    <ul className="space-y-1 min-w-0">
      {items.map((it, i) => {
        const file = isFileUrl(it.url)
        const name = it.label || (file ? 'Berkas' : it.url)
        return (
          <li key={`${it.label}-${i}`} className="min-w-0">
            {isImageUrl(it.url) && <Thumb url={it.url} alt={name} className="mb-1" />}
            <a
              href={it.url}
              target="_blank"
              rel="noreferrer"
              onClick={file ? (e) => openFile(it.url, e) : undefined}
              className={`text-gov-600 hover:underline inline-flex items-start gap-1 max-w-full ${WRAP}`}
            >
              <i className={`fa-solid ${file ? 'fa-file' : 'fa-paperclip'} text-[10px] mt-0.5 shrink-0`} />
              <span className="min-w-0">{name}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

const BTN = 'text-[11px] px-2 py-1 rounded font-medium transition flex items-center gap-1'

/** Mode edit: tambah link atau upload file/gambar (bisa banyak sekaligus) */
export function AttachmentEditor({ items, onChange }: { items: Attachment[]; onChange: (next: Attachment[]) => void }) {
  const upload = useContext(UploadContext)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (i: number, patch: Partial<Attachment>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setError('')
    const added: Attachment[] = []
    const failed: string[] = []

    for (const f of Array.from(files)) {
      if (f.size > MAX_MB * 1024 * 1024) { failed.push(`${f.name} (melebihi ${MAX_MB} MB)`); continue }
      try { added.push({ label: f.name, url: await upload(f) }) }
      catch { failed.push(`${f.name} (gagal diunggah)`) }
    }

    if (added.length) onChange([...items, ...added])
    if (failed.length) setError(`Tidak bisa diunggah: ${failed.join(', ')}`)
    if (fileRef.current) fileRef.current.value = '' // izinkan pilih file yang sama lagi
    setBusy(false)
  }

  return (
    <div className="space-y-2 min-w-0">
      {items.map((it, i) => {
        const file = isFileUrl(it.url)
        return (
          <div key={i} className="space-y-1 p-1 border border-slate-200 rounded bg-white min-w-0">
            {file && isImageUrl(it.url) && <Thumb url={it.url} alt={it.label} />}
            <input
              type="text"
              value={it.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Nama berkas"
              className={CELL_INPUT}
            />
            <div className="flex items-center gap-1 min-w-0">
              {file ? (
                <span className="flex-1 min-w-0 text-[10px] text-slate-500 flex items-center gap-1">
                  <i className="fa-solid fa-file shrink-0" /> File terunggah
                </span>
              ) : (
                <input type="url" value={it.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://..." className={CELL_INPUT} />
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
        <button type="button" onClick={() => onChange([...items, { label: '', url: '' }])} className={`${BTN} text-emerald-700 bg-emerald-100 hover:bg-emerald-200`}>
          <i className="fa-solid fa-link" /> Tambah Link
        </button>
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={`${BTN} text-sky-700 bg-sky-100 hover:bg-sky-200 disabled:opacity-50`}>
          <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-upload'}`} /> {busy ? 'Mengunggah...' : 'Upload File'}
        </button>
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {error && <p className="text-[10px] text-rose-600">{error}</p>}
    </div>
  )
}