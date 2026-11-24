import { supabase } from './supabase'

/** DEBUG SEMENTARA: cetak semua baris tabel profiles yang berhasil di-fetch. */
export async function debugCetakSemuaProfil() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, unit_kerja, satuan_kerja')

  if (error) {
    console.error('DEBUG profiles — gagal fetch:', error)
    return
  }

  console.log(`DEBUG profiles — berhasil fetch ${data?.length ?? 0} baris:`)
  console.table(data)
}