import { Fragment, useMemo, useRef, useState, type DragEvent } from "react";

import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import Badge, { WARNA_BADGE } from "../components/importjson/Badge";
import Langkah from "../components/importjson/Langkah";
import TombolGradasi from "../components/importjson/TombolGradasi";
import { GRAD } from "../components/importjson/konstanta";

import DaftarMasalah, { useSelesai } from "../components/importjson/Daftarmasalah";
import MonthlyLogTable from "../components/logbook/logbookTable/MonthlyLogTable";

import {
  buatPrompt,
  bulanAdaIsi,
  gabungEntri,
  idMasalah,
  parseBerkas,
  type EntriLogbook,
  type HasilEntri,
} from "../lib/validasiLogbook";
import { BULAN } from "../lib/LogbookData";
import {
  ambilLogbookAktif,
  daftarLogbook,
  hapusLogbook,
  simpanLogbook,
  simpanSelesai,
} from "../lib/logbookStore";

/* ───────── Konstanta & helper ───────── */

const WARNA_GALAT = "bg-[#fee2e2] text-[#991b1b]";

const th =
  "border-b border-r border-white/25 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";
const td =
  "border-b border-r border-[#dbe6f7] px-3 py-2 align-top text-sm text-[#1b3560] last:border-r-0";
const teks = "whitespace-pre-line [overflow-wrap:anywhere]";

const KOLOM = [
  ["No", "w-[48px]"],
  ["Nama Ketua Tim", "min-w-[200px] !text-left"],
  ["Judul Aktivitas", "min-w-[260px]"],
  ["Target Output", "min-w-[160px]"],
  ["Status Pelaksanaan", "min-w-[130px]"],
  ["Progres", "w-[90px]"],
  ["Bulan Terisi", "w-[90px]"],
  ["Validasi", "min-w-[140px]"],
] as const;

const IKON = {
  unduh: "M12 3v12M7 11l5 5 5-5M4 20h16",
  salin: "M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM5 15V6a2 2 0 0 1 2-2h9",
  centang: "M5 12l5 5 9-10",
};

function Ikon({ d, lebar = 2.2 }: { d: string; lebar?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={lebar}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const kosong = <span className="text-slate-400">–</span>;

const jmlGalat = (h: HasilEntri) =>
  h.masalah.filter((x) => x.level === "galat").length;

/** Peringatan yang belum ditandai selesai */
const peringatanBelum = (h: HasilEntri, selesai: Set<string>) =>
  h.masalah.filter(
    (x) => x.level === "peringatan" && !selesai.has(idMasalah(h.nama, x))
  ).length;

const teksTarget = (e: EntriLogbook) =>
  e.header.targetOutputs
    .filter((t) => t.jenis)
    .map((t) => `${t.jumlah} ${t.jenis}`)
    .join(", ");

/** Gabung hasil import baru ke daftar yang sudah ada (ketua yang sama digabung per bulan) */
function gabungHasil(lama: HasilEntri[], baru: HasilEntri[]) {
  const peta = new Map(lama.map((h) => [h.nama, h]));
  let diperbarui = 0;

  for (const h of baru) {
    const ada = peta.get(h.nama);
    if (!ada) {
      peta.set(h.nama, h);
      continue;
    }
    diperbarui++;
    const pesanLama = new Set(ada.masalah.map((x) => x.pesan));
    peta.set(h.nama, {
      nama: h.nama,
      entri: gabungEntri(ada.entri, h.entri),
      masalah: [...ada.masalah, ...h.masalah.filter((x) => !pesanLama.has(x.pesan))],
    });
  }

  return { daftar: [...peta.values()], diperbarui };
}

function unduhTemplateJson() {
  const template = {
    versi: 1,
    tahun: 2026,
    logbook: [
      {
        header: {
          namaKetua: "",
          unitKerja: "",
          satuanKerja: "",
          judulAktivitas: "",
          targetOutputs: [{ jenis: "", jumlah: 1 }],
          progresTotal: 0,
          progresKeterangan: "",
          statusPelaksanaan: "",
        },
        bulanan: BULAN.map((bulan) => ({
          bulan,
          aktivitas: { uraian: "", kendala: "", mitigasi: "", dataDukung: [] },
          output: { jenis: "", judul: "", status: "", capaian: 0, dataDukung: [] },
        })),
        catatanImport: [],
      },
    ],
  };

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(template, null, 2)], { type: "application/json" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-logbook.json";
  a.click();
  URL.revokeObjectURL(url);
}

/* ───────── Detail aktivitas (judul dari header.judulAktivitas) ───────── */

function DetailAktivitasImport({ entri }: { entri: EntriLogbook }) {
  const { header } = entri;

  const informasi = [
    ["Kategori Pendanaan", "Rupiah Murni"],
    ["Skema Mitra Program", "-"],
    ["Judul", header.judulAktivitas || "-"],
    ["Target Output Utama", teksTarget(entri) || "-"],
    ["Progres Total Aktivitas", `${header.progresTotal ?? 0}%`],
    ["Status", header.statusPelaksanaan || "-"],
  ];

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-[#dbe6f7] bg-white shadow-sm">
      <div className="bg-[#1f4e8c] px-6 py-4 text-white">
        <h2 className="text-lg font-bold">Detail Aktivitas &amp; Progres Kegiatan</h2>
        <p className="mt-1 text-xs text-blue-100">
          Informasi aktivitas dan capaian program mitra
        </p>
      </div>

      <div className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-6 py-3">
        <h3 className="text-sm font-bold text-[#1b3560]">Informasi</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {informasi.map(([label, nilai]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(130px,0.8fr)_minmax(0,1.5fr)] gap-3 border-b border-r border-[#e5edf8] px-6 py-4"
          >
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <span className="whitespace-pre-wrap break-words text-sm font-semibold text-[#1b3560]">
              {nilai}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── Halaman ───────── */

export default function ImportJson() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { selesai, toggle } = useSelesai();

  const [files, setFiles] = useState<{ nama: string; ukuran: number }[]>([]);
  const [hasil, setHasil] = useState<HasilEntri[] | null>(null);
  const [buka, setBuka] = useState<number | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [seret, setSeret] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [tersimpan, setTersimpan] = useState<number | null>(null);
  const [versi, setVersi] = useState(0);
  const [gabung, setGabung] = useState(true);
  const [bulanPilih, setBulanPilih] = useState<string>(BULAN[new Date().getMonth()]);

  const kosongkanInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const reset = () => {
    setFiles([]);
    setHasil(null);
    setBuka(null);
    setError("");
    setInfo("");
    setTersimpan(null);
    kosongkanInput();
  };

  /* ----- baca file JSON ----- */

  const proses = async (fs: File[]) => {
    if (!fs.length) return;

    setError("");
    setInfo("");
    setTersimpan(null);
    setBuka(null);

    const salah = fs.filter((f) => !/\.json$/i.test(f.name));
    if (salah.length) {
      setError(`Format file harus .json: ${salah.map((f) => f.name).join(", ")}`);
      return;
    }

    setMemuat(true);
    try {
      let semua = hasil ?? [];
      let diperbarui = 0;
      const baru: { nama: string; ukuran: number }[] = [];
      const gagal: string[] = [];

      for (const f of fs) {
        const r = parseBerkas(await f.text());
        if ("galat" in r) {
          gagal.push(`${f.name}: ${r.galat}`);
          continue;
        }
        const g = gabungHasil(semua, r.hasil);
        semua = g.daftar;
        diperbarui += g.diperbarui;
        baru.push({ nama: f.name, ukuran: f.size });
      }

      if (baru.length) {
        setHasil(semua);
        setFiles((p) => [...p, ...baru]);
      }
      if (gagal.length) setError(gagal.join(" | "));
      if (diperbarui) {
        setInfo(
          `${diperbarui} ketua sudah ada: bulan yang terisi di file terbaru menggantikan bulan yang sama, bulan lainnya dipertahankan.`
        );
      }
    } catch {
      setError("File tidak bisa dibaca.");
    } finally {
      setMemuat(false);
      kosongkanInput();
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSeret(false);
    void proses(Array.from(e.dataTransfer.files));
  };

  /* ----- turunan data ----- */

  const daftar = useMemo(() => hasil ?? [], [hasil]);

  /** layak = tanpa galat; bersih/cek menghitung peringatan yang belum ditandai selesai */
  const { layak, bersih, cek, galat } = useMemo(() => {
    const layak: HasilEntri[] = [];
    let bersih = 0;
    let cek = 0;
    let galat = 0;
    for (const h of daftar) {
      if (jmlGalat(h) > 0) {
        galat++;
        continue;
      }
      layak.push(h);
      if (peringatanBelum(h, selesai) > 0) cek++;
      else bersih++;
    }
    return { layak, bersih, cek, galat };
  }, [daftar, selesai]);

  const ukuran = files.reduce((n, f) => n + f.ukuran, 0);

  const grup = useMemo(() => {
    const peta = new Map<string, { h: HasilEntri; idx: number }[]>();
    daftar.forEach((h, idx) => {
      const unit = h.entri.header.unitKerja || "Tanpa unit kerja";
      peta.set(unit, [...(peta.get(unit) ?? []), { h, idx }]);
    });
    return [...peta.entries()];
  }, [daftar]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tersimpanDiBrowser = useMemo(() => daftarLogbook().length, [versi, tersimpan]);

  /* ----- aksi ----- */

  const ubahBulanan = (idx: number, bulanan: EntriLogbook["bulanan"]) =>
    setHasil((p) =>
      p ? p.map((x, i) => (i === idx ? { ...x, entri: { ...x.entri, bulanan } } : x)) : p
    );

  const simpan = () => {
    if (!layak.length) {
      setError("Tidak ada logbook yang layak disimpan.");
      return;
    }

    const peta = new Map<string, EntriLogbook>(
      (gabung ? daftarLogbook() : []).map((e) => [e.header.namaKetua, e])
    );
    for (const h of layak) {
      const nama = h.entri.header.namaKetua;
      const ada = peta.get(nama);
      peta.set(nama, ada ? gabungEntri(ada, h.entri) : h.entri);
    }

    const aktif =
      (gabung ? ambilLogbookAktif()?.header.namaKetua : undefined) ??
      layak[0].entri.header.namaKetua;

    if (!simpanLogbook([...peta.values()], aktif)) {
      setError("Gagal menyimpan: penyimpanan browser penuh atau diblokir.");
      return;
    }

    simpanSelesai(selesai); // status "selesai" ikut tersimpan bersama logbook
    setError("");
    setTersimpan(layak.length);
  };

  const salinPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buatPrompt(0, 0, bulanPilih));
      setInfo(
        `Prompt untuk bulan ${bulanPilih}, semua ketua, sudah disalin. Tempel ke AI bersama file Excel, lalu unggah JSON hasilnya di sini.`
      );
    } catch {
      setError("Prompt tidak bisa disalin otomatis. Izinkan akses clipboard di browser.");
    }
  };

  const hapusTersimpan = () => {
    if (!window.confirm("Hapus semua logbook yang tersimpan di browser ini?")) return;
    hapusLogbook();
    setVersi((v) => v + 1);
    setInfo("Data logbook di browser sudah dihapus. Halaman Logbook kembali memakai logbook.json.");
  };

  /* ----- tampilan ----- */

  return (
    <div
      className="mt-20 min-h-screen w-full bg-[#f2f5fa] font-sans text-[#1b3560]"
      translate="no"
    >
      <main className="min-w-0">
        <InstansiBar />

        <div className="flex flex-col gap-5 px-4 py-6 sm:px-9">
          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
            {/* Judul kartu */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe6f7] px-6 py-4">
              <div>
                <h2 className="text-xl font-extrabold">Import logbook dari JSON</h2>
                <p className="text-[13px] text-slate-500">
                  Excel dikonversi AI menjadi JSON (semua ketua tim, satu bulan per prompt).
                  Unggah file JSON-nya (boleh banyak sekaligus), periksa laporan, lalu simpan.
                </p>
              </div>
              <TombolGradasi onClick={unduhTemplateJson}>
                <Ikon d={IKON.unduh} />
                Unduh Template
              </TombolGradasi>
            </div>

            {/* Prompt AI */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#dbe6f7] bg-[#f5f8fd] px-6 py-3 text-[13px]">
              <span className="font-bold">Prompt AI untuk semua ketua, bulan</span>
              <select
                value={bulanPilih}
                aria-label="Bulan yang dikonversi"
                onChange={(e) => setBulanPilih(e.target.value)}
                className="rounded-lg border border-[#9db8e0] bg-white px-2 py-1 text-sm font-bold text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              >
                {BULAN.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <TombolGradasi onClick={() => void salinPrompt()}>
                <Ikon d={IKON.salin} />
                Salin Prompt AI
              </TombolGradasi>
              <span className="text-xs text-slate-500">
                Satu sheet bulan penuh (semua ketua, semua pusat riset) sekitar 15 ribu token.
                Bila jawaban AI terpotong, minta AI melanjutkan lalu unggah semua file JSON-nya.
              </span>
            </div>

            {/* Langkah */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-[#dbe6f7] px-6 py-2.5 text-[13px] font-bold">
              <Langkah n={1} label="Unggah file JSON" aktif={!hasil} selesai={!!hasil} />
              <span
                aria-hidden="true"
                className={`h-0.5 w-12 ${hasil ? "bg-[#1f4e8c]" : "bg-[#dbe6f7]"}`}
              />
              <Langkah
                n={2}
                label="Periksa laporan"
                aktif={!!hasil && tersimpan === null}
                selesai={tersimpan !== null}
              />
              <span
                aria-hidden="true"
                className={`h-0.5 w-12 ${tersimpan !== null ? "bg-[#1f4e8c]" : "bg-[#dbe6f7]"}`}
              />
              <Langkah
                n={3}
                label="Simpan ke logbook"
                aktif={tersimpan !== null}
                selesai={tersimpan !== null}
              />
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setSeret(true);
              }}
              onDragLeave={() => setSeret(false)}
              onDrop={onDrop}
              className={`mx-6 mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border-2 border-dashed px-4 py-6 transition ${
                seret ? "border-[#2a5aa8] bg-[#eaf0fa]" : "border-[#9db8e0] bg-[#f5f8fd]"
              }`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(27,63,120,0.18)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[26px] w-[26px]"
                  fill="none"
                  stroke="#1f4e8c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                </svg>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-base font-extrabold">
                  Tarik dan lepas satu atau beberapa file JSON di sini
                </p>
                <p className="text-[13px] text-slate-500">
                  Hasil tiap file digabung otomatis. Ketua yang sama digabung per bulan, bulan
                  yang terisi di file terbaru menggantikan bulan yang sama.
                </p>
              </div>

              <TombolGradasi besar onClick={() => inputRef.current?.click()} disabled={memuat}>
                {memuat ? "Membaca…" : "Pilih File"}
              </TombolGradasi>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".json,application/json"
                className="sr-only"
                aria-label="Pilih file JSON"
                onChange={(e) => void proses(Array.from(e.target.files ?? []))}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mx-6 mt-3 rounded-xl bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b]"
              >
                {error}
              </p>
            )}

            {info && (
              <p
                role="status"
                className="mx-6 mt-3 rounded-xl bg-[#eaf0fa] px-4 py-2 text-sm font-semibold text-[#1b3560]"
              >
                {info}
              </p>
            )}

            {/* File terpilih */}
            {hasil && (
              <div className="mx-6 mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe6f7] px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
                    <rect width="32" height="32" rx="8" fill="#dcfce7" />
                    <path
                      d="M10 9h8l4 4v10H10z"
                      fill="none"
                      stroke="#166534"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold">
                      {files.length === 1 ? files[0].nama : `${files.length} file JSON`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.max(1, Math.round(ukuran / 1024))} KB, {daftar.length} ketua tim,{" "}
                      {grup.length} unit kerja
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-[#1f4e8c] hover:bg-[#eaf0fa]"
                  >
                    Tambah file
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                  >
                    Hapus semua
                  </button>
                </div>
              </div>
            )}

            {/* Laporan validasi */}
            {hasil && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-2.5 pt-[18px]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="mr-1 text-base font-extrabold">Laporan validasi</span>
                    <Badge warna="bg-[#eaf0fa] text-[#1b3560]">{daftar.length} logbook</Badge>
                    <Badge warna={WARNA_BADGE.Siap}>{bersih} bersih</Badge>
                    <Badge warna={WARNA_BADGE.Cek}>{cek} perlu dicek</Badge>
                    <Badge warna={WARNA_GALAT}>{galat} galat</Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    Yang galat dilewati, yang perlu dicek tetap disimpan. Klik baris untuk
                    melihat detail aktivitas, tabel per bulan, dan catatannya.
                  </span>
                </div>

                <div className="px-6">
                  <div className="overflow-x-auto rounded-2xl border border-[#dbe6f7]">
                    <table className="w-full min-w-[900px] border-separate border-spacing-0 bg-white">
                      <thead style={{ background: GRAD }}>
                        <tr>
                          {KOLOM.map(([label, cls]) => (
                            <th key={label} className={`${th} ${cls}`}>
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {grup.map(([unit, items]) => (
                          <Fragment key={unit}>
                            <tr>
                              <td
                                colSpan={KOLOM.length}
                                className="border-b border-[#dbe6f7] bg-[#eaf0fa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1b3560]"
                              >
                                {unit}{" "}
                                <span className="font-medium normal-case tracking-normal text-slate-500">
                                  ({items.length} ketua)
                                </span>
                              </td>
                            </tr>

                            {items.map(({ h, idx }, i) => {
                              const g = jmlGalat(h);
                              const p = peringatanBelum(h, selesai);
                              const hd = h.entri.header;
                              const terbuka = buka === idx;

                              return (
                                <Fragment key={idx}>
                                  <tr
                                    onClick={() => setBuka(terbuka ? null : idx)}
                                    className={`cursor-pointer transition-colors hover:bg-[#eaf0fa] ${
                                      i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"
                                    }`}
                                  >
                                    <td className={`${td} text-center`}>{idx + 1}</td>
                                    <td className={`${td} font-medium ${teks}`}>{h.nama}</td>
                                    <td className={`${td} ${teks}`}>
                                      {hd.judulAktivitas || kosong}
                                    </td>
                                    <td className={`${td} ${teks}`}>
                                      {teksTarget(h.entri) || kosong}
                                    </td>
                                    <td className={`${td} ${teks}`}>
                                      {hd.statusPelaksanaan || kosong}
                                    </td>
                                    <td className={`${td} text-center`}>{hd.progresTotal}%</td>
                                    <td className={`${td} text-center`}>
                                      {h.entri.bulanan.filter(bulanAdaIsi).length} / 12
                                    </td>
                                    <td className={`${td} text-center`}>
                                      {g > 0 ? (
                                        <Badge warna={WARNA_GALAT}>{g} galat</Badge>
                                      ) : p > 0 ? (
                                        <Badge warna={WARNA_BADGE.Cek}>{p} catatan</Badge>
                                      ) : (
                                        <Badge warna={WARNA_BADGE.Siap}>Bersih</Badge>
                                      )}
                                    </td>
                                  </tr>

                                  {terbuka && (
                                    <tr>
                                      <td
                                        colSpan={KOLOM.length}
                                        className="max-w-0 border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3"
                                      >
                                        <DetailAktivitasImport entri={h.entri} />

                                        <div className="mb-3">
                                          <DaftarMasalah
                                            nama={h.nama}
                                            masalah={h.masalah}
                                            selesai={selesai}
                                            onToggle={toggle}
                                          />
                                        </div>

                                        <div className="overflow-x-auto">
                                          <div className="min-w-[1400px]">
                                            <MonthlyLogTable
                                              key={`${idx}-${files.length}`}
                                              initialData={h.entri.bulanan}
                                              onSave={(data) => ubahBulanan(idx, data)}
                                            />
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {tersimpan !== null && (
              <p
                role="status"
                className="mx-6 mt-4 rounded-xl bg-[#dcfce7] px-4 py-2 text-sm font-semibold text-[#166534]"
              >
                {tersimpan} logbook disimpan. Total di browser: {tersimpanDiBrowser}.{" "}
                <a href="/logbook" className="underline">
                  Buka halaman Logbook
                </a>
              </p>
            )}

            {/* Footer kartu */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-[18px]">
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={gabung}
                    onChange={(e) => setGabung(e.target.checked)}
                    className="h-4 w-4 accent-[#1f4e8c]"
                  />
                  Gabungkan dengan logbook yang sudah tersimpan (ketua yang sama digabung per
                  bulan)
                </label>

                {tersimpanDiBrowser > 0 && (
                  <span>
                    Tersimpan di browser: {tersimpanDiBrowser} logbook{" "}
                    <button
                      type="button"
                      onClick={hapusTersimpan}
                      className="font-bold text-[#991b1b] underline"
                    >
                      Hapus
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-[#f5f8fd]"
                >
                  Batal
                </button>
                <TombolGradasi
                  besar
                  onClick={simpan}
                  disabled={!hasil || layak.length === 0 || tersimpan !== null}
                >
                  <Ikon d={IKON.centang} lebar={2.6} />
                  Simpan ke Logbook
                </TombolGradasi>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}