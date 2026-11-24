
import * as XLSX from "xlsx";

export type AktivitasPayload = {
  judul: string;
  tahunPelaksanaan: number;
  status: string;
  progres: number;
  keterangan: string;
  targetOutputs: { jenis: string; jumlah: number }[];
  kategoriPendanaan: string;
  unitPengampuDifa: string;
  programSkemaPendanaan: string;
};

export type PerisetImport = {
  nama: string;
  nip: string;
  email: string;
  password: string;
  unitKerja: string;
  satuanKerja: string;
  aktivitas: AktivitasPayload[];
};

export type GalatBaris = {
  baris: number;
  pesan: string;
};

export type HasilParse = {
  periset: PerisetImport[];
  galat: GalatBaris[];
  jumlahBaris: number;
};

export type OpsiExcel = {
  unit: { nama: string; satuanKerja: string }[];
  status: string[];
  jenisOutput: string[];
  kategori: string[];
  unitPengampuDifa: string[];
  programSkemaPerUnit: Record<string, string[]>;
};

export const PROGRAM_SKEMA_PER_UNIT: Record<string, string[]> = {
  ORPA: ["RIIM", "PRIS", "Hibah"],
  DFRI: ["SBKU"],
};

const NAMA_SHEET = "Data Periset";

export const KOLOM = {
  nama: "Nama Ketua Tim",
  nip: "NIP",
  email: "Email Aktif",
  password: "Password Akun (minimal 8 karakter)",
  unit: "Unit Kerja",
  satuan: "Satuan Kerja",
  judul: "Judul Aktivitas",
  tahun: "Tahun Pelaksanaan",
  status: "Status Pelaksanaan",
  progres: "Progres Total (%)",
  keterangan: "Keterangan Progres",
  target: "Target Output",
  kategori: "Kategori Pendanaan",
  unitPengampuDifa: "Unit Pengampu DIFA",
  programSkema: "Program/Skema Pendanaan",
} as const;

type KunciKolom = keyof typeof KOLOM;

const WAJIB: KunciKolom[] = [
  "nama",
  "email",
  "password",
  "unit",
  "judul",
  "tahun",
  "status",
  "target",
  "kategori",
  "unitPengampuDifa",
  "programSkema",
];

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const kecil = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ");

const cocok = (v: string, daftar: readonly string[]) =>
  daftar.find((d) => kecil(d) === kecil(v));

export function unduhTemplate(opsi: OpsiExcel) {
  const wb = XLSX.utils.book_new();

  const judulKolom = Object.values(KOLOM) as string[];
  const isian = XLSX.utils.aoa_to_sheet([judulKolom]);

  isian["!cols"] = [
    28, 30, 28, 34, 30, 48, 20, 24, 16, 32, 44, 22, 24, 34,
  ].map((wch) => ({ wch }));

  XLSX.utils.book_append_sheet(wb, isian, NAMA_SHEET);

  const contohJenis = opsi.jenisOutput.slice(0, 2);

  const contohTarget = contohJenis.length
    ? contohJenis.map((j, i) => `${j}: ${i + 1}`).join("; ")
    : "Jenis output: 1";

  const contohUnit = opsi.unit[0];

  const petunjuk: (string | number)[][] = [
    ["PETUNJUK PENGISIAN TEMPLATE PERISET"],
    [""],
    [`1. Isi sheet '${NAMA_SHEET}'. Satu baris = satu aktivitas.`],
    [
      "2. Jika seorang periset memiliki beberapa aktivitas, ulangi seluruh identitas akun (nama, email, password, unit kerja) pada setiap baris.",
    ],
    [
      "3. Email menjadi identitas akun. Baris dengan email sama akan digabung menjadi satu akun dengan beberapa aktivitas.",
    ],
    [
      "4. Password wajib diisi, minimal 8 karakter, dan harus sama pada semua baris dengan email yang sama.",
    ],
    [
      "5. Tahun Pelaksanaan wajib diisi dengan angka tahun antara 2000 sampai 2100. Tahun dapat berbeda untuk setiap aktivitas.",
    ],
    [
      "6. Unit Kerja, Status Pelaksanaan, Jenis Output, Kategori Pendanaan, Unit Pengampu DIFA, dan Program/Skema harus sesuai pilihan yang tersedia di sheet 'Pilihan'.",
    ],
    [
      `7. Target Output ditulis 'Jenis: jumlah'. Jika lebih dari satu, pisahkan dengan titik koma. Contoh: ${contohTarget}`,
    ],
    [
      "8. Progres diisi angka 0–100. Jika kosong, nilainya 0. Keterangan Progres dan Satuan Kerja boleh dikosongkan.",
    ],
    [
      "9. PNBP hanya boleh menggunakan Unit Pengampu DIFA ORPA. Rupiah Murni dapat menggunakan ORPA atau DFRI.",
    ],
    [
      "10. Program/skema yang diperbolehkan: ORPA = RIIM, PRIS, Hibah; DFRI = SBKU.",
    ],
    [""],
    ["CONTOH BARIS (silakan ganti dengan data sebenarnya)"],
    [judulKolom],
    [
      "Nama Lengkap",
      "nama@brin.go.id",
      "GantiPassword123",
      contohUnit?.nama ?? "",
      contohUnit?.satuanKerja ?? "",
      "Judul aktivitas penelitian",
      new Date().getFullYear(),
      opsi.status[0] ?? "",
      25,
      "",
      contohTarget,
      opsi.kategori[0] ?? "Rupiah Murni",
      "ORPA",
      "RIIM",
    ],
  ];

  const sheetPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  sheetPetunjuk["!cols"] = [{ wch: 140 }];
  XLSX.utils.book_append_sheet(wb, sheetPetunjuk, "Petunjuk");

  const kolomPilihan: [string, string[]][] = [
    ["Unit Kerja", opsi.unit.map((u) => u.nama)],
    ["Satuan Kerja", opsi.unit.map((u) => u.satuanKerja)],
    ["Status Pelaksanaan", opsi.status],
    ["Jenis Output", opsi.jenisOutput],
    ["Kategori Pendanaan", opsi.kategori],
    ["Unit Pengampu DIFA", opsi.unitPengampuDifa],
    ["Program/Skema ORPA", opsi.programSkemaPerUnit.ORPA ?? []],
    ["Program/Skema DFRI", opsi.programSkemaPerUnit.DFRI ?? []],
  ];

  const tinggi = Math.max(1, ...kolomPilihan.map(([, v]) => v.length));

  const aoa: string[][] = [
    kolomPilihan.map(([h]) => h),
  ];

  for (let i = 0; i < tinggi; i++) {
    aoa.push(kolomPilihan.map(([, v]) => v[i] ?? ""));
  }

  const sheetPilihan = XLSX.utils.aoa_to_sheet(aoa);

  sheetPilihan["!cols"] = [
    34, 34, 26, 36, 24, 24, 28, 28,
  ].map((wch) => ({ wch }));

  XLSX.utils.book_append_sheet(wb, sheetPilihan, "Pilihan");

  XLSX.writeFile(wb, "template-data-periset.xlsx");
}

function parseTarget(teks: string, jenisOutput: string[]) {
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

    if (!jenis) {
      galat.push(`Jenis output '${namaJenis}' tidak dikenal`);
    } else if (!Number.isInteger(jumlah) || jumlah < 1) {
      galat.push(`Jumlah target '${jenis}' minimal 1`);
    } else if (target.some((t) => t.jenis === jenis)) {
      galat.push(`Jenis output '${jenis}' muncul lebih dari sekali`);
    } else {
      target.push({ jenis, jumlah });
    }
  }

  if (!potongan.length) {
    galat.push("Target Output wajib diisi");
  }

  return { target, galat };
}

export async function parseExcelPeriset(
  file: File,
  opsi: OpsiExcel
): Promise<HasilParse> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });

  const ws =
    wb.Sheets[NAMA_SHEET] ??
    wb.Sheets[wb.SheetNames[0]];

  if (!ws) {
    throw new Error("File Excel tidak berisi sheet apa pun.");
  }

  const baris = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!baris.length) {
    throw new Error("Sheet kosong. Gunakan template Excel yang disediakan.");
  }

  const judul = (baris[0] ?? []).map((h) => kecil(String(h)));

  const peta: Partial<Record<KunciKolom, number>> = {};

  (Object.keys(KOLOM) as KunciKolom[]).forEach((k) => {
    const i = judul.indexOf(kecil(KOLOM[k]));
    if (i >= 0) peta[k] = i;
  });

  const hilang = WAJIB.filter((k) => peta[k] === undefined);

  if (hilang.length) {
    throw new Error(
      `Kolom tidak ditemukan: ${hilang.map((k) => KOLOM[k]).join(", ")}. Unduh template terbaru.`
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
    const r = baris[i] ?? [];

    if (r.every((c) => String(c ?? "").trim() === "")) {
      continue;
    }

    jumlahBaris++;

    const noBaris = i + 1;
    const catat = (pesan: string) =>
      galat.push({ baris: noBaris, pesan });

    const nama = sel(r, "nama");
    const email = sel(r, "email").toLowerCase();
    const nip = sel(r, "nip").replace(/\s/g, "");

    if (nip && !/^\d{18}$/.test(nip)) {
      catat("NIP harus terdiri dari 18 digit angka");
    }
    const password = sel(r, "password");

    const unitMentah = sel(r, "unit");

    const unit =
      opsi.unit.find((u) => kecil(u.nama) === kecil(unitMentah))?.nama ?? "";

    const satuan =
      sel(r, "satuan") ||
      opsi.unit.find((u) => kecil(u.nama) === kecil(unit))?.satuanKerja ||
      "";

    const judulAkt = sel(r, "judul");

    // Validasi tahun pelaksanaan
    const tahunMentah = sel(r, "tahun");
    const tahunPelaksanaan = Number(tahunMentah);

    const statusMentah = sel(r, "status");
    const kategoriMentah = sel(r, "kategori");
    const unitPengampu = sel(r, "unitPengampuDifa").toUpperCase();
    const skemaMentah = sel(r, "programSkema");

    const aktivitasSebelum = galat.length;

    if (!nama) catat("Nama Ketua Tim kosong");

    if (!email) {
      catat("Email Aktif kosong");
    } else if (!POLA_EMAIL.test(email)) {
      catat(`Format email '${email}' belum benar`);
    }

    if (!password) {
      catat("Password akun kosong");
    } else if (password.length < 8) {
      catat("Password minimal 8 karakter");
    }

    if (!unitMentah) {
      catat("Unit Kerja kosong");
    } else if (!unit) {
      catat(`Unit Kerja '${unitMentah}' tidak dikenal; pilih dari sheet Pilihan`);
    }

    if (!judulAkt) {
      catat("Judul Aktivitas kosong");
    }

    if (!tahunMentah) {
      catat("Tahun Pelaksanaan wajib diisi");
    } else if (
      !Number.isInteger(tahunPelaksanaan) ||
      tahunPelaksanaan < 2000 ||
      tahunPelaksanaan > 2100
    ) {
      catat("Tahun Pelaksanaan harus berupa angka bulat antara 2000–2100");
    }

    const status = cocok(statusMentah, opsi.status);

    if (!statusMentah) {
      catat("Status Pelaksanaan kosong");
    } else if (!status) {
      catat(`Status '${statusMentah}' tidak dikenal`);
    }

    const kategori = cocok(kategoriMentah, opsi.kategori);

    if (!kategori) {
      catat(`Kategori Pendanaan '${kategoriMentah}' tidak valid`);
    }

    if (!opsi.unitPengampuDifa.includes(unitPengampu)) {
      catat("Unit Pengampu DIFA harus ORPA atau DFRI");
    }

    if (kategori === "PNBP" && unitPengampu !== "ORPA") {
      catat("Kategori PNBP hanya boleh menggunakan Unit Pengampu DIFA ORPA");
    }

    const skema = cocok(
      skemaMentah,
      opsi.programSkemaPerUnit[unitPengampu] ?? []
    );

    if (!skema) {
      catat(
        `Program/Skema '${skemaMentah}' tidak sesuai dengan Unit Pengampu DIFA ${unitPengampu}`
      );
    }

    let progres = 0;

    const progresMentah = sel(r, "progres")
      .replace("%", "")
      .replace(",", ".")
      .trim();

    if (progresMentah) {
      const n = Number(progresMentah);

      if (!Number.isFinite(n) || n < 0 || n > 100) {
        catat(`Progres '${sel(r, "progres")}' harus angka 0–100`);
      } else {
        progres = Math.round(n);
      }
    }

    const { target, galat: galatTarget } = parseTarget(
      sel(r, "target"),
      opsi.jenisOutput
    );

    galatTarget.forEach(catat);

    // Jangan masukkan aktivitas jika ada kesalahan pada baris ini.
    if (galat.length !== aktivitasSebelum) {
      continue;
    }

    const aktivitas: AktivitasPayload = {
      judul: judulAkt,
      tahunPelaksanaan,
      status: status!,
      progres,
      keterangan: sel(r, "keterangan"),
      targetOutputs: target,
      kategoriPendanaan: kategori!,
      unitPengampuDifa: unitPengampu,
      programSkemaPendanaan: skema!,
    };

    // Email menjadi kunci pengelompokan akun.
    const key = email;
    const ada = kelompok.get(key);

    if (!ada) {
      kelompok.set(key, {
        nama,
        email,
        password,
        nip,
        unitKerja: unit,
        satuanKerja: satuan,
        aktivitas: [aktivitas],
      });
    } else {
      const konflik: string[] = [];

      if (kecil(ada.nama) !== kecil(nama)) konflik.push("nama");
      if (ada.password !== password) konflik.push("password");
      if (kecil(ada.nip) !== kecil(nip)) konflik.push("nip");
      if (kecil(ada.unitKerja) !== kecil(unit)) konflik.push("unit kerja");
      if (kecil(ada.satuanKerja) !== kecil(satuan)) konflik.push("satuan kerja");

      if (konflik.length) {
        catat(
          `Identitas ${konflik.join(", ")} berbeda pada email ${email}; samakan seluruh baris untuk email ini`
        );
      } else {
        ada.aktivitas.push(aktivitas);
      }
    }
  }

  return {
    periset: [...kelompok.values()],
    galat,
    jumlahBaris,
  };
}
