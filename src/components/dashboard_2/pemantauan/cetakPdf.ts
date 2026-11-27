import type { BarisPantau, StatusPantau } from "./types";
import { BULAN, daftar } from "./types";

/* ---------- Cetak PDF ---------- */
export async function cetakPdf(pusatRiset: string, data: BarisPantau[]) {
  // Dimuat saat dibutuhkan saja, supaya halaman tidak berat
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const lebar = doc.internal.pageSize.getWidth();
  const tinggi = doc.internal.pageSize.getHeight();
  const tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const namaFile = pusatRiset.replace(/[^\w]+/g, "-");

  // Kop
  doc.setFillColor(27, 63, 120);
  doc.rect(0, 0, lebar, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Rekap Pemantauan Pengisian Logbook", 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(pusatRiset, 14, 16.5);
  doc.text(`Dicetak ${tanggal}`, lebar - 14, 16.5, { align: "right" });

  if (data.length === 0) {
    doc.setTextColor(27, 53, 96);
    doc.setFontSize(10);
    doc.text("Belum ada data pemantauan untuk pusat riset ini.", 14, 34);
    doc.save(`Rekap-Pemantauan-${namaFile}.pdf`);
    return;
  }

  // Total per status
  const total: Record<StatusPantau, number> = { Lengkap: 0, "Belum Lengkap": 0, Kosong: 0 };
  data.forEach((d) =>
    BULAN.forEach((b) => {
      const s = d.bulan?.[b]?.status;
      if (s) total[s]++;
    })
  );
  doc.setTextColor(27, 53, 96);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    `Ketua tim: ${data.length}    Lengkap: ${total.Lengkap}    Belum lengkap: ${total["Belum Lengkap"]}    Kosong: ${total.Kosong}`,
    14,
    29
  );

  // Bagian 1: ringkasan status per bulan
  const SINGKAT: Record<string, string> = { Lengkap: "Lengkap", "Belum Lengkap": "Belum", Kosong: "Kosong" };
  const WARNA_SEL: Record<string, { fill: [number, number, number]; teks: [number, number, number] }> = {
    Lengkap: { fill: [220, 252, 231], teks: [22, 101, 52] },
    Belum: { fill: [254, 243, 199], teks: [146, 64, 14] },
    Kosong: { fill: [254, 226, 226], teks: [153, 27, 27] },
  };

  autoTable(doc, {
    startY: 33,
    head: [["No", "Nama Ketua Tim", "Unit Kerja", ...BULAN.map((b) => b.slice(0, 3))]],
    body: data.map((d, i) => [
      String(i + 1),
      d.nama,
      d.pusatRiset || "-",
      ...BULAN.map((b) => SINGKAT[d.bulan?.[b]?.status ?? ""] ?? "-"),
    ]),
    styles: { fontSize: 7, cellPadding: 1.6, lineColor: [219, 230, 247], lineWidth: 0.2, textColor: [27, 53, 96], valign: "middle" },
    headStyles: { fillColor: [27, 63, 120], textColor: 255, halign: "center" },
    alternateRowStyles: { fillColor: [245, 248, 253] },
    columnStyles: { 0: { cellWidth: 9, halign: "center" }, 1: { cellWidth: 48 }, 2: { cellWidth: 38 } },
    didParseCell: (h) => {
      if (h.section === "body" && h.column.index >= 3) {
        h.cell.styles.halign = "center";
        const w = WARNA_SEL[String(h.cell.raw)];
        if (w) {
          h.cell.styles.fillColor = w.fill;
          h.cell.styles.textColor = w.teks;
          h.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // Bagian 2: rincian kolom yang belum sesuai
  const rincian: string[][] = [];
  data.forEach((d) =>
    BULAN.forEach((b) => {
      const s = d.bulan?.[b];
      if (s?.status && s.status !== "Lengkap") {
        rincian.push([d.nama, d.pusatRiset || "-", b, s.status, daftar(s.belumSesuai).map((x) => `• ${x}`).join("\n")]);
      }
    })
  );

  if (rincian.length) {
    let y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 33;
    y += 10;
    if (y > tinggi - 40) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(27, 53, 96);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Rincian yang belum sesuai", 14, y);

    autoTable(doc, {
      startY: y + 3,
      head: [["Nama Ketua Tim", "Unit Kerja", "Bulan", "Status", "Belum diisi di logbook"]],
      body: rincian,
      styles: { fontSize: 8, cellPadding: 2, lineColor: [219, 230, 247], lineWidth: 0.2, textColor: [27, 53, 96], valign: "top" },
      headStyles: { fillColor: [27, 63, 120], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 248, 253] },
      columnStyles: { 0: { cellWidth: 48 }, 1: { cellWidth: 34 }, 2: { cellWidth: 22 }, 3: { cellWidth: 26 } },
      didParseCell: (h) => {
        if (h.section === "body" && h.column.index === 3) {
          const w = WARNA_SEL[SINGKAT[String(h.cell.raw)] ?? ""];
          if (w) {
            h.cell.styles.fillColor = w.fill;
            h.cell.styles.textColor = w.teks;
            h.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }

  // Nomor halaman
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(`Halaman ${i} dari ${n}`, lebar - 14, tinggi - 8, { align: "right" });
  }

  doc.save(`Rekap-Pemantauan-${namaFile}-${new Date().toISOString().slice(0, 10)}.pdf`);
}