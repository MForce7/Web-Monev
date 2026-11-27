import { supabase } from "./supabase";

export type SkemaPendanaan = "PRIS" | "RIIM";

export type RekapPendanaanRecord = {
  id: string;
  skema: SkemaPendanaan;
  jenis: string;
  ketua: string;
  judul: string;
  pusatRiset: string;
  jangkaBulan: number | null;
  dana: (number | null)[];
  nomorSK: string;
  tanggalSK: string;
  status: string;
  keterangan: string;
  link: string;
  linkLabel: string;
};

type RekapPendanaanRow = {
  id: string;
  skema: SkemaPendanaan;
  jenis: string;
  ketua: string;
  judul: string;
  pusat_riset: string;
  jangka_bulan: number | null;
  dana: (number | null)[];
  nomor_sk: string;
  tanggal_sk: string;
  status: string;
  keterangan: string;
  link: string;
  link_label: string;
};

const TABEL = "rekappendanaan";
const KOLOM =
  "id, skema, jenis, ketua, judul, pusat_riset, jangka_bulan, dana, nomor_sk, tanggal_sk, status, keterangan, link, link_label";

export async function ambilRekapPendanaan(): Promise<RekapPendanaanRecord[]> {
  const { data, error } = await supabase
    .from(TABEL)
    .select(KOLOM)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat rekap pendanaan: ${error.message}`);
  }

  return ((data ?? []) as unknown as RekapPendanaanRow[]).map((row) => ({
    id: row.id,
    skema: row.skema,
    jenis: row.jenis,
    ketua: row.ketua,
    judul: row.judul,
    pusatRiset: row.pusat_riset,
    jangkaBulan: row.jangka_bulan,
    dana: row.dana,
    nomorSK: row.nomor_sk,
    tanggalSK: row.tanggal_sk,
    status: row.status,
    keterangan: row.keterangan,
    link: row.link,
    linkLabel: row.link_label,
  }));
}

export async function simpanSemuaRekapPendanaan(
  records: RekapPendanaanRecord[],
): Promise<void> {
  const rows = records.map((record, index) => ({
    id: record.id,
    skema: record.skema,
    jenis: record.jenis,
    ketua: record.ketua,
    judul: record.judul,
    pusat_riset: record.pusatRiset,
    jangka_bulan: record.jangkaBulan,
    dana: record.dana,
    nomor_sk: record.nomorSK,
    tanggal_sk: record.tanggalSK,
    status: record.status,
    keterangan: record.keterangan,
    link: record.link,
    link_label: record.linkLabel,
    urutan: index + 1,
  }));

  const { error } = await supabase.rpc("sync_rekappendanaan", {
    p_rows: rows,
  });

  if (error) {
    throw new Error(`Gagal menyimpan rekap pendanaan: ${error.message}`);
  }
}
