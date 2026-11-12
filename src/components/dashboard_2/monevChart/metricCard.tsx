import React from "react";
import type { MetricItem } from "../../../types/monev.ts";

interface MetricCardProps {
  data: MetricItem; // satu item dari metrics.json
  subtitle?: string;
}

const DEFAULT_COLOR = "#5b21cd";

export const MetricCard: React.FC<MetricCardProps> = ({
  data,
  subtitle = "(Realisasi/Target)",
}) => {
  const { title, target, realisasi, color = DEFAULT_COLOR } = data;

  return (
    <div className="flex w-full max-w-xs flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 font-sans shadow-lg sm:w-56">
      {/* Bagian Judul Header */}
      <div className="w-full border-b border-gray-200 pb-2 text-center">
        <div className="text-sm font-bold tracking-wide" style={{ color }}>
          {title}
        </div>
        <div className="mt-0.5 text-xs font-bold" style={{ color }}>
          {subtitle}
        </div>
      </div>

      {/* Bagian Nilai Utama */}
      <div
        className="mt-4 flex items-baseline justify-center font-bold"
        style={{ color }}
      >
        <span className="text-4xl tracking-tight sm:text-5xl">{realisasi}</span>
        <span className="mx-1 text-3xl font-semibold sm:text-4xl">/</span>
        <span className="text-2xl tracking-tight sm:text-3xl">{target}</span>
      </div>
    </div>
  );
};

export default MetricCard;