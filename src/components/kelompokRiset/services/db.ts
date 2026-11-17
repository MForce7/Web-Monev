import { supabase } from "../../../lib/supabase"; // sesuaikan path client Supabase kamu

import type { PusatRiset } from "../types";

const TABEL = "kelompok_riset_data";
const ID_BARIS = 1;

export async function ambilKelompokRiset(): Promise<PusatRiset[]> {
  const { data, error } = await supabase
    .from(TABEL)
    .select("data")
    .eq("id", ID_BARIS)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat data dari database: ${error.message}`);
  }

  // Baris belum pernah dibuat atau kolom data kosong -> tabel kosong saja.
  if (!data || !data.data) {
    return [];
  }

  return data.data as PusatRiset[];
}

export async function simpanKelompokRiset(
  dataBaru: PusatRiset[],
): Promise<void> {
  const { error } = await supabase.from(TABEL).upsert({
    id: ID_BARIS,
    data: dataBaru,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Gagal menyimpan data ke database: ${error.message}`);
  }
}