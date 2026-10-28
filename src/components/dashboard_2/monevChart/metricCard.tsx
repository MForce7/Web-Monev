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
    <div className="w-56 p-4 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center font-sans">
      {/* Bagian Judul Header */}
      <div className="text-center w-full pb-2 border-b border-gray-200">
        <div
          className="font-bold text-sm tracking-wide underline decoration-1 underline-offset-2"
          style={{ color, textDecorationColor: color }}
        >
          {title}
        </div>
        <div
          className="font-bold text-xs underline decoration-1 underline-offset-2 mt-0.5"
          style={{ color, textDecorationColor: color }}
        >
          {subtitle}
        </div>
      </div>

      {/* Bagian Nilai Utama */}
      <div
        className="mt-4 flex items-baseline justify-center font-bold"
        style={{ color }}
      >
        <span className="text-5xl tracking-tight">{realisasi}</span>
        <span className="text-4xl mx-1 font-semibold">/</span>
        <span className="text-3xl tracking-tight">{target}</span>
      </div>
    </div>
  );
};

export default MetricCard;