
import { Field } from "./Field";
import { Seksi } from "./Seksi";
import {
  OPSI_JENIS,
  OPSI_STATUS,
  OPSI_KATEGORI,
  batas,
  kelasInput,
  type Aktivitas,
  type Target,
} from "./shared";

export const OPSI_UNIT_PENGAMPU_DIFA = [
  { value: "ORPA", label: "ORPA (Organisasi Riset Penerbangan dan Antariksa)" },
  { value: "DFRI", label: "DFRI (Deputi Bidang Fasilitasi Riset dan Inovasi)" },
];

export const OPSI_PROGRAM_SKEMA_ORPA = [
  { value: "RIIM", label: "RIIM (Riset dan Inovasi untuk Indonesia Maju)" },
  { value: "PRIS", label: "PRIS (Program Riset Inovasi Substantif / Strategis)" },
  { value: "Hibah", label: "Hibah" },
];

export const OPSI_PROGRAM_SKEMA_DFRI = [{ value: "SBKU", label: "SBKU" }];

export const SEMUA_PROGRAM_SKEMA = [
  ...OPSI_PROGRAM_SKEMA_ORPA,
  ...OPSI_PROGRAM_SKEMA_DFRI,
];

export const opsiProgramSkema = (unitDifa: string) =>
  unitDifa === "DFRI"
    ? OPSI_PROGRAM_SKEMA_DFRI
    : unitDifa === "ORPA"
      ? OPSI_PROGRAM_SKEMA_ORPA
      : [];

type AktivitasCardProps = {
  a: Aktivitas;
  index: number;
  total: number;
  nomorAktivitas: number;
  tampilAkt: (id: number, k: string) => string | undefined;
  ubahAkt: (id: number, patch: Partial<Aktivitas>) => void;
  hapusAkt: (id: number) => void;
  ubahTarget: (aid: number, tid: number, patch: Partial<Target>) => void;
  tambahTarget: (aid: number) => void;
  hapusTarget: (aid: number, tid: number) => void;
  disorotServer?: boolean;
};

export function AktivitasCard({
  a,
  index,
  total,
  nomorAktivitas,
  tampilAkt,
  ubahAkt,
  hapusAkt,
  ubahTarget,
  tambahTarget,
  hapusTarget,
  disorotServer,
}: AktivitasCardProps) {
  const i = index;

  return (
    <div
      className={`border-t-4 border-[#eaf0fa] ${
        disorotServer ? "ring-2 ring-[#dc2626] ring-inset" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 bg-[#eaf0fa] px-4 py-2.5 sm:px-6">
        <h3 className="text-sm font-extrabold">
          Aktivitas {i + 1}
          {total > 1 && (
            <span className="font-semibold text-slate-500"> dari {total}</span>
          )}
        </h3>

        {total > 1 && (
          <button
            type="button"
            onClick={() => hapusAkt(a.id)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
          >
            Hapus aktivitas
          </button>
        )}
      </div>

      {disorotServer && (
        <p
          role="alert"
          className="bg-[#fee2e2] px-4 py-2 text-xs font-semibold text-[#991b1b] sm:px-6"
        >
          Server menolak data aktivitas ini — periksa bagian Pendanaan di bawah.
        </p>
      )}

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

        {/* Tahun pelaksanaan */}
        <Field
          label="Tahun pelaksanaan"
          id={`tahun-pelaksanaan-${a.id}`}
          wajib
          galat={tampilAkt(a.id, "tahunPelaksanaan")}
          hint="Masukkan tahun pelaksanaan aktivitas (2000–2100)."
        >
          <input
            id={`tahun-pelaksanaan-${a.id}`}
            type="number"
            min={2000}
            max={2100}
            step={1}
            value={a.tahunPelaksanaan}
            onChange={(e) =>
              ubahAkt(a.id, {
                tahunPelaksanaan:
                  e.target.value === "" ? ("" as unknown as number) : Number(e.target.value),
              })
            }
            className={kelasInput(tampilAkt(a.id, "tahunPelaksanaan"))}
            placeholder="Contoh: 2026"
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
                  ubahAkt(a.id, {
                    progres: batas(Number(e.target.value), 0, 100),
                  })
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
                  ubahAkt(a.id, {
                    progres: batas(Number(e.target.value), 0, 100),
                  })
                }
                className={`${kelasInput()} w-20! shrink-0 text-center`}
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
                  onChange={(e) =>
                    ubahTarget(a.id, t.id, { jenis: e.target.value })
                  }
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
                    ubahTarget(a.id, t.id, {
                      jumlah: batas(Number(e.target.value), 1, 999),
                    })
                  }
                  className={`${kelasInput()} w-16! shrink-0 text-center sm:w-24!`}
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
              onChange={(e) => {
                const kategori = e.target.value;
                ubahAkt(a.id, {
                  kategori,
                  kategoriLain: "",
                  unitPengampuDifa: kategori === "PNBP" ? "ORPA" : "",
                  programSkemaPendanaan: "",
                });
              }}
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

          <Field
            label="Unit Pengampu DIFA"
            id={`unit-difa-${a.id}`}
            wajib
            galat={tampilAkt(a.id, "skema")}
            hint={
              a.kategori === "PNBP"
                ? "PNBP hanya untuk ORPA."
                : "Rupiah Murni bisa ORPA atau DFRI."
            }
          >
            <select
              id={`unit-difa-${a.id}`}
              value={a.unitPengampuDifa}
              disabled={a.kategori === "PNBP"}
              onChange={(e) => {
                const unitPengampuDifa = e.target.value;
                ubahAkt(a.id, {
                  unitPengampuDifa,
                  programSkemaPendanaan:
                    unitPengampuDifa === "DFRI" ? "SBKU" : "",
                });
              }}
              className={kelasInput(tampilAkt(a.id, "skema"))}
            >
              <option value="">Pilih unit pengampu DIFA…</option>
              {(a.kategori === "PNBP"
                ? OPSI_UNIT_PENGAMPU_DIFA.filter((u) => u.value === "ORPA")
                : OPSI_UNIT_PENGAMPU_DIFA
              ).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Program / Skema Pendanaan"
            id={`program-skema-${a.id}`}
            wajib
            galat={tampilAkt(a.id, "skema")}
            hint={
              a.unitPengampuDifa === "DFRI"
                ? "DFRI hanya untuk skema SBKU."
                : "ORPA bisa RIIM, PRIS, atau Hibah."
            }
          >
            <select
              id={`program-skema-${a.id}`}
              value={a.programSkemaPendanaan}
              disabled={a.unitPengampuDifa === "DFRI" || !a.unitPengampuDifa}
              onChange={(e) =>
                ubahAkt(a.id, { programSkemaPendanaan: e.target.value })
              }
              className={kelasInput(tampilAkt(a.id, "skema"))}
            >
              <option value="">
                {a.unitPengampuDifa
                  ? "Pilih program/skema…"
                  : "Pilih unit pengampu DIFA dulu"}
              </option>

              {opsiProgramSkema(a.unitPengampuDifa).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {tampilAkt(a.id, "skema") && (
          <p role="alert" className="mt-2 text-xs font-semibold text-[#991b1b]">
            {tampilAkt(a.id, "skema")}
          </p>
        )}
      </Seksi>
    </div>
  );
}
