
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import TombolGradasi from "../importjson/TombolGradasi";

import type {
  AktivitasPayload,
} from "../../lib/excelPeriset";

import {
  OPSI_KATEGORI,
  UNIT,
  LAIN,
  POLA_EMAIL,
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
  onSavedBaru: () => void;
  onSavedTambahAkt: () => Promise<void> | void;
};

/**
 * Aktivitas dianggap mulai diisi jika pengguna
 * mengisi salah satu field aktivitas.
 *
 * Tahun default tidak dihitung sebagai isian.
 */
function aktivitasSudahDiisi(a: Aktivitas): boolean {
  return Boolean(
    a.judul.trim() ||
    a.status ||
    a.progres !== 0 ||
    a.keterangan.trim() ||
    a.targets.some((t) => t.jenis.trim()) ||
    a.kategori ||
    a.kategoriLain.trim() ||
    a.unitPengampuDifa ||
    a.programSkemaPendanaan
  );
}

export function FormPeristModal({
  mode,
  onClose,
  onSavedBaru,
  onSavedTambahAkt,
}: FormPeristModalProps) {
  const hitung = useRef(3);

  const idBaru = () => hitung.current++;

  const buatAktivitas = (id: number): Aktivitas => ({
    id,
    judul: "",
    tahunPelaksanaan: new Date().getFullYear(),
    status: "",
    progres: 0,
    keterangan: "",
    targets: [
      {
        id: id + 1,
        jenis: "",
        jumlah: 1,
      },
    ],
    kategori: "",
    kategoriLain: "",
    unitPengampuDifa: "",
    programSkemaPendanaan: "",
  });

  const aktivitasBaru = (): Aktivitas => {
    const id = hitung.current;
    hitung.current += 2;
    return buatAktivitas(id);
  };

  const [iden, setIden] = useState<Identitas>(
    IDENTITAS_AWAL
  );

  const [aktivitas, setAktivitas] = useState<
    Aktivitas[]
  >(() => [buatAktivitas(1)]);

  const [dicoba, setDicoba] = useState(false);
  const [pesan, setPesan] = useState("");

  const [galatServer, setGalatServer] =
    useState<GalatServer | null>(null);

  const [menyimpan, setMenyimpan] = useState(false);

  const [berhasil, setBerhasil] = useState<{
    nama: string;
    jumlah: number;
    jenis: ModeForm["jenis"];
  } | null>(null);

  const perisetTujuan =
    mode.jenis === "tambahAkt"
      ? mode.periset
      : null;

  const modeBaru = !perisetTujuan;

  /* ───────── Scroll Modal ───────── */

  useEffect(() => {
    const lama = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = lama;
    };
  }, []);

  /* ───────── Identitas ───────── */

  const ubahIden = <K extends keyof Identitas>(
    k: K,
    v: Identitas[K]
  ) => {
    setIden((p) => ({
      ...p,
      [k]: v,
    }));
  };

  const pilihUnit = (v: string) => {
    setIden((p) => ({
      ...p,
      unit: v,
      unitLain: "",
      satuan:
        UNIT.find((u) => u.nama === v)
          ?.satuanKerja ?? "",
    }));
  };

  const unitFinal =
    iden.unit === LAIN
      ? iden.unitLain.trim()
      : iden.unit.trim();

  const namaBersih = iden.nama.trim();
  const emailBersih = iden.email.trim();

  /* ───────── Aktivitas ───────── */

  const ubahAkt = (
    id: number,
    patch: Partial<Aktivitas>
  ) => {
    setAktivitas((p) =>
      p.map((a) =>
        a.id === id
          ? { ...a, ...patch }
          : a
      )
    );
  };

  const tambahAkt = () => {
    setAktivitas((p) => [
      ...p,
      aktivitasBaru(),
    ]);
  };

  const hapusAkt = (id: number) => {
    setAktivitas((p) =>
      p.length > 1
        ? p.filter((a) => a.id !== id)
        : p
    );
  };

  const ubahTarget = (
    aid: number,
    tid: number,
    patch: Partial<Target>
  ) => {
    setAktivitas((p) =>
      p.map((a) =>
        a.id === aid
          ? {
              ...a,
              targets: a.targets.map((t) =>
                t.id === tid
                  ? { ...t, ...patch }
                  : t
              ),
            }
          : a
      )
    );
  };

  const tambahTarget = (aid: number) => {
    setAktivitas((p) =>
      p.map((a) =>
        a.id === aid
          ? {
              ...a,
              targets: [
                ...a.targets,
                {
                  id: idBaru(),
                  jenis: "",
                  jumlah: 1,
                },
              ],
            }
          : a
      )
    );
  };

  const hapusTarget = (
    aid: number,
    tid: number
  ) => {
    setAktivitas((p) =>
      p.map((a) =>
        a.id === aid
          ? {
              ...a,
              targets: a.targets.filter(
                (t) => t.id !== tid
              ),
            }
          : a
      )
    );
  };

  /**
   * Hanya aktivitas yang benar-benar diisi
   * yang akan divalidasi dan dikirim ke server.
   */
  const aktivitasTerisi = useMemo(
    () => aktivitas.filter(aktivitasSudahDiisi),
    [aktivitas]
  );

  /* ───────── Validasi ───────── */

  const galat = useMemo(() => {
    const ident: Record<string, string> = {};

    if (modeBaru) {
      if (!namaBersih) {
        ident.nama = "Nama ketua tim wajib diisi";
      }

      if (
        iden.nip.trim() &&
        !/^\d{18}$/.test(iden.nip.trim())
      ) {
        ident.nip =
          "NIP harus terdiri dari 18 digit angka";
      }

      if (!emailBersih) {
        ident.email = "Email aktif wajib diisi";
      } else if (!POLA_EMAIL.test(emailBersih)) {
        ident.email = "Format email belum benar";
      }

      if (!iden.password) {
        ident.password = "Password wajib diisi";
      } else if (iden.password.length < 8) {
        ident.password =
          "Password minimal 8 karakter";
      }

      if (!unitFinal) {
        ident.unit = "Unit kerja wajib diisi";
      }
    }

    const akt: Record<
      number,
      Record<string, string>
    > = {};

    /*
     * Mode tambah aktivitas:
     * minimal harus ada satu aktivitas yang diisi.
     */
    if (
      perisetTujuan &&
      aktivitasTerisi.length === 0
    ) {
      akt[aktivitas[0]?.id ?? 0] = {
        judul:
          "Isi minimal satu aktivitas yang akan ditambahkan",
      };
    }

    /*
     * Validasi hanya dilakukan untuk aktivitas
     * yang sudah mulai diisi.
     */
    for (const a of aktivitasTerisi) {
      const e: Record<string, string> = {};

      if (!a.judul.trim()) {
        e.judul = "Judul aktivitas wajib diisi";
      }

      if (
        !Number.isInteger(
          Number(a.tahunPelaksanaan)
        ) ||
        Number(a.tahunPelaksanaan) < 2000 ||
        Number(a.tahunPelaksanaan) > 2100
      ) {
        e.tahunPelaksanaan =
          "Tahun pelaksanaan harus antara 2000–2100";
      }

      if (!a.status) {
        e.status =
          "Pilih status pelaksanaan";
      }

      if (a.targets.length === 0) {
        e.target =
          "Tambahkan minimal satu target output";
      } else if (
        a.targets.some((t) => !t.jenis)
      ) {
        e.target =
          "Pilih jenis untuk setiap target";
      } else if (
        new Set(
          a.targets.map((t) => t.jenis)
        ).size !== a.targets.length
      ) {
        e.target =
          "Satu jenis hanya boleh muncul sekali, gabungkan jumlahnya";
      } else if (
        a.targets.some(
          (t) =>
            !Number.isInteger(Number(t.jumlah)) ||
            Number(t.jumlah) < 1
        )
      ) {
        e.target =
          "Jumlah target minimal 1";
      }

      if (
        !OPSI_KATEGORI.includes(
          a.kategori as never
        )
      ) {
        e.kategori =
          "Kategori pendanaan wajib dipilih";
      }

      if (!a.unitPengampuDifa) {
        e.skema =
          "Pilih unit pengampu DIFA";
      } else if (!a.programSkemaPendanaan) {
        e.skema =
          "Pilih program/skema pendanaan";
      }

      akt[a.id] = e;
    }

    /*
     * Pembatasan logbook lokal yang sudah ada
     * tetap dipertahankan.
     */
    const umum =
      modeBaru && aktivitasTerisi.length > 1
        ? "Penyimpanan browser saat ini hanya bisa menampung satu logbook per nama ketua. Simpan satu aktivitas dulu."
        : "";

    const jumlah =
      Object.keys(ident).length +
      Object.values(akt).reduce(
        (n, e) => n + Object.keys(e).length,
        0
      ) +
      (umum ? 1 : 0);

    return {
      ident,
      akt,
      umum,
      jumlah,
    };
  }, [
    modeBaru,
    perisetTujuan,
    namaBersih,
    emailBersih,
    unitFinal,
    iden,
    aktivitas,
    aktivitasTerisi,
  ]);

  /* ───────── Pesan Error ───────── */

  const tampilIden = (k: string) => {
    if (
      galatServer &&
      galatServer.aktivitasKe === null &&
      galatServer.field === k
    ) {
      return galatServer.pesan;
    }

    return dicoba
      ? galat.ident[k]
      : undefined;
  };

  const tampilAkt = (
    id: number,
    k: string
  ) => {
    const idx = aktivitas.findIndex(
      (x) => x.id === id
    );

    if (
      galatServer &&
      galatServer.aktivitasKe === idx + 1 &&
      galatServer.field === k
    ) {
      return galatServer.pesan;
    }

    return dicoba
      ? galat.akt[id]?.[k]
      : undefined;
  };

  const tampilkanGalatServer = (
    pesanMentah: string
  ) => {
    const parsed = parseGalatServer(
      pesanMentah
    );

    setGalatServer(parsed);
    setDicoba(true);

    setPesan(
      parsed.aktivitasKe
        ? `Aktivitas ${parsed.aktivitasKe}: ${pesanMentah}`
        : pesanMentah
    );
  };

  /* ───────── Reset ───────── */

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

  /* ───────── Payload ───────── */

  const buatPayloadAktivitas =
    (): AktivitasPayload[] =>
      aktivitasTerisi.map((a) => ({
        judul: a.judul.trim(),

        tahunPelaksanaan: Number(
          a.tahunPelaksanaan
        ),

        status: a.status,

        progres: a.progres,

        keterangan: a.keterangan.trim(),

        targetOutputs: a.targets.map(
          ({ jenis, jumlah }) => ({
            jenis,
            jumlah: Number(jumlah),
          })
        ),

        kategoriPendanaan: a.kategori,

        unitPengampuDifa:
          a.unitPengampuDifa,

        programSkemaPendanaan:
          a.programSkemaPendanaan,
      }));

  /* ───────── Simpan ───────── */

  const simpan = async (
    e?: FormEvent
  ) => {
    e?.preventDefault();

    if (menyimpan) return;

    setDicoba(true);
    setPesan("");
    setGalatServer(null);

    if (galat.jumlah > 0) return;

    const payload = buatPayloadAktivitas();

    /* Tambah aktivitas ke periset lama */

    if (perisetTujuan) {
      if (payload.length === 0) {
        setPesan(
          "Isi minimal satu aktivitas sebelum menyimpan."
        );
        return;
      }

      setMenyimpan(true);

      try {
        await tambahAktivitasDiDb(
          perisetTujuan.id,
          payload
        );

        setBerhasil({
          nama: perisetTujuan.nama,
          jumlah: payload.length,
          jenis: "tambahAkt",
        });

        await onSavedTambahAkt();
      } catch (err) {
        tampilkanGalatServer(
          err instanceof Error
            ? err.message
            : "Gagal menambahkan aktivitas ke database."
        );
      } finally {
        setMenyimpan(false);
      }

      return;
    }

    /* Buat akun periset baru */

    setMenyimpan(true);

    try {
      await buatPerisetDiDb(
        iden,
        payload
      );

      setBerhasil({
        nama: namaBersih,
        jumlah: payload.length,
        jenis: "baru",
      });

      onSavedBaru();
    } catch (err) {
      tampilkanGalatServer(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan periset ke database."
      );
    } finally {
      setMenyimpan(false);
    }
  };

  /* ───────── Preview ───────── */

  const teksTarget = (a: Aktivitas) =>
    a.targets
      .filter((t) => t.jenis)
      .map(
        (t) => `${t.jumlah} ${t.jenis}`
      )
      .join(", ") || "–";

  const nomorAktivitas = modeBaru ? 2 : 1;

  const namaPratinjau =
    perisetTujuan
      ? perisetTujuan.nama
      : namaBersih;

  const unitPratinjau =
    perisetTujuan
      ? perisetTujuan.unitKerja
      : unitFinal;

  /* ───────── Tampilan ───────── */

  return (
    <div className="fixed inset-0 z-90 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-form"
        className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-[#f2f5fa] shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}

        <div className="flex items-start justify-between gap-3 border-b border-[#dbe6f7] bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2
              id="judul-form"
              className="text-lg font-extrabold sm:text-xl wrap-anywhere"
            >
              {perisetTujuan
                ? `Tambah aktivitas · ${perisetTujuan.nama}`
                : "Form periset baru"}
            </h2>

            <p className="text-[13px] text-slate-500">
              {perisetTujuan
                ? "Aktivitas baru akan ditambahkan ke periset ini."
                : "Isi identitas periset. Data aktivitas boleh ditambahkan sekarang atau nanti."}
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

        {/* Isi */}

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

                <p className="text-lg font-extrabold wrap-anywhere">
                  {berhasil.jenis === "tambahAkt"
                    ? `${berhasil.jumlah} aktivitas ditambahkan ke ${berhasil.nama}`
                    : berhasil.jumlah > 0
                      ? `Akun dan ${berhasil.jumlah} aktivitas ${berhasil.nama} berhasil dibuat`
                      : `Akun periset ${berhasil.nama} berhasil dibuat`}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {berhasil.jenis === "baru" &&
                    (berhasil.jumlah > 0
                      ? "Periset dapat login menggunakan email dan password yang telah didaftarkan."
                      : "Akun sudah dibuat tanpa aktivitas. Aktivitas dapat ditambahkan melalui menu tambah aktivitas.")}
                </p>

                <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full border border-[#9db8e0] px-4.5 py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                  >
                    {berhasil.jenis === "tambahAkt"
                      ? "Tambah aktivitas lagi"
                      : "Tambah periset lain"}
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
              <form
                onSubmit={(e) => void simpan(e)}
                noValidate
              >
                {/* Identitas */}

                {perisetTujuan ? (
                  <div className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 text-sm sm:px-6">
                    <p className="text-xs font-medium text-slate-500">
                      Periset
                    </p>

                    <p className="font-extrabold wrap-anywhere">
                      {perisetTujuan.nama}
                    </p>

                    <p className="text-xs text-slate-500 wrap-anywhere">
                      {perisetTujuan.unitKerja ||
                        "Tanpa unit kerja"}
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

                {/* Informasi aktivitas opsional */}

                {modeBaru && (
                  <div className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 sm:px-6">
                    <p className="text-sm font-bold text-[#1f4e8c]">
                      Aktivitas bersifat opsional
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Jika belum memiliki data aktivitas,
                      bagian ini boleh dikosongkan. Akun
                      periset tetap dapat dibuat.
                    </p>
                  </div>
                )}

                {/* Daftar aktivitas */}

                {aktivitas.map((a, i) => (
                  <AktivitasCard
                    key={a.id}
                    a={a}
                    index={i}
                    total={aktivitas.length}
                    nomorAktivitas={nomorAktivitas}
                    tampilAkt={(id, k) =>
                      tampilAkt(id, k)
                    }
                    ubahAkt={ubahAkt}
                    hapusAkt={hapusAkt}
                    ubahTarget={ubahTarget}
                    tambahTarget={tambahTarget}
                    hapusTarget={hapusTarget}
                    disorotServer={
                      galatServer?.aktivitasKe ===
                      i + 1
                    }
                  />
                ))}

                {/* Tambah aktivitas */}

                <div className="border-t border-[#dbe6f7] px-4 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={tambahAkt}
                    className="rounded-full border border-[#9db8e0] px-4 py-2 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                  >
                    + Tambah aktivitas
                  </button>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Satu periset dapat memiliki beberapa
                    aktivitas dengan sumber pendanaan
                    yang berbeda.
                  </p>

                  {galat.umum &&
                    aktivitasTerisi.length > 1 && (
                      <p
                        role="alert"
                        className="mt-2 text-xs font-semibold text-[#991b1b]"
                      >
                        {galat.umum}
                      </p>
                    )}
                </div>

                {/* Pesan error */}

                {pesan && (
                  <p
                    role="alert"
                    className="mx-4 mb-3 rounded-xl bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b] sm:mx-6"
                  >
                    {pesan}
                  </p>
                )}

                {/* Footer */}

                <div className="flex flex-col gap-3 border-t border-[#dbe6f7] bg-[#f5f8fd] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <span className="text-xs text-slate-500">
                    <span className="text-[#991b1b]">
                      *
                    </span>{" "}
                    identitas wajib diisi. Aktivitas
                    opsional untuk periset baru.
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

                    <TombolGradasi
                      besar
                      onClick={() => void simpan()}
                    >
                      {menyimpan
                        ? "Menyimpan…"
                        : perisetTujuan
                          ? "Simpan aktivitas"
                          : aktivitasTerisi.length > 0
                            ? "Simpan periset & aktivitas"
                            : "Buat akun periset"}
                    </TombolGradasi>
                  </div>
                </div>
              </form>
            )}
          </section>

          {/* Preview */}

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
