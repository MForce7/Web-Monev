import ActivityHeader from '../components/activityHeader'
import MonevRow from '../components/monevRow'
import data from '../data/monevData.json'
import type { MonevData } from '../types/monev'

const monev = data as MonevData

export default function MonevPage() {
  return (
    <div className="mx-auto space-y-6">
      <ActivityHeader
        initialData={monev.header}
        onSave={(header) => console.log('simpan header', header)}
      />
      <MonevRow
        initialData={monev.bulanan}
        onSave={(bulanan) => console.log('simpan bulanan', bulanan)}
      />
    </div>
  )
}