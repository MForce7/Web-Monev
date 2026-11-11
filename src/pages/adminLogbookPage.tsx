import { useEffect, useMemo, useState } from 'react'
import ActivityHeader from '../components/logbook/ActivityHeader'
import { fetchAllResearcherProfiles, type AdminProfileSummary } from '../lib/supabaseAdminData'
import { fetchProfileWithActivities, updateActivityHeaderInDb } from '../lib/supabaseLogbookData'
import type { ActivityEntry } from '../types/monev'
import type { MonthData } from '../components/logbook/logbookTable/MonthlyLogTable'

export default function AdminLogbookPage() {
  const [profiles, setProfiles] = useState<AdminProfileSummary[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profilesError, setProfilesError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [unitKerjaFilter, setUnitKerjaFilter] = useState('')

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllResearcherProfiles()
      .then(setProfiles)
      .catch((err: Error) => setProfilesError(err.message))
      .finally(() => setProfilesLoading(false))
  }, [])

  const unitKerjaOptions = useMemo(() => {
    const set = new Set(profiles.map((p) => p.unitKerja).filter(Boolean))
    return Array.from(set).sort()
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return profiles.filter((p) => {
      const matchSearch = !keyword || p.fullName.toLowerCase().includes(keyword)
      const matchUnit = !unitKerjaFilter || p.unitKerja === unitKerjaFilter
      return matchSearch && matchUnit
    })
  }, [profiles, search, unitKerjaFilter])

  const selectedProfile = profiles.find((p) => p.id === selectedUserId) ?? null

  useEffect(() => {
    if (!selectedUserId) {
      setActivities([])
      return
    }

    let cancelled = false
    setActivitiesLoading(true)
    setActivitiesError(null)

    fetchProfileWithActivities(selectedUserId)
      .then(({ activities }) => {
        if (!cancelled) setActivities(activities)
      })
      .catch((err: Error) => {
        if (!cancelled) setActivitiesError(err.message)
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedUserId])

  const updateHeader = (activityId: string) => async (updatedHeader: ActivityEntry['header']) => {
    await updateActivityHeaderInDb(activityId, updatedHeader)
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, header: updatedHeader } : a)))
  }

  const updateMonthly = (activityId: string) => (updatedMonthly: MonthData[]) => {
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, bulanan: updatedMonthly } : a)))
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto mt-20">
      <h1 className="text-xl font-bold text-slate-800">Logbook Seluruh User</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Cari nama peneliti..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={unitKerjaFilter}
          onChange={(e) => setUnitKerjaFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
        >
          <option value="">Semua Unit Kerja</option>
          {unitKerjaOptions.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {profilesLoading && <p className="text-sm text-slate-500">Memuat daftar user...</p>}
      {profilesError && <p className="text-sm text-red-600">Gagal memuat daftar user: {profilesError}</p>}

      {!profilesLoading && !profilesError && (
        <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Nama</th>
                <th className="text-left px-4 py-2 font-semibold">Unit Kerja</th>
                <th className="text-left px-4 py-2 font-semibold">Satuan Kerja</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                    Tidak ada user yang cocok.
                  </td>
                </tr>
              )}
              {filteredProfiles.map((p) => (
                <tr
                  key={p.id}
                  className={`border-t border-slate-100 ${selectedUserId === p.id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-2">{p.fullName || '(Belum diisi)'}</td>
                  <td className="px-4 py-2">{p.unitKerja || '-'}</td>
                  <td className="px-4 py-2">{p.satuanKerja || '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(p.id)}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Lihat Logbook
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUserId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Logbook — {selectedProfile?.fullName || selectedUserId}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              Tutup
            </button>
          </div>

          {activitiesLoading && <p className="text-sm text-slate-500">Memuat logbook...</p>}
          {activitiesError && <p className="text-sm text-red-600">Gagal memuat logbook: {activitiesError}</p>}

          {!activitiesLoading && !activitiesError && activities.length === 0 && (
            <p className="text-sm text-slate-500">User ini belum punya aktivitas.</p>
          )}

          {activities.map((activity) => (
            <ActivityHeader
              key={activity.id}
              activityId={activity.id}
              initialData={activity.header}
              onSave={updateHeader(activity.id)}
              initialMonthlyData={activity.bulanan}
              onMonthlySave={updateMonthly(activity.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}