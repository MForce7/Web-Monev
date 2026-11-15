import type { UserOptions } from "jspdf-autotable";

import {
  KOLOM,
} from "../constants";

import type {
  PusatTampil,
} from "../types";

export async function cetakPdf(
  pusat: string,
  cari: string,
  data: PusatTampil[],
) {
  const [{ jsPDF }, { default: autoTable }] =
    await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const lebar = doc.internal.pageSize.getWidth();
  const tinggi = doc.internal.pageSize.getHeight();

  const tanggal = new Date().toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const namaFile =
    `Kelompok-Riset-${pusat.replace(/[^\w]+/g, "-")}-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

  const filter = [
    pusat,
    cari.trim()
      ? `Pencarian: "${cari.trim()}"`
      : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  // Header PDF.
  doc.setFillColor(27, 63, 120);
  doc.rect(0, 0, lebar, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);

  doc.text(
    "Kelompok Riset ORPA Tahun Anggaran 2026",
    14,
    10,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(filter, 14, 16.5);
  doc.text(
    `Dicetak ${tanggal}`,
    lebar - 14,
    16.5,
    { align: "right" },
  );

  if (data.length === 0) {
    doc.setTextColor(27, 53, 96);
    doc.setFontSize(10);

    doc.text(
      "Belum ada data kelompok riset untuk filter ini.",
      14,
      34,
    );

    doc.save(namaFile);
    return;
  }

  const jumlahKelompok = data.reduce(
    (n, p) => n + p.kelompok.length,
    0,
  );

  const jumlahPeriset = data.reduce(
    (n, p) =>
      n +
      p.kelompok.reduce(
        (m, k) => m + k.anggota.length,
        0,
      ),
    0,
  );

  doc.setTextColor(27, 53, 96);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text(
    `Pusat riset: ${data.length}    Kelompok: ${jumlahKelompok}    Periset: ${jumlahPeriset}`,
    14,
    29,
  );

  const body: NonNullable<UserOptions["body"]> = [];

  data.forEach((p) => {
    body.push([
      {
        content: p.nama.toUpperCase(),
        colSpan: KOLOM.length,
        styles: {
          halign: "center",
          fillColor: [31, 70, 140],
          textColor: 255,
          fontStyle: "bold",
        },
      },
    ]);

    p.kelompok.forEach((k) => {
      k.anggota.forEach((a, i) => {
        const baris: NonNullable<
          UserOptions["body"]
        >[number] = [];

        if (i === 0) {
          baris.push(
            {
              content: `${k.no}.`,
              rowSpan: k.anggota.length,
              styles: {
                halign: "center",
                valign: "top",
                fillColor: [255, 255, 255],
              },
            },
            {
              content: k.nama,
              rowSpan: k.anggota.length,
              styles: {
                valign: "top",
                fillColor: [255, 255, 255],
              },
            },
          );
        }

        baris.push(
          `${a.no}. ${a.nama}`,
          a.nip,
          a.keterangan,
          a.jabatan,
        );

        body.push(baris);
      });
    });
  });

  const warnaKeterangan = {
    pimpinan: {
      fill: [232, 239, 251] as [number, number, number],
      teks: [27, 53, 96] as [number, number, number],
    },
    anggota: {
      fill: [241, 245, 249] as [number, number, number],
      teks: [27, 53, 96] as [number, number, number],
    },
  };

  autoTable(doc, {
    startY: 33,
    head: [KOLOM],
    body,

    margin: {
      left: 14,
      right: 14,
      bottom: 14,
    },

    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [219, 230, 247],
      lineWidth: 0.2,
      textColor: [27, 53, 96],
      valign: "middle",
    },

    headStyles: {
      fillColor: [27, 63, 120],
      textColor: 255,
      halign: "center",
    },

    alternateRowStyles: {
      fillColor: [245, 248, 253],
    },

    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 68 },
      3: { cellWidth: 42, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
    },

    rowPageBreak: "avoid",

    didParseCell: (hook) => {
      if (
        hook.section === "body" &&
        hook.column.index === 4 &&
        typeof hook.cell.raw === "string"
      ) {
        const warna =
          hook.cell.raw === "Anggota"
            ? warnaKeterangan.anggota
            : warnaKeterangan.pimpinan;

        hook.cell.styles.fillColor = warna.fill;
        hook.cell.styles.textColor = warna.teks;
        hook.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Nomor halaman.
  const jumlahHalaman = doc.getNumberOfPages();

  for (let i = 1; i <= jumlahHalaman; i++) {
    doc.setPage(i);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);

    doc.text(
      `Halaman ${i} dari ${jumlahHalaman}`,
      lebar - 14,
      tinggi - 8,
      { align: "right" },
    );
  }

  doc.save(namaFile);
}