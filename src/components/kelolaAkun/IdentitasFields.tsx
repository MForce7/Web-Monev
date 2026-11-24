import { UNIT, LAIN, kelasInput, type Identitas } from "./shared";
import { Field } from "./Field";
import { Seksi } from "./Seksi";

type IdentitasFieldsProps = {
  iden: Identitas;
  ubahIden: <K extends keyof Identitas>(k: K, v: Identitas[K]) => void;
  pilihUnit: (v: string) => void;
  tampilIden: (k: string) => string | undefined;
};

export function IdentitasFields({ iden, ubahIden, pilihUnit, tampilIden }: IdentitasFieldsProps) {
  return (
    <Seksi n={1} judul="Identitas Ketua Tim">
      <Field label="Nama ketua tim" id="nama" wajib galat={tampilIden("nama")}>
        <input
          id="nama"
          value={iden.nama}
          onChange={(e) => ubahIden("nama", e.target.value)}
          className={kelasInput(tampilIden("nama"))}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email aktif" id="email" wajib galat={tampilIden("email")}>
          <input
            id="email"
            type="email"
            value={iden.email}
            onChange={(e) => ubahIden("email", e.target.value)}
            className={kelasInput(tampilIden("email"))}
          />
        </Field>

        <Field
          label="Password"
          id="password"
          wajib
          galat={tampilIden("password")}
          hint="Minimal 8 karakter, dipakai periset untuk login."
        >
          <input
            id="password"
            type="password"
            value={iden.password}
            onChange={(e) => ubahIden("password", e.target.value)}
            className={kelasInput(tampilIden("password"))}
          />
        </Field>
      </div>

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
            aria-label="Unit kerja lainnya"
            value={iden.unitLain}
            onChange={(e) => ubahIden("unitLain", e.target.value)}
            placeholder="Tulis unit kerja"
            className={`${kelasInput(tampilIden("unit"))} mt-2`}
          />
        )}
      </Field>
    </Seksi>
  );
}