import localData from "@/data/dashboard/dashboard.json";
import type { DashboardData } from "@/types/dashboard";

const data = localData as unknown as DashboardData;

// urutan seri chart orpa
const series = ["publikasi", "purwarupa", "ki"] as const;

// 1. data pusat riset (bentuk lama: rawDataPr)
const dataPr = {
  kategori: data.kategori,
  items: data.pusatRiset.map(({ nama, nilai }) => ({ nama, nilai })),
};

// 2. data chart orpa (bentuk lama: rawDataChart)
const dataChart = {
  kategori: data.kategori.filter((k) => series.includes(k.key as (typeof series)[number])),
  targetVsRealisasi: {
    max: data.orpa.chartMax,
    series,
    groups: data.pusatRiset.map((p) =>
      series.map((s) => p.targetVsRealisasi[s] ?? { target: 0, realisasi: 0 })
    ),
  },
  komposisi: data.orpa.komposisi,
};

// 3. data metrics (bentuk lama: rawData)
const dataMetrics = data.metrics;

export default function Page() {
  return (
    <>
      <ChartPusatRiset data={dataPr} />
      <ChartOrpa data={dataChart} />
      <Metrics data={dataMetrics} />
    </>
  );
}