import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

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
   SATU logbook per nama ketua, jadi form menolak lebih dari satu aktivitas agar data tidak saling menimpa. */
const STORE_MENDUKUNG_ID = false;

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

/** Yang sedang menunggu konfirmasi hapus */
type TargetHapus =
  | { sumber: "browser"; nama: string; jumlah: number }
  | { sumber: "db"; tipe: "periset"; nama: string; aktivitas: { id: string; judul: string }[] }
  | { sumber: "db"; tipe: "aktivitas"; id: string; judul: string; nama: string };

const IDENTITAS_AWAL: Identitas = { nama: "", email: "", unit: "", unitLain: "", satuan: "" };

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

  const [dicoba, setDicoba] = useState(false);
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState<{ nama: string; jumlah: number } | null>(null);
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

  // `versi` sengaja jadi pemicu muat ulang daftar setelah menyimpan / menghapus
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tersimpan = useMemo(() => daftarLogbook(), [versi]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const aktifNama = useMemo(() => ambilLogbookAktif()?.header.namaKetua ?? "", [versi]);

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
    if (!namaBersih) ident.nama = "Nama ketua tim wajib diisi";
    else if (!STORE_MENDUKUNG_ID && jumlahSudahAda > 0) {
      ident.nama = "Periset dengan nama ini sudah punya logbook";
    }
    if (!emailBersih) ident.email = "Email aktif wajib diisi";
    else if (!POLA_EMAIL.test(emailBersih)) ident.email = "Format email belum benar, mis. nama@brin.go.id";
    if (!unitFinal) ident.unit = "Unit kerja wajib diisi";

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
      !STORE_MENDUKUNG_ID && aktivitas.length > 1
        ? "Penyimpanan browser saat ini hanya bisa menampung satu logbook per nama ketua. Hapus aktivitas tambahan, atau simpan satu aktivitas dulu."
        : "";

    const jumlah =
      Object.keys(ident).length +
      Object.values(akt).reduce((n, e) => n + Object.keys(e).length, 0) +
      (umum ? 1 : 0);
    return { ident, akt, umum, jumlah };
  }, [namaBersih, emailBersih, unitFinal, jumlahSudahAda, aktivitas]);

  /** Galat nama (duplikat) langsung tampil; yang lain setelah mencoba simpan */
  const tampilIden = (k: string) =>
    dicoba || (k === "nama" && namaBersih) ? galat.ident[k] : undefined;
  const tampilAkt = (id: number, k: string) => (dicoba ? galat.akt[id]?.[k] : undefined);

  /* ----- aksi ----- */

  const simpan = (e?: FormEvent) => {
    e?.preventDefault();
    setDicoba(true);
    setPesan("");
    if (galat.jumlah) return;

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
    setBerhasil({ nama: namaBersih, jumlah: entriBaru.length });
    setVersi((v) => v + 1);
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

  const reset = () => {
    setIden(IDENTITAS_AWAL);
    setAktivitas([aktivitasBaru()]);
    setDicoba(false);
    setPesan("");
    setBerhasil(null);
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

  /** Isi pop-up sesuai apa yang akan dihapus */
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f5fa] pt-20 font-sans text-[#1b3560] sm:pt-24">
      <main className="min-w-0">
        <div
          className="flex min-h-[56px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-base font-bold text-white shadow-[0_6px_14px_rgba(0,0,0,0.12)] sm:min-h-[66px] sm:px-9 sm:text-xl"
          style={{ background: "linear-gradient(90deg, #f0283c 0%, #ff5a6a 100%)" }}
        >
          <span>ORPA</span>
          <span aria-hidden="true" className="hidden h-[26px] w-px bg-white/60 sm:block" />
          <span className="min-w-0 sm:truncate">Badan Riset dan Inovasi Nasional</span>
        </div>

        <div className="grid items-start gap-4 px-3 py-4 sm:gap-5 sm:px-9 sm:py-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ───── Kolom kiri: form / hasil ───── */}
          <section className="min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
            <div className="border-b border-[#dbe6f7] px-4 py-4 sm:px-6">
              <h2 className="text-lg font-extrabold sm:text-xl">Form Periset</h2>
              <p className="text-[13px] text-slate-500">
                Isi data periset dan aktivitasnya. Setelah disimpan, periset ini langsung punya
                logbook baru dengan 12 bulan yang masih kosong.
              </p>
            </div>

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
                  {berhasil.jumlah > 1
                    ? `${berhasil.jumlah} logbook ${berhasil.nama} sudah dibuat`
                    : `Logbook ${berhasil.nama} sudah dibuat`}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Isi progres bulanannya di halaman Logbook.
                </p>
                <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <TombolGradasi besar onClick={() => bukaLogbook(berhasil.nama)}>
                    Buka Logbook {berhasil.nama}
                  </TombolGradasi>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full border border-[#9db8e0] px-[18px] py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                  >
                    Tambah periset lain
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={simpan} noValidate>
                {/* ── 1. Identitas periset (diisi sekali) ── */}
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

                {/* ── 2 & 3. Aktivitas, output, dan pendanaan (bisa lebih dari satu) ── */}
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

                    <Seksi n={2} judul="Aktivitas & output">
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

                    <Seksi n={3} judul="Pendanaan">
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
                      onClick={reset}
                      className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-white"
                    >
                      Kosongkan
                    </button>
                    <TombolGradasi besar onClick={() => simpan()}>
                      Simpan &amp; buat logbook
                    </TombolGradasi>
                  </div>
                </div>
              </form>
            )}
          </section>

          {/* ───── Kolom kanan: pratinjau & daftar ───── */}
          <aside className="grid min-w-0 gap-4 sm:gap-5">
            {!berhasil && (
              <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
                <div className="bg-[#1f4e8c] px-5 py-3 text-sm font-bold text-white">
                  Pratinjau logbook
                </div>
                <dl className="grid gap-3 border-b border-[#e5edf8] px-5 py-4 text-sm">
                  {[
                    ["Nama ketua", namaBersih || "–"],
                    ["Email aktif", emailBersih || "–"],
                    ["Unit kerja", unitFinal || "–"],
                  ].map(([k, v]) => (
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
              </section>
            )}

            {/* ── Periset terdaftar (database): dikelompokkan per periset, tiap aktivitas bisa dihapus ── */}
            <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
              <div className="flex items-center justify-between gap-2 bg-[#1f4e8c] px-5 py-3 text-sm font-bold text-white">
                <span>Periset terdaftar</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#1b3560]">{dbList.length}</span>
              </div>

              <div className="border-b border-[#e5edf8] px-4 py-3">
                <input
                  type="search"
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  placeholder="Cari nama, unit, atau judul aktivitas…"
                  aria-label="Cari periset"
                  className={kelasInput()}
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
                <p className="px-5 py-4 text-xs text-slate-500">Memuat daftar periset…</p>
              ) : dbTampil.length === 0 ? (
                <p className="px-5 py-4 text-xs text-slate-500">
                  {dbList.length === 0 ? "Belum ada periset di database." : "Tidak ada yang cocok dengan pencarian."}
                </p>
              ) : (
                <ul className="max-h-[480px] divide-y divide-[#e5edf8] overflow-y-auto">
                  {dbTampil.map((p) => (
                    <li key={p.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-extrabold [overflow-wrap:anywhere]">
                            {p.nama || "(tanpa nama)"}
                          </p>
                          <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">
                            {p.unitKerja || "Tanpa unit kerja"} · {p.aktivitas.length} aktivitas
                          </p>
                        </div>
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
                            className="shrink-0 rounded-full border border-[#fecaca] px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                          >
                            Hapus periset
                          </button>
                        )}
                      </div>

                      {p.aktivitas.length === 0 ? (
                        <p className="mt-2 text-xs italic text-slate-400">Belum ada aktivitas.</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {p.aktivitas.map((a) => (
                            <li key={a.id} className="flex items-start gap-2 rounded-lg bg-[#f5f8fd] px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-3 text-[13px] font-semibold [overflow-wrap:anywhere]">
                                  {a.judul || "(tanpa judul)"}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {a.status || "Status belum diisi"} · {a.progres}%
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  bukaModal({ sumber: "db", tipe: "aktivitas", id: a.id, judul: a.judul, nama: p.nama })
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
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Periset tersimpan di browser (logbook yang dibuat lewat form ini) ── */}
            <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
              <div className="flex items-center justify-between bg-[#eaf0fa] px-5 py-3 text-sm font-bold">
                <span>Periset tersimpan</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs">{tersimpan.length}</span>
              </div>
              {tersimpan.length === 0 ? (
                <p className="px-5 py-4 text-xs text-slate-500">
                  Belum ada logbook di browser ini.
                </p>
              ) : (
                <ul className="max-h-[320px] divide-y divide-[#e5edf8] overflow-y-auto">
                  {tersimpan.map((e, i) => {
                    const nama = e.header.namaKetua;
                    const jumlahLogbook = tersimpan.filter((x) => kecil(x.header.namaKetua) === kecil(nama)).length;
                    return (
                      <li key={`${nama}-${i}`} className="flex items-center gap-1 px-5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold">{nama}</p>
                          <p className="truncate text-xs text-slate-500">
                            {e.header.unitKerja || "Tanpa unit kerja"}
                            {kecil(nama) === kecil(aktifNama) && (
                              <span className="ml-1.5 font-bold text-[#166534]">· aktif</span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => bukaLogbook(nama)}
                          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-[#1f4e8c] hover:bg-[#eaf0fa]"
                        >
                          Buka
                        </button>
                        <button
                          type="button"
                          onClick={() => bukaModal({ sumber: "browser", nama, jumlah: jumlahLogbook })}
                          aria-label={`Hapus periset ${nama} dari browser`}
                          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                        >
                          Hapus
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </main>

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