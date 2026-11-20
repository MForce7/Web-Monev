import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import TombolGradasi from "../importjson/TombolGradasi";
import { Field } from "./Field";
import { Seksi } from "./Seksi";
import { BULAN } from "../../lib/LogbookData";
import { ambilLogbookAktif, daftarLogbook, simpanLogbook } from "../../lib/logbookStore";
import type { AktivitasPayload } from "../../lib/excelPeriset";
import type { EntriLogbook } from "../../lib/validasiLogbook";
import { emptyMonth, type HeaderData } from "../../types/monev";
import {
  OPSI_JENIS,
  OPSI_STATUS,
  OPSI_KATEGORI,
  OPSI_SKEMA,
  UNIT,
  LAIN,
  POLA_EMAIL,
  kecil,
  batas,
  pilihanAkhir,
  kelasInput,
  IDENTITAS_AWAL,
  bukaLogbook,
  buatPerisetDiDb,
  tambahAktivitasDiDb,
  type Identitas,
  type Target,
  type Aktivitas,
  type ModeForm,
} from "./shared";

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
  const [menyimpan, setMenyimpan] = useState(false);
  const [berhasil, setBerhasil] = useState<{ nama: string; jumlah: number; jenis: ModeForm["jenis"] } | null>(null);

  const perisetTujuan = mode.jenis === "tambahAkt" ? mode.periset : null;
  const modeBaru = !perisetTujuan;

  // Diambil sekali saat modal dibuka, cukup untuk cek duplikat nama selama form ini terbuka
  const tersimpan = useMemo(() => daftarLogbook(), []);

  // Kunci scroll halaman selagi form pop up terbuka
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

  /* ----- validasi ----- */

  const galat = useMemo(() => {
    const ident: Record<string, string> = {};
    if (modeBaru) {
      if (!namaBersih) {
        ident.nama = "Nama ketua tim wajib diisi";
      }

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

      if (!unitFinal) {
        ident.unit = "Unit kerja wajib diisi";
      }
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
      // modeBaru && !STORE_MENDUKUNG_ID && aktivitas.length > 1
      modeBaru && aktivitas.length > 1
        ? "Penyimpanan browser saat ini hanya bisa menampung satu logbook per nama ketua. Hapus aktivitas tambahan, atau simpan satu aktivitas dulu."
        : "";

    const jumlah =
      Object.keys(ident).length +
      Object.values(akt).reduce((n, e) => n + Object.keys(e).length, 0) +
      (umum ? 1 : 0);
    return { ident, akt, umum, jumlah };
  }, [modeBaru, namaBersih, emailBersih, unitFinal, jumlahSudahAda, aktivitas]);

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

  const tutupForm = () => {
    if (menyimpan) return;
    onClose();
  };

  const simpan = async (e?: FormEvent) => {
    e?.preventDefault();
    if (menyimpan) return;
    setDicoba(true);
    setPesan("");
    if (galat.jumlah) return;

    // ── Tambah aktivitas ke periset yang sudah ada di database ──
    if (perisetTujuan) {
      // ── Periset baru: buat akun Supabase Auth + profil + aktivitas ──

    setMenyimpan(true);

    try {
      const payload: AktivitasPayload[] = aktivitas.map((a) => ({
        judul: a.judul.trim(),
        status: a.status,
        progres: a.progres,
        keterangan: a.keterangan.trim(),
        targetOutputs: a.targets.map(({ jenis, jumlah }) => ({
          jenis,
          jumlah,
        })),
        kategoriPendanaan: a.kategori,
        skemaMitraProgram: a.skema,
      }));

      await buatPerisetDiDb(iden, payload);

      setBerhasil({
        nama: namaBersih,
        jumlah: payload.length,
        jenis: "baru",
      });

      onSavedBaru();
    } catch (err) {
      setPesan(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan periset ke database."
      );
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
        // ...(STORE_MENDUKUNG_ID ? { idAktivitas: `${waktu}-${a.id}` } : {}),
      } as unknown as HeaderData,
      bulanan: BULAN.map((b) => emptyMonth(b)) as EntriLogbook["bulanan"],
      catatanImport: [],
    }));

    if (!simpanLogbook([...daftarLogbook(), ...entriBaru], namaBersih)) {
      setPesan("Gagal menyimpan: penyimpanan browser penuh atau diblokir.");
      return;
    }
    setBerhasil({ nama: namaBersih, jumlah: entriBaru.length, jenis: "baru" });
    onSavedBaru();
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
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#166534" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                    Akun periset sudah dibuat. Periset dapat login menggunakan email
                    dan password yang telah didaftarkan.
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
                            const ada = tersimpan.find((x) => kecil(x.header.namaKetua) === kecil(namaBersih));
                            if (ada) bukaLogbook(ada.header.namaKetua);
                          }}
                          className="mt-1 text-xs font-bold text-[#1f4e8c] underline"
                        >
                          Buka logbook yang sudah ada
                        </button>
                      )}
                      {namaBersih && jumlahSudahAda > 0 && (
                      // {STORE_MENDUKUNG_ID && namaBersih && jumlahSudahAda > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          Periset ini sudah punya {jumlahSudahAda} logbook. Aktivitas di bawah akan ditambahkan.
                        </p>
                      )}
                    </Field>

                    <Field label="Email aktif" id="email" wajib galat={tampilIden("email")} hint="Dipakai untuk menghubungi periset">
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
                    <Field
                      label="Password akun periset"
                      id="password"
                      wajib
                      galat={tampilIden("password")}
                      hint="Minimal 8 karakter. Password ini digunakan untuk login ke aplikasi."
                    >
                      <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={iden.password}
                        onChange={(e) => ubahIden("password", e.target.value)}
                        placeholder="Masukkan password"
                        minLength={8}
                        className={kelasInput(tampilIden("password"))}
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
                            <option key={u.nama} value={u.nama}>{u.nama}</option>
                          ))}
                    
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

                      <Field label="Satuan kerja" id="satuan" hint="Terisi otomatis dari unit kerja, boleh diubah">
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
                      <Field label="Judul aktivitas" id={`judul-${a.id}`} wajib galat={tampilAkt(a.id, "judul")}>
                        <textarea
                          id={`judul-${a.id}`}
                          rows={3}
                          value={a.judul}
                          onChange={(e) => ubahAkt(a.id, { judul: e.target.value })}
                          className={kelasInput(tampilAkt(a.id, "judul"))}
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Status pelaksanaan" id={`status-${a.id}`} wajib galat={tampilAkt(a.id, "status")}>
                          <select
                            id={`status-${a.id}`}
                            value={a.status}
                            onChange={(e) => ubahAkt(a.id, { status: e.target.value })}
                            className={kelasInput(tampilAkt(a.id, "status"))}
                          >
                            {OPSI_STATUS.map((s) => (
                              <option key={s} value={s}>{s}</option>
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
                              onChange={(e) => ubahAkt(a.id, { progres: batas(Number(e.target.value), 0, 100) })}
                              aria-label={`Progres total aktivitas ${i + 1}`}
                              className="min-w-0 flex-1 accent-[#1f4e8c]"
                            />
                            <input
                              id={`progres-${a.id}`}
                              type="number"
                              min={0}
                              max={100}
                              value={a.progres}
                              onChange={(e) => ubahAkt(a.id, { progres: batas(Number(e.target.value), 0, 100) })}
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
                                  <option key={j} value={j}>{j}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min={1}
                                aria-label={`Jumlah target ${ti + 1} aktivitas ${i + 1}`}
                                value={t.jumlah}
                                onChange={(e) => ubahTarget(a.id, t.id, { jumlah: batas(Number(e.target.value), 1, 999) })}
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
                            onChange={(e) =>
                              ubahAkt(a.id, {
                                kategori: e.target.value,
                                kategoriLain: "",
                              })
                            }
                            className={kelasInput(tampilAkt(a.id, "kategori"))}
                          >
                            <option value="">Pilih kategori pendanaan…</option>

                            {OPSI_KATEGORI.map((kategori) => (
                              <option key={kategori} value={kategori}>
                                {kategori}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Skema mitra program" id={`skema-${a.id}`} wajib galat={tampilAkt(a.id, "skema")}>
                          <select
                            id={`skema-${a.id}`}
                            value={a.skema}
                            onChange={(e) => ubahAkt(a.id, { skema: e.target.value, skemaLain: "" })}
                            className={kelasInput(tampilAkt(a.id, "skema"))}
                          >
                            <option value="">Pilih skema mitra program…</option>
                            {OPSI_SKEMA.map((s) => (
                              <option key={s} value={s}>{s}</option>
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
                      {menyimpan ? "Menyimpan…" : perisetTujuan ? "Simpan aktivitas" : "Simpan & buat logbook"}
                    </TombolGradasi>
                  </div>
                </div>
              </form>
            )}
          </section>

          {!berhasil && (
            <aside className="hidden min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)] lg:block">
              <div className="bg-[#1f4e8c] px-5 py-3 text-sm font-bold text-white">Pratinjau</div>
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
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-[#1f4e8c]">Aktivitas {i + 1}</dt>
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
  );
}