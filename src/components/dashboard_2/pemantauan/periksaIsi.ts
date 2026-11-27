import type { Sel } from "./types";

/* ---------- Pemeriksa isi logbook ----------
   Hubungkan ke data logbook: kirim isian satu ketua tim di satu bulan, hasilnya langsung
   berupa status + daftar kolom yang belum diisi. Sesuaikan nama kunci dengan data logbook. */
const KOLOM_WAJIB = [
  "Uraian Kemajuan Aktivitas",
  "Kendala Ditemui",
  "Mitigasi / Rencana Tindak Lanjut",
  "Data Dukung Progres",
  "Jenis Output",
  "Judul Output",
  "Status",
  "Presentase Progress (%)",
  "Output Data Dukung",
];

export function periksaIsi(isi?: Partial<Record<string, string | number | null>>): Sel {
  if (!isi) return { status: "Kosong", belumSesuai: ["Semua kolom kosong"] };
  const kosong = KOLOM_WAJIB.filter((k) => {
    const v = isi[k];
    return v === undefined || v === null || String(v).trim() === "";
  });
  if (kosong.length === KOLOM_WAJIB.length) return { status: "Kosong", belumSesuai: ["Semua kolom kosong"] };
  if (kosong.length) return { status: "Belum Lengkap", belumSesuai: kosong };
  return { status: "Lengkap", belumSesuai: [] };
}