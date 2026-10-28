import Card from "./parts/card";
import Legend from "./parts/legend";
import PusatRisetChart from "./parts/pusatRisetChart";

export type Kategori = {
  key: string;
  label: string;
  from: string; // warna awal gradient
  to: string;   // warna akhir gradient
};

export type PusatRisetItem = {
  nama: string;
  nilai: Record<string, number>; // key = Kategori.key
};

export type PusatRisetData = {
  kategori: Kategori[];
  items: PusatRisetItem[];
};

interface PrChartProps {
  data: PusatRisetData; // dikirim dari parent
}

export default function PrChart({ data }: PrChartProps) {
  const { kategori, items } = data;

  if (items.length === 0) {
    return <p className="text-center text-sm text-gray-500">Belum ada data.</p>;
  }

  return (
    <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
      {items.map((p) => (
        <Card key={p.nama} className="p-3">
          <h4 className="mb-2 text-center text-xs font-bold text-gray-800">
            Realisasi Capaian {p.nama}
          </h4>
          <PusatRisetChart nilai={p.nilai} kategori={kategori} />
          <Legend items={kategori} size="sm" />
        </Card>
      ))}
    </div>
  );
}