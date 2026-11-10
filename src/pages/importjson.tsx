
import { Fragment, useMemo, useRef, useState, type DragEvent } from "react";

import Badge, { WARNA_BADGE } from "../components/importjson/Badge";
import Langkah from "../components/importjson/Langkah";
import TombolGradasi from "../components/importjson/TombolGradasi";
import { GRAD } from "../components/importjson/konstanta";

import MonthlyLogTable from "../components/logbook/logbookTable/MonthlyLogTable";

import {
  buatPrompt,
  bulanAdaIsi,
  gabungEntri,
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
} from "../lib/logbookStore";

const WARNA_GALAT = "bg-[#fee2e2] text-[#991b1b]";

const th =
  "border-r border-white/25 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";

const td =
  "border-b border-r border-[#dbe6f7] px-3 py-2 align-top text-sm text-[#1b3560] last:border-r-0";

const teks = "whitespace-pre-line [overflow-wrap:anywhere]";

const jml = (h: HasilEntri, level: "galat" | "peringatan") =>
  h.masalah.filter((x) => x.level === level).length;

const bulanTerisi = (h: HasilEntri) =>
  h.entri.bulanan.filter(bulanAdaIsi).length;

/* =========================================================
   DETAIL AKTIVITAS
   Judul diambil dari header.judulAktivitas,
   BUKAN dari bulanan[].output.judul
========================================================= */

function DetailAktivitasImport({
  entri,
}: {
  entri: EntriLogbook;
}) {
  const header = entri.header;

  const targetOutput =
    header.targetOutputs
      ?.filter((item) => item.jenis)
      .map((item) => `${item.jumlah} ${item.jenis}`)
      .join(", ") || "-";

  const informasi = [
    {
      label: "Kategori Pendanaan",
      value: "Rupiah Murni",
    },
    {
      label: "Skema Mitra Program",
      value: "-",
    },
    {
      label: "Judul",
      value: header.judulAktivitas || "-",
    },
    {
      label: "Target Output Utama",
      value: targetOutput,
    },
    {
      label: "Progres Total Aktivitas",
      value: `${header.progresTotal ?? 0}%`,
    },
    {
      label: "Status",
      value: header.statusPelaksanaan || "-",
    },
  ];

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-[#dbe6f7] bg-white shadow-sm">
      {/* Header detail */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1f4e8c] px-6 py-4 text-white">
        <div>
          <h2 className="text-lg font-bold">
            Detail Aktivitas &amp; Progres Kegiatan
          </h2>

          <p className="mt-1 text-xs text-blue-100">
            Informasi aktivitas dan capaian program mitra
          </p>
        </div>
      </div>

      {/* Isi detail */}
      <div className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-6 py-3">
        <h3 className="text-sm font-bold text-[#1b3560]">
          Informasi
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {informasi.map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-[minmax(130px,0.8fr)_minmax(0,1.5fr)] gap-3 border-b border-r border-[#e5edf8] px-6 py-4"
          >
            <span className="text-sm font-medium text-slate-500">
              {item.label}
            </span>

            <span className="whitespace-pre-wrap break-words text-sm font-semibold text-[#1b3560]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   GABUNG HASIL IMPORT
========================================================= */

function gabungHasil(lama: HasilEntri[], baru: HasilEntri[]) {
  const peta = new Map<string, HasilEntri>(
    lama.map((h): [string, HasilEntri] => [h.nama, h])
  );

  let diperbarui = 0;

  baru.forEach((h) => {
    const ada = peta.get(h.nama);

    if (!ada) {
      peta.set(h.nama, h);
      return;
    }

    diperbarui++;

    const pesanLama = new Set(ada.masalah.map((x) => x.pesan));

    peta.set(h.nama, {
      nama: h.nama,
      entri: gabungEntri(ada.entri, h.entri),
      masalah: [
        ...ada.masalah,
        ...h.masalah.filter((x) => !pesanLama.has(x.pesan)),
      ],
    });
  });

  return {
    daftar: [...peta.values()],
    diperbarui,
  };
}

/* =========================================================
   TEMPLATE JSON
========================================================= */

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
          aktivitas: {
            uraian: "",
            kendala: "",
            mitigasi: "",
            dataDukung: [],
          },
          output: {
            jenis: "",
            judul: "",
            status: "",
            capaian: 0,
            dataDukung: [],
          },
        })),

        catatanImport: [],
      },
    ],
  };

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    })
  );

  const a = document.createElement("a");
  a.href = url;
  a.download = "template-logbook.json";
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================================================
   HALAMAN IMPORT JSON
========================================================= */

export default function ImportJson() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<
    { nama: string; ukuran: number }[]
  >([]);

  const [hasil, setHasil] = useState<HasilEntri[] | null>(null);

  const [buka, setBuka] = useState<number | null>(null);

  const [memuat, setMemuat] = useState(false);
  const [seret, setSeret] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [tersimpan, setTersimpan] = useState<number | null>(null);

  const [versi, setVersi] = useState(0);

  const [gabung, setGabung] = useState(true);

  const [bulanPilih, setBulanPilih] = useState<string>(
    BULAN[new Date().getMonth()]
  );

  /* =========================================================
     RESET
  ========================================================= */

  const reset = () => {
    setFiles([]);
    setHasil(null);
    setBuka(null);
    setError("");
    setInfo("");
    setTersimpan(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  /* =========================================================
     PROSES FILE JSON
  ========================================================= */

  const proses = async (fs: File[]) => {
    if (!fs.length) return;

    setError("");
    setInfo("");
    setTersimpan(null);
    setBuka(null);

    const salah = fs.filter((f) => !/\.json$/i.test(f.name));

    if (salah.length) {
      setError(
        `Format file harus .json: ${salah.map((f) => f.name).join(", ")}`
      );
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

        baru.push({
          nama: f.name,
          ukuran: f.size,
        });
      }

      if (baru.length) {
        setHasil(semua);
        setFiles((p) => [...p, ...baru]);
      }

      if (gagal.length) {
        setError(gagal.join(" | "));
      }

      if (diperbarui) {
        setInfo(
          `${diperbarui} ketua sudah ada: bulan yang terisi di file terbaru menggantikan bulan yang sama, bulan lainnya dipertahankan.`
        );
      }
    } catch {
      setError("File tidak bisa dibaca.");
    } finally {
      setMemuat(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  /* =========================================================
     DRAG AND DROP
  ========================================================= */

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSeret(false);

    void proses(Array.from(e.dataTransfer.files));
  };

  /* =========================================================
     TURUNAN DATA
  ========================================================= */

  const daftar = hasil ?? [];

  const layak = useMemo(
    () => daftar.filter((h) => jml(h, "galat") === 0),
    [daftar]
  );

  const bersih = daftar.filter((h) => h.masalah.length === 0).length;

  const cek = daftar.filter(
    (h) => h.masalah.length > 0 && jml(h, "galat") === 0
  ).length;

  const galat = daftar.filter((h) => jml(h, "galat") > 0).length;

  const ukuran = files.reduce((n, f) => n + f.ukuran, 0);

  const grup = useMemo(() => {
    const peta = new Map<string, { h: HasilEntri; idx: number }[]>();

    daftar.forEach((h, idx) => {
      const k = h.entri.header.unitKerja || "Tanpa unit kerja";

      peta.set(k, [...(peta.get(k) ?? []), { h, idx }]);
    });

    return [...peta.entries()];
  }, [daftar]);

  const tersimpanDiBrowser = useMemo(
    () => daftarLogbook().length,
    [versi, tersimpan]
  );

  /* =========================================================
     UPDATE DATA BULANAN
  ========================================================= */

  const ubahBulanan = (
    idx: number,
    bulanan: HasilEntri["entri"]["bulanan"]
  ) => {
    setHasil((p) =>
      p
        ? p.map((x, i) =>
            i === idx
              ? {
                  ...x,
                  entri: {
                    ...x.entri,
                    bulanan,
                  },
                }
              : x
          )
        : p
    );
  };

  /* =========================================================
     SIMPAN KE LOGBOOK
  ========================================================= */

  const simpan = () => {
    if (layak.length === 0) {
      setError("Tidak ada logbook yang layak disimpan.");
      return;
    }

    const lama = gabung ? daftarLogbook() : [];

    const peta = new Map<string, EntriLogbook>(
      lama.map((e): [string, EntriLogbook] => [
        e.header.namaKetua,
        e,
      ])
    );

    layak.forEach((h) => {
      const ada = peta.get(h.entri.header.namaKetua);

      peta.set(
        h.entri.header.namaKetua,
        ada ? gabungEntri(ada, h.entri) : h.entri
      );
    });

    const aktif =
      (gabung
        ? ambilLogbookAktif()?.header.namaKetua
        : undefined) ?? layak[0].entri.header.namaKetua;

    if (!simpanLogbook([...peta.values()], aktif)) {
      setError(
        "Gagal menyimpan: penyimpanan browser penuh atau diblokir."
      );
      return;
    }

    setError("");
    setTersimpan(layak.length);
  };

  /* =========================================================
     SALIN PROMPT AI
  ========================================================= */

  const salinPrompt = async () => {
    try {
      await navigator.clipboard.writeText(
        buatPrompt(0, 0, bulanPilih)
      );

      setInfo(
        `Prompt untuk bulan ${bulanPilih}, semua ketua, sudah disalin. Tempel ke AI bersama file Excel, lalu unggah JSON hasilnya di sini.`
      );
    } catch {
      setError(
        "Prompt tidak bisa disalin otomatis. Izinkan akses clipboard di browser."
      );
    }
  };

  /* =========================================================
     HAPUS DATA TERSIMPAN
  ========================================================= */

  const hapusTersimpan = () => {
    if (
      !window.confirm(
        "Hapus semua logbook yang tersimpan di browser ini?"
      )
    ) {
      return;
    }

    hapusLogbook();

    setVersi((v) => v + 1);

    setInfo(
      "Data logbook di browser sudah dihapus. Halaman Logbook kembali memakai logbook.json."
    );
  };

  /* =========================================================
     TAMPILAN
  ========================================================= */

  return (
    <div className="min-h-screen w-full bg-[#f2f5fa] pt-24 font-sans text-[#1b3560]">
      <main className="min-w-0">
        {/* HEADER HALAMAN */}
        <div className="flex h-[66px] items-center gap-4 bg-[#1f4e8c] px-6 text-xl font-bold text-white sm:px-9">
          <span>ORPA</span>

          <span
            aria-hidden="true"
            className="h-[26px] w-px bg-white/60"
          />

          <span className="truncate">
            Badan Riset dan Inovasi Nasional
          </span>
        </div>

        <div className="flex flex-col gap-5 px-4 py-6 sm:px-9">
          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
            {/* JUDUL KARTU */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe6f7] px-6 py-4">
              <div>
                <h2 className="text-xl font-extrabold">
                  Import logbook dari JSON
                </h2>

                <p className="text-[13px] text-slate-500">
                  Excel dikonversi AI menjadi JSON (semua ketua tim,
                  satu bulan per prompt). Unggah file JSON-nya
                  (boleh banyak sekaligus), periksa laporan, lalu simpan.
                </p>
              </div>

              <TombolGradasi onClick={unduhTemplateJson}>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
                </svg>
                Unduh Template
              </TombolGradasi>
            </div>

            {/* PROMPT AI */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#dbe6f7] bg-[#f5f8fd] px-6 py-3 text-[13px]">
              <span className="font-bold">
                Prompt AI untuk semua ketua, bulan
              </span>

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
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                </svg>
                Salin Prompt AI
              </TombolGradasi>

              <span className="text-xs text-slate-500">
                Satu sheet bulan penuh (semua ketua, semua pusat
                riset) sekitar 15 ribu token. Bila jawaban AI
                terpotong, minta AI melanjutkan lalu unggah semua
                file JSON-nya.
              </span>
            </div>

            {/* LANGKAH */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-[#dbe6f7] px-6 py-2.5 text-[13px] font-bold">
              <Langkah
                n={1}
                label="Unggah file JSON"
                aktif={!hasil}
                selesai={!!hasil}
              />

              <span
                aria-hidden="true"
                className={`h-0.5 w-12 ${
                  hasil ? "bg-[#1f4e8c]" : "bg-[#dbe6f7]"
                }`}
              />

              <Langkah
                n={2}
                label="Periksa laporan"
                aktif={!!hasil && tersimpan === null}
                selesai={tersimpan !== null}
              />

              <span
                aria-hidden="true"
                className={`h-0.5 w-12 ${
                  tersimpan !== null
                    ? "bg-[#1f4e8c]"
                    : "bg-[#dbe6f7]"
                }`}
              />

              <Langkah
                n={3}
                label="Simpan ke logbook"
                aktif={tersimpan !== null}
                selesai={tersimpan !== null}
              />
            </div>

            {/* DROPZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setSeret(true);
              }}
              onDragLeave={() => setSeret(false)}
              onDrop={onDrop}
              className={`mx-6 mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border-2 border-dashed px-4 py-6 transition ${
                seret
                  ? "border-[#2a5aa8] bg-[#eaf0fa]"
                  : "border-[#9db8e0] bg-[#f5f8fd]"
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
                  Hasil tiap file digabung otomatis. Ketua yang sama
                  digabung per bulan, bulan yang terisi di file
                  terbaru menggantikan bulan yang sama.
                </p>
              </div>

              <TombolGradasi
                besar
                onClick={() => inputRef.current?.click()}
                disabled={memuat}
              >
                {memuat ? "Membaca…" : "Pilih File"}
              </TombolGradasi>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".json,application/json"
                className="sr-only"
                aria-label="Pilih file JSON"
                onChange={(e) =>
                  void proses(Array.from(e.target.files ?? []))
                }
              />
            </div>

            {/* PESAN ERROR */}
            {error && (
              <p
                role="alert"
                className="mx-6 mt-3 rounded-xl bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b]"
              >
                {error}
              </p>
            )}

            {/* PESAN INFORMASI */}
            {info && (
              <p
                role="status"
                className="mx-6 mt-3 rounded-xl bg-[#eaf0fa] px-4 py-2 text-sm font-semibold text-[#1b3560]"
              >
                {info}
              </p>
            )}

            {/* FILE TERPILIH */}
            {hasil && (
              <div className="mx-6 mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe6f7] px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <svg
                    viewBox="0 0 32 32"
                    className="h-8 w-8 shrink-0"
                    aria-hidden="true"
                  >
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
                      {files.length === 1
                        ? files[0].nama
                        : `${files.length} file JSON`}
                    </p>

                    <p className="text-xs text-slate-500">
                      {Math.max(1, Math.round(ukuran / 1024))} KB,{" "}
                      {daftar.length} ketua tim, {grup.length} unit kerja
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

            {/* LAPORAN VALIDASI */}
            {hasil && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-2.5 pt-[18px]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="mr-1 text-base font-extrabold">
                      Laporan validasi
                    </span>

                    <Badge warna="bg-[#eaf0fa] text-[#1b3560]">
                      {daftar.length} logbook
                    </Badge>

                    <Badge warna={WARNA_BADGE.Siap}>
                      {bersih} bersih
                    </Badge>

                    <Badge warna={WARNA_BADGE.Cek}>
                      {cek} perlu dicek
                    </Badge>

                    <Badge warna={WARNA_GALAT}>
                      {galat} galat
                    </Badge>
                  </div>

                  <span className="text-xs text-slate-500">
                    Yang galat dilewati, yang perlu dicek tetap
                    disimpan. Klik baris untuk melihat detail
                    aktivitas, tabel per bulan, dan catatannya.
                  </span>
                </div>

                <div className="px-6">
                  <div className="overflow-x-auto rounded-2xl border border-[#dbe6f7]">
                    <table className="w-full min-w-[900px] border-separate border-spacing-0 bg-white">
                      <thead style={{ background: GRAD }}>
                        <tr>
                          <th className={`${th} w-[48px] border-b`}>
                            No
                          </th>

                          <th
                            className={`${th} min-w-[200px] border-b text-left`}
                          >
                            Nama Ketua Tim
                          </th>

                          <th
                            className={`${th} min-w-[260px] border-b`}
                          >
                            Judul Aktivitas
                          </th>

                          <th
                            className={`${th} min-w-[160px] border-b`}
                          >
                            Target Output
                          </th>

                          <th
                            className={`${th} min-w-[130px] border-b`}
                          >
                            Status Pelaksanaan
                          </th>

                          <th className={`${th} w-[90px] border-b`}>
                            Progres
                          </th>

                          <th className={`${th} w-[90px] border-b`}>
                            Bulan Terisi
                          </th>

                          <th
                            className={`${th} min-w-[140px] border-b`}
                          >
                            Validasi
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {grup.map(([unit, items]) => (
                          <Fragment key={unit}>
                            <tr>
                              <td
                                colSpan={8}
                                className="border-b border-[#dbe6f7] bg-[#eaf0fa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1b3560]"
                              >
                                {unit}{" "}
                                <span className="font-medium normal-case tracking-normal text-slate-500">
                                  ({items.length} ketua)
                                </span>
                              </td>
                            </tr>

                            {items.map(({ h, idx }, i) => {
                              const g = jml(h, "galat");
                              const p = jml(h, "peringatan");
                              const hd = h.entri.header;
                              const terbuka = buka === idx;

                              return (
                                <Fragment key={idx}>
                                  {/* BARIS NAMA KETUA */}
                                  <tr
                                    onClick={() =>
                                      setBuka(terbuka ? null : idx)
                                    }
                                    className={`cursor-pointer transition-colors hover:bg-[#eaf0fa] ${
                                      i % 2 === 1
                                        ? "bg-[#f5f8fd]"
                                        : "bg-white"
                                    }`}
                                  >
                                    <td className={`${td} text-center`}>
                                      {idx + 1}
                                    </td>

                                    <td className={`${td} font-medium ${teks}`}>
                                      {h.nama}
                                    </td>

                                    <td className={`${td} ${teks}`}>
                                      {hd.judulAktivitas || (
                                        <span className="text-slate-400">
                                          –
                                        </span>
                                      )}
                                    </td>

                                    <td className={`${td} ${teks}`}>
                                      {hd.targetOutputs
                                        .filter((t) => t.jenis)
                                        .map(
                                          (t) => `${t.jumlah} ${t.jenis}`
                                        )
                                        .join(", ") || (
                                        <span className="text-slate-400">
                                          –
                                        </span>
                                      )}
                                    </td>

                                    <td className={`${td} ${teks}`}>
                                      {hd.statusPelaksanaan || (
                                        <span className="text-slate-400">
                                          –
                                        </span>
                                      )}
                                    </td>

                                    <td className={`${td} text-center`}>
                                      {hd.progresTotal}%
                                    </td>

                                    <td className={`${td} text-center`}>
                                      {bulanTerisi(h)} / 12
                                    </td>

                                    <td className={`${td} text-center`}>
                                      {g > 0 ? (
                                        <Badge warna={WARNA_GALAT}>
                                          {g} galat
                                        </Badge>
                                      ) : p > 0 ? (
                                        <Badge warna={WARNA_BADGE.Cek}>
                                          {p} catatan
                                        </Badge>
                                      ) : (
                                        <Badge warna={WARNA_BADGE.Siap}>
                                          Bersih
                                        </Badge>
                                      )}
                                    </td>
                                  </tr>

                                  {/* DETAIL KETUA DAN TABEL BULANAN */}
                                  {terbuka && (
                                    <tr>
                                      <td
                                        colSpan={8}
                                        className="max-w-0 border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3"
                                      >
                                        {/* DETAIL AKTIVITAS */}
                                        <DetailAktivitasImport
                                          entri={h.entri}
                                        />

                                        {/* CATATAN VALIDASI */}
                                        {h.masalah.length > 0 && (
                                          <ul className="mb-3 space-y-1 rounded-xl bg-[#fffbeb] px-4 py-2.5 text-xs">
                                            {h.masalah.map((x, k) => (
                                              <li
                                                key={k}
                                                className={
                                                  x.level === "galat"
                                                    ? "font-semibold text-[#991b1b]"
                                                    : "text-[#92400e]"
                                                }
                                              >
                                                {x.level === "galat"
                                                  ? "✕"
                                                  : "!"}{" "}
                                                {x.pesan}
                                              </li>
                                            ))}
                                          </ul>
                                        )}

                                        {/* TABEL LOGBOOK BULANAN */}
                                        <div className="overflow-x-auto">
                                          <div className="min-w-[1400px]">
                                            <MonthlyLogTable
                                              key={`${idx}-${files.length}`}
                                              initialData={h.entri.bulanan}
                                              onSave={(data) =>
                                                ubahBulanan(idx, data)
                                              }
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

            {/* PESAN BERHASIL SIMPAN */}
            {tersimpan !== null && (
              <p
                role="status"
                className="mx-6 mt-4 rounded-xl bg-[#dcfce7] px-4 py-2 text-sm font-semibold text-[#166534]"
              >
                {tersimpan} logbook disimpan. Total di browser:{" "}
                {tersimpanDiBrowser}.{" "}
                <a href="/logbook" className="underline">
                  Buka halaman Logbook
                </a>
              </p>
            )}

            {/* FOOTER KARTU */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-[18px]">
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={gabung}
                    onChange={(e) => setGabung(e.target.checked)}
                    className="h-4 w-4 accent-[#1f4e8c]"
                  />

                  Gabungkan dengan logbook yang sudah tersimpan
                  (ketua yang sama digabung per bulan)
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
                  disabled={
                    !hasil || layak.length === 0 || tersimpan !== null
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12l5 5 9-10" />
                  </svg>

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
