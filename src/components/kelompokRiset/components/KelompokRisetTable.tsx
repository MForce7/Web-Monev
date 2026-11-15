import {
  Fragment,
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

  onUpdate: (
    pi: number,
    ki: number,
    ai: number,
    field: keyof Periset,
    value: string,
  ) => void;

  onTambah: (pi: number, ki: number) => void;

  onHapus: (
    pi: number,
    ki: number,
    ai: number,
  ) => void;

  onKoordinator: (
    pi: number,
    ki: number,
    ai: number,
  ) => void;

  onPindah: (
    pi: number,
    ki: number,
    ai: number,
    tujuan: TujuanPindah,
  ) => void;
};

export default function KelompokRisetTable({
  tampil,
  modeEdit,
  opsiKelompok,
  onUpdate,
  onTambah,
  onHapus,
  onKoordinator,
  onPindah,
}: Props) {
  const inputClass =
    "w-full min-w-0 px-2 py-1.5 border border-blue-200 rounded-md text-xs text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-blue-300";

  return (
    <div className="overflow-hidden rounded-b-3xl">
      <table className="w-full max-w-full table-fixed text-left text-xs font-normal leading-snug text-[#1b3560] border-collapse">
        <colgroup>
          {WIDTHS.map((width, index) => (
            <col
              key={index}
              style={{ width: `${width}%` }}
            />
          ))}
        </colgroup>

        <thead>
          <tr
            className="text-white text-center text-sm font-bold"
            style={{ background: GRAD_BIRU }}
          >
            {KOLOM.map((label) => (
              <th
                key={label}
                className="px-3 py-3 text-sm font-bold border-r border-white/25 last:border-r-0 break-words whitespace-normal"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {tampil.map((p) => (
            <Fragment key={p.nama}>
              <tr>
                <td
                  colSpan={KOLOM.length}
                  className="px-3 py-2 text-white text-center text-xs font-bold uppercase tracking-wider"
                  style={{ background: GRAD_BIRU_TUA }}
                >
                  {p.nama}
                </td>
              </tr>

              {p.kelompok.map((k) => (
                <Fragment key={`${p.nama}-${k.nama}`}>
                  {k.anggota.map((a, i) => (
                    <tr
                      key={`${p.nama}-${k.nama}-${a.nip}-${a.ai}`}
                      className="hover:bg-[#eef3fb] transition-colors"
                    >
                      {i === 0 && (
                        <>
                          <td
                            rowSpan={k.anggota.length}
                            className={`${TD_CLASS} text-center bg-white`}
                          >
                            {k.no}.
                          </td>

                          <td
                            rowSpan={k.anggota.length}
                            className={`${TD_CLASS} bg-white`}
                          >
                            <div className="font-semibold">
                              {k.nama}
                            </div>

                            {modeEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  onTambah(p.pi, k.ki)
                                }
                                className="mt-2 text-[10px] font-semibold text-blue-700 hover:underline"
                              >
                                + Tambah periset
                              </button>
                            )}
                          </td>
                        </>
                      )}

                      <td className={TD_CLASS}>
                        {modeEdit ? (
                          <div className="space-y-2">
                            <input
                              className={inputClass}
                              value={a.nama}
                              placeholder="Nama periset"
                              onChange={(e) =>
                                onUpdate(
                                  p.pi,
                                  k.ki,
                                  a.ai,
                                  "nama",
                                  e.target.value,
                                )
                              }
                            />

                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onKoordinator(
                                    p.pi,
                                    k.ki,
                                    a.ai,
                                  )
                                }
                                className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px]"
                              >
                                Jadikan koordinator
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  onHapus(
                                    p.pi,
                                    k.ki,
                                    a.ai,
                                  )
                                }
                                className="px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 text-[10px]"
                              >
                                Hapus
                              </button>
                            </div>

                            <select
                              defaultValue=""
                              className={inputClass}
                              onChange={(e) => {
                                if (!e.target.value) return;

                                const [tujuanPi, tujuanKi] =
                                  e.target.value
                                    .split(":")
                                    .map(Number);

                                onPindah(
                                  p.pi,
                                  k.ki,
                                  a.ai,
                                  {
                                    pi: tujuanPi,
                                    ki: tujuanKi,
                                  },
                                );

                                e.target.value = "";
                              }}
                            >
                              <option value="">
                                Pindahkan ke kelompok...
                              </option>

                              {opsiKelompok
                                .filter((opsi) => {
                                  const [pi, ki] =
                                    opsi.value
                                      .split(":")
                                      .map(Number);

                                  return !(
                                    pi === p.pi &&
                                    ki === k.ki
                                  );
                                })
                                .map((opsi) => (
                                  <option
                                    key={opsi.value}
                                    value={opsi.value}
                                  >
                                    {opsi.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <span className="text-slate-400 mr-1">
                              {a.no}.
                            </span>
                            {a.nama}
                          </>
                        )}
                      </td>

                      <td className={`${TD_CLASS} text-center`}>
                        {modeEdit ? (
                          <input
                            className={inputClass}
                            value={a.nip}
                            placeholder="NIP"
                            onChange={(e) =>
                              onUpdate(
                                p.pi,
                                k.ki,
                                a.ai,
                                "nip",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          a.nip
                        )}
                      </td>

                      <td className={`${TD_CLASS} text-center`}>
                        {modeEdit ? (
                          <select
                            className={inputClass}
                            value={a.keterangan}
                            onChange={(e) =>
                              onUpdate(
                                p.pi,
                                k.ki,
                                a.ai,
                                "keterangan",
                                e.target.value,
                              )
                            }
                          >
                            <option value="Koordinator">
                              Koordinator
                            </option>
                            <option value="Ketua">
                              Ketua
                            </option>
                            <option value="Anggota">
                              Anggota
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full border text-[11px] font-normal ${lencana(a.keterangan)}`}
                          >
                            {a.keterangan}
                          </span>
                        )}
                      </td>

                      <td className={`${TD_CLASS} border-r-0`}>
                        {modeEdit ? (
                          <input
                            className={inputClass}
                            value={a.jabatan}
                            placeholder="Jabatan fungsional"
                            onChange={(e) =>
                              onUpdate(
                                p.pi,
                                k.ki,
                                a.ai,
                                "jabatan",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          a.jabatan
                        )}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </Fragment>
          ))}

          {tampil.length === 0 && (
            <tr>
              <td
                colSpan={KOLOM.length}
                className="p-6 text-center text-xs text-slate-500"
              >
                Tidak ada data yang cocok dengan pencarian.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}