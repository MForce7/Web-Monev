// import { useEffect, useState } from 'react'
// import type { ActivityEntry } from '../types/monev'
// import { getActivitiesForPeriset } from '../lib/monevData'
// import ActivityHeader from '../components/logbook/ActivityHeader'
// import type { MonthData } from '../components/logbook/logbookTable/MonthlyLogTable'

// interface Props {
//   /** Didapat dari sesi login / auth context — SATU periset yang sedang login */
//   perisetId: string
// }

// export default function LogbookPage({ perisetId }: Props) {
//   const [activities, setActivities] = useState<ActivityEntry[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     setLoading(true)
//     setError(null)

//     getActivitiesForPeriset(perisetId)
//       .then(setActivities)
//       .catch((err: Error) => setError(err.message))
//       .finally(() => setLoading(false))
//   }, [perisetId])

//   const updateHeader = (activityId: string) => (updatedHeader: ActivityEntry['header']) => {
//     setActivities((prev) =>
//       prev.map((a) => (a.id === activityId ? { ...a, header: updatedHeader } : a))
//     )
//     // TODO: kirim ke API, mis. saveActivityHeader(perisetId, activityId, updatedHeader)
//   }

//   const updateMonthly = (activityId: string) => (updatedMonthly: MonthData[]) => {
//     setActivities((prev) =>
//       prev.map((a) => (a.id === activityId ? { ...a, bulanan: updatedMonthly } : a))
//     )
//     // TODO: kirim ke API, mis. saveActivityMonthly(perisetId, activityId, updatedMonthly)
//   }

//   if (loading) {
//     return <div className="p-6 text-slate-500">Memuat data logbook...</div>
//   }

//   if (error) {
//     return <div className="p-6 text-red-600">Gagal memuat data: {error}</div>
//   }

//   if (activities.length === 0) {
//     return <div className="p-6 text-slate-500">Belum ada aktivitas.</div>
//   }

//   return (
//     <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto">
//       <h1 className="text-xl font-bold text-slate-800">
//         Logbook Aktivitas — {activities.length} aktivitas
//       </h1>

//       {activities.map((activity) => (
//         <ActivityHeader
//           key={activity.id}
//           initialData={activity.header}
//           onSave={updateHeader(activity.id)}
//           initialMonthlyData={activity.bulanan}
//           onMonthlySave={updateMonthly(activity.id)}
//         />
//       ))}
//     </div>
//   )
// }






import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import type { ActivityEntry } from '../types/monev'
import { getActivitiesForPeriset } from '../lib/monevData'
import ActivityHeader from '../components/logbook/ActivityHeader'
import type { MonthData } from '../components/logbook/logbookTable/MonthlyLogTable'
import ProfileCard from '../components/logbook/userIdentity'



export default function LogbookPage() {
  const { session, loading: sessionLoading } = useAuth()
  const perisetId = session?.user?.id

  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionLoading) return

    if (!perisetId) {
      setLoading(false)
      setError('Kamu belum login atau sesi tidak valid')
      return
    }

    setLoading(true)
    setError(null)

    getActivitiesForPeriset(perisetId)
      .then(setActivities)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [perisetId, sessionLoading])

  const updateHeader = (activityId: string) => (updatedHeader: ActivityEntry['header']) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, header: updatedHeader } : a))
    )
  }

  const updateMonthly = (activityId: string) => (updatedMonthly: MonthData[]) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, bulanan: updatedMonthly } : a))
    )
  }

  if (sessionLoading || loading) {
    return <div className="p-6 text-slate-500">Memuat data logbook...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">Gagal memuat data: {error}</div>
  }

  if (activities.length === 0) {
    return <div className="p-6 text-slate-500">Belum ada aktivitas.</div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 mx-auto">
      <div className='mt-16'></div>
      <ProfileCard/>
      <h1 className="text-xl font-bold text-slate-800">
        Logbook Aktivitas — {activities.length} aktivitas
      </h1>

      {activities.map((activity) => (
        <ActivityHeader
          key={activity.id}
          initialData={activity.header}
          onSave={updateHeader(activity.id)}
          initialMonthlyData={activity.bulanan}
          onMonthlySave={updateMonthly(activity.id)}
        />
      ))}
    </div>
  )
}