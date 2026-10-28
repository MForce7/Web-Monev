import MetricCard from "./metricCard.tsx";
import type { MetricsData } from "../../../types/monev.ts";

interface MetricCardListProps {
  data: MetricsData; // seluruh isi metrics.json
}

export default function MetricCardList({ data }: MetricCardListProps) {
  if (data.items.length === 0) {
    return <p className="text-gray-500">Belum ada data.</p>;
  }

  return (
    <section className="flex flex-wrap gap-6">
      {data.items.map((item) => (
        <MetricCard key={item.title} data={item} />
      ))}
    </section>
  );
}