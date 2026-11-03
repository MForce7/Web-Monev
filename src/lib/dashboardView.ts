import type { Kategori, KategoriKey, TargetRealisasi, TriwulanData } from "../types/dashboard";

const ORPA_SERIES = ["publikasi", "purwarupa", "ki"] as const satisfies readonly KategoriKey[];
const EMPTY: TargetRealisasi = { target: 0, realisasi: 0 };

/* ---------- pemecah per bagian ---------- */

function toMetrics(d: TriwulanData) {
  return d.metrics;
}

function toOrpaCharts(kategori: Kategori[], d: TriwulanData) {
  return {
    kategori: kategori.filter((k) => ORPA_SERIES.some((s) => s === k.key)),
    targetVsRealisasi: {
      max: d.orpa.chartMax,
      series: ORPA_SERIES,
      groups: d.pusatRiset.map((p) =>
        ORPA_SERIES.map((s) => p.targetVsRealisasi[s] ?? EMPTY)
      ),
    },
    komposisi: d.orpa.komposisi,
  };
}

function toPusatRiset(kategori: Kategori[], d: TriwulanData) {
  return {
    kategori,
    items: d.pusatRiset.map(({ nama, nilai }) => ({ nama, nilai })),
  };
}

/* ---------- satu pintu masuk ---------- */

export function buildDashboardView(kategori: Kategori[], d: TriwulanData) {
  return {
    metrics: toMetrics(d),
    orpaCharts: toOrpaCharts(kategori, d),
    prChart: toPusatRiset(kategori, d),
  };
}

export type DashboardView = ReturnType<typeof buildDashboardView>;