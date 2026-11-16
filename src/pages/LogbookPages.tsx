import { useLogbookData } from '../lib/LogbookDataContext'
import ActivityHeader from '../components/logbook/ActivityHeader'
import ProfileCard from '../components/logbook/userIdentity'

export default function LogbookPage() {
  const { activities, loading, error, updateActivityHeader, updateActivityMonthly } = useLogbookData()

  if (loading) {
    return <div className="p-4 sm:p-6 pt-24 text-slate-500">Memuat data logbook...</div>
  }

  if (error) {
    return <div className="p-4 sm:p-6 pt-24 text-red-600">Gagal memuat data: {error}</div>
  }

  if (activities.length === 0) {
    return <div className="p-4 sm:p-6 pt-24 text-slate-500">Belum ada aktivitas.</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-3 pb-8 pt-20 sm:space-y-8 sm:px-6 sm:pt-24">
      <ProfileCard />
      <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
        Logbook Aktivitas — {activities.length} aktivitas
      </h1>

      {activities.map((activity) => (
        <ActivityHeader
          key={activity.id}
          activityId={activity.id}
          initialData={activity.header}
          onSave={updateActivityHeader(activity.id)}
          initialMonthlyData={activity.bulanan}
          onMonthlySave={updateActivityMonthly(activity.id)}
        />
      ))}
    </div>
  )
}