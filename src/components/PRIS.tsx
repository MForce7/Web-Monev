import Tabel from "../data/tabel.tsx";
import rekapOutput from "../../config/rekapOutput.json";
import type { BarisLogbook } from "../../config/Tipe.ts";

type Props = { bulan: string | null; pusatRiset: string | null };

const semua = rekapOutput.logbook.PRIS as unknown as Record<string, BarisLogbook[]>; // pusat riset -> baris

export default function PRIS({ bulan, pusatRiset }: Props) {
  const rows = Object.entries(semua)
    .filter(([p]) => !pusatRiset || p === pusatRiset) // belum pilih pusat riset = tampil semua
    .flatMap(([, baris]) => baris)
    .filter((r) => !bulan || r.bulan === bulan) // belum pilih bulan = tampil semua
    .filter((r) => r.ketua || r.aktivitas.uraian || r.output.judul); // baris template yang masih kosong disembunyikan

  return <Tabel rows={rows} />;
}