import { JENIS_OUTPUT, hasKeterangan, statusOptions } from './config'
import { BULAN } from './LogbookData'
import { STATUS_PELAKSANAAN, type Attachment, type HeaderData } from '../types/monev'
import type { MonthData } from '../components/logbook/logbookTable/MonthlyLogTable'

export type Masalah = { level: 'galat' | 'peringatan'; pesan: string }
export interface EntriLogbook { header: HeaderData; bulanan: MonthData[]; catatanImport?: string[] }
export interface HasilEntri { nama: string; entri: EntriLogbook; masalah: Masalah[] }

/** ID stabil untuk satu masalah (dipakai untuk menandai "selesai" di daftar validasi) */
export const idMasalah = (nama: string, m: Masalah) => `${nama}|${m.level}|${m.pesan}`

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

/**
 * Teks status bebas -> salah satu status valid untuk jenis tsb (sesuai config.ts); null bila tidak ada yang cocok.
 * Tiap aturan = [pola pada teks Excel, pola pada nama status di daftar jenis itu].
 * Urutan dari tahap paling akhir ke paling awal; aturan yang tidak punya padanan di jenis itu dilewati.
 */
function petaStatusOutput(jenis: string, s: string): string | null {
  const list = statusOptions(jenis, '')
  const t = kecil(s)
  const persis = list.find((x) => kecil(x) === t)
  if (persis) return persis

  const aturan: [RegExp, RegExp][] = [
    [/publish|terbit/, /^published$/],
    [/granted|diberi/, /granted|diberi/],
    [/regist|terdaftar/, /terdaftar|registered/],
    [/ac{1,2}ept|diterima/, /accepted/],
    [/review/, /review/],
    [/submit/, /submit/],
    [/test|uji|selesai|finish/, /uji|selesai/],
    [/manufaktur|manufactur|fabrikasi|perakitan|rakit/, /manufaktur/],
    [/draf/, /^draf/],
    [/draf|pengembangan/, /desain/], // Purwarupa/Model tidak punya "Draf": tahap awalnya Desain
    [/desain|design|gambar/, /desain/],
  ]
  for (const [pola, polaItem] of aturan) {
    if (!pola.test(t)) continue
    const item = list.find((x) => polaItem.test(kecil(x)))
    if (item) return item
  }
  // "Belum Mulai" = tahap paling awal dari jenis tsb
  if (/^belum/.test(t) && list.length) return list[0]
  return null
}

/* ───────── Pemecahan sel yang memuat beberapa output ───────── */

/** Penanda butir: "* ", "• ", "- ", "1. ", "2) " di awal baris */
const MARKA = /^\s*(?:[*•·]\s*|[-–—]\s+|\d{1,2}[.)]\s+)/

/** Judul: baris bertanda memulai butir baru, baris tanpa tanda disambung ke butir sebelumnya */
function butirJudul(s: string): { butir: string[]; bertanda: number } {
  const butir: string[] = []
  let bertanda = 0
  for (const baris of s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)) {
    if (MARKA.test(baris)) {
      bertanda++
      butir.push(baris.replace(MARKA, '').trim())
    } else if (butir.length) butir[butir.length - 1] += ` ${baris}`
    else butir.push(baris)
  }
  return { butir, bertanda }
}

/** Jenis/status: satu baris = satu nilai (tanda butir dibuang) */
const barisDari = (s: string): string[] =>
  s.split(/\r?\n/).map((x) => x.replace(MARKA, '').trim()).filter(Boolean)

/**
 * Bila Judul Output memuat >= 2 butir bertanda, pecah menjadi beberapa output.
 * Jenis dan status dipasangkan berurutan bila jumlah barisnya sama dengan jumlah butir;
 * bila tidak sama, butir ke-2 dst dibiarkan kosong (tidak ditebak) dan diberi peringatan.
 */
function pecahOutput(o: unknown, label: string, m: Masalah[]): Obj[] {
  const r = rec(o)
  const { butir, bertanda } = butirJudul(str(r.judul))
  if (bertanda < 2 || butir.length < 2) return [r]

  const n = butir.length
  const jenis = barisDari(str(r.jenis))
  const status = barisDari(str(r.status))
  const pilih = (daftar: string[], i: number, asli: unknown) =>
    daftar.length === n ? daftar[i] : i === 0 ? str(asli) : ''

  const lengkap = jenis.length === n && status.length === n
  m.push({
    level: 'peringatan',
    pesan: `${label}: judul output berisi ${n} butir, dipecah menjadi ${n} output.${
      lengkap ? '' : ' Jenis/status butir ke-2 dan seterusnya belum terisi di Excel, lengkapi lewat tombol Edit'
    }`,
  })

  return butir.map((judul, i) => ({
    jenis: pilih(jenis, i, r.jenis),
    judul,
    status: pilih(status, i, r.status),
    capaian: i === 0 ? r.capaian : 0,
    dataDukung: i === 0 ? r.dataDukung : [],
    keterangan: i === 0 ? r.keterangan : '',
  }))
}

/* ───────── Normalisasi bagian-bagian ───────── */

/** Normalisasi persentase menjadi angka bulat 0–100 */
function persen(v: unknown, label: string, m: Masalah[]): number {
  if (v === '' || v == null) return 0

  let n = angka(v)

  if (!Number.isFinite(n)) {
    m.push({
      level: 'peringatan',
      pesan: `${label}: "${str(v)}" bukan angka, dijadikan 0`,
    })
    return 0
  }

  // Nilai desimal antara 0 dan 1 dianggap sebagai pecahan persentase.
  // Contoh: 0.1 = 10%, 0.5 = 50%, 1.0 = 100%.
  if (n > 0 && n <= 1) {
    n *= 100
  }

  if (n < 0 || n > 100) {
    m.push({
      level: 'peringatan',
      pesan: `${label}: ${n} di luar 0–100, dipotong`,
    })
  }

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
      const valid = statusOptions(jenis, '').join(' | ')
      m.push({ level: 'peringatan', pesan: `${label}: status "${statusMentah}" tidak sesuai untuk jenis ${jenis} (pilihan: ${valid || 'tidak ada'})` })
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

const outputKosong = (o: Out) =>
  !(o.jenis || o.judul || o.status || o.keterangan || o.capaian > 0 || o.dataDukung.length)

/**
 * Buang output yang benar-benar kosong, lalu tambah baris kosong sesuai JUMLAH target tiap jenis
 * (mis. target "2 KI" tetapi bulan itu baru mengisi 1 KI -> ditambah 1 baris KI kosong).
 * Judul output yang sudah ada tidak diubah.
 */
function lengkapiTarget(semua: Out[], target: { jenis: string; jumlah: number }[]): Out[] {
  const ada = semua.filter((o) => !outputKosong(o))

  const terisi = new Map<string, number>()
  ada.forEach((o) => terisi.set(o.jenis, (terisi.get(o.jenis) ?? 0) + 1))

  const butuh = new Map<string, number>()
  target.forEach((x) => {
    if (x.jenis && JENIS.includes(x.jenis)) {
      butuh.set(x.jenis, (butuh.get(x.jenis) ?? 0) + Math.max(1, x.jumlah || 1))
    }
  })

  const tambah: Out[] = []
  butuh.forEach((jumlah, jenis) => {
    const kurang = jumlah - (terisi.get(jenis) ?? 0)
    for (let k = 0; k < kurang; k++) tambah.push({ ...blankOutput(), jenis })
  })

  return [...ada, ...tambah]
}

function susunBulan(nama: string, aktivitas: MonthData['aktivitas'], outs: Out[]): MonthData {
  return {
    bulan: nama,
    aktivitas,
    output: outs[0] ?? blankOutput(),
    ...(outs.length > 1 ? { outputTambahan: outs.slice(1) } : {}),
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
    const labelKe = (k: number) => (k === 0 ? nama : `${nama} output ${k + 1}`)

    // output utama + tambahan, lalu pecah sel yang ternyata memuat beberapa butir
    const mentah = [b.output, ...arr(b.outputTambahan)].flatMap((o, k) => pecahOutput(o, labelKe(k), m))
    const semua = mentah.map((o, k) => normOutput(o, labelKe(k), m)).filter((o): o is Out => o !== null)
    const aktivitas = {
      uraian: str(a.uraian),
      kendala: str(a.kendala),
      mitigasi: str(a.mitigasi),
      dataDukung: lampiran(a.dataDukung),
    }

    const apaAdanya = susunBulan(nama, aktivitas, semua)
    // bulan yang sama sekali kosong dibiarkan kosong supaya tidak dihitung "terisi" dan tidak menimpa data lama saat digabung
    if (!bulanAdaIsi(apaAdanya)) return apaAdanya
    return susunBulan(nama, aktivitas, lengkapiTarget(semua, targetOutputs))
  })

  // Field lain di HeaderData (pendanaan, kontrak, dst.) tidak ada di JSON import,
  // jadi objek ini di-assert ke HeaderData dan field tsb dipertahankan dari data lama saat digabung.
  const header = {
    namaKetua,
    unitKerja: str(h.unitKerja),
    satuanKerja: str(h.satuanKerja),
    judulAktivitas: str(h.judulAktivitas),
    targetOutputs,
    progresTotal: persen(h.progresTotal, 'Progres total', m),
    progresKeterangan: str(h.progresKeterangan),
    statusPelaksanaan,
  } as HeaderData

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
    ...hc, // field yang tidak ada di import (pendanaan, kontrak, dst.) tetap dari data lama
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
- targetOutputs = kolom Target Output, dipecah menjadi [{ "jenis", "jumlah" }] . Contoh "1 HKI; 1 Publikasi Internasional" menjadi dua entri. Jika target berbeda-beda antarbulan, pakai yang paling lengkap dan tulis konfliknya di catatanImport
- progresTotal = Persentase Progres Pelaksanaan bulan terakhir yang terisi, angka bulat 0-100
- statusPelaksanaan = Status Pelaksanaan bulan terakhir yang terisi, salah satu dari: ${STATUS_PELAKS.join(', ')}. Pemetaan dari Excel: Perencanaan = Perencanaan, Persiapan = Perencanaan, Pelaksanaan = Pelaksanaan / Berjalan, Selesai = Selesai, Dimanfaatkan = Selesai
- progresKeterangan = "" kecuali ada keterangan yang jelas

bulanan (tiap bulan):
- aktivitas.uraian / kendala / mitigasi = salin PERSIS dari kolom Uraian Kemajuan, Kendala, Mitigasi. Jangan meringkas atau memperbaiki kata
- aktivitas.dataDukung dan output.dataDukung = [{ "label", "url" }] dari kolom Data Dukung. Jika isinya URL: label = nama situs singkat, url = URL-nya. Jika isinya teks biasa: label = teksnya, url = "". Satu entri per item
- output = Jenis Output, Judul Output, Status, Progres Capaian
- BANYAK OUTPUT DALAM SATU BULAN: bila sel Judul Output memuat beberapa butir, baik bernomor (1., 2.), diawali tanda (*, -, •), maupun berupa beberapa baris terpisah, setiap butir adalah SATU output sendiri. Butir pertama di "output", butir lainnya SEMUA di "outputTambahan" dengan struktur sama. Jangan menggabungkan beberapa butir menjadi satu judul. Pasangkan Jenis Output dan Status secara berurutan dengan butirnya bila sel Jenis/Status juga berisi beberapa baris. Jika sel Jenis atau Status hanya berisi satu nilai padahal butirnya lebih dari satu, JANGAN menebak: pakai nilai itu untuk butir pertama, isi jenis dan status butir lainnya dengan "", lalu catat di catatanImport (sebut bulan dan judul butirnya). Jangan menghilangkan butir apa pun, jenis apa pun (Purwarupa, Model, Publikasi, KI, dst.)
- Jika sebuah bulan hanya menyebut sebagian jenis dari target output (mis. target 1 KI + 1 Publikasi tetapi bulan itu hanya menulis Publikasi), tulis yang ada saja. Jangan membuat output KI kosong atau mengarang isinya; sistem yang menambahkan barisnya
- bulan tanpa isian: biarkan kosong ("" dan 0, dataDukung [])

JENIS OUTPUT dan STATUS yang valid (pakai persis penulisan ini; status hanya boleh dari daftar milik jenis itu sendiri, jangan meminjam status jenis lain):
${jenis}

Pemetaan jenis output dari Excel (periset menulis bebas, petakan berdasarkan maknanya):
- Publikasi Global/Nasional/Internasional, Jurnal (global, internasional, nasional, dst.), Prosiding, Artikel, Buku = Publikasi
- Kekayaan Intelektual / HKI / KI = KI; jika jelas disebut paten = Paten; hak cipta = Hak Cipta
- Purwarupa / Prototipe = Purwarupa; Model = Model
- DESAIN INDUSTRI: ABAIKAN. Bukan KI dan tidak masuk logbook. Jangan buat output atau target untuknya, cukup catat di catatanImport (sebut bulan dan judulnya)
- "Naskah Kebijakan ..." belum ada di sistem: kosongkan jenis dan catat di catatanImport
Pemetaan status output: pilih status dari daftar jenis itu yang maknanya paling dekat. Draft/Drafting = Draf (Purwarupa dan Model tidak punya Draf, pakai Desain); Submit/Submitted/Final submit = Submitted (Publikasi) atau Submit Intipdaqu (KI/Paten/Hak Cipta); Reviewed/Under review = Under Review; Accepted/Diterima = Accepted; Published/Terbit = Published; Registered/Terdaftar = Terdaftar DJKI; Granted = Granted/Diberi; Gambar Desain/Design = Desain; Manufaktur/Manufakturing/Perakitan/Fabrikasi = Manufaktur; Testing/Uji/Selesai = Pengujian/Selesai Uji; Belum Mulai = status pertama dari jenisnya. Jika tidak ada yang cocok, kosongkan status dan catat di catatanImport.

Aturan angka: 0.1 menjadi 10, "40 %" menjadi 40, 70 tetap 70, 1.0 menjadi 100. Teks bukan angka di kolom persen menjadi 0 dan dicatat di catatanImport.

Isi Excel bervariasi: sel jenis, status, dan target sering memuat keterangan berlebih atau sinonim (mis. "Submit makalah ALICIA ke Jurnal Internasional", "Journal International (BEEI)", "Dalam proses perakitan", "1 HKI, 1 pub internasional"). Petakan berdasarkan MAKNA ke nilai valid di atas. Untuk Purwarupa dan Model, teks status asli yang berbeda dari status valid taruh di "keterangan". Kolom Progres Capaian yang berisi teks: ambil angka persen hanya bila jelas satu angka untuk output itu; selain itu isi 0 dan salin teks aslinya ke catatanImport.

LARANGAN: jangan mengarang URL, jenis output, status, atau isi. Jika tidak yakin, isi "" atau 0 dan jelaskan di catatanImport (sebut bulan dan nama kolom). Jangan menghapus ketua yang datanya kosong.`
}