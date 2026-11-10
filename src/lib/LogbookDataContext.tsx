import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
// import { fetchProfileWithActivities, type ProfileInfo } from './supabaseLogbookData'
import type { ActivityEntry } from '../types/monev'
import type { MonthData } from '../components/logbook/logbookTable/MonthlyLogTable'

import { fetchProfileWithActivities, updateActivityHeaderInDb, type ProfileInfo } from './supabaseLogbookData'


interface LogbookDataValue {
  profile: ProfileInfo | null
  activities: ActivityEntry[]
  loading: boolean
  error: string | null
  headerSaveError: string | null 
  refetch: () => void
  updateActivityHeader: (activityId: string) => (header: ActivityEntry['header']) => void
  updateActivityMonthly: (activityId: string) => (bulanan: MonthData[]) => void
}

const LogbookDataContext = createContext<LogbookDataValue | undefined>(undefined)

export function LogbookDataProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useAuth()
  const userId = session?.user.id

  const [profile, setProfile] = useState<ProfileInfo | null>(null)
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [headerSaveError, setHeaderSaveError] = useState<string | null>(null)


  useEffect(() => {
    if (sessionLoading) return

    if (!userId) {
      setProfile(null)
      setActivities([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchProfileWithActivities(userId)
      .then(({ profile, activities }) => {
        if (cancelled) return
        setProfile(profile)
        setActivities(activities)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, sessionLoading, reloadToken])

  const refetch = () => setReloadToken((t) => t + 1)

  // const updateActivityHeader = (activityId: string) => (updatedHeader: ActivityEntry['header']) => {
  //   setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, header: updatedHeader } : a)))
  //   // TODO: tulis balik ke Supabase (update tabel activities + sinkronisasi target_outputs)
  // }

  

  const updateActivityHeader = (activityId: string) => async (updatedHeader: ActivityEntry['header']) => {
    setHeaderSaveError(null)
    try {
      await updateActivityHeaderInDb(activityId, updatedHeader)
    } catch (err) {
      setHeaderSaveError((err as Error).message)
      throw err // lempar lagi supaya ActivityHeader tahu save gagal
    }
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, header: updatedHeader } : a)))
  }




  const updateActivityMonthly = (activityId: string) => (updatedMonthly: MonthData[]) => {
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, bulanan: updatedMonthly } : a)))
    // TODO: tulis balik ke Supabase (upsert monthly_reports per bulan)
  }

  return (
    <LogbookDataContext.Provider
      value={{ profile, activities, loading, error, headerSaveError, refetch, updateActivityHeader, updateActivityMonthly }}
    >
      {children}
    </LogbookDataContext.Provider>
  )
}

export function useLogbookData() {
  const ctx = useContext(LogbookDataContext)
  if (!ctx) throw new Error('useLogbookData harus dipakai di dalam <LogbookDataProvider>')
  return ctx
}