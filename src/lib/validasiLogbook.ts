import { JENIS_OUTPUT, hasKeterangan, statusOptions } from './config'
import { BULAN } from './LogbookData'
import { STATUS_PELAKSANAAN, type Attachment, type HeaderData } from '../types/monev'
import type { MonthData } from '../components/logbook/MonthlyLogTable'

export type Masalah = { level: 'galat' | 'peringatan'; pesan: string }
export interface EntriLogbook { header: HeaderData; bulanan: MonthData[]; catatanImport?: string[] }
export interface HasilEntri { nama: string; entri: EntriLogbook; masalah: Masalah[] }

type Out = MonthData['output']

const JENIS = JENIS_OUTPUT as readonly string[]
const STATUS_PELAKS = STATUS_PELAKSANAAN as readonly string[]

type Obj = Record<string, unknown>
const rec = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {})
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown) => (v == null ? '' : String(v).trim())
const angka = (v: unknown) => (typeof v === 'number' ? v : Number(str(v).replace('%', '').replace(',', '.')))
const kecil = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

const blankOutput = (): Out => ({ jenis: '', judul: '', status: '', capaian: 0, dataDukung: [] })
const blankMonth = (bulan: string): MonthData => ({
  bulan,
  aktivitas: { uraian: '', kendala: '', mitigasi: '', dataDukung: [] },
  output: blankOutput(),
})

/* ───────── Pemetaan teks bebas Excel -> nilai di config ───────── */

/** Penanda jenis yang sengaja diabaikan (Desain Industri bukan KI) */
const ABAIKAN = '\u0000abaikan'

/** '' = kosong, ABAIKAN = diabaikan, null = tidak dikenali */
function petaJenis(s: string): string | null {
  if (!s) return ''
  const t = kecil(s)
  const persis = JENIS.find((j) => kecil(j) === t)
  if (persis) return persis
  if (/desain industri|design industri|industrial design/.test(t)) return ABAIKAN
  if (/hak cipta/.test(t)) return 'Hak Cipta'
  if (/paten/.test(t)) return 'Paten'
  if (/\b(hki|ki)\b|kekayaan intelektual/.test(t)) return 'KI'
  if (/purwarupa|prototipe|prototype/.test(t)) return 'Purwarupa'
  if (/^model\b/.test(t)) return 'Model'
  if (/^(publikasi|jurnal|prosiding|artikel|makalah|paper|buku|book chapter)/.test(t)) return 'Publikasi'
  return null
}

const ALIAS_PELAKSANAAN: Record<string, string> = {
  pelaksanaan: 'Pelaksanaan / Berjalan',
  berjalan: 'Pelaksanaan / Berjalan',
  persiapan: 'Perencanaan',
  dimanfaatkan: 'Selesai',
}

/** Teks status bebas -> salah satu status valid untuk jenis tsb; null bila tidak ada yang cocok */
function petaStatusOutput(jenis: string, s: string): string | null {
  const list = statusOptions(jenis, '')
  const t = kecil(s)
  const persis = list.find((x) => kecil(x) === t)
  if (persis) return persis

  const aturan: [RegExp, string][] = [
    [/publish|terbit/, 'Published'],
    [/ac{1,2}ept|diterima/, 'Accepted'],
    [/regist|terdaftar|granted|diberikan/, 'Registered'],
    [/review/, 'In-Review'],
    [/submit/, 'Submitting'],
    [/draf/, jenis === 'Publikasi' ? 'Drafting' : 'Pengembangan'],
    [/pengembangan/, 'Pengembangan'],
    [/desain|design/, 'Design'],
    [/manufaktur|fabrikasi/, 'Manufakturing'],
    [/test|uji/, 'Testing'],
    [/finish|selesai/, 'FINISHED'],
  ]
  const hasil = aturan.find(([re, nilai]) => re.test(t) && list.includes(nilai))
  if (hasil) return hasil[1]
  // "Belum Mulai" = tahap paling awal dari jenis tsb
  if (/^belum/.test(t) && list.length) return list[0]
  return null
}

/* ───────── Normalisasi bagian-bagian ───────── */

/** Angka 0–100 bulat; menambah masalah bila perlu dibetulkan */
function persen(v: unknown, label: string, m: Masalah[]): number {
  if (v === '' || v == null) return 0
  const n = angka(v)
  if (!Number.isFinite(n)) {
    m.push({ level: 'peringatan', pesan: `${label}: "${str(v)}" bukan angka, dijadikan 0` })
    return 0
  }
  if (n < 0 || n > 100) m.push({ level: 'peringatan', pesan: `${label}: ${n} di luar 0–100, dipotong` })
  if (n > 0 && n < 1) m.push({ level: 'peringatan', pesan: `${label}: ${n} mungkin pecahan, pastikan bukan ${n * 100}%` })
  return Math.min(100, Math.max(0, Math.round(n)))
}

const adalahUrl = (s: string) => /^https?:\/\//i.test(s)
const namaSitus = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

/** Terima [{label,url}], [string] atau campuran. Teks biasa jadi { label: teks, url: '' } */
function lampiran(v: unknown): Attachment[] {
  return arr(v)
    .map((a): Attachment => {
      if (typeof a === 'string') {
        const s = a.trim()
        return adalahUrl(s) ? { label: namaSitus(s), url: s } : { label: s, url: '' }
      }
      const r = rec(a)
      const url = str(r.url)
      return { label: str(r.label) || (url ? namaSitus(url) : ''), url }
    })
    .filter((a) => a.label || a.url)
}

/** null = output diabaikan (Desain Industri) */
function normOutput(o: unknown, label: string, m: Masalah[]): Out | null {
  const r = rec(o)
  const judul = str(r.judul)
  const statusMentah = str(r.status)
  let keterangan = str(r.keterangan)

  let jenis = str(r.jenis)
  const dipetakan = petaJenis(jenis)
  if (dipetakan === ABAIKAN) {
    m.push({ level: 'peringatan', pesan: `${label}: output "${jenis}"${judul ? ` ("${judul}")` : ''} diabaikan karena Desain Industri tidak termasuk KI` })
    return null
  }
  if (dipetakan === null) m.push({ level: 'peringatan', pesan: `${label}: jenis "${jenis}" tidak ada di daftar` })
  else jenis = dipetakan

  let status = statusMentah
  if (jenis && JENIS.includes(jenis) && statusMentah) {
    const s = petaStatusOutput(jenis, statusMentah)
    if (s) {
      status = s
      // teks asli dipertahankan di keterangan bila jenisnya punya kolom keterangan
      if (hasKeterangan(jenis) && !keterangan && kecil(s) !== kecil(statusMentah)) keterangan = statusMentah
    } else {
      m.push({ level: 'peringatan', pesan: `${label}: status "${statusMentah}" tidak sesuai untuk jenis ${jenis}` })
    }
  }
  if (!jenis && (judul || statusMentah)) m.push({ level: 'peringatan', pesan: `${label}: jenis output kosong padahal judul/status terisi` })

  return {
    jenis,
    judul,
    status,
    capaian: persen(r.capaian, `${label} capaian`, m),
    dataDukung: lampiran(r.dataDukung),
    ...(keterangan ? { keterangan } : {}),
  }
}

function normEntri(raw: unknown, i: number): HasilEntri {
  const r = rec(raw)
  const h = rec(r.header)
  const m: Masalah[] = []

  const namaKetua = str(h.namaKetua)
  if (!namaKetua) m.push({ level: 'galat', pesan: 'Nama ketua kosong' })
  if (!str(h.judulAktivitas)) m.push({ level: 'peringatan', pesan: 'Judul aktivitas kosong' })

  const targetOutputs = arr(h.targetOutputs).flatMap((t, k) => {
    const x = rec(t)
    let jenis = str(x.jenis)
    const p = petaJenis(jenis)
    if (p === ABAIKAN) {
      m.push({ level: 'peringatan', pesan: `Target ${k + 1}: "${jenis}" diabaikan karena Desain Industri tidak termasuk KI` })
      return []
    }
    if (!jenis) m.push({ level: 'peringatan', pesan: `Target ${k + 1}: jenis kosong` })
    else if (p === null) m.push({ level: 'peringatan', pesan: `Target ${k + 1}: jenis "${jenis}" tidak ada di daftar` })
    else jenis = p
    return [{ jenis, jumlah: Math.max(1, Math.round(angka(x.jumlah)) || 1) }]
  })
  if (!targetOutputs.length) targetOutputs.push({ jenis: '', jumlah: 1 })

  let statusPelaksanaan = str(h.statusPelaksanaan)
  if (statusPelaksanaan && !STATUS_PELAKS.includes(statusPelaksanaan)) {
    const alias = ALIAS_PELAKSANAAN[kecil(statusPelaksanaan)]
    if (alias) {
      if (['persiapan', 'dimanfaatkan'].includes(kecil(statusPelaksanaan))) {
        m.push({ level: 'peringatan', pesan: `Status pelaksanaan "${statusPelaksanaan}" tidak ada di sistem, dipetakan ke "${alias}"` })
      }
      statusPelaksanaan = alias
    } else {
      m.push({ level: 'peringatan', pesan: `Status pelaksanaan "${statusPelaksanaan}" tidak ada di daftar` })
    }
  }

  const sumber = new Map(arr(r.bulanan).map((b) => [kecil(str(rec(b).bulan)), rec(b)]))
  const bulanan: MonthData[] = BULAN.map((nama) => {
    const b = sumber.get(kecil(nama))
    if (!b) return blankMonth(nama) // file per bulan: bulan lain memang tidak ada
    const a = rec(b.aktivitas)
    const output = normOutput(b.output, nama, m) ?? blankOutput()
    const tambahan = arr(b.outputTambahan)
      .map((o, k) => normOutput(o, `${nama} output ${k + 2}`, m))
      .filter((o): o is Out => o !== null)
    return {
      bulan: nama,
      aktivitas: { uraian: str(a.uraian), kendala: str(a.kendala), mitigasi: str(a.mitigasi), dataDukung: lampiran(a.dataDukung) },
      output,
      ...(tambahan.length ? { outputTambahan: tambahan } : {}),
    }
  })

  const header: HeaderData = {
    namaKetua,
    unitKerja: str(h.unitKerja),
    satuanKerja: str(h.satuanKerja),
    judulAktivitas: str(h.judulAktivitas),
    targetOutputs,
    progresTotal: persen(h.progresTotal, 'Progres total', m),
    progresKeterangan: str(h.progresKeterangan),
    statusPelaksanaan,
  }

  const catatanImport = arr(r.catatanImport).map(str).filter(Boolean)
  catatanImport.forEach((pesan) => m.push({ level: 'peringatan', pesan: `Catatan AI: ${pesan}` }))

  return { nama: namaKetua || `(Entri ${i + 1} tanpa nama)`, entri: { header, bulanan, catatanImport }, masalah: m }
}

/* ───────── Penggabungan antar file / dengan data tersimpan ───────── */

/** Bulan dianggap terisi bila ada teks aktivitas atau data output */
export const bulanAdaIsi = (b: MonthData): boolean =>
  !!(b.aktivitas.uraian || b.aktivitas.kendala || b.aktivitas.mitigasi || b.aktivitas.dataDukung.length) ||
  [b.output, ...(b.outputTambahan ?? [])].some(
    (o) => o.jenis || o.judul || o.status || o.keterangan || o.capaian > 0 || o.dataDukung.length,
  )

const indeksTerakhir = (e: EntriLogbook) => e.bulanan.reduce((n, b, i) => (bulanAdaIsi(b) ? i : n), -1)

/**
 * Gabung dua entri ketua yang sama, per bulan: bulan yang terisi di `baru` menggantikan bulan itu,
 * bulan lain dipertahankan dari `lama`. Header diambil dari entri yang bulan terisinya paling akhir;
 * isian yang kosong dilengkapi dari yang satunya.
 */
export function gabungEntri(lama: EntriLogbook, baru: EntriLogbook): EntriLogbook {
  const utama = indeksTerakhir(baru) >= indeksTerakhir(lama) ? baru : lama
  const hu = utama.header
  const hc = (utama === baru ? lama : baru).header

  const header: HeaderData = {
    ...hu,
    unitKerja: hu.unitKerja || hc.unitKerja,
    satuanKerja: hu.satuanKerja || hc.satuanKerja,
    judulAktivitas: hu.judulAktivitas || hc.judulAktivitas,
    targetOutputs: hu.targetOutputs.some((t) => t.jenis) ? hu.targetOutputs : hc.targetOutputs,
    progresTotal: hu.progresTotal || hc.progresTotal,
    progresKeterangan: hu.progresKeterangan || hc.progresKeterangan,
    statusPelaksanaan: hu.statusPelaksanaan || hc.statusPelaksanaan,
  }

  const bulanan = BULAN.map((nama) => {
    const b = baru.bulanan.find((x) => x.bulan === nama)
    if (b && bulanAdaIsi(b)) return b
    return lama.bulanan.find((x) => x.bulan === nama) ?? b ?? blankMonth(nama)
  })

  const catatanImport = [...new Set([...(lama.catatanImport ?? []), ...(baru.catatanImport ?? [])])]
  return { header, bulanan, catatanImport }
}

/** Terima { logbook: [...] }, array langsung, atau satu objek { header, bulanan } */
export function parseBerkas(teks: string): { hasil: HasilEntri[] } | { galat: string } {
  let data: unknown
  try { data = JSON.parse(teks) } catch (e) { return { galat: `File bukan JSON yang valid: ${(e as Error).message}` } }

  const daftar = Array.isArray(data) ? data : Array.isArray(rec(data).logbook) ? (rec(data).logbook as unknown[]) : rec(data).header ? [data] : null
  if (!daftar || !daftar.length) return { galat: 'Isi file tidak dikenali. Butuh { "logbook": [ { "header", "bulanan" } ] }.' }
  return { hasil: daftar.map(normEntri) }
}

/* ───────── Prompt untuk AI (daftar diambil dari config agar selalu sinkron) ───────── */

export function buatPrompt(dari = 0, sampai = 0, bulan = ''): string {
  const bulanTxt = bulan
    ? `

HANYA BULAN ${bulan.toUpperCase()}: kerjakan hanya sheet "Aktivitas Bulan ${bulan}" (di Excel kadang tertulis "Nopember" untuk November). Pada tiap ketua, "bulanan" hanya berisi SATU objek, yaitu bulan ${bulan}; bulan lain tidak perlu ditulis. Isi header (judul aktivitas, target output, progres total, status pelaksanaan) dari baris bulan ${bulan} ini.${dari > 0 ? '' : ' Tulis SEMUA ketua tim dari SEMUA pusat riset/unit kerja pada sheet itu, urut dari atas ke bawah, termasuk yang belum mengisi apa pun (bulannya dibiarkan kosong). Jangan memotong JSON di tengah.'}`
    : ''
  const batas =
    dari > 0 && sampai >= dari
      ? `

BATAS PEKERJAAN (WAJIB): Excel ini berisi puluhan ketua tim dan jawabanmu ada batas panjangnya. Kerjakan HANYA ketua tim urutan ke-${dari} sampai ke-${sampai}, dihitung dari atas ke bawah pada sheet "Aktivitas Bulan ${bulan || 'Januari'}" (baris judul unit seperti "PUSAT RISET ANTARIKSA" tidak dihitung; sheet bulan lain memakai nama ketua yang sama). Ketua di luar rentang itu jangan ditulis. Satu jawaban = satu file JSON utuh untuk rentang ini saja. Jangan memotong JSON di tengah: bila hampir melewati batas panjang, berhenti setelah ketua terakhir yang lengkap dan tutup JSON dengan benar.`
      : ''
  const jenis = JENIS.map((j) => `- ${j}: status = ${statusOptions(j, '').join(' | ')}${hasKeterangan(j) ? ' (boleh isi "keterangan")' : ''}`).join('\n')
  return `Ubah file Excel "Laporan progres aktivitas dan output" terlampir menjadi JSON logbook.${bulanTxt}${batas}

FORMAT KELUARAN (hanya JSON, tanpa teks lain):
{ "versi": 1, "tahun": 2026, "logbook": [ { "header": {...}, "bulanan": [12 bulan Januari..Desember], "catatanImport": [] } ] }

Satu objek logbook per Nama Ketua Tim. Data diambil dari sheet "Aktivitas Bulan <Nama>" (Nopember = November). Abaikan sheet Glosarium, REKAP, REKAP REALTIME dan teks "Laporan Bulan" di A3.

header:
- namaKetua, unitKerja, satuanKerja = kolom Nama Ketua Tim, Unit Kerja, Satuan Kerja (hapus spasi dan enter di ujung)
- judulAktivitas = Judul Aktivitas bulan terakhir yang terisi
- targetOutputs = kolom Target Output, dipecah menjadi [{ "jenis", "jumlah" }]. Contoh "1 HKI; 1 Publikasi Internasional" menjadi dua entri. Jika target berbeda-beda antarbulan, pakai yang paling lengkap dan tulis konfliknya di catatanImport
- progresTotal = Persentase Progres Pelaksanaan bulan terakhir yang terisi, angka bulat 0-100
- statusPelaksanaan = Status Pelaksanaan bulan terakhir yang terisi, salah satu dari: ${STATUS_PELAKS.join(', ')}. Pemetaan dari Excel: Perencanaan = Perencanaan, Persiapan = Perencanaan, Pelaksanaan = Pelaksanaan / Berjalan, Selesai = Selesai, Dimanfaatkan = Selesai
- progresKeterangan = "" kecuali ada keterangan yang jelas

bulanan (tiap bulan):
- aktivitas.uraian / kendala / mitigasi = salin PERSIS dari kolom Uraian Kemajuan, Kendala, Mitigasi. Jangan meringkas atau memperbaiki kata
- aktivitas.dataDukung dan output.dataDukung = [{ "label", "url" }] dari kolom Data Dukung. Jika isinya URL: label = nama situs singkat, url = URL-nya. Jika isinya teks biasa: label = teksnya, url = "". Satu entri per item
- output = Jenis Output, Judul Output, Status, Progres Capaian
- Jika satu bulan memuat beberapa output (judul bernomor 1., 2., ...), output pertama di "output", sisanya di "outputTambahan" dengan struktur sama
- bulan tanpa isian: biarkan kosong ("" dan 0, dataDukung [])

JENIS OUTPUT dan STATUS yang valid (pakai persis penulisan ini):
${jenis}

Pemetaan jenis output dari Excel (periset menulis bebas, petakan berdasarkan maknanya):
- Publikasi Global/Nasional/Internasional, Jurnal (global, internasional, nasional, dst.), Prosiding, Artikel, Buku = Publikasi
- Kekayaan Intelektual / HKI / KI = KI; jika jelas disebut paten = Paten; hak cipta = Hak Cipta
- Purwarupa / Prototipe = Purwarupa; Model = Model
- DESAIN INDUSTRI: ABAIKAN. Bukan KI dan tidak masuk logbook. Jangan buat output atau target untuknya, cukup catat di catatanImport (sebut bulan dan judulnya)
- "Naskah Kebijakan ..." belum ada di sistem: kosongkan jenis dan catat di catatanImport
Pemetaan status output: Drafting/draft = Drafting (KI: Pengembangan); Submit/Submitted/Final submit = Submitting; Reviewed/Under review = In-Review; Accepted/Diterima = Accepted; Published/Terbit = Published; Gambar Desain/Design = Design; Belum Mulai = status pertama dari jenisnya. Jika tidak ada yang cocok, kosongkan status dan catat di catatanImport.

Aturan angka: 0.1 menjadi 10, "40 %" menjadi 40, 70 tetap 70, 1.0 menjadi 100. Teks bukan angka di kolom persen menjadi 0 dan dicatat di catatanImport.

Isi Excel bervariasi: sel jenis, status, dan target sering memuat keterangan berlebih atau sinonim (mis. "Submit makalah ALICIA ke Jurnal Internasional", "Journal International (BEEI)", "Dalam proses perakitan", "1 HKI, 1 pub internasional"). Petakan berdasarkan MAKNA ke nilai valid di atas. Untuk Purwarupa dan Model, teks status asli yang berbeda dari status valid taruh di "keterangan". Kolom Progres Capaian yang berisi teks: ambil angka persen hanya bila jelas satu angka untuk output itu; selain itu isi 0 dan salin teks aslinya ke catatanImport.

LARANGAN: jangan mengarang URL, jenis output, status, atau isi. Jika tidak yakin, isi "" atau 0 dan jelaskan di catatanImport (sebut bulan dan nama kolom). Jangan menghapus ketua yang datanya kosong.`
}