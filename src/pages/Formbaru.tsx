import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import TombolGradasi from "../components/importjson/TombolGradasi";

import unitKerjaRaw from "../data/unitkerja.json";
import { JENIS_OUTPUT } from "../lib/config";
import { BULAN } from "../lib/LogbookData";
import {
  ambilLogbookAktif,
  daftarLogbook,
  pilihAktif,
  simpanLogbook,
} from "../lib/logbookStore";
import {
  deleteActivitiesInDb,
  deleteActivityInDb,
  fetchAllResearchers,
  type PerisetRingkas,
} from "../lib/supabaseLogbookData";
import {
  parseExcelPeriset,
  unduhTemplate,
  type AktivitasPayload,
  type HasilParse,
  type OpsiExcel,
  type PerisetImport,
} from "../lib/excelPeriset";
import type { EntriLogbook } from "../lib/validasiLogbook";
import { STATUS_PELAKSANAAN, emptyMonth, type HeaderData } from "../types/monev";

/* ───────── Konstanta & helper ───────── */

const OPSI_JENIS = JENIS_OUTPUT as readonly string[];
const OPSI_STATUS = STATUS_PELAKSANAAN as readonly string[];
const UNIT: { nama: string; satuanKerja: string }[] = unitKerjaRaw.unitKerja;
const LAIN = "__lain";

/* Pilihan pendanaan. Pilihan "Lainnya" selalu tersedia di akhir daftar. */
const OPSI_KATEGORI = ["Rupiah Murni", "PNBP"];
const OPSI_SKEMA = [
  "ORPA (Organisasi Riset Penerbangan dan Antariksa)",
  "DFRI (Deputi Bidang Fasilitasi Riset dan Inovasi)",
  "RIIM (Riset dan Inovasi untuk Indonesia Maju)",
  "PRIS (Program Riset Inovasi Substantif / Strategis)",
  "SBKU",
];

/* Ubah jadi true setelah logbookStore / validasiLogbook / ImportJson mengenali logbook lewat
   `idAktivitas` (bukan hanya nama ketua). Selama false, penyimpanan browser hanya bisa menampung
   SATU logbook per nama ketua, jadi form menolak lebih dari satu aktivitas agar data tidak saling menimpa.
   (Hanya berlaku untuk form "Periset baru". Menambah aktivitas ke periset di database tidak terkena batas ini.) */
const STORE_MENDUKUNG_ID = false;

const PER_HALAMAN = 10;

/** Pilihan untuk template & validasi Excel: sama persis dengan pilihan di form periset */
const OPSI_EXCEL: OpsiExcel = {
  unit: UNIT,
  status: [...OPSI_STATUS],
  jenisOutput: [...OPSI_JENIS],
  kategori: OPSI_KATEGORI,
  skema: OPSI_SKEMA,
};

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const kecil = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const batas = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
const pilihanAkhir = (nilai: string, lain: string) => (nilai === LAIN ? lain.trim() : nilai);

const kelasInput = (galat?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1b3560] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    galat
      ? "border-[#dc2626] focus:ring-[#dc2626]/30"
      : "border-[#9db8e0] focus:ring-[#2a5aa8]"
  }`;

type Identitas = {
  nama: string;
  email: string;
  unit: string;
  unitLain: string;
  satuan: string;
};
type Target = { id: number; jenis: string; jumlah: number };
type Aktivitas = {
  id: number;
  judul: string;
  status: string;
  progres: number;
  keterangan: string;
  targets: Target[];
  kategori: string;
  kategoriLain: string;
  skema: string;
  skemaLain: string;
};

/** Form pop up: periset baru, atau tambah aktivitas ke periset yang sudah terdaftar */
type PerisetTujuan = { id: PerisetRingkas["id"]; nama: string; unitKerja: string };
type ModeForm = { jenis: "baru" } | { jenis: "tambahAkt"; periset: PerisetTujuan };

/** Akun admin (hanya ditampilkan di tab Akun Admin) */
type AdminRingkas = { id: string; nama: string; email: string; unitKerja?: string };

/** Yang sedang menunggu konfirmasi hapus */
type TargetHapus =
  | { sumber: "browser"; nama: string; jumlah: number }
  | { sumber: "db"; tipe: "periset"; nama: string; aktivitas: { id: string; judul: string }[] }
  | { sumber: "db"; tipe: "aktivitas"; id: string; judul: string; nama: string };

const IDENTITAS_AWAL: Identitas = { nama: "", email: "", unit: "", unitLain: "", satuan: "" };

/**
 * TODO: sambungkan ke supabaseLogbookData.
 * Fungsi ini harus menambah satu atau lebih aktivitas (beserta target output)
 * ke periset dengan id tersebut di database.
 */
async function tambahAktivitasDiDb(_perisetId: PerisetTujuan["id"], _data: AktivitasPayload[]): Promise<void> {
  throw new Error("Penambahan aktivitas ke database belum dihubungkan.");
}

/**
 * TODO: sambungkan ke supabaseLogbookData.
 * Mengambil semua akun admin.
 */
async function fetchAllAdmins(): Promise<AdminRingkas[]> {
  throw new Error("Daftar admin belum dihubungkan ke database.");
}

/**
 * TODO: sambungkan ke supabaseLogbookData.
 * Menyimpan hasil import Excel: tiap periset beserta seluruh aktivitasnya.
 * Periset yang namanya sudah ada di database sebaiknya hanya ditambah aktivitasnya.
 */
async function importPerisetDiDb(_data: PerisetImport[]): Promise<void> {
  throw new Error("Penyimpanan hasil import Excel ke database belum dihubungkan.");
}

function Field({
  label,
  id,
  wajib,
  galat,
  hint,
  children,
}: {
  label: string;
  id?: string;
  wajib?: boolean;
  galat?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[13px] font-bold">
        {label}
        {wajib && <span className="text-[#991b1b]"> *</span>}
      </label>
      {children}
      {galat ? (
        <p role="alert" className="mt-1 text-xs font-semibold text-[#991b1b]">
          {galat}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function Seksi({ n, judul, children }: { n: number; judul: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#dbe6f7] px-4 py-4 last:border-b-0 sm:px-6 sm:py-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f4e8c] text-xs text-white">
          {n}
        </span>
        {judul}
      </h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

/** Pop-up konfirmasi: di HP naik dari bawah, di layar lebar di tengah. Esc / klik latar = batal. */
function ModalKonfirmasi({
  judul,
  children,
  menghapus,
  galat,
  onYa,
  onBatal,
}: {
  judul: string;
  children: ReactNode;
  menghapus: boolean;
  galat: string;
  onYa: () => void;
  onBatal: () => void;
}) {
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !menghapus) onBatal();
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [menghapus, onBatal]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !menghapus) onBatal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-modal-hapus"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fee2e2]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="judul-modal-hapus" className="text-base font-extrabold text-[#1b3560] [overflow-wrap:anywhere]">
              {judul}
            </h3>
            <div className="mt-1.5 space-y-2 text-sm text-slate-600">{children}</div>
          </div>
        </div>

        {galat && (
          <p role="alert" className="mt-3 rounded-lg bg-[#fee2e2] px-3 py-2 text-xs font-semibold text-[#991b1b] [overflow-wrap:anywhere]">
            {galat}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            disabled={menghapus}
            onClick={onBatal}
            className="rounded-full border border-[#9db8e0] px-5 py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd] disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={menghapus}
            onClick={onYa}
            className="rounded-full bg-[#dc2626] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {menghapus ? "Menghapus…" : "Ya, hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pop up import periset dari file Excel (template dari tombol "Unduh template Excel") */
type PropsImportExcel = {
  opsi: OpsiExcel;
  /** true jika nama periset sudah terdaftar di database */
  sudahAda: (nama: string) => boolean;
  onSimpan: (data: PerisetImport[]) => Promise<void>;
  onClose: () => void;
};

const MAKS_GALAT_TAMPIL = 15;

function ImportExcelModal({ opsi, sudahAda, onSimpan, onClose }: PropsImportExcel) {
  const [namaFile, setNamaFile] = useState("");
  const [hasil, setHasil] = useState<HasilParse | null>(null);
  const [membaca, setMembaca] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState("");
  const [selesai, setSelesai] = useState<number | null>(null);

  const pilihFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // boleh memilih file yang sama lagi setelah diperbaiki
    if (!file) return;

    setNamaFile(file.name);
    setHasil(null);
    setGalat("");
    setMembaca(true);
    try {
      setHasil(await parseExcelPeriset(file, opsi));
    } catch (err) {
      setGalat((err as Error).message || "File tidak bisa dibaca.");
    } finally {
      setMembaca(false);
    }
  };

  const jumlahAktivitas = hasil?.periset.reduce((n, p) => n + p.aktivitas.length, 0) ?? 0;
  const bisaSimpan = !!hasil && hasil.galat.length === 0 && hasil.periset.length > 0 && !menyimpan;

  const simpan = async () => {
    if (!hasil || !bisaSimpan) return;
    setMenyimpan(true);
    setGalat("");
    try {
      await onSimpan(hasil.periset);
      setSelesai(hasil.periset.length);
    } catch (err) {
      setGalat((err as Error).message || "Gagal menyimpan data import.");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-import-excel"
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#dbe6f7] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="judul-import-excel" className="text-lg font-extrabold text-[#1b3560] sm:text-xl">
              Import periset dari Excel
            </h2>
            <p className="text-[13px] text-slate-500">
              Unggah file template yang sudah diisi periset. Satu baris = satu aktivitas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={menyimpan}
            aria-label="Tutup"
            className="shrink-0 rounded-full px-3 py-1.5 text-lg font-bold leading-none text-slate-500 hover:bg-[#eaf0fa] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6">
          {selesai !== null ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#166534" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </div>
              <p className="text-lg font-extrabold text-[#1b3560]">{selesai} periset berhasil diimport</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-full border border-[#9db8e0] px-5 py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
              >
                Tutup
              </button>
            </div>
          ) : (
            <div className="grid gap-4 text-[#1b3560]">
              <div className="flex flex-col gap-3 rounded-xl bg-[#f5f8fd] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Belum punya template? Unduh, bagikan ke periset, lalu unggah hasil isiannya di sini.
                </p>
                <button
                  type="button"
                  onClick={() => unduhTemplate(opsi)}
                  className="shrink-0 rounded-full border border-[#9db8e0] bg-white px-4 py-2 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#eaf0fa]"
                >
                  Unduh template Excel
                </button>
              </div>

              <div>
                <label htmlFor="file-excel" className="mb-1 block text-[13px] font-bold">
                  File Excel (.xlsx)
                </label>
                <input
                  id="file-excel"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => void pilihFile(e)}
                  disabled={membaca || menyimpan}
                  className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#1f4e8c] file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-white hover:file:bg-[#2a5aa8]"
                />
                {namaFile && <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">{namaFile}</p>}
              </div>

              {membaca && <p className="text-sm text-slate-500">Membaca file…</p>}

              {galat && (
                <p role="alert" className="rounded-lg bg-[#fee2e2] px-3 py-2 text-xs font-semibold text-[#991b1b] [overflow-wrap:anywhere]">
                  {galat}
                </p>
              )}

              {hasil && (
                <>
                  <p className="text-sm">
                    Terbaca <b>{hasil.jumlahBaris} baris</b>: <b>{hasil.periset.length} periset</b> dengan{" "}
                    <b>{jumlahAktivitas} aktivitas</b> valid.
                  </p>

                  {hasil.galat.length > 0 && (
                    <div role="alert" className="rounded-lg border border-[#fecaca] bg-[#fee2e2] px-3 py-2 text-xs text-[#991b1b]">
                      <p className="font-bold">
                        {hasil.galat.length} masalah ditemukan. Perbaiki file Excel lalu unggah ulang.
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {hasil.galat.slice(0, MAKS_GALAT_TAMPIL).map((g, i) => (
                          <li key={i} className="[overflow-wrap:anywhere]">
                            Baris {g.baris}: {g.pesan}
                          </li>
                        ))}
                      </ul>
                      {hasil.galat.length > MAKS_GALAT_TAMPIL && (
                        <p className="mt-1">dan {hasil.galat.length - MAKS_GALAT_TAMPIL} masalah lainnya.</p>
                      )}
                    </div>
                  )}

                  {hasil.periset.length > 0 && (
                    <div className="max-h-[260px] overflow-auto rounded-xl border border-[#dbe6f7]">
                      <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                        <thead className="sticky top-0 bg-[#eaf0fa] font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                          <tr>
                            <th scope="col" className="px-3 py-2">Periset</th>
                            <th scope="col" className="px-3 py-2">Email</th>
                            <th scope="col" className="px-3 py-2">Unit kerja</th>
                            <th scope="col" className="px-3 py-2 text-center">Aktivitas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hasil.periset.map((p) => (
                            <tr key={p.nama} className="border-t border-[#e5edf8] align-top">
                              <td className="px-3 py-2 font-bold [overflow-wrap:anywhere]">
                                {p.nama}
                                {sudahAda(p.nama) && (
                                  <span className="ml-2 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">
                                    sudah terdaftar
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 [overflow-wrap:anywhere]">{p.email}</td>
                              <td className="px-3 py-2 [overflow-wrap:anywhere]">{p.unitKerja}</td>
                              <td className="px-3 py-2 text-center font-bold">{p.aktivitas.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {selesai === null && (
          <div className="flex flex-col-reverse gap-2 border-t border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={menyimpan}
              className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-white disabled:opacity-60"
            >
              Batal
            </button>
            {bisaSimpan ? (
              <TombolGradasi besar onClick={() => void simpan()}>
                Simpan {hasil?.periset.length} periset
              </TombolGradasi>
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-400"
              >
                {menyimpan ? "Menyimpan…" : "Simpan"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const bukaLogbook = (nama: string) => {
  pilihAktif(nama);
  window.location.assign("/logbook");
};

/* ───────── Halaman ───────── */

export default function Formbaru() {
  const hitung = useRef(1);
  const idBaru = () => hitung.current++;
  const aktivitasBaru = (): Aktivitas => ({
    id: idBaru(),
    judul: "",
    status: OPSI_STATUS[0] ?? "",
    progres: 0,
    keterangan: "",
    targets: [{ id: idBaru(), jenis: "", jumlah: 1 }],
    kategori: "",
    kategoriLain: "",
    skema: "",
    skemaLain: "",
  });

  const [iden, setIden] = useState<Identitas>(IDENTITAS_AWAL);
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>(() => [aktivitasBaru()]);

  // Form pop up (null = tertutup)
  const [formMode, setFormMode] = useState<ModeForm | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const [dicoba, setDicoba] = useState(false);
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState<{ nama: string; jumlah: number; jenis: ModeForm["jenis"] } | null>(null);
  const [versi, setVersi] = useState(0);

  // Pop-up hapus (dipakai untuk periset di browser maupun di database)
  const [target, setTarget] = useState<TargetHapus | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [galatModal, setGalatModal] = useState("");

  // Daftar periset yang sudah ada di database
  const [dbList, setDbList] = useState<PerisetRingkas[]>([]);
  const [dbMemuat, setDbMemuat] = useState(true);
  const [dbGalat, setDbGalat] = useState("");
  const [cari, setCari] = useState("");
  const [halaman, setHalaman] = useState(1);

  // Tab & import Excel
  const [tab, setTab] = useState<"periset" | "admin">("periset");
  const [showImport, setShowImport] = useState(false);

  // Daftar admin
  const [adminList, setAdminList] = useState<AdminRingkas[]>([]);
  const [adminMemuat, setAdminMemuat] = useState(true);
  const [adminGalat, setAdminGalat] = useState("");
  const [cariAdmin, setCariAdmin] = useState("");
  const [terbuka, setTerbuka] = useState<Set<PerisetRingkas["id"]>>(() => new Set());

  const muatDb = useCallback(async () => {
    setDbMemuat(true);
    setDbGalat("");
    try {
      setDbList(await fetchAllResearchers());
    } catch (err) {
      setDbGalat((err as Error).message);
    } finally {
      setDbMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muatDb();
  }, [muatDb]);

  const muatAdmin = useCallback(async () => {
    setAdminMemuat(true);
    setAdminGalat("");
    try {
      setAdminList(await fetchAllAdmins());
    } catch (err) {
      setAdminGalat((err as Error).message);
    } finally {
      setAdminMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muatAdmin();
  }, [muatAdmin]);

  // Kunci scroll halaman selagi form pop up terbuka
  useEffect(() => {
    if (!formMode) return;
    const lama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = lama;
    };
  }, [formMode]);

  // `versi` sengaja jadi pemicu muat ulang daftar setelah menyimpan / menghapus
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tersimpan = useMemo(() => daftarLogbook(), [versi]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const aktifNama = useMemo(() => ambilLogbookAktif()?.header.namaKetua ?? "", [versi]);

  const perisetTujuan = formMode?.jenis === "tambahAkt" ? formMode.periset : null;
  const modeBaru = !perisetTujuan;

  const ubahIden = <K extends keyof Identitas>(k: K, v: Identitas[K]) =>
    setIden((p) => ({ ...p, [k]: v }));

  const pilihUnit = (v: string) =>
    setIden((p) => ({
      ...p,
      unit: v,
      unitLain: "",
      satuan: UNIT.find((u) => u.nama === v)?.satuanKerja ?? "",
    }));

  const ubahAkt = (id: number, patch: Partial<Aktivitas>) =>
    setAktivitas((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const tambahAkt = () => setAktivitas((p) => [...p, aktivitasBaru()]);
  const hapusAkt = (id: number) => setAktivitas((p) => (p.length > 1 ? p.filter((a) => a.id !== id) : p));

  const ubahTarget = (aid: number, tid: number, patch: Partial<Target>) =>
    setAktivitas((p) =>
      p.map((a) =>
        a.id === aid ? { ...a, targets: a.targets.map((t) => (t.id === tid ? { ...t, ...patch } : t)) } : a
      )
    );
  const tambahTarget = (aid: number) =>
    setAktivitas((p) =>
      p.map((a) => (a.id === aid ? { ...a, targets: [...a.targets, { id: idBaru(), jenis: "", jumlah: 1 }] } : a))
    );
  const hapusTarget = (aid: number, tid: number) =>
    setAktivitas((p) => p.map((a) => (a.id === aid ? { ...a, targets: a.targets.filter((t) => t.id !== tid) } : a)));

  const unitFinal = iden.unit === LAIN ? iden.unitLain.trim() : iden.unit;
  const namaBersih = iden.nama.trim();
  const emailBersih = iden.email.trim();
  const jumlahSudahAda = tersimpan.filter((x) => kecil(x.header.namaKetua) === kecil(namaBersih)).length;

  /* ----- validasi ----- */

  const galat = useMemo(() => {
    const ident: Record<string, string> = {};
    if (modeBaru) {
      if (!namaBersih) ident.nama = "Nama ketua tim wajib diisi";
      else if (!STORE_MENDUKUNG_ID && jumlahSudahAda > 0) {
        ident.nama = "Periset dengan nama ini sudah punya logbook";
      }
      if (!emailBersih) ident.email = "Email aktif wajib diisi";
      else if (!POLA_EMAIL.test(emailBersih)) ident.email = "Format email belum benar, mis. nama@brin.go.id";
      if (!unitFinal) ident.unit = "Unit kerja wajib diisi";
    }

    const akt: Record<number, Record<string, string>> = {};
    for (const a of aktivitas) {
      const e: Record<string, string> = {};
      if (!a.judul.trim()) e.judul = "Judul aktivitas wajib diisi";
      if (!a.status) e.status = "Pilih status pelaksanaan";

      if (a.targets.length === 0) e.target = "Tambahkan minimal satu target output";
      else if (a.targets.some((t) => !t.jenis)) e.target = "Pilih jenis untuk setiap target";
      else if (new Set(a.targets.map((t) => t.jenis)).size !== a.targets.length) {
        e.target = "Satu jenis hanya boleh muncul sekali, gabungkan jumlahnya";
      } else if (a.targets.some((t) => !(t.jumlah >= 1))) e.target = "Jumlah target minimal 1";

      if (!pilihanAkhir(a.kategori, a.kategoriLain)) e.kategori = "Kategori pendanaan wajib diisi";
      if (!pilihanAkhir(a.skema, a.skemaLain)) e.skema = "Skema mitra program wajib diisi";
      akt[a.id] = e;
    }

    const umum =
      modeBaru && !STORE_MENDUKUNG_ID && aktivitas.length > 1
        ? "Penyimpanan browser saat ini hanya bisa menampung satu logbook per nama ketua. Hapus aktivitas tambahan, atau simpan satu aktivitas dulu."
        : "";

    const jumlah =
      Object.keys(ident).length +
      Object.values(akt).reduce((n, e) => n + Object.keys(e).length, 0) +
      (umum ? 1 : 0);
    return { ident, akt, umum, jumlah };
  }, [modeBaru, namaBersih, emailBersih, unitFinal, jumlahSudahAda, aktivitas]);

  /** Galat nama (duplikat) langsung tampil; yang lain setelah mencoba simpan */
  const tampilIden = (k: string) =>
    dicoba || (k === "nama" && namaBersih) ? galat.ident[k] : undefined;
  const tampilAkt = (id: number, k: string) => (dicoba ? galat.akt[id]?.[k] : undefined);

  /* ----- aksi ----- */

  const reset = () => {
    setIden(IDENTITAS_AWAL);
    setAktivitas([aktivitasBaru()]);
    setDicoba(false);
    setPesan("");
    setBerhasil(null);
  };

  const bukaFormBaru = () => {
    reset();
    setFormMode({ jenis: "baru" });
  };

  const bukaFormAkt = (p: PerisetRingkas) => {
    reset();
    setFormMode({ jenis: "tambahAkt", periset: { id: p.id, nama: p.nama, unitKerja: p.unitKerja } });
  };

  const tutupForm = () => {
    if (menyimpan) return;
    reset();
    setFormMode(null);
  };

  const simpan = async (e?: FormEvent) => {
    e?.preventDefault();
    if (menyimpan) return;
    setDicoba(true);
    setPesan("");
    if (galat.jumlah) return;

    // ── Tambah aktivitas ke periset yang sudah ada di database ──
    if (perisetTujuan) {
      setMenyimpan(true);
      try {
        const payload: AktivitasPayload[] = aktivitas.map((a) => ({
          judul: a.judul.trim(),
          status: a.status,
          progres: a.progres,
          keterangan: a.keterangan.trim(),
          targetOutputs: a.targets.map(({ jenis, jumlah }) => ({ jenis, jumlah })),
          kategoriPendanaan: pilihanAkhir(a.kategori, a.kategoriLain),
          skemaMitraProgram: pilihanAkhir(a.skema, a.skemaLain),
        }));
        await tambahAktivitasDiDb(perisetTujuan.id, payload);
        await muatDb();
        setBerhasil({ nama: perisetTujuan.nama, jumlah: payload.length, jenis: "tambahAkt" });
      } catch (err) {
        setPesan((err as Error).message);
      } finally {
        setMenyimpan(false);
      }
      return;
    }

    // ── Periset baru: disimpan sebagai logbook di browser ──
    const waktu = Date.now();
    const entriBaru: EntriLogbook[] = aktivitas.map((a) => ({
      header: {
        namaKetua: namaBersih,
        emailAktif: emailBersih,
        unitKerja: unitFinal,
        satuanKerja: iden.satuan.trim(),
        judulAktivitas: a.judul.trim(),
        targetOutputs: a.targets.map(({ jenis, jumlah }) => ({ jenis, jumlah })),
        progresTotal: a.progres,
        progresKeterangan: a.keterangan.trim(),
        statusPelaksanaan: a.status,
        kategoriPendanaan: pilihanAkhir(a.kategori, a.kategoriLain),
        skemaMitraProgram: pilihanAkhir(a.skema, a.skemaLain),
        ...(STORE_MENDUKUNG_ID ? { idAktivitas: `${waktu}-${a.id}` } : {}),
      } as unknown as HeaderData,
      bulanan: BULAN.map((b) => emptyMonth(b)) as EntriLogbook["bulanan"],
      catatanImport: [],
    }));

    // periset baru langsung jadi logbook aktif
    if (!simpanLogbook([...daftarLogbook(), ...entriBaru], namaBersih)) {
      setPesan("Gagal menyimpan: penyimpanan browser penuh atau diblokir.");
      return;
    }
    setBerhasil({ nama: namaBersih, jumlah: entriBaru.length, jenis: "baru" });
    setVersi((v) => v + 1);
    void muatDb();
  };

  /** Hapus semua logbook milik satu periset di penyimpanan browser (dikenali dari nama ketua) */
  const hapusDiBrowser = (nama: string) => {
    const sisa = daftarLogbook().filter((x) => kecil(x.header.namaKetua) !== kecil(nama));
    // kalau yang dihapus sedang aktif, pindahkan aktif ke periset pertama yang tersisa
    const aktifBaru = kecil(aktifNama) === kecil(nama) ? (sisa[0]?.header.namaKetua ?? "") : aktifNama;

    if (!simpanLogbook(sisa, aktifBaru)) {
      throw new Error("Gagal menghapus: penyimpanan browser diblokir atau tidak merespons.");
    }
    // layar sukses periset yang baru dihapus tidak boleh menawarkan "Buka Logbook" lagi
    if (berhasil && kecil(berhasil.nama) === kecil(nama)) setBerhasil(null);
    setVersi((v) => v + 1);
  };

  const bukaModal = (t: TargetHapus) => {
    setGalatModal("");
    setTarget(t);
  };
  const tutupModal = useCallback(() => {
    setTarget(null);
    setGalatModal("");
  }, []);

  const konfirmasiYa = async () => {
    if (!target) return;
    setMenghapus(true);
    setGalatModal("");
    try {
      if (target.sumber === "browser") {
        hapusDiBrowser(target.nama);
      } else if (target.tipe === "aktivitas") {
        await deleteActivityInDb(target.id);
      } else {
        await deleteActivitiesInDb(target.aktivitas.map((a) => a.id));
      }
      if (target.sumber === "db") await muatDb();
      setTarget(null);
    } catch (err) {
      setGalatModal((err as Error).message);
      // hapus periset bisa berhasil sebagian: segarkan daftar supaya tampilan sesuai kenyataan
      if (target.sumber === "db") void muatDb();
    } finally {
      setMenghapus(false);
    }
  };

  const teksTarget = (a: Aktivitas) =>
    a.targets
      .filter((t) => t.jenis)
      .map((t) => `${t.jumlah} ${t.jenis}`)
      .join(", ") || "–";

  /* ----- daftar periset di database (dengan pencarian) ----- */

  const q = kecil(cari);
  const dbTampil = q
    ? dbList.filter(
        (p) =>
          kecil(p.nama).includes(q) ||
          kecil(p.unitKerja).includes(q) ||
          p.aktivitas.some((a) => kecil(a.judul).includes(q))
      )
    : dbList;

  const totalHalaman = Math.max(1, Math.ceil(dbTampil.length / PER_HALAMAN));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const awalHalaman = (halamanAktif - 1) * PER_HALAMAN;
  const dbHalaman = dbTampil.slice(awalHalaman, awalHalaman + PER_HALAMAN);

  const qAdmin = kecil(cariAdmin);
  const adminTampil = qAdmin
    ? adminList.filter((a) => kecil(a.nama).includes(qAdmin) || kecil(a.email).includes(qAdmin))
    : adminList;

  const ubahTerbuka = (id: PerisetRingkas["id"]) =>
    setTerbuka((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Isi pop-up hapus sesuai apa yang akan dihapus */
  const isiModal = () => {
    if (!target) return null;

    if (target.sumber === "browser") {
      return {
        judul: `Yakin ingin menghapus ${target.nama}?`,
        isi: (
          <p>
            {target.jumlah > 1
              ? `${target.jumlah} logbook periset ini akan terhapus dari browser dan tidak bisa dikembalikan.`
              : "Logbook periset ini akan terhapus dari browser dan tidak bisa dikembalikan."}
          </p>
        ),
      };
    }

    if (target.tipe === "aktivitas") {
      return {
        judul: "Yakin ingin menghapus aktivitas ini?",
        isi: (
          <>
            <p className="rounded-lg bg-[#f5f8fd] px-3 py-2 font-semibold text-[#1b3560] [overflow-wrap:anywhere]">
              {target.judul || "(tanpa judul)"}
            </p>
            <p>
              Milik <b>{target.nama || "periset"}</b>. Target output dan seluruh log bulanannya ikut
              terhapus permanen dari database dan tidak bisa dikembalikan.
            </p>
          </>
        ),
      };
    }

    const tampil = target.aktivitas.slice(0, 5);
    const sisa = target.aktivitas.length - tampil.length;
    return {
      judul: `Yakin ingin menghapus periset ${target.nama || "ini"}?`,
      isi: (
        <>
          <p>
            <b>{target.aktivitas.length} aktivitas</b> beserta log bulanannya akan terhapus permanen
            dari database dan tidak bisa dikembalikan:
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-[#1b3560]">
            {tampil.map((a) => (
              <li key={a.id} className="[overflow-wrap:anywhere]">
                {a.judul || "(tanpa judul)"}
              </li>
            ))}
          </ul>
          {sisa > 0 && <p className="text-xs">dan {sisa} aktivitas lainnya.</p>}
          <p className="text-xs">Akun login periset tidak ikut terhapus.</p>
        </>
      ),
    };
  };

  const modal = isiModal();

  /* ----- tampilan ----- */

  const nomorAktivitas = modeBaru ? 2 : 1;
  const namaPratinjau = perisetTujuan ? perisetTujuan.nama : namaBersih;
  const unitPratinjau = perisetTujuan ? perisetTujuan.unitKerja : unitFinal;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f5fa] pt-20 font-sans text-[#1b3560] sm:pt-24">
      <main className="min-w-0">
        <div
          className="flex min-h-[36px] flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-1 text-sm font-bold text-white shadow-[0_4px_10px_rgba(0,0,0,0.12)] sm:min-h-[40px] sm:px-9 sm:text-base"
          style={{ background: "linear-gradient(90deg, #f0283c 0%, #ff5a6a 100%)" }}
        >
          <span>ORPA</span>
          <span aria-hidden="true" className="hidden h-[18px] w-px bg-white/60 sm:block" />
          <span className="min-w-0 sm:truncate">Badan Riset dan Inovasi Nasional</span>
        </div>

        <div className="grid gap-4 px-3 py-4 sm:gap-5 sm:px-9 sm:py-6">
          {/* ───── Judul halaman + aksi ───── */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold sm:text-xl">Kelola akun</h2>
              <p className="text-[13px] text-slate-500">
                {tab === "periset"
                  ? "Akun periset beserta aktivitasnya. Klik nama periset untuk melihat aktivitasnya, atau “+ Aktivitas” untuk menambah aktivitas baru."
                  : "Daftar akun admin."}
              </p>
            </div>
            {tab === "periset" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => unduhTemplate(OPSI_EXCEL)}
                  className="rounded-full border border-[#9db8e0] bg-white px-[18px] py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                >
                  Unduh template Excel
                </button>
                <button
                  type="button"
                  onClick={() => setShowImport(true)}
                  className="rounded-full border border-[#9db8e0] bg-white px-[18px] py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                >
                  Import Excel
                </button>
                <TombolGradasi besar onClick={bukaFormBaru}>
                  + Periset baru
                </TombolGradasi>
              </div>
            )}
          </div>

          {/* ───── Tab: akun periset / akun admin ───── */}
          <div role="tablist" aria-label="Jenis akun" className="flex gap-1 border-b border-[#cfdcf0]">
            {(
              [
                ["periset", "Akun Periset", dbList.length],
                ["admin", "Akun Admin", adminList.length],
              ] as const
            ).map(([k, label, n]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold ${
                  tab === k
                    ? "border-[#1f4e8c] text-[#1f4e8c]"
                    : "border-transparent text-slate-500 hover:text-[#1b3560]"
                }`}
              >
                {label}
                <span className="ml-2 rounded-full bg-[#eaf0fa] px-2 py-0.5 text-xs text-[#1b3560]">{n}</span>
              </button>
            ))}
          </div>

          {tab === "periset" && (
            <>

          {/* ───── Daftar periset di database ───── */}
          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
            <div className="border-b border-[#e5edf8] px-4 py-3 sm:px-5">
              <input
                type="search"
                value={cari}
                onChange={(e) => {
                  setCari(e.target.value);
                  setHalaman(1);
                }}
                placeholder="Cari nama, unit, atau judul aktivitas…"
                aria-label="Cari periset"
                className={`${kelasInput()} sm:max-w-md`}
              />
            </div>

            {dbGalat && (
              <div role="alert" className="border-b border-[#fecaca] bg-[#fee2e2] px-5 py-2 text-xs font-semibold text-[#991b1b]">
                <p className="[overflow-wrap:anywhere]">Gagal memuat daftar: {dbGalat}</p>
                <button type="button" onClick={() => void muatDb()} className="mt-1 underline">
                  Coba lagi
                </button>
              </div>
            )}

            {dbMemuat ? (
              <p className="px-5 py-6 text-sm text-slate-500">Memuat daftar periset…</p>
            ) : dbTampil.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                {dbList.length === 0
                  ? "Belum ada periset di database. Klik “+ Periset baru” untuk menambahkan."
                  : "Tidak ada yang cocok dengan pencarian."}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#eaf0fa] text-xs font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                        <th scope="col" className="w-12 px-4 py-3 text-center">
                          No
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Periset
                        </th>
                        <th scope="col" className="hidden px-4 py-3 md:table-cell">
                          Unit kerja
                        </th>
                        <th scope="col" className="w-24 px-4 py-3 text-center">
                          Aktivitas
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbHalaman.map((p, idx) => {
                        const buka = terbuka.has(p.id);
                        return (
                          <Fragment key={p.id}>
                            <tr className="border-t border-[#e5edf8] align-top hover:bg-[#f9fbfe]">
                              <td className="px-4 py-3 text-center text-xs text-slate-500">
                                {awalHalaman + idx + 1}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => ubahTerbuka(p.id)}
                                  aria-expanded={buka}
                                  aria-label={`${buka ? "Sembunyikan" : "Lihat"} aktivitas ${p.nama}`}
                                  className="flex items-start gap-2 text-left"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`mt-0.5 inline-block text-[10px] text-[#1f4e8c] transition-transform ${buka ? "rotate-90" : ""}`}
                                  >
                                    ▶
                                  </span>
                                  <span className="font-extrabold [overflow-wrap:anywhere]">
                                    {p.nama || "(tanpa nama)"}
                                  </span>
                                </button>
                                <p className="ml-[18px] text-xs text-slate-500 md:hidden [overflow-wrap:anywhere]">
                                  {p.unitKerja || "Tanpa unit kerja"}
                                </p>
                              </td>
                              <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell [overflow-wrap:anywhere]">
                                {p.unitKerja || "–"}
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{p.aktivitas.length}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => bukaFormAkt(p)}
                                    aria-label={`Tambah aktivitas untuk ${p.nama}`}
                                    className="rounded-full border border-[#9db8e0] px-3 py-1 text-xs font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                                  >
                                    + Aktivitas
                                  </button>
                                  {p.aktivitas.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        bukaModal({
                                          sumber: "db",
                                          tipe: "periset",
                                          nama: p.nama,
                                          aktivitas: p.aktivitas.map((a) => ({ id: a.id, judul: a.judul })),
                                        })
                                      }
                                      aria-label={`Hapus periset ${p.nama}`}
                                      className="rounded-full border border-[#fecaca] px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                                    >
                                      Hapus
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {buka && (
                              <tr className="bg-[#f5f8fd]">
                                <td colSpan={5} className="px-4 pb-4 pt-1 sm:pl-16">
                                  {p.aktivitas.length === 0 ? (
                                    <p className="text-xs italic text-slate-400">Belum ada aktivitas.</p>
                                  ) : (
                                    <ul className="space-y-1.5">
                                      {p.aktivitas.map((a) => (
                                        <li
                                          key={a.id}
                                          className="flex items-start gap-2 rounded-lg border border-[#e5edf8] bg-white px-3 py-2"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-semibold [overflow-wrap:anywhere]">
                                              {a.judul || "(tanpa judul)"}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                              {a.status || "Status belum diisi"} · {a.progres}%
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              bukaModal({
                                                sumber: "db",
                                                tipe: "aktivitas",
                                                id: a.id,
                                                judul: a.judul,
                                                nama: p.nama,
                                              })
                                            }
                                            aria-label={`Hapus aktivitas ${a.judul}`}
                                            className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                                          >
                                            Hapus
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-2 border-t border-[#e5edf8] px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <span>
                    Menampilkan {awalHalaman + 1}–{awalHalaman + dbHalaman.length} dari {dbTampil.length} periset
                  </span>
                  {totalHalaman > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHalaman(halamanAktif - 1)}
                        disabled={halamanAktif <= 1}
                        className="rounded-full border border-[#9db8e0] px-3 py-1 font-bold text-[#1f4e8c] hover:bg-[#f5f8fd] disabled:opacity-40"
                      >
                        Sebelumnya
                      </button>
                      <span className="font-semibold text-[#1b3560]">
                        {halamanAktif} / {totalHalaman}
                      </span>
                      <button
                        type="button"
                        onClick={() => setHalaman(halamanAktif + 1)}
                        disabled={halamanAktif >= totalHalaman}
                        className="rounded-full border border-[#9db8e0] px-3 py-1 font-bold text-[#1f4e8c] hover:bg-[#f5f8fd] disabled:opacity-40"
                      >
                        Berikutnya
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
            </>
          )}

          {/* ───── Akun admin ───── */}
          {tab === "admin" && (
            <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
              <div className="border-b border-[#e5edf8] px-4 py-3 sm:px-5">
                <input
                  type="search"
                  value={cariAdmin}
                  onChange={(e) => setCariAdmin(e.target.value)}
                  placeholder="Cari nama atau email admin…"
                  aria-label="Cari admin"
                  className={`${kelasInput()} sm:max-w-md`}
                />
              </div>

              {adminGalat && (
                <div role="alert" className="border-b border-[#fecaca] bg-[#fee2e2] px-5 py-2 text-xs font-semibold text-[#991b1b]">
                  <p className="[overflow-wrap:anywhere]">Gagal memuat daftar: {adminGalat}</p>
                  <button type="button" onClick={() => void muatAdmin()} className="mt-1 underline">
                    Coba lagi
                  </button>
                </div>
              )}

              {adminMemuat ? (
                <p className="px-5 py-6 text-sm text-slate-500">Memuat daftar admin…</p>
              ) : adminTampil.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">
                  {adminList.length === 0 ? "Belum ada akun admin." : "Tidak ada yang cocok dengan pencarian."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#eaf0fa] text-xs font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                        <th scope="col" className="w-12 px-4 py-3 text-center">No</th>
                        <th scope="col" className="px-4 py-3">Nama</th>
                        <th scope="col" className="px-4 py-3">Email</th>
                        <th scope="col" className="hidden px-4 py-3 md:table-cell">Unit kerja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminTampil.map((a, i) => (
                        <tr key={a.id} className="border-t border-[#e5edf8] hover:bg-[#f9fbfe]">
                          <td className="px-4 py-3 text-center text-xs text-slate-500">{i + 1}</td>
                          <td className="px-4 py-3 font-extrabold [overflow-wrap:anywhere]">{a.nama || "(tanpa nama)"}</td>
                          <td className="px-4 py-3 text-xs [overflow-wrap:anywhere]">{a.email}</td>
                          <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell [overflow-wrap:anywhere]">
                            {a.unitKerja || "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* ───── Pop up form (periset baru / tambah aktivitas) ───── */}
      {formMode && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-form"
            className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-[#f2f5fa] shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#dbe6f7] bg-white px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h2 id="judul-form" className="text-lg font-extrabold sm:text-xl [overflow-wrap:anywhere]">
                  {perisetTujuan ? `Tambah aktivitas · ${perisetTujuan.nama}` : "Form periset baru"}
                </h2>
                <p className="text-[13px] text-slate-500">
                  {perisetTujuan
                    ? "Aktivitas baru akan ditambahkan ke periset ini."
                    : "Isi data periset dan aktivitasnya. Setelah disimpan, periset ini langsung punya logbook baru dengan 12 bulan yang masih kosong."}
                </p>
              </div>
              <button
                type="button"
                onClick={tutupForm}
                disabled={menyimpan}
                aria-label="Tutup form"
                className="shrink-0 rounded-full px-3 py-1.5 text-lg font-bold leading-none text-slate-500 hover:bg-[#eaf0fa] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="grid items-start gap-4 overflow-y-auto p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section className="min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
                {berhasil ? (
                  <div className="px-4 py-8 text-center sm:px-6 sm:py-10">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7"
                        fill="none"
                        stroke="#166534"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    </div>
                    <p className="text-lg font-extrabold [overflow-wrap:anywhere]">
                      {berhasil.jenis === "tambahAkt"
                        ? `${berhasil.jumlah} aktivitas ditambahkan ke ${berhasil.nama}`
                        : berhasil.jumlah > 1
                          ? `${berhasil.jumlah} logbook ${berhasil.nama} sudah dibuat`
                          : `Logbook ${berhasil.nama} sudah dibuat`}
                    </p>
                    {berhasil.jenis === "baru" && (
                      <p className="mt-1 text-sm text-slate-500">
                        Isi progres bulanannya di halaman Logbook.
                      </p>
                    )}
                    <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                      {berhasil.jenis === "baru" && (
                        <TombolGradasi besar onClick={() => bukaLogbook(berhasil.nama)}>
                          Buka Logbook {berhasil.nama}
                        </TombolGradasi>
                      )}
                      <button
                        type="button"
                        onClick={reset}
                        className="rounded-full border border-[#9db8e0] px-[18px] py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                      >
                        {berhasil.jenis === "tambahAkt" ? "Tambah aktivitas lagi" : "Tambah periset lain"}
                      </button>
                      <button
                        type="button"
                        onClick={tutupForm}
                        className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-[#f5f8fd]"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => void simpan(e)} noValidate>
                    {/* ── 1. Identitas periset (diisi sekali) ── */}
                    {perisetTujuan ? (
                      <div className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 text-sm sm:px-6">
                        <p className="text-xs font-medium text-slate-500">Periset</p>
                        <p className="font-extrabold [overflow-wrap:anywhere]">{perisetTujuan.nama}</p>
                        <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">
                          {perisetTujuan.unitKerja || "Tanpa unit kerja"}
                        </p>
                      </div>
                    ) : (
                      <Seksi n={1} judul="Identitas periset">
                        <Field label="Nama ketua tim" id="nama" wajib galat={tampilIden("nama")}>
                          <input
                            id="nama"
                            value={iden.nama}
                            onChange={(e) => ubahIden("nama", e.target.value)}
                            placeholder="mis. Dr. Nama Lengkap, M.Si."
                            className={kelasInput(tampilIden("nama"))}
                          />
                          {tampilIden("nama")?.includes("sudah punya") && (
                            <button
                              type="button"
                              onClick={() => {
                                const ada = tersimpan.find(
                                  (x) => kecil(x.header.namaKetua) === kecil(namaBersih)
                                );
                                if (ada) bukaLogbook(ada.header.namaKetua);
                              }}
                              className="mt-1 text-xs font-bold text-[#1f4e8c] underline"
                            >
                              Buka logbook yang sudah ada
                            </button>
                          )}
                          {STORE_MENDUKUNG_ID && namaBersih && jumlahSudahAda > 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              Periset ini sudah punya {jumlahSudahAda} logbook. Aktivitas di bawah akan ditambahkan.
                            </p>
                          )}
                        </Field>

                        <Field
                          label="Email aktif"
                          id="email"
                          wajib
                          galat={tampilIden("email")}
                          hint="Dipakai untuk menghubungi periset"
                        >
                          <input
                            id="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={iden.email}
                            onChange={(e) => ubahIden("email", e.target.value)}
                            placeholder="nama@brin.go.id"
                            className={kelasInput(tampilIden("email"))}
                          />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Unit kerja" id="unit" wajib galat={tampilIden("unit")}>
                            <select
                              id="unit"
                              value={iden.unit}
                              onChange={(e) => pilihUnit(e.target.value)}
                              className={kelasInput(tampilIden("unit"))}
                            >
                              <option value="">Pilih unit kerja…</option>
                              {UNIT.map((u) => (
                                <option key={u.nama} value={u.nama}>
                                  {u.nama}
                                </option>
                              ))}
                              <option value={LAIN}>Lainnya (isi manual)</option>
                            </select>
                            {iden.unit === LAIN && (
                              <input
                                aria-label="Nama unit kerja"
                                value={iden.unitLain}
                                onChange={(e) => ubahIden("unitLain", e.target.value)}
                                placeholder="Tulis nama unit kerja"
                                className={`${kelasInput(tampilIden("unit"))} mt-2`}
                              />
                            )}
                          </Field>

                          <Field
                            label="Satuan kerja"
                            id="satuan"
                            hint="Terisi otomatis dari unit kerja, boleh diubah"
                          >
                            <input
                              id="satuan"
                              value={iden.satuan}
                              onChange={(e) => ubahIden("satuan", e.target.value)}
                              className={kelasInput()}
                            />
                          </Field>
                        </div>
                      </Seksi>
                    )}

                    {/* ── Aktivitas, output, dan pendanaan (bisa lebih dari satu) ── */}
                    {aktivitas.map((a, i) => (
                      <div key={a.id} className="border-t-4 border-[#eaf0fa]">
                        <div className="flex items-center justify-between gap-3 bg-[#eaf0fa] px-4 py-2.5 sm:px-6">
                          <h3 className="text-sm font-extrabold">
                            Aktivitas {i + 1}
                            {aktivitas.length > 1 && (
                              <span className="font-semibold text-slate-500"> dari {aktivitas.length}</span>
                            )}
                          </h3>
                          {aktivitas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => hapusAkt(a.id)}
                              className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                            >
                              Hapus aktivitas
                            </button>
                          )}
                        </div>

                        <Seksi n={nomorAktivitas} judul="Aktivitas & output">
                          <Field
                            label="Judul aktivitas"
                            id={`judul-${a.id}`}
                            wajib
                            galat={tampilAkt(a.id, "judul")}
                          >
                            <textarea
                              id={`judul-${a.id}`}
                              rows={3}
                              value={a.judul}
                              onChange={(e) => ubahAkt(a.id, { judul: e.target.value })}
                              className={kelasInput(tampilAkt(a.id, "judul"))}
                            />
                          </Field>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="Status pelaksanaan"
                              id={`status-${a.id}`}
                              wajib
                              galat={tampilAkt(a.id, "status")}
                            >
                              <select
                                id={`status-${a.id}`}
                                value={a.status}
                                onChange={(e) => ubahAkt(a.id, { status: e.target.value })}
                                className={kelasInput(tampilAkt(a.id, "status"))}
                              >
                                {OPSI_STATUS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </Field>

                            <Field label="Progres total aktivitas (%)" id={`progres-${a.id}`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={a.progres}
                                  onChange={(e) =>
                                    ubahAkt(a.id, { progres: batas(Number(e.target.value), 0, 100) })
                                  }
                                  aria-label={`Progres total aktivitas ${i + 1}`}
                                  className="min-w-0 flex-1 accent-[#1f4e8c]"
                                />
                                <input
                                  id={`progres-${a.id}`}
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={a.progres}
                                  onChange={(e) =>
                                    ubahAkt(a.id, { progres: batas(Number(e.target.value), 0, 100) })
                                  }
                                  className={`${kelasInput()} !w-20 shrink-0 text-center`}
                                />
                              </div>
                            </Field>
                          </div>

                          <Field label="Keterangan progres" id={`ket-${a.id}`} hint="Opsional">
                            <input
                              id={`ket-${a.id}`}
                              value={a.keterangan}
                              onChange={(e) => ubahAkt(a.id, { keterangan: e.target.value })}
                              className={kelasInput()}
                            />
                          </Field>

                          <div>
                            <p className="mb-1 text-[13px] font-bold">
                              Target output<span className="text-[#991b1b]"> *</span>
                            </p>
                            <div className="grid gap-2">
                              {a.targets.map((t, ti) => (
                                <div key={t.id} className="flex items-center gap-2">
                                  <select
                                    aria-label={`Jenis target ${ti + 1} aktivitas ${i + 1}`}
                                    value={t.jenis}
                                    onChange={(e) => ubahTarget(a.id, t.id, { jenis: e.target.value })}
                                    className={`${kelasInput(tampilAkt(a.id, "target"))} min-w-0 flex-1`}
                                  >
                                    <option value="">Pilih jenis output…</option>
                                    {OPSI_JENIS.map((j) => (
                                      <option key={j} value={j}>
                                        {j}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    min={1}
                                    aria-label={`Jumlah target ${ti + 1} aktivitas ${i + 1}`}
                                    value={t.jumlah}
                                    onChange={(e) =>
                                      ubahTarget(a.id, t.id, { jumlah: batas(Number(e.target.value), 1, 999) })
                                    }
                                    className={`${kelasInput()} !w-16 shrink-0 text-center sm:!w-24`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => hapusTarget(a.id, t.id)}
                                    aria-label={`Hapus target ${ti + 1} aktivitas ${i + 1}`}
                                    className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              {tampilAkt(a.id, "target") && (
                                <p role="alert" className="text-xs font-semibold text-[#991b1b]">
                                  {tampilAkt(a.id, "target")}
                                </p>
                              )}
                              <div>
                                <button
                                  type="button"
                                  onClick={() => tambahTarget(a.id)}
                                  className="rounded-full border border-[#9db8e0] px-4 py-1.5 text-xs font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                                >
                                  + Tambah target
                                </button>
                              </div>
                            </div>
                          </div>
                        </Seksi>

                        <Seksi n={nomorAktivitas + 1} judul="Pendanaan">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="Kategori pendanaan"
                              id={`kategori-${a.id}`}
                              wajib
                              galat={tampilAkt(a.id, "kategori")}
                            >
                              <select
                                id={`kategori-${a.id}`}
                                value={a.kategori}
                                onChange={(e) => ubahAkt(a.id, { kategori: e.target.value, kategoriLain: "" })}
                                className={kelasInput(tampilAkt(a.id, "kategori"))}
                              >
                                <option value="">Pilih kategori pendanaan…</option>
                                {OPSI_KATEGORI.map((k) => (
                                  <option key={k} value={k}>
                                    {k}
                                  </option>
                                ))}
                                <option value={LAIN}>Lainnya (isi manual)</option>
                              </select>
                              {a.kategori === LAIN && (
                                <input
                                  aria-label={`Kategori pendanaan lainnya aktivitas ${i + 1}`}
                                  value={a.kategoriLain}
                                  onChange={(e) => ubahAkt(a.id, { kategoriLain: e.target.value })}
                                  placeholder="Tulis kategori pendanaan"
                                  className={`${kelasInput(tampilAkt(a.id, "kategori"))} mt-2`}
                                />
                              )}
                            </Field>

                            <Field
                              label="Skema mitra program"
                              id={`skema-${a.id}`}
                              wajib
                              galat={tampilAkt(a.id, "skema")}
                            >
                              <select
                                id={`skema-${a.id}`}
                                value={a.skema}
                                onChange={(e) => ubahAkt(a.id, { skema: e.target.value, skemaLain: "" })}
                                className={kelasInput(tampilAkt(a.id, "skema"))}
                              >
                                <option value="">Pilih skema mitra program…</option>
                                {OPSI_SKEMA.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                                <option value={LAIN}>Lainnya (isi manual)</option>
                              </select>
                              {a.skema === LAIN && (
                                <input
                                  aria-label={`Skema mitra program lainnya aktivitas ${i + 1}`}
                                  value={a.skemaLain}
                                  onChange={(e) => ubahAkt(a.id, { skemaLain: e.target.value })}
                                  placeholder="Tulis skema mitra program"
                                  className={`${kelasInput(tampilAkt(a.id, "skema"))} mt-2`}
                                />
                              )}
                            </Field>
                          </div>
                        </Seksi>
                      </div>
                    ))}

                    {/* ── Tambah aktivitas ── */}
                    <div className="border-t border-[#dbe6f7] px-4 py-4 sm:px-6">
                      <button
                        type="button"
                        onClick={tambahAkt}
                        className="rounded-full border border-[#9db8e0] px-4 py-2 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                      >
                        + Tambah aktivitas
                      </button>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Satu periset bisa punya beberapa aktivitas dengan sumber pendanaan yang berbeda.
                      </p>
                      {galat.umum && aktivitas.length > 1 && (
                        <p role="alert" className="mt-2 text-xs font-semibold text-[#991b1b]">
                          {galat.umum}
                        </p>
                      )}
                    </div>

                    {pesan && (
                      <p
                        role="alert"
                        className="mx-4 mb-3 rounded-xl bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b] sm:mx-6"
                      >
                        {pesan}
                      </p>
                    )}

                    <div className="flex flex-col gap-3 border-t border-[#dbe6f7] bg-[#f5f8fd] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <span className="text-xs text-slate-500">
                        <span className="text-[#991b1b]">*</span> wajib diisi
                      </span>
                      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={tutupForm}
                          disabled={menyimpan}
                          className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-white disabled:opacity-60"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={reset}
                          disabled={menyimpan}
                          className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-white disabled:opacity-60"
                        >
                          Kosongkan
                        </button>
                        <TombolGradasi besar onClick={() => void simpan()}>
                          {menyimpan
                            ? "Menyimpan…"
                            : perisetTujuan
                              ? "Simpan aktivitas"
                              : "Simpan & buat logbook"}
                        </TombolGradasi>
                      </div>
                    </div>
                  </form>
                )}
              </section>

              {/* ───── Pratinjau ───── */}
              {!berhasil && (
                <aside className="hidden min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)] lg:block">
                  <div className="bg-[#1f4e8c] px-5 py-3 text-sm font-bold text-white">
                    Pratinjau
                  </div>
                  <dl className="grid gap-3 border-b border-[#e5edf8] px-5 py-4 text-sm">
                    {(
                      [
                        ["Nama ketua", namaPratinjau || "–"],
                        ...(perisetTujuan ? [] : [["Email aktif", emailBersih || "–"]]),
                        ["Unit kerja", unitPratinjau || "–"],
                      ] as string[][]
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs font-medium text-slate-500">{k}</dt>
                        <dd className="font-semibold [overflow-wrap:anywhere]">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {aktivitas.map((a, i) => (
                    <dl key={a.id} className="grid gap-3 border-b border-[#e5edf8] px-5 py-4 text-sm last:border-b-0">
                      <dt className="text-xs font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                        Aktivitas {i + 1}
                      </dt>
                      {[
                        ["Judul", a.judul.trim() || "–"],
                        ["Target output", teksTarget(a)],
                        ["Status", a.status || "–"],
                        ["Kategori pendanaan", pilihanAkhir(a.kategori, a.kategoriLain) || "–"],
                        ["Skema mitra program", pilihanAkhir(a.skema, a.skemaLain) || "–"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-xs font-medium text-slate-500">{k}</dt>
                          <dd className="whitespace-pre-line font-semibold [overflow-wrap:anywhere]">{v}</dd>
                        </div>
                      ))}
                      <div>
                        <dt className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                          <span>Progres total</span>
                          <span className="font-bold text-[#1b3560]">{a.progres}%</span>
                        </dt>
                        <dd className="h-2 overflow-hidden rounded-full bg-[#dbe6f7]">
                          <div className="h-full bg-[#1f4e8c]" style={{ width: `${a.progres}%` }} />
                        </dd>
                      </div>
                    </dl>
                  ))}
                </aside>
              )}
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <ImportExcelModal
          opsi={OPSI_EXCEL}
          sudahAda={(nama) => dbList.some((p) => kecil(p.nama) === kecil(nama))}
          onClose={() => setShowImport(false)}
          onSimpan={async (data) => {
            await importPerisetDiDb(data);
            await muatDb();
          }}
        />
      )}

      {modal && (
        <ModalKonfirmasi
          judul={modal.judul}
          menghapus={menghapus}
          galat={galatModal}
          onYa={() => void konfirmasiYa()}
          onBatal={tutupModal}
        >
          {modal.isi}
        </ModalKonfirmasi>
      )}
    </div>
  );
}