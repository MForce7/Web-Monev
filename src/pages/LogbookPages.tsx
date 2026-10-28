import { STATUS_PELAKSANAAN, emptyMonth, type HeaderData } from '../types/monev'
import ActivityHeader from '../components/logbook/ActivityHeader.tsx'
import MonthlyLogTable, { type MonthData } from '../components/logbook/MonthlyLogTable'
import { UploadContext, readAsDataUrl, type UploadFn } from '../components/logbook/Attachments'
import { JENIS_OUTPUT } from '../lib/config'
import Safe from '../components/logbook/Safe.tsx'

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const emptyHeader = () =>
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
  monthsData = NAMA_BULAN.map((b) => emptyMonth(b)),
  onSaveHeader,
  onSaveMonths,
  uploadFile = readAsDataUrl,
}: Props) {
  return (
    <UploadContext.Provider value={uploadFile}>
      {/* mt-24: turun dari navbar | px-4 md:px-8: jarak kiri-kanan */}
      <div className="space-y-4 w-full max-w-full min-w-0 mt-24 px-4 md:px-8">
        <ActivityHeader initialData={headerData} onSave={onSaveHeader} />
        <Safe name="MonthlyLogTable">
          <MonthlyLogTable initialData={monthsData} onSave={onSaveMonths} />
        </Safe>
      </div>
    </UploadContext.Provider>
  )
}