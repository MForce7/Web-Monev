
interface DetailAktivitasImportProps {
  judulAktivitas?: string;
  progresTotal?: number;
  statusPelaksanaan?: string;
  targetOutputs?: { jenis: string; jumlah: number }[];
}

export default function DetailAktivitasImport({
  judulAktivitas = "",
  progresTotal = 0,
  statusPelaksanaan = "",
  targetOutputs = [],
}: DetailAktivitasImportProps) {
  const baris = [
    {
      label: "Kategori Pendanaan",
      value: "",
    },
    {
      label: "Skema Mitra Program",
      value: "",
    },
    {
      label: "Judul",
      value: judulAktivitas,
    },
    {
      label: "Target Output Utama",
      value: targetOutputs
        .filter((item) => item.jenis)
        .map((item) => `${item.jumlah} ${item.jenis}`)
        .join(", "),
    },
    {
      label: "Progres Total Aktivitas",
      value: `${progresTotal}%`,
    },
    {
      label: "Status",
      value: statusPelaksanaan,
    },
  ];

  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-[#dbe6f7] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1f4e8c] px-6 py-4 text-white">
        <div>
          <h2 className="text-lg font-bold">
            Detail Aktivitas &amp; Progres Kegiatan
          </h2>
          <p className="mt-1 text-xs text-blue-100">
            Informasi aktivitas dan capaian program mitra
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#dbe6f7] px-6 py-3">
        <h3 className="font-bold text-[#1b3560]">Informasi aktivitas</h3>
        <span className="text-xs text-slate-400">
          Data dari file Excel / JSON
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {baris.map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-[minmax(140px,0.8fr)_minmax(0,1.5fr)] gap-3 border-b border-r border-[#e5edf8] px-6 py-4"
          >
            <span className="text-sm font-semibold text-slate-500">
              {item.label}
            </span>

            <span className="whitespace-pre-wrap break-words text-sm font-medium text-[#1b3560]">
              {item.value || "-"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
