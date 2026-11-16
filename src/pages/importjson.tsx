import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
} from "react";

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
      className="h-4 w-4 shrink-0"
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

/** true kalau lebar layar >= minPx. Dipakai supaya hanya satu tampilan (kartu / tabel) yang dirender. */
function useLayarLebar(minPx = 768) {
  const [lebar, setLebar] = useState(
    () => typeof window !== "undefined" && window.matchMedia(`(min-width:${minPx}px)`).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width:${minPx}px)`);
    const ubah = () => setLebar(mq.matches);
    ubah();
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, [minPx]);

  return lebar;
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
      <div className="bg-[#1f4e8c] px-4 py-3 text-white sm:px-6 sm:py-4">
        <h2 className="text-base font-bold sm:text-lg">Detail Aktivitas &amp; Progres Kegiatan</h2>
        <p className="mt-1 text-xs text-blue-100">
          Informasi aktivitas dan capaian program mitra
        </p>
      </div>

      <div className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 sm:px-6">
        <h3 className="text-sm font-bold text-[#1b3560]">Informasi</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {informasi.map(([label, nilai]) => (
          <div
            key={label}
            className="grid grid-cols-1 gap-0.5 border-b border-[#e5edf8] px-4 py-3 sm:grid-cols-[minmax(130px,0.8fr)_minmax(0,1.5fr)] sm:gap-3 sm:px-6 sm:py-4 md:border-r"
          >
            <span className="text-xs font-medium text-slate-500 sm:text-sm">{label}</span>
            <span className="whitespace-pre-wrap break-words text-sm font-semibold text-[#1b3560]">
              {nilai}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Isi detail satu ketua: detail aktivitas, daftar masalah, tabel bulanan */
function PanelDetail({
  h,
  kunci,
  selesai,
  onToggle,
  onUbahBulanan,
}: {
  h: HasilEntri;
  kunci: string;
  selesai: Set<string>;
  onToggle: ComponentProps<typeof DaftarMasalah>["onToggle"];
  onUbahBulanan: (bulanan: EntriLogbook["bulanan"]) => void;
}) {
  return (
    <>
      <DetailAktivitasImport entri={h.entri} />

      <div className="mb-3">
        <DaftarMasalah nama={h.nama} masalah={h.masalah} selesai={selesai} onToggle={onToggle} />
      </div>

      {/* MonthlyLogTable sudah punya area geser + petunjuk sendiri */}
      <div className="min-w-0">
        <MonthlyLogTable key={kunci} initialData={h.entri.bulanan} onSave={onUbahBulanan} />
      </div>
    </>
  );
}

function BadgeValidasi({ g, p }: { g: number; p: number }) {
  if (g > 0) return <Badge warna={WARNA_GALAT}>{g} galat</Badge>;
  if (p > 0) return <Badge warna={WARNA_BADGE.Cek}>{p} catatan</Badge>;
  return <Badge warna={WARNA_BADGE.Siap}>Bersih</Badge>;
}

/* ───────── Halaman ───────── */

export default function ImportJson() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { selesai, toggle } = useSelesai();
  const layarLebar = useLayarLebar(768);

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
      className="mt-20 min-h-screen w-full max-w-full overflow-x-hidden bg-[#f2f5fa] font-sans text-[#1b3560]"
      translate="no"
    >
      <main className="min-w-0">
        <InstansiBar />

        <div className="flex min-w-0 flex-col gap-5 px-3 py-4 sm:px-6 sm:py-6 lg:px-9">
          <section className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)] sm:rounded-[18px]">
            {/* Judul kartu */}
            <div className="flex flex-col gap-3 border-b border-[#dbe6f7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold sm:text-xl">Import logbook dari JSON</h2>
                <p className="text-xs text-slate-500 sm:text-[13px]">
                  Excel dikonversi AI menjadi JSON (semua ketua tim, satu bulan per prompt).
                  Unggah file JSON-nya (boleh banyak sekaligus), periksa laporan, lalu simpan.
                </p>
              </div>
              <TombolGradasi onClick={unduhTemplateJson} className="w-full sm:w-auto">
                <Ikon d={IKON.unduh} />
                Unduh Template
              </TombolGradasi>
            </div>

            {/* Prompt AI */}
            <div className="flex flex-col gap-2 border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 text-[13px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:px-6">
              <span className="font-bold">Prompt AI untuk semua ketua, bulan</span>
              <div className="flex items-center gap-2">
                <select
                  value={bulanPilih}
                  aria-label="Bulan yang dikonversi"
                  onChange={(e) => setBulanPilih(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-[#9db8e0] bg-white px-2 py-2 text-sm font-bold text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8] sm:flex-none sm:py-1"
                >
                  {BULAN.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <TombolGradasi onClick={() => void salinPrompt()} className="flex-1 sm:flex-none">
                  <Ikon d={IKON.salin} />
                  Salin Prompt AI
                </TombolGradasi>
              </div>
              <span className="text-xs text-slate-500">
                Satu sheet bulan penuh (semua ketua, semua pusat riset) sekitar 15 ribu token.
                Bila jawaban AI terpotong, minta AI melanjutkan lalu unggah semua file JSON-nya.
              </span>
            </div>

            {/* Langkah */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-[#dbe6f7] px-4 py-2.5 text-xs font-bold sm:px-6 sm:text-[13px]">
              <Langkah n={1} label="Unggah file JSON" aktif={!hasil} selesai={!!hasil} />
              <span
                aria-hidden="true"
                className={`hidden h-0.5 w-8 sm:block lg:w-12 ${hasil ? "bg-[#1f4e8c]" : "bg-[#dbe6f7]"}`}
              />
              <Langkah
                n={2}
                label="Periksa laporan"
                aktif={!!hasil && tersimpan === null}
                selesai={tersimpan !== null}
              />
              <span
                aria-hidden="true"
                className={`hidden h-0.5 w-8 sm:block lg:w-12 ${tersimpan !== null ? "bg-[#1f4e8c]" : "bg-[#dbe6f7]"}`}
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
              className={`mx-3 mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border-2 border-dashed px-3 py-5 transition sm:mx-6 sm:mt-5 sm:px-4 sm:py-6 ${
                seret ? "border-[#2a5aa8] bg-[#eaf0fa]" : "border-[#9db8e0] bg-[#f5f8fd]"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(27,63,120,0.18)] sm:h-14 sm:w-14">
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

              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-extrabold sm:text-base">
                  <span className="hidden sm:inline">Tarik dan lepas satu atau beberapa file JSON di sini</span>
                  <span className="sm:hidden">Pilih satu atau beberapa file JSON</span>
                </p>
                <p className="text-xs text-slate-500 sm:text-[13px]">
                  Hasil tiap file digabung otomatis. Ketua yang sama digabung per bulan, bulan
                  yang terisi di file terbaru menggantikan bulan yang sama.
                </p>
              </div>

              <TombolGradasi
                besar
                onClick={() => inputRef.current?.click()}
                disabled={memuat}
                className="w-full sm:w-auto"
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
                onChange={(e) => void proses(Array.from(e.target.files ?? []))}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mx-3 mt-3 break-words rounded-xl bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b] sm:mx-6"
              >
                {error}
              </p>
            )}

            {info && (
              <p
                role="status"
                className="mx-3 mt-3 break-words rounded-xl bg-[#eaf0fa] px-4 py-2 text-sm font-semibold text-[#1b3560] sm:mx-6"
              >
                {info}
              </p>
            )}

            {/* File terpilih */}
            {hasil && (
              <div className="mx-3 mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe6f7] px-3 py-2.5 sm:mx-6 sm:px-4">
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
                <div className="flex flex-col gap-2 px-4 pb-2.5 pt-[18px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <span className="mr-1 text-base font-extrabold">Laporan validasi</span>
                    <Badge warna="bg-[#eaf0fa] text-[#1b3560]">{daftar.length} logbook</Badge>
                    <Badge warna={WARNA_BADGE.Siap}>{bersih} bersih</Badge>
                    <Badge warna={WARNA_BADGE.Cek}>{cek} perlu dicek</Badge>
                    <Badge warna={WARNA_GALAT}>{galat} galat</Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    Yang galat dilewati, yang perlu dicek tetap disimpan.{" "}
                    <span className="md:hidden">Ketuk kartu</span>
                    <span className="hidden md:inline">Klik baris</span> untuk melihat detail
                    aktivitas, tabel per bulan, dan catatannya.
                  </span>
                </div>

                <div className="px-3 sm:px-6">
                  {layarLebar ? (
                    /* ───── Tablet / desktop: tabel ───── */
                    <>
                      <p className="mb-1.5 hidden items-center justify-center gap-2 rounded-md bg-[#eaf0fa] px-3 py-1.5 text-[11px] font-semibold text-[#2a5aa8] md:flex lg:hidden">
                        Geser tabel ke samping untuk melihat semua kolom
                        <span aria-hidden className="animate-pulse">→</span>
                      </p>

                      <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-[#dbe6f7]">
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
                                          <BadgeValidasi g={g} p={p} />
                                        </td>
                                      </tr>

                                      {terbuka && (
                                        <tr>
                                          <td
                                            colSpan={KOLOM.length}
                                            className="max-w-0 border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3"
                                          >
                                            <PanelDetail
                                              h={h}
                                              kunci={`${idx}-${files.length}`}
                                              selesai={selesai}
                                              onToggle={toggle}
                                              onUbahBulanan={(data) => ubahBulanan(idx, data)}
                                            />
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
                    </>
                  ) : (
                    /* ───── HP: daftar kartu ───── */
                    <div className="space-y-4">
                      {grup.map(([unit, items]) => (
                        <div key={unit} className="space-y-2">
                          <p className="rounded-lg bg-[#eaf0fa] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1b3560]">
                            {unit}{" "}
                            <span className="font-medium normal-case tracking-normal text-slate-500">
                              ({items.length} ketua)
                            </span>
                          </p>

                          {items.map(({ h, idx }) => {
                            const g = jmlGalat(h);
                            const p = peringatanBelum(h, selesai);
                            const hd = h.entri.header;
                            const terbuka = buka === idx;

                            return (
                              <div
                                key={idx}
                                className={`overflow-hidden rounded-xl border bg-white ${
                                  terbuka ? "border-[#2a5aa8]" : "border-[#dbe6f7]"
                                }`}
                              >
                                <button
                                  type="button"
                                  aria-expanded={terbuka}
                                  onClick={() => setBuka(terbuka ? null : idx)}
                                  className="block w-full p-3 text-left transition-colors active:bg-[#eaf0fa]"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`min-w-0 text-sm font-bold ${teks}`}>
                                      {idx + 1}. {h.nama}
                                    </p>
                                    <span className="shrink-0">
                                      <BadgeValidasi g={g} p={p} />
                                    </span>
                                  </div>

                                  <dl className="mt-2 space-y-1 text-xs">
                                    <div className="flex gap-2">
                                      <dt className="w-24 shrink-0 text-slate-400">Judul</dt>
                                      <dd className={`min-w-0 ${teks}`}>{hd.judulAktivitas || kosong}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="w-24 shrink-0 text-slate-400">Target</dt>
                                      <dd className={`min-w-0 ${teks}`}>{teksTarget(h.entri) || kosong}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="w-24 shrink-0 text-slate-400">Status</dt>
                                      <dd className={`min-w-0 ${teks}`}>{hd.statusPelaksanaan || kosong}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="w-24 shrink-0 text-slate-400">Progres</dt>
                                      <dd className="min-w-0">{hd.progresTotal}%</dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="w-24 shrink-0 text-slate-400">Bulan terisi</dt>
                                      <dd className="min-w-0">{h.entri.bulanan.filter(bulanAdaIsi).length} / 12</dd>
                                    </div>
                                  </dl>

                                  <p className="mt-2 text-center text-[11px] font-bold text-[#2a5aa8]">
                                    {terbuka ? "Tutup detail ▲" : "Lihat detail ▼"}
                                  </p>
                                </button>

                                {terbuka && (
                                  <div className="min-w-0 border-t border-[#dbe6f7] bg-[#f5f8fd] p-2">
                                    <PanelDetail
                                      h={h}
                                      kunci={`${idx}-${files.length}`}
                                      selesai={selesai}
                                      onToggle={toggle}
                                      onUbahBulanan={(data) => ubahBulanan(idx, data)}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {tersimpan !== null && (
              <p
                role="status"
                className="mx-3 mt-4 break-words rounded-xl bg-[#dcfce7] px-4 py-2 text-sm font-semibold text-[#166534] sm:mx-6"
              >
                {tersimpan} logbook disimpan. Total di browser: {tersimpanDiBrowser}.{" "}
                <a href="/logbook" className="underline">
                  Buka halaman Logbook
                </a>
              </p>
            )}

            {/* Footer kartu */}
            <div className="flex flex-col gap-4 px-4 py-[18px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6">
              <div className="flex min-w-0 flex-col gap-1 text-xs text-slate-500">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={gabung}
                    onChange={(e) => setGabung(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#1f4e8c]"
                  />
                  <span>
                    Gabungkan dengan logbook yang sudah tersimpan (ketua yang sama digabung per
                    bulan)
                  </span>
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
                  className="flex-1 rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-[#f5f8fd] sm:flex-none"
                >
                  Batal
                </button>
                <TombolGradasi
                  besar
                  onClick={simpan}
                  disabled={!hasil || layak.length === 0 || tersimpan !== null}
                  className="flex-[2] sm:flex-none"
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