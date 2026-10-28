import { loadLogbook } from '../lib/LogbookData'
import { FLAGS } from '../lib/flags'
import ActivityHeader from '../components/logbook/ActivityHeader'
import MonthlyLogTable from '../components/logbook/MonthlyLogTable'

export default function Logbook() {
  // Dibaca ulang setiap render; Vite HMR memicu render ulang saat logbook.json berubah
  const { header, bulanan } = loadLogbook()

  return (
    <div className="px-4 pb-4 pt-20 space-y-4">
      {/* key berubah saat isi JSON berubah, sehingga useState di dalam komponen dibuat ulang */}
      <ActivityHeader
        key={JSON.stringify(header)}
        initialData={header}
        onSave={(updated) => console.log('Header tersimpan di state:', updated)}
      />

      {FLAGS.MonthlyLogTable && (
        <MonthlyLogTable
          key={JSON.stringify(bulanan)}
          initialData={bulanan}
          onSave={(updated) => console.log('Data tersimpan di state:', updated)}
        />
      )}
    </div>
  )
}