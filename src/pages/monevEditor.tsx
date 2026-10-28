import { createContext, useContext, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  STATUS_PELAKSANAAN,
  clampPercent,
  emptyMonth,
  type Attachment,
  type HeaderData,
  type MonevMonth,
  type TargetOutput,
} from '../types/monev'

/* ═════════════════════════ Jenis Output & Status ═════════════════════════
 * Setiap jenis output punya daftar status sendiri (sesuai diagram).
 * Purwarupa dan Model punya tambahan kolom keterangan ("+ ket").
 */

const JENIS_OUTPUT = ['Purwarupa', 'Model', 'Publikasi', 'KI', 'Paten', 'Hak Cipta'] as const

const STATUS_PRODUK = ['Design', 'Manufakturing', 'Testing', 'FINISHED'] as const
const STATUS_PUBLIKASI = [
  'Design',
  'Manufakturing',
  'Testing',
  'Drafting',
  'Submitting',
  'In-Review',
  'Accepted',
  'Published',
] as const
const STATUS_KI = ['Pengembangan', 'Submitting', 'In-Review', 'Registered'] as const

const STATUS_BY_JENIS: Record<string, readonly string[]> = {
  Purwarupa: STATUS_PRODUK,
  Model: STATUS_PRODUK,
  Publikasi: STATUS_PUBLIKASI,
  KI: STATUS_KI,
  Paten: STATUS_KI,
  'Hak Cipta': STATUS_KI,
}

/** Jenis output yang punya kolom keterangan tambahan */
const JENIS_DENGAN_KETERANGAN: readonly string[] = ['Purwarupa', 'Model']

const hasKeterangan = (jenis: string) => JENIS_DENGAN_KETERANGAN.includes(jenis)

/** Status bawaan saat jenis diganti: pertahankan status lama bila masih valid, kalau tidak ambil yang pertama */
function defaultStatus(jenis: string, current: string): string {
  const list = STATUS_BY_JENIS[jenis]
  if (!list) return jenis ? current : ''
  return list.includes(current) ? current : list[0]
}

/** Daftar status untuk dropdown; status lama di luar daftar tetap ditampilkan agar tidak hilang */
function statusOptions(jenis: string, current: string): string[] {
  const list = STATUS_BY_JENIS[jenis] ?? []
  return current && !list.includes(current) ? [current, ...list] : [...list]
}

/** Warna badge status berdasarkan tahapnya: awal (abu), proses (kuning), selesai (hijau) */
const TONE_AWAL = 'bg-slate-100 text-slate-600 border-slate-300'
const TONE_PROSES = 'bg-amber-50 text-amber-700 border-amber-300'
const TONE_SELESAI = 'bg-emerald-50 text-emerald-700 border-emerald-300'
const TONE_TERLAMBAT = 'bg-red-50 text-red-700 border-red-300'

const STATUS_TONE: Record<string, string> = {
  'Belum Mulai': TONE_AWAL,
  Design: TONE_AWAL,
  Pengembangan: TONE_AWAL,
  Drafting: TONE_AWAL,
  Manufakturing: TONE_PROSES,
  Testing: TONE_PROSES,
  Submitting: TONE_PROSES,
  'In-Review': TONE_PROSES,
  Berjalan: TONE_PROSES,
  FINISHED: TONE_SELESAI,
  Accepted: TONE_SELESAI,
  Published: TONE_SELESAI,
  Registered: TONE_SELESAI,
  Selesai: TONE_SELESAI,
  Terlambat: TONE_TERLAMBAT,
}

const statusTone = (status: string) => STATUS_TONE[status] ?? TONE_AWAL

/** Opsi jenis output; nilai lama yang tidak ada di daftar baru tetap muncul agar data tidak hilang */
function JenisOptions({ current }: { current: string }) {
  const isLegacy = current !== '' && !(JENIS_OUTPUT as readonly string[]).includes(current)
  return (
    <>
      {isLegacy && <option value={current}>{current} (lama)</option>}
      {JENIS_OUTPUT.map((j) => (
        <option key={j} value={j}>{j}</option>
      ))}
    </>
  )
}

/* ═════════════════════════ Shared ═════════════════════════ */

/** Teks panjang (URL, kata tanpa spasi) tetap turun ke baris baru, tidak melebarkan tabel */
const WRAP = '[overflow-wrap:anywhere]'

/**
 * CSS cetak: A4 landscape, tabel dipadatkan agar muat satu halaman.
 * Disisipkan sebagai <style> sehingga tidak perlu file CSS terpisah.
 */
const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 8mm; }

  html, body {
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .no-print { display: none !important; }

  #headerCard, #mainTable {
    width: 100% !important;
    max-width: 100% !important;
    box-shadow: none !important;
  }

  #headerCard { margin-bottom: 4mm; break-inside: avoid; }

  #mainTable { table-layout: fixed; font-size: 8.5px; line-height: 1.25; }
  #mainTable th, #mainTable td { padding: 2px 3px !important; }
  #mainTable thead { display: table-header-group; }
  #mainTable tr { break-inside: avoid; }
}
`

function PrintStyles() {
  return <style>{PRINT_CSS}</style>
}

/* ═════════════════════════ Input Persentase ═════════════════════════ */

/**
 * Input angka 0–100 yang memakai teks lokal, sehingga:
 * - kolom boleh kosong saat mengetik (angka 0 awal bisa dihapus),
 * - angka 0 di depan otomatis dibersihkan ("080" -> "80"),
 * - nilai dibatasi maksimum 100,
 * - saat keluar fokus dan kosong, kembali menjadi 0.
 * Ke parent selalu dikirim angka (kosong dianggap 0).
 */
function PercentInput({ value, onChange, className }: {
  value: number
  onChange: (next: number) => void
  className?: string
}) {
  const [text, setText] = useState(String(clampPercent(value)))
  const [prevValue, setPrevValue] = useState(value)

  // Sinkron bila nilai dari luar berubah (mis. data di-reset), tanpa mengganggu ketikan user
  if (value !== prevValue) {
    setPrevValue(value)
    const current = text === '' ? 0 : Number(text)
    if (current !== value) setText(String(clampPercent(value)))
  }

  const handleChange = (raw: string) => {
    let digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    if (digits !== '' && Number(digits) > 100) digits = '100'
    setText(digits)
    const next = digits === '' ? 0 : Number(digits)
    setPrevValue(next)
    onChange(next)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        if (text === '') setText('0')
      }}
      className={className}
    />
  )
}

/* ═════════════════════════ Upload File ═════════════════════════ */

/** Batas ukuran per file (byte). File disimpan di data, jadi dibatasi agar tidak terlalu berat. */
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

/** Fungsi unggah: menerima File, mengembalikan URL yang disimpan di data. */
export type UploadFn = (file: File) => Promise<string>

/** Bawaan: ubah file menjadi data URL (tersimpan langsung di dalam data, tanpa server) */
const readAsDataUrl: UploadFn = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * Konteks unggah. Secara bawaan file disimpan sebagai data URL.
 * Bila sudah ada server/storage, berikan prop `uploadFile` ke <MonevReport />
 * yang mengunggah file lalu mengembalikan URL-nya.
 */
const UploadContext = createContext<UploadFn>(readAsDataUrl)

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
  const win = window.open('', '_blank') // dibuka dulu agar tidak diblokir popup blocker
  try {
    const blob = await (await fetch(url)).blob()
    const objectUrl = URL.createObjectURL(blob)
    if (win) win.location.href = objectUrl
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  } catch {
    win?.close()
  }
}

/* ═════════════════════════ ActivityHeader ═════════════════════════ */

interface ActivityHeaderProps {
  initialData: HeaderData
  onSave?: (updatedData: HeaderData) => void
}

const HEADER_INPUT =
  'min-w-0 p-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none'
const LABEL_CELL = `w-[28%] py-2 px-4 font-medium text-slate-500 bg-slate-50/50 ${WRAP}`
const VALUE_CELL = `min-w-0 py-2 px-4 ${WRAP}`
const ROW_BORDER = 'border-b border-slate-100'

function Row({ label, children, last = false, alignTop = false }: {
  label: string
  children: ReactNode
  last?: boolean
  alignTop?: boolean
}) {
  return (
    <tr className={last ? '' : ROW_BORDER}>
      <td className={`${LABEL_CELL} ${alignTop ? 'align-top' : ''}`}>{label}</td>
      <td className={VALUE_CELL}>{children}</td>
    </tr>
  )
}

function Locked({ show }: { show: boolean }) {
  return show ? <span className="text-[10px] text-slate-400 font-normal ml-2">(Terkunci)</span> : null
}

/** Baris read-only (Nama Ketua, Unit Kerja, Satuan Kerja) */
function LockedRow({ label, value, bold = false, editing }: {
  label: string
  value: string
  bold?: boolean
  editing: boolean
}) {
  return (
    <Row label={label}>
      <span className={bold ? 'font-semibold text-slate-800' : 'text-slate-800'}>{value}</span>
      <Locked show={editing} />
    </Row>
  )
}

export function ActivityHeader({ initialData, onSave }: ActivityHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState<HeaderData>(initialData) // data terakhir yang disimpan
  const [draft, setDraft] = useState<HeaderData>(initialData) // data yang sedang diedit

  const data = isEditing ? draft : saved

  /* ── Handlers ── */
  const setField = <K extends keyof HeaderData>(field: K, value: HeaderData[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }))

  const setOutput = (index: number, patch: Partial<TargetOutput>) =>
    setDraft((prev) => ({
      ...prev,
      targetOutputs: prev.targetOutputs.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }))

  const addOutput = () =>
    setDraft((prev) => ({
      ...prev,
      targetOutputs: [...prev.targetOutputs, { jenis: JENIS_OUTPUT[0], jumlah: 1 }],
    }))

  const removeOutput = (index: number) =>
    setDraft((prev) => ({ ...prev, targetOutputs: prev.targetOutputs.filter((_, i) => i !== index) }))

  const startEdit = () => {
    setDraft(saved)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(saved) // buang perubahan
    setIsEditing(false)
  }

  const handleSave = () => {
    setSaved(draft)
    setIsEditing(false)
    onSave?.(draft)
  }

  /* ── Render ── */
  return (
    <div
      id="headerCard"
      className="bg-white shadow-md rounded-lg overflow-hidden border border-slate-200 w-full max-w-full min-w-0"
    >
      {/* Bar judul */}
      <div
        className={`px-6 py-3 font-semibold text-lg flex items-center justify-between gap-3 text-white ${
          isEditing ? 'bg-amber-600' : 'bg-gov-700'
        }`}
      >
        <span className={`min-w-0 ${WRAP}`}>
          <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-folder-open'} mr-2`} />
          {isEditing ? 'Edit Detail Aktivitas' : 'Detail Aktivitas & Progres Kegiatan'}
        </span>

        <div className="flex items-center gap-2 shrink-0 no-print">
          {isEditing ? (
            <span className="text-xs bg-amber-700 px-3 py-1 rounded-full text-amber-100">Mode Edit</span>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="px-3 py-1 bg-gov-800 hover:bg-gov-900 border border-gov-500 rounded text-xs text-white transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-pen-to-square" /> Edit Detail
            </button>
          )}
        </div>
      </div>

      {/* Isi */}
      <div className={`p-4 ${isEditing ? 'bg-amber-50/30' : ''}`}>
        <table className="w-full table-fixed text-sm border-collapse">
          <tbody>
            <LockedRow label="Nama Ketua" value={data.namaKetua} bold editing={isEditing} />
            <LockedRow label="Unit Kerja" value={data.unitKerja} editing={isEditing} />
            <LockedRow label="Satuan Kerja" value={data.satuanKerja} editing={isEditing} />

            <Row label="Judul Aktivitas">
              {isEditing ? (
                <input
                  type="text"
                  value={data.judulAktivitas}
                  onChange={(e) => setField('judulAktivitas', e.target.value)}
                  className={`w-full p-2 text-sm ${HEADER_INPUT}`}
                />
              ) : (
                <span className="font-medium text-slate-800">{data.judulAktivitas}</span>
              )}
            </Row>

            <Row label="Target Output Utama" alignTop>
              {isEditing ? (
                <div>
                  <div className="space-y-2">
                    {data.targetOutputs.map((out, idx) => (
                      <div key={idx} className="flex items-center gap-2 min-w-0">
                        <select
                          value={out.jenis}
                          onChange={(e) => setOutput(idx, { jenis: e.target.value })}
                          className={`flex-1 ${HEADER_INPUT}`}
                        >
                          <JenisOptions current={out.jenis} />
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={out.jumlah}
                          onChange={(e) => setOutput(idx, { jumlah: parseInt(e.target.value) || 1 })}
                          className={`w-20 shrink-0 text-center ${HEADER_INPUT}`}
                        />
                        <span className="text-xs text-slate-500 shrink-0">buah</span>
                        {data.targetOutputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOutput(idx)}
                            aria-label="Hapus target output"
                            className="text-rose-500 hover:text-rose-700 p-1 text-xs shrink-0"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addOutput}
                    className="mt-2 text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded font-medium transition flex items-center gap-1"
                  >
                    <i className="fa-solid fa-plus" /> Tambah Target Output
                  </button>
                </div>
              ) : (
                <table className="w-full max-w-lg table-fixed text-xs border border-slate-200 rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="p-2 text-left">Jenis Output</th>
                      <th className="p-2 text-center w-28">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.targetOutputs.map((out, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className={`p-2 font-medium text-slate-700 ${WRAP}`}>{out.jenis}</td>
                        <td className="p-2 text-center font-semibold text-slate-800">{out.jumlah} buah</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Row>

            <Row label="Progres Total Aktivitas">
              {isEditing ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <PercentInput
                      value={data.progresTotal}
                      onChange={(next) => setField('progresTotal', next)}
                      className={`w-20 text-sm text-center font-bold text-emerald-600 ${HEADER_INPUT}`}
                    />
                    <span className="font-bold text-slate-600">%</span>
                  </div>
                  <input
                    type="text"
                    value={data.progresKeterangan}
                    onChange={(e) => setField('progresKeterangan', e.target.value)}
                    placeholder="Keterangan progres..."
                    className={`flex-1 ${HEADER_INPUT}`}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                  <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full"
                      style={{ width: `${clampPercent(data.progresTotal)}%` }}
                    />
                  </div>
                  <span className={`min-w-0 font-semibold text-emerald-600 ${WRAP}`}>
                    {data.progresTotal}%{' '}
                    <span className="font-normal text-slate-500 text-xs">({data.progresKeterangan})</span>
                  </span>
                </div>
              )}
            </Row>

            <Row label="Status Pelaksanaan" last>
              {isEditing ? (
                <select
                  value={data.statusPelaksanaan}
                  onChange={(e) => setField('statusPelaksanaan', e.target.value)}
                  className={`max-w-full p-2 ${HEADER_INPUT}`}
                >
                  {STATUS_PELAKSANAAN.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                  {data.statusPelaksanaan}
                </span>
              )}
            </Row>
          </tbody>
        </table>

        {isEditing && (
          <div className="mt-4 flex justify-end gap-2 no-print">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-gov-700 hover:bg-gov-800 text-white rounded text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-check" /> Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded text-xs font-semibold transition"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════ MonevRow ═════════════════════════ */

/* Status output sekarang bebas per jenis (string) dan ada keterangan opsional,
 * jadi tipe bulan diperluas di sini tanpa perlu mengubah file types.
 * Output pertama disimpan di `output`, output tambahan di `outputTambahan`. */
type MonthOutput = Omit<MonevMonth['output'], 'status'> & { status: string; keterangan?: string }
export type MonthData = Omit<MonevMonth, 'output'> & {
  output: MonthOutput
  outputTambahan?: MonthOutput[]
}

interface MonevRowProps {
  /** Data 12 bulan dari parent (sama seperti pola ActivityHeader) */
  initialData: MonthData[]
  /** Dipanggil setiap ada baris yang disimpan atau dikosongkan, berisi seluruh data bulanan terbaru */
  onSave?(updatedData: MonthData[]): void
}

/* Lebar kolom dalam persen, total 100, jadi tabel selalu pas selebar kartu
 * (tanpa scroll ke kanan). Kolom terakhir (Tindakan) disembunyikan saat cetak;
 * kolom lain otomatis melebar mengisi halaman. */
const COLUMN_WIDTHS = [
  6,  // Bulan
  11, // Uraian Kemajuan Aktivitas
  9,  // Kendala Ditemui
  9,  // Mitigasi / Rencana Tindak Lanjut
  8,  // Data Dukung Progres
  8,  // Jenis Output
  11, // Judul Output
  10, // Status (+ keterangan)
  9,  // Persentase Progres (%)
  8,  // Data Dukung Output
  11, // Tindakan
] as const

const AKTIVITAS_HEADERS = [
  'Uraian Kemajuan Aktivitas',
  'Kendala Ditemui',
  'Mitigasi / Rencana Tindak Lanjut',
  'Data Dukung Progres',
] as const

const OUTPUT_HEADERS = ['Jenis Output', 'Judul Output', 'Status', 'Persentase Progres (%)', 'Data Dukung Output'] as const

const CARD = 'bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden w-full max-w-full min-w-0'
const CELL = `p-1.5 border-r border-slate-200 align-top min-w-0 whitespace-pre-line ${WRAP}` // border-bawah diatur per baris
const CELL_INPUT =
  'w-full min-w-0 p-1 border border-slate-300 rounded text-[11px] focus:ring-2 focus:ring-amber-500 focus:outline-none'
const HEAD_CELL = `p-1.5 border-r ${WRAP}`

const Dash = () => <span className="text-slate-400">–</span>

/** Teks biasa saat dilihat, input/textarea saat diedit */
function TextField({ editing, value, onChange, multiline = false }: {
  editing: boolean
  value: string
  onChange: (next: string) => void
  multiline?: boolean
}) {
  if (!editing) return value ? <>{value}</> : <Dash />
  return multiline ? (
    <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={CELL_INPUT} />
  ) : (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={CELL_INPUT} />
  )
}

/** Daftar data dukung (mode lihat): link biasa atau file terunggah, gambar tampil sebagai thumbnail */
function AttachmentList({ items }: { items: Attachment[] }) {
  if (!items.length) return <Dash />
  return (
    <ul className="space-y-1 min-w-0">
      {items.map((item, i) => {
        const isFile = isDataUrl(item.url)
        const name = item.label || (isFile ? 'Berkas' : item.url)
        return (
          <li key={`${item.label}-${i}`} className="min-w-0">
            {isImageUrl(item.url) && (
              <img
                src={item.url}
                alt={name}
                className="mb-1 max-h-16 max-w-full rounded border border-slate-200 object-cover"
              />
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

/** Editor data dukung: tambah link atau upload file/gambar (bisa banyak sekaligus) */
function AttachmentEditor({ items, onChange }: { items: Attachment[]; onChange: (next: Attachment[]) => void }) {
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
    if (fileRef.current) fileRef.current.value = '' // izinkan memilih file yang sama lagi
    setBusy(false)
  }

  return (
    <div className="space-y-2 min-w-0">
      {items.map((item, i) => {
        const isFile = isDataUrl(item.url)
        return (
          <div key={i} className="space-y-1 p-1 border border-slate-200 rounded bg-white min-w-0">
            {isFile && isImageUrl(item.url) && (
              <img
                src={item.url}
                alt={item.label}
                className="max-h-16 max-w-full rounded border border-slate-200 object-cover"
              />
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
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-[10px] text-rose-600">{error}</p>}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const pct = clampPercent(value)
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="h-1.5 flex-1 min-w-0 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-semibold text-slate-700 text-[11px]">{pct}%</span>
    </div>
  )
}

/** Tombol di kolom Tindakan, selalu dengan keterangan teks */
function ActionButton({ label, icon, onClick, className }: {
  label: string
  icon: string
  onClick: () => void
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] leading-tight font-medium transition ${className}`}
    >
      <i className={`fa-solid ${icon} shrink-0`} />
      <span>{label}</span>
    </button>
  )
}

/* ── Satu bulan (bisa terdiri dari beberapa baris output) ── */

/** Output kosong untuk baris tambahan: jenis dan status dipilih user */
const blankOutput = (): MonthOutput => ({ ...emptyMonth('').output, status: '', keterangan: '' })
const outputsOf = (m: MonthData): MonthOutput[] => [m.output, ...(m.outputTambahan ?? [])]

interface MonthRowProps {
  month: MonthData
  onSave: (next: MonthData) => void
  onClear: () => void
}

function MonthRow({ month, onSave, onClear }: MonthRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<MonthData>(month)

  const data = isEditing ? draft : month
  const { aktivitas } = data
  const outputs = outputsOf(data)
  const span = outputs.length

  const setAktivitas = (patch: Partial<MonevMonth['aktivitas']>) =>
    setDraft((prev) => ({ ...prev, aktivitas: { ...prev.aktivitas, ...patch } }))

  const setOutputAt = (index: number, patch: Partial<MonthOutput>) =>
    setDraft((prev) =>
      index === 0
        ? { ...prev, output: { ...prev.output, ...patch } }
        : {
            ...prev,
            outputTambahan: (prev.outputTambahan ?? []).map((o, i) => (i === index - 1 ? { ...o, ...patch } : o)),
          },
    )

  /** Ganti jenis: status menyesuaikan daftar jenis baru, keterangan hanya untuk Purwarupa/Model */
  const changeJenis = (index: number, current: MonthOutput, jenis: string) =>
    setOutputAt(index, {
      jenis,
      status: defaultStatus(jenis, current.status),
      keterangan: hasKeterangan(jenis) ? current.keterangan ?? '' : '',
    })

  const removeOutput = (index: number) =>
    setDraft((prev) => ({
      ...prev,
      outputTambahan: (prev.outputTambahan ?? []).filter((_, i) => i !== index - 1),
    }))

  /** Menambah baris output; jika belum mode edit, otomatis masuk mode edit */
  const addOutput = () => {
    const base = isEditing ? draft : month
    setDraft({ ...base, outputTambahan: [...(base.outputTambahan ?? []), blankOutput()] })
    setIsEditing(true)
  }

  const startEdit = () => {
    setDraft(month)
    setIsEditing(true)
  }

  const handleSave = () => {
    onSave(draft)
    setIsEditing(false)
  }

  const handleClear = () => {
    if (window.confirm(`Kosongkan seluruh isian bulan ${month.bulan}?`)) onClear()
  }

  const rowClass = isEditing ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'
  const mergedCell = `${CELL} border-b border-slate-200`

  return (
    <>
      {outputs.map((output, idx) => {
        const isFirst = idx === 0
        const isLast = idx === span - 1
        // Antar-output dipisah garis putus-putus; antar-bulan garis penuh
        const cell = `${CELL} border-b ${isLast ? 'border-slate-200' : 'border-dashed border-slate-300'}`

        return (
          <tr key={idx} className={rowClass}>
            {/* Kolom yang di-merge: hanya ada di baris pertama, membentang ke semua baris output */}
            {isFirst && (
              <>
                <td rowSpan={span} className={`${mergedCell} font-semibold text-slate-800`}>{data.bulan}</td>
                <td rowSpan={span} className={mergedCell}>
                  <TextField editing={isEditing} multiline value={aktivitas.uraian} onChange={(uraian) => setAktivitas({ uraian })} />
                </td>
                <td rowSpan={span} className={mergedCell}>
                  <TextField editing={isEditing} multiline value={aktivitas.kendala} onChange={(kendala) => setAktivitas({ kendala })} />
                </td>
                <td rowSpan={span} className={mergedCell}>
                  <TextField editing={isEditing} multiline value={aktivitas.mitigasi} onChange={(mitigasi) => setAktivitas({ mitigasi })} />
                </td>
                <td rowSpan={span} className={mergedCell}>
                  {isEditing ? (
                    <AttachmentEditor items={aktivitas.dataDukung} onChange={(dataDukung) => setAktivitas({ dataDukung })} />
                  ) : (
                    <AttachmentList items={aktivitas.dataDukung} />
                  )}
                </td>
              </>
            )}

            {/* Jenis Output */}
            <td className={cell}>
              {isEditing && !isFirst && (
                <button
                  type="button"
                  onClick={() => removeOutput(idx)}
                  className="mb-1 flex items-center gap-1 text-[10px] font-medium text-rose-600 hover:text-rose-800"
                >
                  <i className="fa-solid fa-trash" /> Hapus output
                </button>
              )}
              {isEditing ? (
                <select
                  value={output.jenis}
                  onChange={(e) => changeJenis(idx, output, e.target.value)}
                  className={CELL_INPUT}
                >
                  <option value="">– Pilih –</option>
                  <JenisOptions current={output.jenis} />
                </select>
              ) : (
                output.jenis || <Dash />
              )}
            </td>

            {/* Judul Output */}
            <td className={cell}>
              <TextField editing={isEditing} value={output.judul} onChange={(judul) => setOutputAt(idx, { judul })} />
            </td>

            {/* Status: pilihan mengikuti jenis output; Purwarupa/Model punya keterangan */}
            <td className={cell}>
              {isEditing ? (
                <div className="space-y-1 min-w-0">
                  <select
                    value={output.jenis ? output.status : ''}
                    disabled={!output.jenis}
                    onChange={(e) => setOutputAt(idx, { status: e.target.value })}
                    className={CELL_INPUT}
                  >
                    {output.jenis ? (
                      statusOptions(output.jenis, output.status).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))
                    ) : (
                      <option value="">Pilih jenis dulu</option>
                    )}
                  </select>
                  {hasKeterangan(output.jenis) && (
                    <textarea
                      rows={2}
                      value={output.keterangan ?? ''}
                      onChange={(e) => setOutputAt(idx, { keterangan: e.target.value })}
                      placeholder="Keterangan"
                      className={CELL_INPUT}
                    />
                  )}
                </div>
              ) : output.jenis && output.status ? (
                <>
                  <span className={`inline-block px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${statusTone(output.status)}`}>
                    {output.status}
                  </span>
                  {hasKeterangan(output.jenis) && output.keterangan && (
                    <p className="mt-1 text-[10px] text-slate-500 whitespace-pre-line">{output.keterangan}</p>
                  )}
                </>
              ) : (
                <Dash />
              )}
            </td>

            {/* Persentase Progres (field data tetap bernama `capaian`) */}
            <td className={cell}>
              {isEditing ? (
                <div className="flex items-center gap-1 min-w-0">
                  <PercentInput
                    value={output.capaian}
                    onChange={(capaian) => setOutputAt(idx, { capaian })}
                    className={`${CELL_INPUT} text-center font-bold text-emerald-600`}
                  />
                  <span className="font-bold text-slate-600 shrink-0">%</span>
                </div>
              ) : (
                <ProgressBar value={output.capaian} />
              )}
            </td>

            {/* Data dukung output */}
            <td className={cell}>
              {isEditing ? (
                <AttachmentEditor items={output.dataDukung} onChange={(dataDukung) => setOutputAt(idx, { dataDukung })} />
              ) : (
                <AttachmentList items={output.dataDukung} />
              )}
            </td>

            {/* Tindakan: satu set tombol per bulan, di-merge */}
            {isFirst && (
              <td rowSpan={span} className="p-1.5 align-top min-w-0 border-b border-slate-200 no-print">
                <div className="flex flex-col gap-1">
                  {isEditing ? (
                    <>
                      <ActionButton label="Simpan" icon="fa-check" onClick={handleSave} className="bg-gov-700 hover:bg-gov-800 text-white font-semibold" />
                      <ActionButton label="Tambah Output" icon="fa-plus" onClick={addOutput} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700" />
                      <ActionButton label="Batal" icon="fa-xmark" onClick={() => setIsEditing(false)} className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold" />
                    </>
                  ) : (
                    <>
                      <ActionButton label="Edit" icon="fa-pen" onClick={startEdit} className="bg-gov-600 hover:bg-gov-700 text-white" />
                      <ActionButton label="Tambah Output" icon="fa-plus" onClick={addOutput} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700" />
                      <ActionButton label="Kosongkan" icon="fa-eraser" onClick={handleClear} className="bg-white hover:bg-red-50 text-red-600 border border-red-200" />
                    </>
                  )}
                </div>
              </td>
            )}
          </tr>
        )
      })}
    </>
  )
}

/* ── Tabel 12 bulan ── */

export function MonevRow({ initialData, onSave }: MonevRowProps) {
  const [rows, setRows] = useState<MonthData[]>(initialData)

  const commit = (index: number, next: MonthData) => {
    const updated = rows.map((r, i) => (i === index ? next : r))
    setRows(updated)
    onSave?.(updated)
  }

  const lastCol = COLUMN_WIDTHS.length - 1

  return (
    <div className={CARD}>
      <PrintStyles />

      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-3 no-print">
        <h3 className="font-bold text-slate-700 text-base min-w-0">
          <i className="fa-solid fa-calendar-days mr-2 text-gov-600" />
          Log Progres Bulanan (Januari - Desember)
        </h3>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5 shrink-0"
        >
          <i className="fa-solid fa-print" /> Cetak Laporan
        </button>
      </div>

      <table id="mainTable" className="w-full max-w-full table-fixed text-left text-[11px] border-collapse">
        <colgroup>
          {COLUMN_WIDTHS.map((width, i) => (
            <col key={i} style={{ width: `${width}%` }} className={i === lastCol ? 'no-print' : undefined} />
          ))}
        </colgroup>

        <thead>
          <tr className="bg-gov-700 text-white text-center font-semibold border-b border-gov-800">
            <th rowSpan={2} className={`p-2 border-r border-gov-600 ${WRAP}`}>Bulan</th>
            <th colSpan={AKTIVITAS_HEADERS.length} className="p-2 border-r border-gov-600 bg-gov-800 uppercase tracking-wider">
              Progres Aktivitas / Kegiatan
            </th>
            <th colSpan={OUTPUT_HEADERS.length} className="p-2 border-r border-gov-600 bg-slate-800 uppercase tracking-wider">
              Progres Capaian Output
            </th>
            <th rowSpan={2} className="p-2 no-print">Tindakan</th>
          </tr>
          <tr className="bg-gov-600 text-white text-center font-medium">
            {AKTIVITAS_HEADERS.map((label) => (
              <th key={label} className={`${HEAD_CELL} border-gov-500`}>{label}</th>
            ))}
            {OUTPUT_HEADERS.map((label) => (
              <th key={label} className={`${HEAD_CELL} border-slate-700`}>{label}</th>
            ))}
          </tr>
        </thead>

        <tbody id="tableBody">
          {rows.map((month, i) => (
            <MonthRow
              key={month.bulan}
              month={month}
              onSave={(next) => commit(i, next)}
              onClear={() => commit(i, emptyMonth(month.bulan))}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ═════════════════════════ Gabungan (default export) ═════════════════════════ */

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** Data kosong bawaan, dipakai bila komponen dirender tanpa props */
const emptyHeader = (): HeaderData =>
  ({
    namaKetua: '',
    unitKerja: '',
    satuanKerja: '',
    judulAktivitas: '',
    targetOutputs: [{ jenis: JENIS_OUTPUT[0], jumlah: 1 }],
    progresTotal: 0,
    progresKeterangan: '',
    statusPelaksanaan: STATUS_PELAKSANAAN[0],
  }) as HeaderData

const emptyMonths = (): MonthData[] => NAMA_BULAN.map((bulan) => emptyMonth(bulan))

interface MonevReportProps {
  /** Opsional: bila tidak diisi, header tampil kosong */
  headerData?: HeaderData
  /** Opsional: bila tidak diisi, 12 bulan tampil kosong */
  monthsData?: MonthData[]
  onSaveHeader?: (updatedData: HeaderData) => void
  onSaveMonths?(updatedData: MonthData[]): void
  /**
   * Opsional: fungsi unggah file ke server/storage, mengembalikan URL berkas.
   * Bila tidak diisi, file disimpan langsung sebagai data URL (maks. 5 MB per file).
   */
  uploadFile?: UploadFn
}

/** Header aktivitas + tabel log bulanan dalam satu komponen */
export default function MonevReport({
  headerData = emptyHeader(),
  monthsData = emptyMonths(),
  onSaveHeader,
  onSaveMonths,
  uploadFile = readAsDataUrl,
}: MonevReportProps) {
  return (
    <UploadContext.Provider value={uploadFile}>
      <div className="space-y-4 w-full max-w-full min-w-0">
        <ActivityHeader initialData={headerData} onSave={onSaveHeader} />
        <MonevRow initialData={monthsData} onSave={onSaveMonths} />
      </div>
    </UploadContext.Provider>
  )
}