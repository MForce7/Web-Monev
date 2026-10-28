import type { ReactNode } from "react";
import TargetChart from "./parts/targetchart";
import DonutChart from "./parts/donutchart";
import Legend from "./parts/legend";

export type Kategori = {
  key: string;
  label: string;
  from: string; // warna awal gradient
  to: string;   // warna akhir gradient
};

export type OrpaChartsData = {
  kategori: Kategori[];
  targetVsRealisasi: {
    max: number;
    series: string[]; // urutan key kategori untuk tiap batang dalam satu grup
    groups: { target: number; realisasi: number }[][];
  };
  komposisi: {
    kategori: string; // cocok dengan Kategori.key
    value: number;
  }[];
};

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
      <h3 className="mb-3 text-center text-sm font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

export default function OrpaChartsSection({ data }: { data: OrpaChartsData }) {
  const { kategori, targetVsRealisasi, komposisi } = data;

  // Legenda mengikuti urutan series di JSON
  const legendItems = targetVsRealisasi.series
    .map((key) => kategori.find((k) => k.key === key))
    .filter((k): k is Kategori => k !== undefined);

  return (
    <div className="grid gap-6 md:grid-cols-2 w-full">
      <Card title="Target Kepala ORPA vs Realisasi">
        <TargetChart data={targetVsRealisasi} kategori={kategori} />
        <Legend items={legendItems} />
      </Card>

      <Card title="Komposisi Realisasi Capaian ORPA">
        <DonutChart data={komposisi} kategori={kategori} />
      </Card>
    </div>
  );
}