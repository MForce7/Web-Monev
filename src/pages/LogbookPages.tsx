import { useLogbookData } from '../lib/LogbookDataContext'
import ActivityHeader from '../components/logbook/ActivityHeader'
import ProfileCard  from '../components/logbook/userIdentity'

export default function LogbookPage() {
  const { activities, loading, error, updateActivityHeader, updateActivityMonthly } = useLogbookData()

  if (loading) {
    return <div className="p-6 text-slate-500">Memuat data logbook...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">Gagal memuat data: {error}</div>
  }

  if (activities.length === 0) {
    return <div className="p-6 text-slate-500">Belum ada aktivitas.</div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center mt-16"></div>
      <ProfileCard />
      <h1 className="text-xl font-bold text-slate-800">
        Logbook Aktivitas — {activities.length} aktivitas
      </h1>

      {activities.map((activity) => (
        <ActivityHeader
          key={activity.id}
          activityId={activity.id}   // ⬅️ tambahkan ini
          initialData={activity.header}
          onSave={updateActivityHeader(activity.id)}
          initialMonthlyData={activity.bulanan}
          onMonthlySave={updateActivityMonthly(activity.id)}
        />
      ))}

    </div>
  )
}