import { useState } from 'react'
import { loadLogbook } from '../lib/LogbookData'
import { ambilLogbookAktif, daftarLogbook, pilihAktif } from '../lib/logbookStore'
import { FLAGS } from '../lib/flags'
import ActivityHeader from '../components/logbook/ActivityHeader'
import MonthlyLogTable from '../components/logbook/MonthlyLogTable'

export default function Logbook() {
  const semua = daftarLogbook()
  const [aktif, setAktif] = useState(() => ambilLogbookAktif()?.header.namaKetua ?? '')

  // Prioritas: hasil import JSON; cadangan: logbook.json
  const entri = semua.find((e) => e.header.namaKetua === aktif) ?? ambilLogbookAktif()
  const { header, bulanan } = entri ?? loadLogbook()

  const unit = [...new Set(semua.map((e) => e.header.unitKerja || 'Tanpa unit kerja'))]

  const ganti = (nama: string) => {
    pilihAktif(nama)
    setAktif(nama)
  }

  return (
    <div className="px-4 pb-4 pt-20 space-y-4">
      {semua.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 no-print">
          <label htmlFor="pilih-ketua" className="text-xs font-semibold text-slate-600">
            <i className="fa-solid fa-user mr-1.5" />Logbook ketua tim
          </label>
          <select
            id="pilih-ketua"
            value={aktif}
            onChange={(e) => ganti(e.target.value)}
            className="max-w-full rounded border border-slate-300 bg-white p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {unit.map((u) => (
              <optgroup key={u} label={u}>
                {semua
                  .filter((e) => (e.header.unitKerja || 'Tanpa unit kerja') === u)
                  .map((e) => (
                    <option key={e.header.namaKetua} value={e.header.namaKetua}>
                      {e.header.namaKetua}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">{semua.length} logbook tersimpan</span>
        </div>
      )}

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