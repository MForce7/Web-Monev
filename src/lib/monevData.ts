import type { PerisetData, PerisetDataJson, ActivityEntry, HeaderData, HeaderDataJson } from '../types/monev'

// const PERISET_JSON_LOADERS: Record<string, () => Promise<{ default: PerisetDataJson }>> = {
//   'periset-001': () => import('../data/periset/periset-001.json') as Promise<{ default: PerisetDataJson }>,
//   'periset-002': () => import('../data/periset/periset-002.json') as Promise<{ default: PerisetDataJson }>,
// }

const PERISET_JSON_LOADERS: Record<string, () => Promise<{ default: PerisetDataJson }>> = {
  // Ganti key di bawah dengan UUID ASLI dari Supabase auth.users, bukan 'periset-001'
  '7268ce3e-a7c4-491e-a889-dfbfe3e1930d': () => import('../data/periset/periset-001.json') as Promise<{ default: PerisetDataJson }>,
  'uuid-user-kedua-di-sini': () => import('../data/periset/periset-002.json') as Promise<{ default: PerisetDataJson }>,
}






export async function fetchPerisetData(perisetId: string): Promise<PerisetDataJson> {
  const loader = PERISET_JSON_LOADERS[perisetId]

  if (!loader) {
    throw new Error(`Data untuk periset dengan id "${perisetId}" tidak ditemukan`)
  }

  const mod = await loader()
  return mod.default
}

function mergePerisetIntoHeader(periset: PerisetData['periset'], header: HeaderDataJson): HeaderData {
  return {
    ...header,
    namaKetua: periset.nama,
    unitKerja: periset.unitKerja,
    satuanKerja: periset.satuanKerja,
  }
}

export async function getActivitiesForPeriset(perisetId: string): Promise<ActivityEntry[]> {
  const data = await fetchPerisetData(perisetId)
  return data.activities.map((a) => ({
    ...a,
    header: mergePerisetIntoHeader(data.periset, a.header),
  }))
}

export async function getActivityById(
  perisetId: string,
  activityId: string
): Promise<ActivityEntry | undefined> {
  const activities = await getActivitiesForPeriset(perisetId)
  return activities.find((a) => a.id === activityId)
}