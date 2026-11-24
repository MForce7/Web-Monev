import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import TombolGradasi from "../importjson/TombolGradasi";
import { BULAN } from "../../lib/LogbookData";
import { daftarLogbook, simpanLogbook } from "../../lib/logbookStore";
import type { AktivitasPayload } from "../../lib/excelPeriset";
import type { EntriLogbook } from "../../lib/validasiLogbook";
import { emptyMonth, type HeaderData } from "../../types/monev";
import {
  OPSI_KATEGORI,
  UNIT,
  LAIN,
  POLA_EMAIL,
  kecil,
  pilihanAkhir,
  IDENTITAS_AWAL,
  tambahAktivitasDiDb,
  buatPerisetDiDb,
  parseGalatServer,
  type Identitas,
  type Target,
  type Aktivitas,
  type ModeForm,
  type GalatServer,
} from "./shared";
import { IdentitasFields } from "./IdentitasFields";
import { AktivitasCard } from "./AktivitasCard";
import { PratinjauPanel } from "./PratinjauPanel";

type FormPeristModalProps = {
  mode: ModeForm;
  onClose: () => void;
  /** Dipanggil setelah periset baru berhasil disimpan ke browser */
  onSavedBaru: () => void;
  /** Dipanggil setelah aktivitas baru berhasil ditambahkan ke periset di database */
  onSavedTambahAkt: () => Promise<void> | void;
};

export function FormPeristModal({ mode, onClose, onSavedBaru, onSavedTambahAkt }: FormPeristModalProps) {
  const hitung = useRef(1);
  const idBaru = () => hitung.current++;
  const aktivitasBaru = (): Aktivitas => ({
    id: idBaru(),
    judul: "",
    status: "",
    progres: 0,
    keterangan: "",
    targets: [{ id: idBaru(), jenis: "", jumlah: 1 }],
    kategori: "",
    kategoriLain: "",
    unitPengampuDifa: "",
    programSkemaPendanaan: "",
  });

  const [iden, setIden] = useState<Identitas>(IDENTITAS_AWAL);
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>(() => [aktivitasBaru()]);
  const [dicoba, setDicoba] = useState(false);
  const [pesan, setPesan] = useState("");
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [berhasil, setBerhasil] = useState<{ nama: string; jumlah: number; jenis: ModeForm["jenis"] } | null>(null);

  const perisetTujuan = mode.jenis === "tambahAkt" ? mode.periset : null;
  const modeBaru = !perisetTujuan;

  const tersimpan = useMemo(() => daftarLogbook(), []);

  useEffect(() => {
    const lama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = lama;
    };
  }, []);

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

  /* ----- validasi klien ----- */

  const galat = useMemo(() => {
    const ident: Record<string, string> = {};
    if (modeBaru) {
      if (!namaBersih) ident.nama = "Nama ketua tim wajib diisi";
      if (!emailBersih) {
        ident.email = "Email aktif wajib diisi";
      } else if (!POLA_EMAIL.test(emailBersih)) {
        ident.email = "Format email belum benar";
      }
      if (!iden.password) {
        ident.password = "Password wajib diisi";
      } else if (iden.password.length < 8) {
        ident.password = "Password minimal 8 karakter";
      }
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

      if (!OPSI_KATEGORI.includes(a.kategori as any)) {
        e.kategori = "Kategori pendanaan wajib dipilih";
      }

      if (!a.unitPengampuDifa) {
        e.skema = "Pilih unit pengampu DIFA";
      } else if (!a.programSkemaPendanaan) {
        e.skema = "Pilih program/skema pendanaan";
      }

      akt[a.id] = e;
    }

    const umum =
      modeBaru && aktivitas.length > 1
        ? "Penyimpanan browser saat ini hanya bisa menampung satu logbook per nama ketua. Hapus aktivitas tambahan, atau simpan satu aktivitas dulu."
        : "";

    const jumlah =
      Object.keys(ident).length +
      Object.values(akt).reduce((n, e) => n + Object.keys(e).length, 0) +
      (umum ? 1 : 0);
    return { ident, akt, umum, jumlah };
  }, [modeBaru, namaBersih, emailBersih, unitFinal, jumlahSudahAda, aktivitas]);

  /** Error identitas: validasi klien digabung dengan error server (kalau ada & memang untuk field ini) */
  const tampilIden = (k: string) => {
    if (galatServer && galatServer.aktivitasKe === null && galatServer.field === k) {
      return galatServer.pesan;
    }
    return dicoba || (k === "nama" && namaBersih) ? galat.ident[k] : undefined;
  };

  /** Error per-aktivitas: validasi klien digabung dengan error server untuk aktivitas & field yang sama */
  const tampilAkt = (id: number, k: string) => {
    const idx = aktivitas.findIndex((x) => x.id === id);
    if (galatServer && galatServer.aktivitasKe === idx + 1 && galatServer.field === k) {
      return galatServer.pesan;
    }
    return dicoba ? galat.akt[id]?.[k] : undefined;
  };

  /* ----- aksi ----- */

  const reset = () => {
    setIden(IDENTITAS_AWAL);
    setAktivitas([aktivitasBaru()]);
    setDicoba(false);
    setPesan("");
    setGalatServer(null);
    setBerhasil(null);
  };

  const tutupForm = () => {
    if (menyimpan) return;
    onClose();
  };

  /** Ubah error mentah dari server jadi pesan yang jelas: aktivitas keberapa, field apa */
  const tampilkanGalatServer = (pesanMentah: string) => {
    const parsed = parseGalatServer(pesanMentah);
    setGalatServer(parsed);
    setDicoba(true); // supaya galat di-highlight juga kalau belum pernah submit
    setPesan(
      parsed.aktivitasKe
        ? `Aktivitas ${parsed.aktivitasKe}: ${pesanMentah}`
        : pesanMentah
    );
  };

  const simpan = async (e?: FormEvent) => {
    e?.preventDefault();
    if (menyimpan) return;
    setDicoba(true);
    setPesan("");
    setGalatServer(null);
    if (galat.jumlah) return;

    const payload: AktivitasPayload[] = aktivitas.map((a) => ({
      judul: a.judul.trim(),
      status: a.status,
      progres: a.progres,
      keterangan: a.keterangan.trim(),
      targetOutputs: a.targets.map(({ jenis, jumlah }) => ({ jenis, jumlah })),
      kategoriPendanaan: a.kategori,
      unitPengampuDifa: a.unitPengampuDifa,
      programSkemaPendanaan: a.programSkemaPendanaan,
    }));

    // ── Tambah aktivitas ke periset yang sudah ada di database ──
    if (perisetTujuan) {
      setMenyimpan(true);
      try {
        await tambahAktivitasDiDb(perisetTujuan.id, payload);
        setBerhasil({ nama: perisetTujuan.nama, jumlah: payload.length, jenis: "tambahAkt" });
        await onSavedTambahAkt();
      } catch (err) {
        tampilkanGalatServer(
          err instanceof Error ? err.message : "Gagal menambahkan aktivitas ke database."
        );
      } finally {
        setMenyimpan(false);
      }
      return;
    }

    // ── Periset baru: buat akun Supabase Auth + profil + aktivitas ──
    setMenyimpan(true);
    try {
      await buatPerisetDiDb(iden, payload);
      setBerhasil({ nama: namaBersih, jumlah: payload.length, jenis: "baru" });
      onSavedBaru();
    } catch (err) {
      tampilkanGalatServer(
        err instanceof Error ? err.message : "Gagal menyimpan periset ke database."
      );
    } finally {
      setMenyimpan(false);
    }
  };

  const teksTarget = (a: Aktivitas) =>
    a.targets
      .filter((t) => t.jenis)
      .map((t) => `${t.jumlah} ${t.jenis}`)
      .join(", ") || "–";

  const nomorAktivitas = modeBaru ? 2 : 1;
  const namaPratinjau = perisetTujuan ? perisetTujuan.nama : namaBersih;
  const unitPratinjau = perisetTujuan ? perisetTujuan.unitKerja : unitFinal;

  return (
    <div className="fixed inset-0 z-90 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-form"
        className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-[#f2f5fa] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#dbe6f7] bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="judul-form" className="text-lg font-extrabold sm:text-xl wrap-anywhere">
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
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#166534" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                </div>
                <p className="text-lg font-extrabold wrap-anywhere">
                  {berhasil.jenis === "tambahAkt"
                    ? `${berhasil.jumlah} aktivitas ditambahkan ke ${berhasil.nama}`
                    : berhasil.jumlah > 1
                      ? `${berhasil.jumlah} logbook ${berhasil.nama} sudah dibuat`
                      : `Logbook ${berhasil.nama} sudah dibuat`}
                </p>
                {berhasil.jenis === "baru" && (
                  <p className="mt-1 text-sm text-slate-500">
                    Akun periset sudah dibuat. Periset dapat login menggunakan email
                    dan password yang telah didaftarkan.
                  </p>
                )}
                <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  {/* {berhasil.jenis === "baru" && (
                    <TombolGradasi besar onClick={() => bukaLogbook(berhasil.nama)}>
                      Buka Logbook {berhasil.nama}
                    </TombolGradasi>
                  )} */}
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full border border-[#9db8e0] px-4.5 py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                  >
                    {berhasil.jenis === "tambahAkt" ? "Tambah aktivitas lagi" : "Tambah periset lain"}
                  </button>
                  <button
                    type="button"
                    onClick={tutupForm}
                    className="rounded-full px-4.5 py-2.5 text-[13px] font-bold hover:bg-[#f5f8fd]"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void simpan(e)} noValidate>
                {perisetTujuan ? (
                  <div className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 text-sm sm:px-6">
                    <p className="text-xs font-medium text-slate-500">Periset</p>
                    <p className="font-extrabold wrap-anywhere">{perisetTujuan.nama}</p>
                    <p className="text-xs text-slate-500 wrap-anywhere">
                      {perisetTujuan.unitKerja || "Tanpa unit kerja"}
                    </p>
                  </div>
                ) : (
                  <IdentitasFields
                    iden={iden}
                    ubahIden={ubahIden}
                    pilihUnit={pilihUnit}
                    tampilIden={tampilIden}
                  />
                )}

                {aktivitas.map((a, i) => (
                  <AktivitasCard
                    key={a.id}
                    a={a}
                    index={i}
                    total={aktivitas.length}
                    nomorAktivitas={nomorAktivitas}
                    tampilAkt={tampilAkt}
                    ubahAkt={ubahAkt}
                    hapusAkt={hapusAkt}
                    ubahTarget={ubahTarget}
                    tambahTarget={tambahTarget}
                    hapusTarget={hapusTarget}
                    disorotServer={galatServer?.aktivitasKe === i + 1}
                  />
                ))}

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
                  <p role="alert" className="mx-4 mb-3 rounded-xl bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b] sm:mx-6">
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
                      className="rounded-full px-4.5 py-2.5 text-[13px] font-bold hover:bg-white disabled:opacity-60"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      disabled={menyimpan}
                      className="rounded-full px-4.5 py-2.5 text-[13px] font-bold hover:bg-white disabled:opacity-60"
                    >
                      Kosongkan
                    </button>
                    <TombolGradasi besar onClick={() => void simpan()}>
                      {menyimpan ? "Menyimpan…" : perisetTujuan ? "Simpan aktivitas" : "Simpan & buat logbook"}
                    </TombolGradasi>
                  </div>
                </div>
              </form>
            )}
          </section>

          {!berhasil && (
            <PratinjauPanel
              perisetTujuan={perisetTujuan}
              namaPratinjau={namaPratinjau}
              emailBersih={emailBersih}
              unitPratinjau={unitPratinjau}
              aktivitas={aktivitas}
              teksTarget={teksTarget}
            />
          )}
        </div>
      </div>
    </div>
  );
}