import unitKerjaRaw from "../../data/unitkerja.json";
import { JENIS_OUTPUT } from "../../lib/config";
import { STATUS_PELAKSANAAN } from "../../types/monev";
import { pilihAktif } from "../../lib/logbookStore";
import type { PerisetRingkas } from "../../lib/supabaseLogbookData";
import type { AktivitasPayload, PerisetImport } from "../../lib/excelPeriset";
import { supabase } from "../../lib/supabase";

export const OPSI_JENIS = JENIS_OUTPUT as readonly string[];
export const OPSI_STATUS = STATUS_PELAKSANAAN as readonly string[];
export const UNIT: { nama: string; satuanKerja: string }[] = unitKerjaRaw.unitKerja;
export const LAIN = "__lain";

export const OPSI_KATEGORI = ["Rupiah Murni", "PNBP"];
export const OPSI_SKEMA = [
  "ORPA (Organisasi Riset Penerbangan dan Antariksa)",
  "DFRI (Deputi Bidang Fasilitasi Riset dan Inovasi)",
  "RIIM (Riset dan Inovasi untuk Indonesia Maju)",
  "PRIS (Program Riset Inovasi Substantif / Strategis)",
  "SBKU",
];

/* Ubah jadi true setelah logbookStore / validasiLogbook / ImportJson mengenali logbook lewat
   `idAktivitas` (bukan hanya nama ketua). Selama false, penyimpanan browser hanya bisa menampung
   SATU logbook per nama ketua. (Hanya berlaku untuk form "Periset baru". Menambah aktivitas ke
   periset di database tidak terkena batas ini.) */
export const STORE_MENDUKUNG_ID = false;

export const PER_HALAMAN = 10;

/** Pilihan untuk template & validasi Excel: sama persis dengan pilihan di form periset */
export const OPSI_EXCEL = {
  unit: UNIT,
  status: [...OPSI_STATUS],
  jenisOutput: [...OPSI_JENIS],
  kategori: OPSI_KATEGORI,
  skema: OPSI_SKEMA,
};

export const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const kecil = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
export const batas = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
export const pilihanAkhir = (nilai: string, lain: string) => (nilai === LAIN ? lain.trim() : nilai);

export const kelasInput = (galat?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1b3560] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    galat ? "border-[#dc2626] focus:ring-[#dc2626]/30" : "border-[#9db8e0] focus:ring-[#2a5aa8]"
  }`;

/* ───────── Tipe ───────── */

export type Identitas = {
  nama: string;
  email: string;
  password: string;
  unit: string;
  unitLain: string;
  satuan: string;
};
export type Target = { id: number; jenis: string; jumlah: number };
export type Aktivitas = {
  id: number;
  judul: string;
  status: string;
  progres: number;
  keterangan: string;
  targets: Target[];
  kategori: string;
  kategoriLain: string;
  skema: string;
  skemaLain: string;
};

/** Form pop up: periset baru, atau tambah aktivitas ke periset yang sudah terdaftar */
export type PerisetTujuan = { id: PerisetRingkas["id"]; nama: string; unitKerja: string };
export type ModeForm = { jenis: "baru" } | { jenis: "tambahAkt"; periset: PerisetTujuan };

/** Akun admin (hanya ditampilkan di tab Akun Admin) */
export type AdminRingkas = { id: string; nama: string; unitKerja?: string };

/** Yang sedang menunggu konfirmasi hapus */
export type TargetHapus =
  | { sumber: "browser"; nama: string; jumlah: number }
  | { sumber: "db"; tipe: "periset"; nama: string; aktivitas: { id: string; judul: string }[] }
  | { sumber: "db"; tipe: "aktivitas"; id: string; judul: string; nama: string };

export const IDENTITAS_AWAL: Identitas = {
  nama: "",
  email: "",
  password: "",
  unit: "",
  unitLain: "",
  satuan: "",
};

export const bukaLogbook = (nama: string) => {
  pilihAktif(nama);
  window.location.assign("/logbook");
};

/* ───────── TODO: sambungkan ke supabaseLogbookData ───────── */

/**
 * Menambah satu atau lebih aktivitas (beserta target output) ke periset dengan id tersebut di database.
 */
// export async function tambahAktivitasDiDb(
//   _perisetId: PerisetTujuan["id"],
//   _data: AktivitasPayload[]
// ): Promise<void> {
//   throw new Error("Penambahan aktivitas ke database belum dihubungkan.");
// }

async function panggilManageResearcher(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(
    "manage-researcher",
    { body }
  );

  if (error) {
    let pesan = error.message;

    try {
      const response = (error as { context?: Response }).context;
      if (response) {
        const detail = await response.clone().json();
        pesan = detail.error || pesan;
      }
    } catch {
      // Gunakan pesan error bawaan jika respons tidak bisa dibaca.
    }

    throw new Error(pesan);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function buatPerisetDiDb(
  identitas: Identitas,
  aktivitas: AktivitasPayload[]
): Promise<{ id: string }> {
  return panggilManageResearcher({
    action: "create_researcher",
    identitas: {
      nama: identitas.nama.trim(),
      email: identitas.email.trim().toLowerCase(),
      password: identitas.password,
      unitKerja: identitas.unit,
      satuanKerja: identitas.satuan.trim(),
    },
    aktivitas,
  });
}

export async function tambahAktivitasDiDb(
  perisetId: PerisetTujuan["id"],
  aktivitas: AktivitasPayload[]
): Promise<void> {
  await panggilManageResearcher({
    action: "add_activities",
    perisetId,
    aktivitas,
  });
}






/** Mengambil semua akun admin. */
export async function fetchAllAdmins(): Promise<AdminRingkas[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, unit_kerja')
    .eq('role', 'admin')
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: r.id,
    nama: r.full_name ?? '',
    unitKerja: r.unit_kerja ?? undefined,
  }))
}
/**
 * Menyimpan hasil import Excel: tiap periset beserta seluruh aktivitasnya.
 * Periset yang namanya sudah ada di database sebaiknya hanya ditambah aktivitasnya.
 */
export async function importPerisetDiDb(_data: PerisetImport[]): Promise<void> {
  throw new Error("Penyimpanan hasil import Excel ke database belum dihubungkan.");
}