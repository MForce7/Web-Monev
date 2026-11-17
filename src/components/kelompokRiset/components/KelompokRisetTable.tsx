import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  KOLOM,
  WIDTHS,
  TD_CLASS,
  GRAD_BIRU,
  GRAD_BIRU_TUA,
  lencana,
} from "../constants";

import type {
  PusatTampil,
  OpsiKelompok,
  Periset,
  TujuanPindah,
} from "../types";

type Props = {
  tampil: PusatTampil[];
  modeEdit: boolean;

  opsiKelompok: OpsiKelompok[];

  // Kelompok
  onTambahKelompok: (pi: number) => void;
  onHapusKelompok: (pi: number, ki: number) => void;
  onUbahNamaKelompok: (pi: number, ki: number, nama: string) => void;

  // Periset
  onUpdate: (pi: number, ki: number, ai: number, field: keyof Periset, value: string) => void;
  onTambah: (pi: number, ki: number) => void;
  onHapus: (pi: number, ki: number, ai: number) => void;
  onKoordinator: (pi: number, ki: number, ai: number) => void;
  onPindah: (pi: number, ki: number, ai: number, tujuan: TujuanPindah) => void;
};

const INPUT =
  "w-full min-w-0 rounded-md border border-blue-200 bg-white px-2 py-1.5 text-xs text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-blue-300";

/** Tombol aksi: sedikit lebih tinggi di HP supaya mudah disentuh */
const BTN = "rounded-md border px-2.5 py-2 md:px-2 md:py-1 text-[11px] font-semibold transition";
const BTN_BIRU = `${BTN} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`;
const BTN_MERAH = `${BTN} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`;

const OPSI_KETERANGAN = ["Koordinator", "Ketua", "Anggota"];

/** Bayangan di tepi kiri/kanan tabel: tanda masih ada kolom yang bisa digeser */
function useScrollHint() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ kiri: false, kanan: false });

  const cek = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const kiri = el.scrollLeft > 4;
    const kanan = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setState((s) => (s.kiri === kiri && s.kanan === kanan ? s : { kiri, kanan }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    cek();
    const ro = new ResizeObserver(cek);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [cek]);

  return { ref, cek, ...state };
}

/** Aksi per periset (mode edit): jadikan koordinator, hapus, pindah kelompok */
function AksiAnggota({
  pi,
  ki,
  ai,
  koordinator,
  opsiKelompok,
  onKoordinator,
  onHapus,
  onPindah,
}: {
  pi: number;
  ki: number;
  ai: number;
  koordinator: boolean;
  opsiKelompok: OpsiKelompok[];
  onKoordinator: Props["onKoordinator"];
  onHapus: Props["onHapus"];
  onPindah: Props["onPindah"];
}) {
  const asal = `${pi}:${ki}`;

  const pindah = (e: ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value) return;
    const [tujuanPi, tujuanKi] = e.target.value.split(":").map(Number);
    onPindah(pi, ki, ai, { pi: tujuanPi, ki: tujuanKi });
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {!koordinator && (
          <button type="button" onClick={() => onKoordinator(pi, ki, ai)} className={BTN_BIRU}>
            Jadikan koordinator
          </button>
        )}
        <button type="button" onClick={() => onHapus(pi, ki, ai)} className={BTN_MERAH}>
          Hapus
        </button>
      </div>

      <select defaultValue="" className={INPUT} onChange={pindah} aria-label="Pindahkan ke kelompok lain">
        <option value="">Pindahkan ke kelompok...</option>
        {opsiKelompok
          .filter((opsi) => opsi.value !== asal)
          .map((opsi) => (
            <option key={opsi.value} value={opsi.value}>
              {opsi.label}
            </option>
          ))}
      </select>
    </div>
  );
}

export default function KelompokRisetTable({
  tampil,
  modeEdit,
  opsiKelompok,
  onTambahKelompok,
  onHapusKelompok,
  onUbahNamaKelompok,
  onUpdate,
  onTambah,
  onHapus,
  onKoordinator,
  onPindah,
}: Props) {
  const { ref, cek, kiri, kanan } = useScrollHint();
  const bisaScroll = kiri || kanan;

  /** Handler input periset: ubah(pi, ki, ai, "nama") -> (event) => onUpdate(...) */
  const ubah =
    (pi: number, ki: number, ai: number, field: keyof Periset) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onUpdate(pi, ki, ai, field, e.target.value);

  const kosong = tampil.length === 0;

  return (
    <>
      {/* ───── HP (di bawah 768px): kartu per kelompok ───── */}
      <div className="space-y-4 rounded-b-2xl p-3 md:hidden">
        {tampil.map((p) => (
          <div key={p.pi}>
            <p
              className="rounded-lg px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white"
              style={{ background: GRAD_BIRU_TUA }}
            >
              {p.nama}
            </p>

            <div className="mt-2 space-y-3">
              {p.kelompok.map((k) => (
                <div
                  key={`${p.pi}-${k.ki}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
                    {modeEdit ? (
                      <div className="space-y-2">
                        <span className="block text-[11px] font-bold text-slate-500">
                          Nama kelompok riset
                        </span>
                        <textarea
                          rows={2}
                          className={INPUT}
                          value={k.nama}
                          placeholder="Nama kelompok riset"
                          onChange={(e) => onUbahNamaKelompok(p.pi, k.ki, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => onHapusKelompok(p.pi, k.ki)}
                          className={BTN_MERAH}
                        >
                          Hapus kelompok
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-sm font-bold text-[#1b3560]">
                        <span>{k.no}.</span>
                        <span className="min-w-0 break-words">{k.nama}</span>
                      </div>
                    )}
                  </div>

                  <ul className="divide-y divide-slate-100">
                    {k.anggota.map((a) => (
                      <li
                        key={`${p.pi}-${k.ki}-${a.ai}`}
                        className="px-3 py-2.5 text-xs text-[#1b3560]"
                      >
                        {modeEdit ? (
                          <div className="space-y-2">
                            <span className="block text-[11px] font-bold text-slate-500">
                              Periset {a.no}
                            </span>
                            <input
                              className={INPUT}
                              value={a.nama}
                              placeholder="Nama periset"
                              aria-label="Nama periset"
                              onChange={ubah(p.pi, k.ki, a.ai, "nama")}
                            />
                            <input
                              className={INPUT}
                              value={a.nip}
                              placeholder="NIP"
                              aria-label="NIP"
                              onChange={ubah(p.pi, k.ki, a.ai, "nip")}
                            />
                            <select
                              className={INPUT}
                              value={a.keterangan}
                              aria-label="Keterangan"
                              onChange={ubah(p.pi, k.ki, a.ai, "keterangan")}
                            >
                              {OPSI_KETERANGAN.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                            <input
                              className={INPUT}
                              value={a.jabatan}
                              placeholder="Jabatan fungsional"
                              aria-label="Jabatan fungsional"
                              onChange={ubah(p.pi, k.ki, a.ai, "jabatan")}
                            />
                            <AksiAnggota
                              pi={p.pi}
                              ki={k.ki}
                              ai={a.ai}
                              koordinator={a.keterangan !== "Anggota"}
                              opsiKelompok={opsiKelompok}
                              onKoordinator={onKoordinator}
                              onHapus={onHapus}
                              onPindah={onPindah}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p className="min-w-0 break-words font-semibold">
                                <span className="mr-1 font-normal text-slate-400">{a.no}.</span>
                                {a.nama}
                              </p>
                              <span
                                className={`inline-block shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-normal ${lencana(a.keterangan)}`}
                              >
                                {a.keterangan}
                              </span>
                            </div>
                            <p className="mt-1 break-all text-slate-500">NIP {a.nip || "—"}</p>
                            <p className="mt-0.5 break-words text-slate-600">{a.jabatan || "—"}</p>
                          </>
                        )}
                      </li>
                    ))}

                    {k.anggota.length === 0 && (
                      <li className="px-3 py-3 text-xs italic text-slate-500">Belum ada anggota.</li>
                    )}
                  </ul>

                  {modeEdit && (
                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={() => onTambah(p.pi, k.ki)}
                        className={`${BTN_BIRU} w-full`}
                      >
                        + Tambah periset
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {modeEdit && (
              <button
                type="button"
                onClick={() => onTambahKelompok(p.pi)}
                className={`${BTN_BIRU} mt-3 w-full border-dashed py-2.5`}
              >
                + Tambah kelompok di {p.nama}
              </button>
            )}
          </div>
        ))}

        {kosong && (
          <p className="p-6 text-center text-xs text-slate-500">Tidak ada data yang cocok dengan pencarian.</p>
        )}

        {/* Ruang kosong agar kartu terbawah tidak tertutup bar Simpan/Batal */}
        {modeEdit && <div className="h-16" aria-hidden="true" />}
      </div>

      {/* ───── Tablet / desktop (768px ke atas): tabel ───── */}
      <div className="hidden md:block">
        {bisaScroll && (
          <p className="flex items-center justify-center gap-2 border-b border-slate-200 bg-[#eaf0fa] px-3 py-1.5 text-[11px] font-bold text-[#2a5aa8]">
            Geser tabel ke samping untuk melihat semua kolom
          </p>
        )}

        <div className="relative">
          <div ref={ref} onScroll={cek} className="overflow-x-auto overscroll-x-contain rounded-b-3xl">
            <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-xs font-normal leading-snug text-[#1b3560] lg:min-w-0">
              <colgroup>
                {WIDTHS.map((width, index) => (
                  <col key={index} style={{ width: `${width}%` }} />
                ))}
              </colgroup>

              <thead>
                <tr className="text-center text-sm font-bold text-white" style={{ background: GRAD_BIRU }}>
                  {KOLOM.map((label) => (
                    <th
                      key={label}
                      className="whitespace-normal break-words border-r border-white/25 px-3 py-3 text-sm font-bold last:border-r-0"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tampil.map((p) => (
                  <Fragment key={p.pi}>
                    <tr>
                      <td
                        colSpan={KOLOM.length}
                        className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white"
                        style={{ background: GRAD_BIRU_TUA }}
                      >
                        {p.nama}
                      </td>
                    </tr>

                    {p.kelompok.map((k) => {
                      /* Sel nomor + nama kelompok (dipakai baris pertama, atau baris tunggal kalau kelompok kosong) */
                      const selKelompok = (rowSpan: number) => (
                        <>
                          <td rowSpan={rowSpan} className={`${TD_CLASS} bg-white text-center`}>
                            {k.no}.
                          </td>
                          <td rowSpan={rowSpan} className={`${TD_CLASS} bg-white`}>
                            {modeEdit ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={3}
                                  className={`${INPUT} resize-none`}
                                  value={k.nama}
                                  placeholder="Nama kelompok riset"
                                  aria-label="Nama kelompok riset"
                                  onChange={(e) => onUbahNamaKelompok(p.pi, k.ki, e.target.value)}
                                />
                                <div className="flex flex-wrap gap-1.5">
                                  <button type="button" onClick={() => onTambah(p.pi, k.ki)} className={BTN_BIRU}>
                                    + Tambah periset
                                  </button>
                                  <button type="button" onClick={() => onHapusKelompok(p.pi, k.ki)} className={BTN_MERAH}>
                                    Hapus kelompok
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="font-semibold">{k.nama}</div>
                            )}
                          </td>
                        </>
                      );

                      /* Kelompok tanpa anggota: satu baris penanda */
                      if (k.anggota.length === 0) {
                        return (
                          <tr key={`${p.pi}-${k.ki}`}>
                            {selKelompok(1)}
                            <td
                              colSpan={KOLOM.length - 2}
                              className={`${TD_CLASS} border-r-0 italic text-slate-500`}
                            >
                              Belum ada anggota.
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <Fragment key={`${p.pi}-${k.ki}`}>
                          {k.anggota.map((a, i) => (
                            <tr key={`${p.pi}-${k.ki}-${a.ai}`} className="transition-colors hover:bg-[#eef3fb]">
                              {i === 0 && selKelompok(k.anggota.length)}

                              <td className={TD_CLASS}>
                                {modeEdit ? (
                                  <div className="space-y-2">
                                    <input
                                      className={INPUT}
                                      value={a.nama}
                                      placeholder="Nama periset"
                                      aria-label="Nama periset"
                                      onChange={ubah(p.pi, k.ki, a.ai, "nama")}
                                    />
                                    <AksiAnggota
                                      pi={p.pi}
                                      ki={k.ki}
                                      ai={a.ai}
                                      koordinator={a.keterangan !== "Anggota"}
                                      opsiKelompok={opsiKelompok}
                                      onKoordinator={onKoordinator}
                                      onHapus={onHapus}
                                      onPindah={onPindah}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span className="mr-1 text-slate-400">{a.no}.</span>
                                    {a.nama}
                                  </>
                                )}
                              </td>

                              <td className={`${TD_CLASS} text-center`}>
                                {modeEdit ? (
                                  <input
                                    className={INPUT}
                                    value={a.nip}
                                    placeholder="NIP"
                                    aria-label="NIP"
                                    onChange={ubah(p.pi, k.ki, a.ai, "nip")}
                                  />
                                ) : (
                                  a.nip
                                )}
                              </td>

                              <td className={`${TD_CLASS} text-center`}>
                                {modeEdit ? (
                                  <select
                                    className={INPUT}
                                    value={a.keterangan}
                                    aria-label="Keterangan"
                                    onChange={ubah(p.pi, k.ki, a.ai, "keterangan")}
                                  >
                                    {OPSI_KETERANGAN.map((o) => (
                                      <option key={o} value={o}>
                                        {o}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span
                                    className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-normal ${lencana(a.keterangan)}`}
                                  >
                                    {a.keterangan}
                                  </span>
                                )}
                              </td>

                              <td className={`${TD_CLASS} border-r-0`}>
                                {modeEdit ? (
                                  <input
                                    className={INPUT}
                                    value={a.jabatan}
                                    placeholder="Jabatan fungsional"
                                    aria-label="Jabatan fungsional"
                                    onChange={ubah(p.pi, k.ki, a.ai, "jabatan")}
                                  />
                                ) : (
                                  a.jabatan
                                )}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}

                    {modeEdit && (
                      <tr>
                        <td colSpan={KOLOM.length} className="border-b border-slate-200 bg-[#f5f8fd] p-2">
                          <button
                            type="button"
                            onClick={() => onTambahKelompok(p.pi)}
                            className={`${BTN_BIRU} w-full border-dashed py-2`}
                          >
                            + Tambah kelompok di {p.nama}
                          </button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {kosong && (
                  <tr>
                    <td colSpan={KOLOM.length} className="p-6 text-center text-xs text-slate-500">
                      Tidak ada data yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bayangan tepi: tetap di tempat, tidak ikut bergeser */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-8 rounded-bl-3xl bg-gradient-to-r from-[#1b3f78]/30 to-transparent transition-opacity duration-200 ${kiri ? "opacity-100" : "opacity-0"}`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-8 rounded-br-3xl bg-gradient-to-l from-[#1b3f78]/30 to-transparent transition-opacity duration-200 ${kanan ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </div>
    </>
  );
}