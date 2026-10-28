import LogbookPages from './logbookPages'
import type { MonthData } from '../components/logbook/MonthlyLogTable'
import data from '../data/monevData.json'
import type { MonevData } from '../types/monev'

const monev = data as MonevData

export default function Tester() {
  return (
    <LogbookPages
      headerData={monev.header}
      monthsData={monev.bulanan as MonthData[]}
      onSaveHeader={(header) => console.log('simpan header', header)}
      onSaveMonths={(bulanan) => console.log('simpan bulanan', bulanan)}
    />
  )
}