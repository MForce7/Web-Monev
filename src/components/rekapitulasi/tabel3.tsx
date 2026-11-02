import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";
import rekapOutput from "../../config/rekapOutput.json";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/* ---------- Tipe data ---------- */
type StatusPantau = "Lengkap" | "Belum Lengkap" | "Kosong";
type Sel = { status?: StatusPantau; belumSesuai?: string[] | string | number };
type BarisPantau = {
  id: string | number;
  nama: string;
  pusatRiset?: string;
  bulan?: Record<string, Sel>; // mis. { Januari: { status: "Lengkap" } }
};

/* ---------- Pemeriksa isi logbook ----------
   Hubungkan ke data logbook: kirim isian satu ketua tim di satu bulan, hasilnya langsung
   berupa status + daftar kolom yang belum diisi. Sesuaikan nama kunci dengan data logbook. */
const KOLOM_WAJIB = [
  "Uraian Kemajuan Aktivitas",
  "Kendala Ditemui",
  "Mitigasi / Rencana Tindak Lanjut",
  "Data Dukung Progres",
  "Jenis Output",
  "Judul Output",
  "Status",
  "Presentase Progress (%)",
  "Output Data Dukung",
];

export function periksaIsi(isi?: Partial<Record<string, string | number | null>>): Sel {
  if (!isi) return { status: "Kosong", belumSesuai: ["Semua kolom kosong"] };
  const kosong = KOLOM_WAJIB.filter((k) => {
    const v = isi[k];
    return v === undefined || v === null || String(v).trim() === "";
  });
  if (kosong.length === KOLOM_WAJIB.length) return { status: "Kosong", belumSesuai: ["Semua kolom kosong"] };
  if (kosong.length) return { status: "Belum Lengkap", belumSesuai: kosong };
  return { status: "Lengkap", belumSesuai: [] };
}

/* ---------- Data ----------
   Diambil dari rekapOutput.json -> "pemantauan". Edit datanya di file JSON itu. */
const semua: BarisPantau[] =
  (rekapOutput as unknown as { pemantauan?: BarisPantau[] }).pemantauan ?? [];

/* ---------- Tampilan status ---------- */
const WARNA_STATUS: Record<StatusPantau, string> = {
  Lengkap: "bg-[#dcfce7] text-[#166534]",
  "Belum Lengkap": "bg-[#fef3c7] text-[#92400e]",
  Kosong: "bg-[#fee2e2] text-[#991b1b]",
};

const daftar = (v?: string[] | string | number): string[] =>
  Array.isArray(v) ? v : v === undefined || v === "" ? [] : [String(v)];

/* ---------- Cetak PDF ---------- */
async function cetakPdf(pusatRiset: string, data: BarisPantau[]) {
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
    head: [["No", "Nama Ketua Tim", ...BULAN.map((b) => b.slice(0, 3))]],
    body: data.map((d, i) => [
      String(i + 1),
      d.nama,
      ...BULAN.map((b) => SINGKAT[d.bulan?.[b]?.status ?? ""] ?? "-"),
    ]),
    styles: { fontSize: 7, cellPadding: 1.6, lineColor: [219, 230, 247], lineWidth: 0.2, textColor: [27, 53, 96], valign: "middle" },
    headStyles: { fillColor: [27, 63, 120], textColor: 255, halign: "center" },
    alternateRowStyles: { fillColor: [245, 248, 253] },
    columnStyles: { 0: { cellWidth: 9, halign: "center" }, 1: { cellWidth: 60 } },
    didParseCell: (h) => {
      if (h.section === "body" && h.column.index >= 2) {
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
        rincian.push([d.nama, b, s.status, daftar(s.belumSesuai).map((x) => `• ${x}`).join("\n")]);
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
      head: [["Nama Ketua Tim", "Bulan", "Status", "Belum diisi di logbook"]],
      body: rincian,
      styles: { fontSize: 8, cellPadding: 2, lineColor: [219, 230, 247], lineWidth: 0.2, textColor: [27, 53, 96], valign: "top" },
      headStyles: { fillColor: [27, 63, 120], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 248, 253] },
      columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 26 }, 2: { cellWidth: 30 } },
      didParseCell: (h) => {
        if (h.section === "body" && h.column.index === 2) {
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

/* ---------- Tabel ---------- */
const th = "border-r border-white/25 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";
const td = "border-b border-r border-[#dbe6f7] px-3 py-2 text-center text-sm text-[#1b3560]";

// Lebar dikunci (width + min + max) supaya posisi kolom Nama tepat di 56px dan tidak ada celah
const kunci1 = "w-[56px] min-w-[56px] max-w-[56px]";
const kunci2 = "w-[200px] min-w-[200px] max-w-[200px]";
const stickyBody1 = `sticky left-0 z-10 ${kunci1}`;
const stickyBody2 = `sticky left-[56px] z-10 ${kunci2}`;
const stickyHead1 = `sticky left-0 z-20 ${kunci1}`;
const stickyHead2 = `sticky left-[56px] z-20 ${kunci2}`;
const LEBAR_STICKY = 256; // 56px (No) + 200px (Nama Ketua Tim), dipakai untuk posisi bayangan kiri

// bulan tetap ada di tipe props supaya cocok dengan komponen lain, tapi tidak dipakai di sini
type Props = { bulan?: string | null; pusatRiset: string | null };

export default function Tabel3({ pusatRiset }: Props) {
  // "Semua Pusat Riset" (atau belum memilih) = tampilkan semua ketua tim
  const data =
    pusatRiset && pusatRiset !== "Semua Pusat Riset"
      ? semua.filter((d) => d.pusatRiset === pusatRiset)
      : semua;
  const jumlahBaris = Math.max(data.length, JUMLAH_BARIS_KOSONG);

  const ref = useRef<HTMLDivElement>(null);
  const [bisaKiri, setBisaKiri] = useState(false);
  const [bisaKanan, setBisaKanan] = useState(false);
  const [mencetak, setMencetak] = useState(false);

  const cek = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setBisaKiri(el.scrollLeft > 4);
    setBisaKanan(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    cek();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(cek);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cek]);

  const geser = (arah: 1 | -1) => ref.current?.scrollBy({ left: arah * 420, behavior: "smooth" });
  const bisaScroll = bisaKiri || bisaKanan;

  // Belum memilih pusat riset = cetak semua pusat riset
  const cetak = async () => {
    if (mencetak) return;
    setMencetak(true);
    try {
      await cetakPdf(pusatRiset ?? "Semua Pusat Riset", data);
    } catch (err) {
      console.error(err);
      alert("PDF gagal dibuat. Coba lagi.");
    } finally {
      setMencetak(false);
    }
  };

  return (
    // Pembungkus luar membawa bayangan + sudut bulat; bagian dalam dipotong dengan clip-path
    <div className="w-full rounded-2xl shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
      <section className="isolate w-full overflow-hidden rounded-2xl bg-white [clip-path:inset(0_round_1rem)]">
        {/* Bilah atas: judul + tombol Cetak */}
        <div className="flex items-center justify-between gap-3 border-b border-[#dbe6f7] bg-white px-4 py-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1b3560]">Pemantauan pengisian logbook</p>
            <p className="truncate text-xs text-slate-500">{pusatRiset ?? "Semua pusat riset"}</p>
          </div>
          <button
            type="button"
            onClick={cetak}
            disabled={mencetak}
            title="Unduh rekap sebagai PDF"
            style={{ background: GRAD_CARD }}
            className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-[0_2px_8px_rgba(27,63,120,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9V3h12v6" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="7" rx="1" />
            </svg>
            {mencetak ? "Membuat PDF…" : "Cetak"}
          </button>
        </div>

        {/* petunjuk: hanya muncul kalau tabel memang bisa di-scroll */}
        {bisaScroll && (
          <p className="flex items-center justify-center gap-2 border-b border-[#dbe6f7] bg-[#f5f8fd] px-3 py-1 text-xs font-semibold text-[#2a5aa8]">
            {bisaKiri && <span aria-hidden>←</span>}
            Geser tabel ke samping untuk melihat bulan lainnya
            {bisaKanan && <span aria-hidden className="animate-pulse">→</span>}
          </p>
        )}

        <div className="relative">
          <div
            ref={ref}
            onScroll={cek}
            className="overflow-x-auto [scrollbar-color:#2a5aa8_#eaf0fa] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#eaf0fa] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a5aa8]"
          >
            <table className="w-full border-separate border-spacing-0">
              <thead style={{ background: GRAD_CARD }}>
                <tr>
                  <th rowSpan={2} className={`${th} ${stickyHead1} bg-[#1b3f78] border-b`}>No</th>
                  <th rowSpan={2} className={`${th} ${stickyHead2} bg-[#1b3f78] border-b text-left`}>Nama Ketua Tim</th>
                  {BULAN.map((b) => (
                    <th key={b} colSpan={2} className={`${th} min-w-[260px] border-b text-sm`}>{b}</th>
                  ))}
                </tr>
                <tr>
                  {BULAN.map((b) => (
                    <FragmentHead key={b} />
                  ))}
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: jumlahBaris }).map((_, i) => {
                  const d = data[i];
                  return (
                    <tr
                      key={d?.id ?? `kosong-${i}`}
                      className={`min-h-[52px] transition-colors hover:bg-[#eaf0fa] [&:last-child>td]:border-b-0 ${
                        i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"
                      }`}
                    >
                      <td className={`${td} ${stickyBody1} h-[52px] bg-inherit`}>{d ? i + 1 : null}</td>
                      <td className={`${td} ${stickyBody2} bg-inherit text-left font-medium`}>{d?.nama}</td>
                      {BULAN.map((b) => {
                        const s = d?.bulan?.[b];
                        return <FragmentSel key={b} ada={!!d} status={s?.status} belum={s?.belumSesuai} />;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* bayangan tepi + tombol panah */}
          {bisaKanan && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-[#1b3f78]/10 to-transparent" />
              <TombolPanah arah="kanan" onClick={() => geser(1)} />
            </>
          )}
          {bisaKiri && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 z-20 w-6 bg-gradient-to-r from-[#1b3f78]/10 to-transparent"
                style={{ left: LEBAR_STICKY }}
              />
              <TombolPanah arah="kiri" onClick={() => geser(-1)} style={{ left: LEBAR_STICKY + 8 }} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function TombolPanah({ arah, onClick, style }: { arah: "kiri" | "kanan"; onClick: () => void; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arah === "kanan" ? "Geser ke kanan" : "Geser ke kiri"}
      style={style}
      className={`absolute top-9 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-[#2a5aa8] shadow-[0_2px_8px_rgba(27,63,120,0.3)] transition hover:bg-[#eaf0fa] ${
        arah === "kanan" ? "right-2" : ""
      }`}
    >
      {arah === "kanan" ? "›" : "‹"}
    </button>
  );
}

function FragmentHead() {
  return (
    <>
      <th className={`${th} min-w-[110px] bg-white/10 border-b`}>Status</th>
      <th className={`${th} min-w-[150px] bg-white/10 border-b`}>Belum Sesuai</th>
    </>
  );
}

function FragmentSel({
  ada,
  status,
  belum,
}: {
  ada: boolean;
  status?: StatusPantau;
  belum?: string[] | string | number;
}) {
  const item = daftar(belum);
  return (
    <>
      <td className={td}>
        {ada &&
          (status ? (
            <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${WARNA_STATUS[status]}`}>
              {status}
            </span>
          ) : (
            <span className="text-slate-400">–</span>
          ))}
      </td>
      <td className={`${td} text-left text-xs`}>
        {item.length > 0 && (
          <ul className="space-y-0.5">
            {item.map((x) => (
              <li key={x} className="flex gap-1.5">
                <span aria-hidden className="text-[#2a5aa8]">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        )}
      </td>
    </>
  );
}