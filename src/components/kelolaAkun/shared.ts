// import unitKerjaRaw from "../../data/unitkerja.json";
// import { JENIS_OUTPUT } from "../../lib/config";
// import { STATUS_PELAKSANAAN } from "../../types/monev";
// import { pilihAktif } from "../../lib/logbookStore";
// import type { PerisetRingkas } from "../../lib/supabaseLogbookData";
// import type { AktivitasPayload, PerisetImport } from "../../lib/excelPeriset";
// import { supabase } from "../../lib/supabase";

// export const OPSI_JENIS = JENIS_OUTPUT as readonly string[];
// export const OPSI_STATUS = STATUS_PELAKSANAAN as readonly string[];
// export const UNIT: { nama: string; satuanKerja: string }[] = unitKerjaRaw.unitKerja;
// export const LAIN = "__lain";

// export const OPSI_KATEGORI = ["Rupiah Murni", "PNBP"];
// export const OPSI_SKEMA = [
//   "ORPA (Organisasi Riset Penerbangan dan Antariksa)",
//   "DFRI (Deputi Bidang Fasilitasi Riset dan Inovasi)",
//   "RIIM (Riset dan Inovasi untuk Indonesia Maju)",
//   "PRIS (Program Riset Inovasi Substantif / Strategis)",
//   "SBKU",
// ];

// /* Ubah jadi true setelah logbookStore / validasiLogbook / ImportJson mengenali logbook lewat
//    `idAktivitas` (bukan hanya nama ketua). Selama false, penyimpanan browser hanya bisa menampung
//    SATU logbook per nama ketua. (Hanya berlaku untuk form "Periset baru". Menambah aktivitas ke
//    periset di database tidak terkena batas ini.) */
// export const STORE_MENDUKUNG_ID = false;

// export const PER_HALAMAN = 10;

// /** Pilihan untuk template & validasi Excel: sama persis dengan pilihan di form periset */
// export const OPSI_EXCEL = {
//   unit: UNIT,
//   status: [...OPSI_STATUS],
//   jenisOutput: [...OPSI_JENIS],
//   kategori: OPSI_KATEGORI,
//   skema: OPSI_SKEMA,
// };

// export const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// export const kecil = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
// export const batas = (n: number, min: number, max: number) =>
//   Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
// export const pilihanAkhir = (nilai: string, lain: string) => (nilai === LAIN ? lain.trim() : nilai);

// export const kelasInput = (galat?: string) =>
//   `w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1b3560] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
//     galat ? "border-[#dc2626] focus:ring-[#dc2626]/30" : "border-[#9db8e0] focus:ring-[#2a5aa8]"
//   }`;

// /* ───────── Tipe ───────── */

// export type Identitas = {
//   nama: string;
//   email: string;
//   password: string;
//   unit: string;
//   unitLain: string;
//   satuan: string;
// };
// export type Target = { id: number; jenis: string; jumlah: number };
// // export type Aktivitas = {
// //   id: number;
// //   judul: string;
// //   status: string;
// //   progres: number;
// //   keterangan: string;
// //   targets: Target[];
// //   kategori: string;
// //   kategoriLain: string;
// //   skema: string;
// //   skemaLain: string;
// // };

// export type Aktivitas = {
//   id: number;
//   judul: string;
//   status: string;
//   progres: number;
//   keterangan: string;
//   targets: Target[];
//   kategori: string;
//   kategoriLain: string;

//   unitPengampuDifa: string;
//   programSkemaPendanaan: string;
// };




// /** Form pop up: periset baru, atau tambah aktivitas ke periset yang sudah terdaftar */
// export type PerisetTujuan = { id: PerisetRingkas["id"]; nama: string; unitKerja: string };
// export type ModeForm = { jenis: "baru" } | { jenis: "tambahAkt"; periset: PerisetTujuan };

// /** Akun admin (hanya ditampilkan di tab Akun Admin) */
// export type AdminRingkas = { id: string; nama: string; unitKerja?: string };

// /** Yang sedang menunggu konfirmasi hapus */
// export type TargetHapus =
//   | { sumber: "browser"; nama: string; jumlah: number }
//   | { sumber: "db"; tipe: "periset"; nama: string; aktivitas: { id: string; judul: string }[] }
//   | { sumber: "db"; tipe: "aktivitas"; id: string; judul: string; nama: string }
//   | { sumber: "db"; tipe: "akun"; id: string; nama: string; jumlahAktivitas: number };

// export const IDENTITAS_AWAL: Identitas = {
//   nama: "",
//   email: "",
//   password: "",
//   unit: "",
//   unitLain: "",
//   satuan: "",
// };

// /* ───────── Parsing pesan error dari server (manage-researcher) ───────── */

// export type FieldGalatServer =
//   | "skema" | "kategori" | "judul" | "status" | "target"
//   | "email" | "nama" | "unit" | null;

// export type GalatServer = {
//   /** pesan asli dari server, ditampilkan apa adanya di banner */
//   pesan: string;
//   /** nomor aktivitas (1-based) kalau pesan menyebut "aktivitas ke-N", null kalau error umum/identitas */
//   aktivitasKe: number | null;
//   /** field yang kemungkinan dimaksud, ditebak dari kata kunci di pesan */
//   field: FieldGalatServer;
// };

// /**
//  * Server (edge function) cuma balas string bebas, jadi di sini kita tebak
//  * nomor aktivitas & field dari kata kuncinya supaya bisa disorot di form.
//  * Kalau pola pesan di server berubah, cukup sesuaikan regex/kata kunci ini.
//  */
// export function parseGalatServer(pesanMentah: string): GalatServer {
//   const cocokIndex = pesanMentah.match(/aktivitas ke-(\d+)/i);
//   const aktivitasKe = cocokIndex ? Number(cocokIndex[1]) : null;

//   const p = pesanMentah.toLowerCase();
//   let field: FieldGalatServer = null;
//   if (p.includes("skema")) field = "skema";
//   else if (p.includes("kategori")) field = "kategori";
//   else if (p.includes("judul")) field = "judul";
//   else if (p.includes("status")) field = "status";
//   else if (p.includes("target")) field = "target";
//   else if (p.includes("email")) field = "email";
//   else if (p.includes("nama")) field = "nama";
//   else if (p.includes("unit")) field = "unit";

//   return { pesan: pesanMentah, aktivitasKe, field };
// }
// /* ───────── TODO: sambungkan ke supabaseLogbookData ───────── */

// /**
//  * Menambah satu atau lebih aktivitas (beserta target output) ke periset dengan id tersebut di database.
//  */
// // export async function tambahAktivitasDiDb(
// //   _perisetId: PerisetTujuan["id"],
// //   _data: AktivitasPayload[]
// // ): Promise<void> {
// //   throw new Error("Penambahan aktivitas ke database belum dihubungkan.");
// // }

// async function panggilManageResearcher(body: Record<string, unknown>) {
//   const { data, error } = await supabase.functions.invoke(
//     "manage-researcher",
//     { body }
//   );

//   if (error) {
//     let pesan = error.message;

//     try {
//       const response = (error as { context?: Response }).context;
//       if (response) {
//         const detail = await response.clone().json();
//         pesan = detail.error || pesan;
//       }
//     } catch {
//       // Gunakan pesan error bawaan jika respons tidak bisa dibaca.
//     }

//     throw new Error(pesan);
//   }

//   if (data?.error) {
//     throw new Error(data.error);
//   }

//   return data;
// }

// export async function buatPerisetDiDb(
//   identitas: Identitas,
//   aktivitas: AktivitasPayload[]
// ): Promise<{ id: string }> {
//   return panggilManageResearcher({
//     action: "create_researcher",
//     identitas: {
//       nama: identitas.nama.trim(),
//       email: identitas.email.trim().toLowerCase(),
//       password: identitas.password,
//       unitKerja: identitas.unit,
//       satuanKerja: identitas.satuan.trim(),
//     },
//     aktivitas,
//   });
// }

// export async function hapusAkunDiDb(
//   perisetId: PerisetTujuan["id"]
// ): Promise<{ jumlahAktivitasTerhapus: number }> {
//   const data = await panggilManageResearcher({
//     action: "delete_researcher",
//     perisetId,
//   });
//   return { jumlahAktivitasTerhapus: data?.jumlahAktivitasTerhapus ?? 0 };
// }

// export async function tambahAktivitasDiDb(
//   perisetId: PerisetTujuan["id"],
//   aktivitas: AktivitasPayload[]
// ): Promise<void> {
//   await panggilManageResearcher({
//     action: "add_activities",
//     perisetId,
//     aktivitas,
//   });
// }






// /** Mengambil semua akun admin. */
// export async function fetchAllAdmins(): Promise<AdminRingkas[]> {
//   const { data, error } = await supabase
//     .from('profiles')
//     .select('id, full_name, unit_kerja')
//     .eq('role', 'admin')
//     .order('full_name', { ascending: true })

//   if (error) throw new Error(error.message)

//   return (data ?? []).map((r) => ({
//     id: r.id,
//     nama: r.full_name ?? '',
//     unitKerja: r.unit_kerja ?? undefined,
//   }))
// }
// /**
//  * Menyimpan hasil import Excel: tiap periset beserta seluruh aktivitasnya.
//  * Periset yang namanya sudah ada di database sebaiknya hanya ditambah aktivitasnya.
//  */
// export async function importPerisetDiDb(_data: PerisetImport[]): Promise<void> {
//   throw new Error("Penyimpanan hasil import Excel ke database belum dihubungkan.");
// }





import unitKerjaRaw from "../../data/unitkerja.json";
import { JENIS_OUTPUT } from "../../lib/config";
import { STATUS_PELAKSANAAN } from "../../types/monev";
import type { PerisetRingkas } from "../../lib/supabaseLogbookData";
import type { AktivitasPayload, PerisetImport, OpsiExcel } from "../../lib/excelPeriset";
import { PROGRAM_SKEMA_PER_UNIT } from "../../lib/excelPeriset";
import { supabase } from "../../lib/supabase";

export const OPSI_JENIS = JENIS_OUTPUT as readonly string[];
export const OPSI_STATUS = STATUS_PELAKSANAAN as readonly string[];
export const UNIT: { nama: string; satuanKerja: string }[] = unitKerjaRaw.unitKerja;
export const LAIN = "__lain";
export const OPSI_KATEGORI = ["Rupiah Murni", "PNBP"] as const;
export const OPSI_UNIT_PENGAMPU_DIFA = ["ORPA", "DFRI"] as const;
export const OPSI_SKEMA = ["RIIM", "PRIS", "Hibah", "SBKU"] as const;
export const PROGRAM_SKEMA_PER_UNIT_VALID = PROGRAM_SKEMA_PER_UNIT;

// Ubah menjadi true setelah seluruh penyimpanan logbook mendukung idAktivitas.
export const STORE_MENDUKUNG_ID = false;
export const PER_HALAMAN = 10;

export const OPSI_EXCEL: OpsiExcel = {
  unit: UNIT,
  status: [...OPSI_STATUS],
  jenisOutput: [...OPSI_JENIS],
  kategori: [...OPSI_KATEGORI],
  unitPengampuDifa: [...OPSI_UNIT_PENGAMPU_DIFA],
  programSkemaPerUnit: PROGRAM_SKEMA_PER_UNIT,
};

export const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const kecil = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
export const batas = (n: number, min: number, max: number) => Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
export const pilihanAkhir = (nilai: string, lain: string) => nilai === LAIN ? lain.trim() : nilai;
export const kelasInput = (galat?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1b3560] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${galat ? "border-[#dc2626] focus:ring-[#dc2626]/30" : "border-[#9db8e0] focus:ring-[#2a5aa8]"}`;

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
  unitPengampuDifa: string;
  programSkemaPendanaan: string;
};
export type PerisetTujuan = { id: PerisetRingkas["id"]; nama: string; unitKerja: string };
export type ModeForm = { jenis: "baru" } | { jenis: "tambahAkt"; periset: PerisetTujuan };
export type AdminRingkas = { id: string; nama: string; unitKerja?: string };
export type TargetHapus =
  | { sumber: "browser"; nama: string; jumlah: number }
  | { sumber: "db"; tipe: "periset"; nama: string; aktivitas: { id: string; judul: string }[] }
  | { sumber: "db"; tipe: "aktivitas"; id: string; judul: string; nama: string }
  | { sumber: "db"; tipe: "akun"; id: string; nama: string; jumlahAktivitas: number };

export const IDENTITAS_AWAL: Identitas = {
  nama: "", email: "", password: "", unit: "", unitLain: "", satuan: "",
};

export type FieldGalatServer =
  | "skema" | "kategori" | "judul" | "status" | "target"
  | "email" | "nama" | "unit" | null;
export type GalatServer = {
  pesan: string;
  aktivitasKe: number | null;
  field: FieldGalatServer;
};

export function parseGalatServer(pesanMentah: string): GalatServer {
  const cocokIndex = pesanMentah.match(/aktivitas ke-(\d+)/i);
  const aktivitasKe = cocokIndex ? Number(cocokIndex[1]) : null;
  const p = pesanMentah.toLowerCase();
  let field: FieldGalatServer = null;
  if (p.includes("skema") || p.includes("pengampu") || p.includes("program")) field = "skema";
  else if (p.includes("kategori")) field = "kategori";
  else if (p.includes("judul")) field = "judul";
  else if (p.includes("status")) field = "status";
  else if (p.includes("target")) field = "target";
  else if (p.includes("email")) field = "email";
  else if (p.includes("nama")) field = "nama";
  else if (p.includes("unit")) field = "unit";
  return { pesan: pesanMentah, aktivitasKe, field };
}

async function panggilManageResearcher(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("manage-researcher", { body });
  if (error) {
    let pesan = error.message;
    try {
      const response = (error as { context?: Response }).context;
      if (response) {
        const detail = await response.clone().json();
        pesan = detail.error || pesan;
      }
    } catch {
      // Pertahankan pesan error bawaan.
    }
    throw new Error(pesan);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function buatPerisetDiDb(identitas: Identitas, aktivitas: AktivitasPayload[]): Promise<{ id: string }> {
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

export async function hapusAkunDiDb(perisetId: PerisetTujuan["id"]): Promise<{ jumlahAktivitasTerhapus: number }> {
  const data = await panggilManageResearcher({ action: "delete_researcher", perisetId });
  return { jumlahAktivitasTerhapus: data?.jumlahAktivitasTerhapus ?? 0 };
}

export async function tambahAktivitasDiDb(perisetId: PerisetTujuan["id"], aktivitas: AktivitasPayload[]): Promise<void> {
  await panggilManageResearcher({ action: "add_activities", perisetId, aktivitas });
}

export async function fetchAllAdmins(): Promise<AdminRingkas[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, unit_kerja")
    .eq("role", "admin")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, nama: r.full_name ?? "", unitKerja: r.unit_kerja ?? undefined }));
}

export type HasilImportDb = {
  total: number;
  berhasil: number;
  gagal: number;
  hasil: { email: string; nama: string; success: boolean; message: string; jumlahAktivitas?: number }[];
};

export async function importPerisetDiDb(data: PerisetImport[]): Promise<HasilImportDb> {
  if (!data.length) throw new Error("Tidak ada data periset untuk diimport.");
  return panggilManageResearcher({ action: "import_researchers", periset: data }) as Promise<HasilImportDb>;
}
