import { supabase } from './supabase'

export interface AdminProfileSummary {
  id: string
  fullName: string
  unitKerja: string
  satuanKerja: string
  role: string
}

/** Daftar seluruh profile (untuk list/filter/search di halaman admin) */
export async function fetchAllResearcherProfiles(): Promise<AdminProfileSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, unit_kerja, satuan_kerja, role')
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name ?? '',
    unitKerja: p.unit_kerja ?? '',
    satuanKerja: p.satuan_kerja ?? '',
    role: p.role ?? 'researcher',
  }))
}