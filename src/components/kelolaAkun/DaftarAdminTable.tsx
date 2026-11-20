import { useState } from "react";
import { kecil, kelasInput, type AdminRingkas } from "./shared";

type DaftarAdminTableProps = {
  adminList: AdminRingkas[];
  adminMemuat: boolean;
  adminGalat: string;
  onRetry: () => void;
};

export function DaftarAdminTable({ adminList, adminMemuat, adminGalat, onRetry }: DaftarAdminTableProps) {
  const [cariAdmin, setCariAdmin] = useState("");

  const q = kecil(cariAdmin);
  const adminTampil = q ? adminList.filter((a) => kecil(a.nama).includes(q)) : adminList;

  return (
    <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
      <div className="border-b border-[#e5edf8] px-4 py-3 sm:px-5">
        <input
          type="search"
          value={cariAdmin}
          onChange={(e) => setCariAdmin(e.target.value)}
          placeholder="Cari nama admin…"
          aria-label="Cari admin"
          className={`${kelasInput()} sm:max-w-md`}
        />
      </div>

      {adminGalat && (
        <div role="alert" className="border-b border-[#fecaca] bg-[#fee2e2] px-5 py-2 text-xs font-semibold text-[#991b1b]">
          <p className="[overflow-wrap:anywhere]">Gagal memuat daftar: {adminGalat}</p>
          <button type="button" onClick={onRetry} className="mt-1 underline">
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
          <table className="w-full min-w-[360px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#eaf0fa] text-xs font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                <th scope="col" className="w-12 px-4 py-3 text-center">No</th>
                <th scope="col" className="px-4 py-3">Nama</th>
                <th scope="col" className="px-4 py-3">Unit kerja</th>
              </tr>
            </thead>
            <tbody>
              {adminTampil.map((a, i) => (
                <tr key={a.id} className="border-t border-[#e5edf8] hover:bg-[#f9fbfe]">
                  <td className="px-4 py-3 text-center text-xs text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-extrabold [overflow-wrap:anywhere]">{a.nama || "(tanpa nama)"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 [overflow-wrap:anywhere]">
                    {a.unitKerja || "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}