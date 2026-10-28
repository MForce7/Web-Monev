import raw from '../data/logbook.json'
import { clampPercent, emptyMonth, type Attachment, type HeaderData } from '../types/monev'
import type { MonthData } from '../components/logbook/MonthlyLogTable'

/**
 * Loader JSON -> data yang siap dipakai komponen logbook.
 * - Selalu menghasilkan 12 bulan (Januari-Desember), bulan yang hilang diisi emptyMonth.
 * - Field yang hilang diberi default, capaian dibatasi 0-100.
 * - Urutan bulan mengikuti BULAN, bukan urutan di file JSON.
 */

export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const

type Obj = Record<string, any>

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)

const attachments = (v: unknown): Attachment[] =>
  Array.isArray(v) ? v.map((a: Obj) => ({ label: str(a?.label), url: str(a?.url) })) : []

const output = (o: Obj = {}): MonthData['output'] => ({
  jenis: str(o.jenis),
  judul: str(o.judul),
  status: (str(o.status) || 'Belum Mulai') as string,
  capaian: clampPercent(num(o.capaian)),
  dataDukung: attachments(o.dataDukung),
  keterangan: str(o.keterangan),
}) as MonthData['output']

function month(bulan: string, m?: Obj): MonthData {
  if (!m) return emptyMonth(bulan) as MonthData
  const a: Obj = m.aktivitas ?? {}
  const extra = Array.isArray(m.outputTambahan) ? m.outputTambahan.map((o: Obj) => output(o)) : []
  return {
    bulan,
    aktivitas: {
      uraian: str(a.uraian),
      kendala: str(a.kendala),
      mitigasi: str(a.mitigasi),
      dataDukung: attachments(a.dataDukung),
    },
    output: output(m.output),
    ...(extra.length ? { outputTambahan: extra } : {}),
  }
}

export function loadHeader(input: unknown = raw): HeaderData {
  const h: Obj = (input as Obj)?.header ?? {}
  return {
    namaKetua: str(h.namaKetua),
    unitKerja: str(h.unitKerja),
    satuanKerja: str(h.satuanKerja),
    judulAktivitas: str(h.judulAktivitas),
    targetOutputs: Array.isArray(h.targetOutputs)
      ? h.targetOutputs.map((t: Obj) => ({ jenis: str(t?.jenis), jumlah: num(t?.jumlah) }))
      : [],
    progresTotal: clampPercent(num(h.progresTotal)),
    progresKeterangan: str(h.progresKeterangan),
    statusPelaksanaan: str(h.statusPelaksanaan),
  }
}

export function loadBulanan(input: unknown = raw): MonthData[] {
  const list: Obj[] = Array.isArray((input as Obj)?.bulanan) ? (input as Obj).bulanan : []
  return BULAN.map((b) => month(b, list.find((m) => str(m?.bulan).toLowerCase() === b.toLowerCase())))
}

export const loadLogbook = (input: unknown = raw) => ({
  header: loadHeader(input),
  bulanan: loadBulanan(input),
})