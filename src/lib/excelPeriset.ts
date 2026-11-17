import * as XLSX from "xlsx";

/* ───────── Tipe ───────── */

/** Data satu aktivitas milik periset (dipakai form pop up dan hasil import Excel) */
export type AktivitasPayload = {
  judul: string;
  status: string;
  progres: number;
  keterangan: string;
  targetOutputs: { jenis: string; jumlah: number }[];
  kategoriPendanaan: string;
  skemaMitraProgram: string;
};

export type PerisetImport = {
  nama: string;
  email: string;
  unitKerja: string;
  satuanKerja: string;
  aktivitas: AktivitasPayload[];
};

export type GalatBaris = { baris: number; pesan: string };

export type HasilParse = {
  periset: PerisetImport[];
  galat: GalatBaris[];
  /** jumlah baris data yang terbaca (baris kosong tidak dihitung) */
  jumlahBaris: number;
};

/** Pilihan yang valid, diambil dari konstanta di halaman supaya template dan validasi selalu sama dengan form */
export type OpsiExcel = {
  unit: { nama: string; satuanKerja: string }[];
  status: string[];
  jenisOutput: string[];
  kategori: string[];
  skema: string[];
};

/* ───────── Kolom template ───────── */

const NAMA_SHEET = "Data Periset";

export const KOLOM = {
  nama: "Nama Ketua Tim",
  email: "Email Aktif",
  unit: "Unit Kerja",
  satuan: "Satuan Kerja",
  judul: "Judul Aktivitas",
  status: "Status Pelaksanaan",
  progres: "Progres Total (%)",
  keterangan: "Keterangan Progres",
  target: "Target Output",
  kategori: "Kategori Pendanaan",
  skema: "Skema Mitra Program",
} as const;

type KunciKolom = keyof typeof KOLOM;

const WAJIB: KunciKolom[] = ["nama", "email", "unit", "judul", "status", "target", "kategori", "skema"];

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const kecil = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const cocok = (v: string, daftar: readonly string[]) => daftar.find((d) => kecil(d) === kecil(v));

/* ───────── Unduh template ───────── */

export function unduhTemplate(opsi: OpsiExcel) {
  const wb = XLSX.utils.book_new();

  // Sheet isian: hanya baris judul kolom
  const judulKolom = Object.values(KOLOM) as string[];
  const isian = XLSX.utils.aoa_to_sheet([judulKolom]);
  isian["!cols"] = [28, 28, 34, 30, 50, 22, 16, 30, 44, 22, 44].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, isian, NAMA_SHEET);

  // Sheet petunjuk + contoh pengisian
  const contohJenis = opsi.jenisOutput.slice(0, 2);
  const contohTarget = contohJenis.length
    ? contohJenis.map((j, i) => `${j}: ${i + 1}`).join("; ")
    : "Jenis output: 1";
  const petunjuk: string[][] = [
    ["Petunjuk pengisian"],
    [""],
    [`1. Isi sheet "${NAMA_SHEET}". Satu baris = satu aktivitas.`],
    ["2. Periset yang punya lebih dari satu aktivitas: ulangi Nama Ketua Tim dan Email Aktif yang sama pada setiap barisnya."],
    ["3. Kolom wajib: Nama Ketua Tim, Email Aktif, Unit Kerja, Judul Aktivitas, Status Pelaksanaan, Target Output, Kategori Pendanaan, Skema Mitra Program."],
    [`4. Target Output ditulis "Jenis: jumlah" dan dipisah titik koma bila lebih dari satu. Contoh: ${contohTarget}`],
    [`5. Status Pelaksanaan dan Jenis Output harus sesuai daftar di sheet "Pilihan". Kategori Pendanaan dan Skema boleh diisi teks lain.`],
    ["6. Progres Total diisi angka 0–100 (kosong dianggap 0). Satuan Kerja boleh dikosongkan, akan diisi otomatis dari Unit Kerja."],
    [""],
    ["Contoh satu baris"],
    judulKolom,
    [
      "Dr. Nama Lengkap, M.Si.",
      "nama@brin.go.id",
      opsi.unit[0]?.nama ?? "",
      opsi.unit[0]?.satuanKerja ?? "",
      "Judul aktivitas penelitian",
      opsi.status[0] ?? "",
      "25",
      "",
      contohTarget,
      opsi.kategori[0] ?? "",
      opsi.skema[0] ?? "",
    ],
  ];
  const sheetPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  sheetPetunjuk["!cols"] = [{ wch: 28 }, { wch: 28 }, { wch: 34 }, { wch: 30 }, { wch: 40 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 44 }, { wch: 18 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(wb, sheetPetunjuk, "Petunjuk");

  // Sheet pilihan yang valid
  const kolomPilihan: [string, string[]][] = [
    ["Unit Kerja", opsi.unit.map((u) => u.nama)],
    ["Satuan Kerja", opsi.unit.map((u) => u.satuanKerja)],
    ["Status Pelaksanaan", opsi.status],
    ["Jenis Output", opsi.jenisOutput],
    ["Kategori Pendanaan", opsi.kategori],
    ["Skema Mitra Program", opsi.skema],
  ];
  const tinggi = Math.max(...kolomPilihan.map(([, v]) => v.length));
  const aoa: string[][] = [kolomPilihan.map(([h]) => h)];
  for (let i = 0; i < tinggi; i++) aoa.push(kolomPilihan.map(([, v]) => v[i] ?? ""));
  const sheetPilihan = XLSX.utils.aoa_to_sheet(aoa);
  sheetPilihan["!cols"] = [34, 30, 22, 34, 22, 48].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, sheetPilihan, "Pilihan");

  XLSX.writeFile(wb, "template-data-periset.xlsx");
}

/* ───────── Baca & validasi file yang sudah diisi ───────── */

function parseTarget(teks: string, jenisOutput: string[]): { target: { jenis: string; jumlah: number }[]; galat: string[] } {
  const target: { jenis: string; jumlah: number }[] = [];
  const galat: string[] = [];
  const potongan = teks
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const p of potongan) {
    const i = p.lastIndexOf(":");
    const angka = i >= 0 ? p.slice(i + 1).trim() : "";
    const punyaJumlah = i >= 0 && /^\d+$/.test(angka);
    const namaJenis = (punyaJumlah ? p.slice(0, i) : p).trim();
    const jumlah = punyaJumlah ? Number(angka) : 1;

    const jenis = cocok(namaJenis, jenisOutput);
    if (!jenis) galat.push(`Jenis output "${namaJenis}" tidak dikenal`);
    else if (jumlah < 1) galat.push(`Jumlah target "${jenis}" minimal 1`);
    else if (target.some((t) => t.jenis === jenis)) galat.push(`Jenis output "${jenis}" muncul lebih dari sekali`);
    else target.push({ jenis, jumlah });
  }
  if (potongan.length === 0) galat.push("Target Output wajib diisi");
  return { target, galat };
}

export async function parseExcelPeriset(file: File, opsi: OpsiExcel): Promise<HasilParse> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const ws = wb.Sheets[NAMA_SHEET] ?? wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("File Excel tidak berisi sheet apa pun.");

  const baris = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false });
  if (baris.length === 0) throw new Error("Sheet kosong. Gunakan template Excel yang disediakan.");

  // petakan judul kolom ke nomor kolomnya
  const judul = baris[0].map((h) => kecil(String(h)));
  const peta: Partial<Record<KunciKolom, number>> = {};
  (Object.keys(KOLOM) as KunciKolom[]).forEach((k) => {
    const i = judul.indexOf(kecil(KOLOM[k]));
    if (i >= 0) peta[k] = i;
  });
  const hilang = WAJIB.filter((k) => peta[k] === undefined);
  if (hilang.length) {
    throw new Error(
      `Kolom tidak ditemukan: ${hilang.map((k) => KOLOM[k]).join(", ")}. Gunakan template Excel yang disediakan.`
    );
  }
  const sel = (r: unknown[], k: KunciKolom) => {
    const i = peta[k];
    return i === undefined ? "" : String(r[i] ?? "").trim();
  };

  const galat: GalatBaris[] = [];
  const kelompok = new Map<string, PerisetImport>();
  let jumlahBaris = 0;

  for (let i = 1; i < baris.length; i++) {
    const r = baris[i];
    if (r.every((c) => String(c ?? "").trim() === "")) continue; // lewati baris kosong
    jumlahBaris++;
    const noBaris = i + 1; // nomor baris di Excel
    const catat = (pesan: string) => galat.push({ baris: noBaris, pesan });
    let adaGalat = false;
    const tolak = (pesan: string) => {
      catat(pesan);
      adaGalat = true;
    };

    const nama = sel(r, "nama");
    const email = sel(r, "email");
    const unit = sel(r, "unit");
    const judulAkt = sel(r, "judul");
    const statusMentah = sel(r, "status");
    const kategori = sel(r, "kategori");
    const skema = sel(r, "skema");

    if (!nama) tolak("Nama Ketua Tim kosong");
    if (!email) tolak("Email Aktif kosong");
    else if (!POLA_EMAIL.test(email)) tolak(`Format email "${email}" belum benar`);
    if (!unit) tolak("Unit Kerja kosong");
    if (!judulAkt) tolak("Judul Aktivitas kosong");
    if (!kategori) tolak("Kategori Pendanaan kosong");
    if (!skema) tolak("Skema Mitra Program kosong");

    const status = cocok(statusMentah, opsi.status);
    if (!statusMentah) tolak("Status Pelaksanaan kosong");
    else if (!status) tolak(`Status "${statusMentah}" tidak dikenal (lihat sheet Pilihan)`);

    let progres = 0;
    const progresMentah = sel(r, "progres").replace("%", "").replace(",", ".").trim();
    if (progresMentah) {
      const n = Number(progresMentah);
      if (!Number.isFinite(n) || n < 0 || n > 100) tolak(`Progres "${sel(r, "progres")}" harus angka 0–100`);
      else progres = Math.round(n);
    }

    const { target, galat: galatTarget } = parseTarget(sel(r, "target"), opsi.jenisOutput);
    galatTarget.forEach(tolak);

    if (adaGalat || !status) continue;

    const satuan = sel(r, "satuan") || (opsi.unit.find((u) => kecil(u.nama) === kecil(unit))?.satuanKerja ?? "");
    const aktivitas: AktivitasPayload = {
      judul: judulAkt,
      status,
      progres,
      keterangan: sel(r, "keterangan"),
      targetOutputs: target,
      kategoriPendanaan: cocok(kategori, opsi.kategori) ?? kategori,
      skemaMitraProgram: cocok(skema, opsi.skema) ?? skema,
    };

    const kunci = kecil(nama);
    const ada = kelompok.get(kunci);
    if (!ada) {
      kelompok.set(kunci, { nama, email, unitKerja: unit, satuanKerja: satuan, aktivitas: [aktivitas] });
    } else if (kecil(ada.email) !== kecil(email)) {
      catat(`Email "${email}" berbeda dengan baris lain untuk ${ada.nama} (${ada.email})`);
    } else {
      ada.aktivitas.push(aktivitas);
    }
  }

  return { periset: [...kelompok.values()], galat, jumlahBaris };
}