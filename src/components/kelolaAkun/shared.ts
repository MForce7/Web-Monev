import unitKerjaRaw from "../../data/Unitkerja.json";
import { JENIS_OUTPUT } from "../../lib/config";
import { STATUS_PELAKSANAAN } from "../../types/monev";
import type { PerisetRingkas } from "../../lib/supabaseLogbookData";
import type { AktivitasPayload, PerisetImport, OpsiExcel } from "../../lib/excelPeriset";
import { PROGRAM_SKEMA_PER_UNIT } from "../../lib/excelPeriset";
import { supabase } from "../../lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
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
  nip: string;
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
  tahunPelaksanaan: number;
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
  nama: "", nip: "", email: "", password: "", unit: "", unitLain: "", satuan: "",
};

export type FieldGalatServer =
  | "skema" | "kategori" | "judul" | "status" | "target"
  | "email" | "nama" | "unit" | "nip" | null;
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
  if (p.includes("nip")) field = "nip";
  else if (p.includes("skema") || p.includes("pengampu") || p.includes("program")) field = "skema";
  else if (p.includes("kategori")) field = "kategori";
  else if (p.includes("judul")) field = "judul";
  else if (p.includes("status")) field = "status";
  else if (p.includes("target")) field = "target";
  else if (p.includes("email")) field = "email";
  else if (p.includes("nama")) field = "nama";
  else if (p.includes("unit")) field = "unit";
  return { pesan: pesanMentah, aktivitasKe, field };
}

// async function panggilManageResearcher(body: Record<string, unknown>) {
//   const { data, error } = await supabase.functions.invoke("manage-researcher", { body });
//   if (error) {
//     let pesan = error.message;
//     try {
//       const response = (error as { context?: Response }).context;
//       if (response) {
//         const detail = await response.clone().json();
//         pesan = detail.error || pesan;
//       }
//     } catch {
//       // Pertahankan pesan error bawaan.
//     }
//     throw new Error(pesan);
//   }
//   if (data?.error) throw new Error(data.error);
//   return data;
// }



export async function panggilManageResearcher(
  payload: Record<string, unknown>
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "manage-researcher",
      {
        body: payload,
      }
    );

    if (error) {
      if (error instanceof FunctionsHttpError) {
        let detail: unknown;

        try {
          detail = await error.context.clone().json();
        } catch {
          detail = await error.context.text();
        }

        console.error("Edge Function HTTP Error:", {
          status: error.context.status,
          detail,
        });

        let pesan = `Edge Function gagal (${error.context.status}).`;
        if (typeof detail === "object" && detail !== null) {
          const obj = detail as Record<string, unknown>;
          if (typeof obj.error === "string" && obj.error) {
            pesan = obj.error;
          } else if (typeof obj.message === "string" && obj.message) {
            pesan = obj.message;
          }
        } else if (typeof detail === "string" && detail.trim()) {
          pesan = detail;
        }

        throw new Error(pesan);
      }

      console.error("Edge Function error:", error);
      throw new Error(error.message || "Gagal menghubungi server.");
    }

    return data;
  } catch (error) {
    console.error("Proses Edge Function gagal:", error);
    throw error;
  }
}


export async function buatPerisetDiDb(identitas: Identitas, aktivitas: AktivitasPayload[]): Promise<{ id: string }> {
  return panggilManageResearcher({
    action: "create_researcher",
    identitas: {
      nama: identitas.nama.trim(),
      nip: identitas.nip.trim(),
      email: identitas.email.trim().toLowerCase(),
      password: identitas.password,
      unitKerja: identitas.unit,
      satuanKerja: identitas.satuan.trim(),
    },
    aktivitas,
  });
}

export async function hapusAkunDiDb(
  researcherId: string
) {
  if (!researcherId) {
    throw new Error("ID periset wajib diberikan.");
  }

  return await panggilManageResearcher({
    action: "delete_researcher",
    researcherId,
  });
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
