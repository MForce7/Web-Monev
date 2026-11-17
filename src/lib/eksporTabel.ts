import type { UserOptions } from "jspdf-autotable";

/* ---------- Tipe umum ---------- */
export type Sel = string | number | null | undefined;
export type Link = { label: string; url: string };

/** Judul kolom bertingkat: `tetap` kolom pertama digabung 2 baris, sisanya dikelompokkan per `items` */
export type Grup = { tetap: number; items: { label: string; span: number }[] };

type DataTabel = {
  kolom: string[];
  baris: Sel[][];
  grup?: Grup;
  /** Indeks kolom yang isinya rata tengah (sisanya rata kiri) */
  rataTengah?: number[];
};

/** Daftar link jadi teks. Di PDF cukup label, di Excel label + alamatnya. */
export function teksLink(links?: Link[], denganUrl = false): string {
  if (!links || links.length === 0) return "";
  return links.map((l) => (denganUrl && l.url ? `${l.label} (${l.url})` : l.label)).join("\n");
}

const tanggalIso = () => new Date().toISOString().slice(0, 10);
const tanggalIndo = () =>
  new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

/** Untuk nama file: huruf, angka, dan strip saja */
export const bersihkanNama = (s: string) => s.replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");

function unduhBlob(blob: Blob, namaFile: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================== PDF ============================== */

export type OpsiPdf = DataTabel & {
  judul: string;
  subjudul: string;
  ringkasan?: string;
  /** Tanpa ekstensi dan tanggal, keduanya ditambahkan otomatis */
  namaFile: string;
  /** Lebar kolom dalam mm (undefined = otomatis) */
  lebarKolom?: (number | undefined)[];
};

export async function unduhPdfTabel(o: OpsiPdf) {
  // Dimuat saat dibutuhkan saja, supaya halaman tidak berat
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const lebar = doc.internal.pageSize.getWidth();
  const tinggi = doc.internal.pageSize.getHeight();
  const file = `${o.namaFile}-${tanggalIso()}.pdf`;

  // Kop (sama dengan Rekap Pemantauan)
  doc.setFillColor(27, 63, 120);
  doc.rect(0, 0, lebar, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(o.judul, 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(o.subjudul, 14, 16.5);
  doc.text(`Dicetak ${tanggalIndo()}`, lebar - 14, 16.5, { align: "right" });

  if (o.baris.length === 0) {
    doc.setTextColor(27, 53, 96);
    doc.setFontSize(10);
    doc.text("Belum ada data untuk filter ini.", 14, 34);
    doc.save(file);
    return;
  }

  let mulaiY = 28;
  if (o.ringkasan) {
    doc.setTextColor(27, 53, 96);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(o.ringkasan, 14, 29);
    mulaiY = 33;
  }

  const tengah = { halign: "center", valign: "middle" } as const;
  const kepala: NonNullable<UserOptions["head"]> = o.grup
    ? [
        [
          ...o.kolom.slice(0, o.grup.tetap).map((k) => ({ content: k, rowSpan: 2, styles: tengah })),
          ...o.grup.items.map((g) => ({ content: g.label.toUpperCase(), colSpan: g.span, styles: tengah })),
        ],
        o.kolom.slice(o.grup.tetap),
      ]
    : [o.kolom];

  const gayaKolom: Record<string, { cellWidth?: number; halign: "center" | "left" }> = {};
  o.kolom.forEach((_, i) => {
    const w = o.lebarKolom?.[i];
    gayaKolom[String(i)] = {
      halign: o.rataTengah?.includes(i) ? "center" : "left",
      ...(w ? { cellWidth: w } : {}),
    };
  });

  autoTable(doc, {
    startY: mulaiY,
    head: kepala,
    body: o.baris.map((r) => r.map((v) => (v === null || v === undefined ? "" : String(v)))),
    margin: { left: 10, right: 10, bottom: 14 },
    styles: { fontSize: 7, cellPadding: 1.8, lineColor: [219, 230, 247], lineWidth: 0.2, textColor: [27, 53, 96], valign: "top", overflow: "linebreak" },
    headStyles: { fillColor: [27, 63, 120], textColor: 255, halign: "center", valign: "middle", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 248, 253] },
    columnStyles: gayaKolom,
    rowPageBreak: "avoid",
    didParseCell: (h) => {
      // Baris judul kedua (anak kolom) sedikit lebih terang
      if (o.grup && h.section === "head" && h.row.index === 1) {
        h.cell.styles.fillColor = [42, 90, 168];
      }
    },
  });

  // Nomor halaman
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(`Halaman ${i} dari ${n}`, lebar - 14, tinggi - 8, { align: "right" });
  }

  doc.save(file);
}

/* ============================== EXCEL ============================== */

export type WarnaSel = { isi: string; teks: string }; // hex tanpa "#", mis. "DCFCE7"

export type SheetExcel = DataTabel & {
  /** Nama tab (maksimal 31 karakter, tanpa / \ ? * [ ] :) */
  nama: string;
  judul: string;
  subjudul: string;
  ringkasan?: string;
  /** Lebar kolom dalam karakter */
  lebarKolom?: number[];
  /** Warna khusus per sel (mis. status Lengkap / Belum Lengkap / Kosong) */
  warnaSel?: (nilai: Sel, kolom: number) => WarnaSel | undefined;
};

export async function unduhExcel(namaFile: string, sheets: SheetExcel[]) {
  const mod = await import("exceljs");
  const Workbook = mod.Workbook ?? mod.default.Workbook;
  const wb = new Workbook();
  wb.creator = "ORPA - Badan Riset dan Inovasi Nasional";
  wb.created = new Date();

  const garis = { style: "thin" as const, color: { argb: "FFDBE6F7" } };
  const tepi = { top: garis, left: garis, bottom: garis, right: garis };
  const isi = (hex: string) => ({
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: `FF${hex}` },
  });

  for (const s of sheets) {
    const n = s.kolom.length;
    const ws = wb.addWorksheet(s.nama);
    ws.columns = s.kolom.map((_, i) => ({ width: s.lebarKolom?.[i] ?? 20 }));

    /* ----- kop: judul, subjudul, ringkasan ----- */
    const barisKop = (teks: string, opsi: { size: number; bold?: boolean; fill: string; warna: string; tinggi: number }) => {
      const r = ws.addRow([teks]);
      ws.mergeCells(r.number, 1, r.number, n);
      const c = r.getCell(1);
      c.font = { name: "Calibri", size: opsi.size, bold: opsi.bold, color: { argb: `FF${opsi.warna}` } };
      c.fill = isi(opsi.fill);
      c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      r.height = opsi.tinggi;
    };
    barisKop(s.judul, { size: 14, bold: true, fill: "1B3F78", warna: "FFFFFF", tinggi: 26 });
    barisKop(`${s.subjudul}  ·  Dicetak ${tanggalIndo()}`, { size: 10, fill: "1B3F78", warna: "FFFFFF", tinggi: 18 });
    if (s.ringkasan) barisKop(s.ringkasan, { size: 10, bold: true, fill: "EAF0FA", warna: "1B3560", tinggi: 20 });
    ws.addRow([]);

    /* ----- judul kolom ----- */
    const gayaKepala = (r: ReturnType<typeof ws.addRow>, hexUntuk: (kolom: number) => string) => {
      for (let c = 1; c <= n; c++) {
        const cell = r.getCell(c);
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = isi(hexUntuk(c));
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = tepi;
      }
    };

    let akhirKepala: number;
    if (s.grup) {
      const g = s.grup;
      const r1 = ws.addRow([
        ...s.kolom.slice(0, g.tetap),
        ...g.items.flatMap((it) => [it.label.toUpperCase(), ...Array<string>(it.span - 1).fill("")]),
      ]);
      const r2 = ws.addRow([...Array<string>(g.tetap).fill(""), ...s.kolom.slice(g.tetap)]);
      gayaKepala(r1, () => "1B3F78");
      gayaKepala(r2, (c) => (c <= g.tetap ? "1B3F78" : "2A5AA8"));
      r1.height = 22;
      r2.height = 32;

      for (let c = 1; c <= g.tetap; c++) ws.mergeCells(r1.number, c, r2.number, c);
      let kol = g.tetap + 1;
      for (const it of g.items) {
        if (it.span > 1) ws.mergeCells(r1.number, kol, r1.number, kol + it.span - 1);
        kol += it.span;
      }
      akhirKepala = r2.number;
    } else {
      const r = ws.addRow(s.kolom);
      gayaKepala(r, () => "1B3F78");
      r.height = 28;
      akhirKepala = r.number;
    }

    /* ----- isi ----- */
    if (s.baris.length === 0) {
      const r = ws.addRow(["Belum ada data untuk filter ini."]);
      ws.mergeCells(r.number, 1, r.number, n);
      r.getCell(1).font = { italic: true, size: 10, color: { argb: "FF64748B" } };
    }

    s.baris.forEach((b, ri) => {
      const r = ws.addRow(b.map((v) => (v === null || v === undefined ? "" : v)));
      for (let c = 1; c <= n; c++) {
        const cell = r.getCell(c);
        cell.font = { name: "Calibri", size: 10, color: { argb: "FF1B3560" } };
        cell.alignment = {
          vertical: "top",
          horizontal: s.rataTengah?.includes(c - 1) ? "center" : "left",
          wrapText: true,
        };
        cell.border = tepi;
        if (ri % 2 === 1) cell.fill = isi("F5F8FD");

        const w = s.warnaSel?.(b[c - 1], c - 1);
        if (w) {
          cell.fill = isi(w.isi);
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${w.teks}` } };
        }
      }
    });

    // Judul kolom tetap terlihat saat digulir, dan siap cetak landscape selebar 1 halaman
    ws.views = [{ state: "frozen", ySplit: akhirKepala }];
    ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  }

  const buf = await wb.xlsx.writeBuffer();
  unduhBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${namaFile}-${tanggalIso()}.xlsx`,
  );
}