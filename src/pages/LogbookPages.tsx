import { STATUS_PELAKSANAAN, emptyMonth, type HeaderData } from '../types/monev'
import ActivityHeader from '../components/logbook/ActivityHeader.tsx'
import MonthlyLogTable, { type MonthData } from '../components/logbook/MonthlyLogTable'
import { UploadContext, readAsDataUrl, type UploadFn } from '../components/logbook/Attachments'
import { JENIS_OUTPUT } from '../lib/config'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const emptyHeader = (): HeaderData =>
  ({
    namaKetua: '',
    unitKerja: '',
    satuanKerja: '',
    judulAktivitas: '',
    targetOutputs: [{ jenis: JENIS_OUTPUT[0], jumlah: 1 }],
    progresTotal: 0,
    progresKeterangan: '',
    statusPelaksanaan: STATUS_PELAKSANAAN[0],
  }) as HeaderData

const emptyMonths = (): MonthData[] => NAMA_BULAN.map((bulan) => emptyMonth(bulan))

interface Props {
  headerData?: HeaderData
  monthsData?: MonthData[]
  onSaveHeader?: (updatedData: HeaderData) => void
  onSaveMonths?(updatedData: MonthData[]): void
  /** Opsional: fungsi unggah ke server; bawaannya data URL (maks. 5 MB per file) */
  uploadFile?: UploadFn
}

export default function LogbookPages({
  headerData = emptyHeader(),
  monthsData = emptyMonths(),
  onSaveHeader,
  onSaveMonths,
  uploadFile = readAsDataUrl,
}: Props) {
  return (
    <UploadContext.Provider value={uploadFile}>
      {/* mt-19: turun dari navbar | px-4 md:px-8: jarak kiri-kanan (16px di HP, 32px di layar besar) */}
      <div className="space-y-4 w-full max-w-full min-w-0 mt-19 px-4 md:px-8">
        <ActivityHeader initialData={headerData} onSave={onSaveHeader} />
        <MonthlyLogTable initialData={monthsData} onSave={onSaveMonths} />
      </div>
    </UploadContext.Provider>
  )
}