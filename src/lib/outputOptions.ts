import type { TargetOutput } from '../types/monev'

/**
 * Pilihan jenis output untuk baris ke-`index`:
 * semua jenis KECUALI yang sudah dipilih di baris lain.
 * Jenis milik baris itu sendiri tetap ada, supaya dropdown-nya tidak kehilangan nilai.
 */
export function availableJenis(
  all: readonly string[],
  outputs: TargetOutput[],
  index: number,
): string[] {
  const usedByOthers = new Set(outputs.filter((_, i) => i !== index).map((o) => o.jenis))
  const list = all.filter((j) => !usedByOthers.has(j))

  // Data lama bisa berisi jenis yang tidak ada di daftar: tetap tampilkan agar tidak hilang
  const current = outputs[index]?.jenis
  return current && !list.includes(current) ? [current, ...list] : list
}

/** Jenis pertama yang belum dipakai, atau null kalau semua jenis sudah terpilih. */
export function nextFreeJenis(all: readonly string[], outputs: TargetOutput[]): string | null {
  const used = new Set(outputs.map((o) => o.jenis))
  return all.find((j) => !used.has(j)) ?? null
}