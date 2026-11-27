import { supabase } from "./supabase";

export type MenuLogbookRekap = "CFC" | "RIIM" | "PRIS";
export type JenisOutputRekap =
  | "Purwarupa"
  | "Model"
  | "Publikasi"
  | "KI"
  | "Paten"
  | "Hak Cipta";
export type LinkLogbookRekap = { label: string; url: string };

type BarisLaporanRekap = {
  id: string;
  pusatRiset: string;
  bulan: string;
  ketua: string;
  aktivitas: {
    uraian: string;
    kendala: string;
    mitigasi: string;
    dataDukung: LinkLogbookRekap[];
  };
  output: {
    jenis: string;
    judul: string;
    status: string;
    progres: number;
    dataDukung: LinkLogbookRekap[];
  };
};

export type BarisLogbookRekap = BarisLaporanRekap & {
  menu: MenuLogbookRekap;
};

export type BarisOutputRekap = BarisLaporanRekap;

export type DataRekapitulasi = {
  logbook: BarisLogbookRekap[];
  output: BarisOutputRekap[];
};

type SupportFileRow = {
  kategori: "aktivitas" | "output";
  label: string;
  url: string | null;
  storage_path: string | null;
  monthly_report_output_id: string | null;
};

type MonthlyReportOutputRow = {
  id: string;
  urutan: number;
  jenis: string | null;
  judul: string | null;
  status: string | null;
  capaian: number | null;
  keterangan: string | null;
};

type MonthlyReportRow = {
  id: string;
  bulan: number;
  uraian: string | null;
  kendala: string | null;
  mitigasi: string | null;
  output_jenis: string | null;
  output_judul: string | null;
  output_status: string | null;
  output_capaian: number | null;
  support_files: SupportFileRow[] | null;
  monthly_report_outputs: MonthlyReportOutputRow[] | null;
};

type ActivityRow = {
  id: string;
  nama_ketua: string | null;
  unit_kerja: string | null;
  program_skema_pendanaan: string | null;
  monthly_reports: MonthlyReportRow[] | null;
};

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function menuDariSkema(skema: string | null): MenuLogbookRekap | null {
  switch (skema?.trim().toUpperCase()) {
    case "SBKU":
      return "CFC";
    case "RIIM":
      return "RIIM";
    case "PRIS":
      return "PRIS";
    default:
      return null;
  }
}

function jenisOutputRekap(jenis: string | null): JenisOutputRekap | null {
  const jenisNormal = jenis?.trim().toLocaleLowerCase("id");
  switch (jenisNormal) {
    case "purwarupa":
    case "prototipe":
      return "Purwarupa";
    case "model":
      return "Model";
    case "publikasi":
      return "Publikasi";
    case "ki":
    case "hki":
    case "ki (kekayaan intelektual)":
    case "kekayaan intelektual":
      return "KI";
    case "paten":
      return "Paten";
    case "hak cipta":
      return "Hak Cipta";
    default:
      return null;
  }
}

function tautan(
  files: SupportFileRow[] | null,
  kategori: SupportFileRow["kategori"],
  outputId?: string,
): LinkLogbookRekap[] {
  return (files ?? [])
    .filter((file) => {
      if (file.kategori !== kategori) return false;
      return kategori === "aktivitas"
        ? true
        : outputId
          ? file.monthly_report_output_id === outputId
          : !file.monthly_report_output_id;
    })
    .map((file) => ({
      label: file.label,
      url: file.url ?? file.storage_path ?? "",
    }))
    .filter((file) => file.url !== "");
}

function laporanTerisi(row: MonthlyReportRow): boolean {
  const files = row.support_files ?? [];

  return Boolean(
    row.uraian?.trim() ||
      row.kendala?.trim() ||
      row.mitigasi?.trim() ||
      row.output_jenis?.trim() ||
      row.output_judul?.trim() ||
      (row.output_status && row.output_status !== "Belum Mulai") ||
      (row.output_capaian ?? 0) > 0 ||
      row.monthly_report_outputs?.length ||
      files.length,
  );
}

export async function fetchRekapitulasi(): Promise<DataRekapitulasi> {
  const { data, error } = await supabase
    .from("activities")
    .select(
      `id, nama_ketua, unit_kerja, program_skema_pendanaan,
       monthly_reports (
         id, bulan, uraian, kendala, mitigasi,
         output_jenis, output_judul, output_status, output_capaian,
         support_files ( kategori, label, url, storage_path, monthly_report_output_id ),
         monthly_report_outputs ( id, urutan, jenis, judul, status, capaian, keterangan )
       )`,
    )
    .order("nama_ketua", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat rekapitulasi: ${error.message}`);
  }

  const activities = (data ?? []) as unknown as ActivityRow[];
  const hasil: DataRekapitulasi = { logbook: [], output: [] };

  for (const activity of activities) {
    const menu = menuDariSkema(activity.program_skema_pendanaan);

    for (const report of (activity.monthly_reports ?? [])
      .filter((report) => report.bulan >= 1 && report.bulan <= BULAN.length)
      .sort((a, b) => a.bulan - b.bulan)) {
      const outputs = report.monthly_report_outputs?.length
        ? report.monthly_report_outputs
            .slice()
            .sort((a, b) => a.urutan - b.urutan)
            .map((output) => ({
              id: output.id,
              jenis: output.jenis,
              judul: output.judul,
              status: output.status,
              progres: output.capaian,
            }))
        : [
            {
              id: undefined,
              jenis: report.output_jenis,
              judul: report.output_judul,
              status: report.output_status,
              progres: report.output_capaian,
            },
          ];
      const outputUtama = outputs[0];
      const baris: BarisLaporanRekap = {
        id: `${activity.id}-${report.bulan}`,
        pusatRiset: activity.unit_kerja?.trim() ?? "",
        bulan: BULAN[report.bulan - 1],
        ketua: activity.nama_ketua?.trim() ?? "",
        aktivitas: {
          uraian: report.uraian ?? "",
          kendala: report.kendala ?? "",
          mitigasi: report.mitigasi ?? "",
          dataDukung: tautan(report.support_files, "aktivitas"),
        },
        output: {
          jenis: outputUtama?.jenis ?? "",
          judul: outputUtama?.judul ?? "",
          status: outputUtama?.status ?? "",
          progres: outputUtama?.progres ?? 0,
          dataDukung: tautan(report.support_files, "output", outputUtama?.id),
        },
      };

      if (menu && laporanTerisi(report)) {
        hasil.logbook.push({ ...baris, menu });
      }

      for (const output of outputs) {
        const jenis = jenisOutputRekap(output.jenis);
        const dataDukung = tautan(report.support_files, "output", output.id);
        const outputTerisi = Boolean(
          output.judul?.trim() ||
            (output.status?.trim() && output.status !== "Belum Mulai") ||
            (output.progres ?? 0) > 0 ||
            dataDukung.length,
        );
        if (!jenis || !outputTerisi) continue;

        hasil.output.push({
          ...baris,
          output: {
            jenis,
            judul: output.judul ?? "",
            status: output.status ?? "",
            progres: output.progres ?? 0,
            dataDukung,
          },
        });
      }
    }
  }

  return hasil;
}
