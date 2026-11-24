import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminGuard } from "../lib/useAdminGuard";
import TombolGradasi from "../components/importjson/TombolGradasi";
import {
  ambilLogbookAktif,
  daftarLogbook,
  simpanLogbook,
} from "../lib/logbookStore";
import {
  deleteActivitiesInDb,
  deleteActivityInDb,
  fetchAllResearchers,
  type PerisetRingkas,
} from "../lib/supabaseLogbookData";
import { unduhTemplate, type PerisetImport } from "../lib/excelPeriset";
import { ModalKonfirmasi } from "../components/kelolaAkun/ModalKonfirmasi";
import { ImportExcelModal } from "../components/kelolaAkun/ImportExcelModal";
import { FormPeristModal } from "../components/kelolaAkun/FormPeristModal";
import { DaftarPerisetTable } from "../components/kelolaAkun/DaftarPerisetTable";
import { DaftarAdminTable } from "../components/kelolaAkun/DaftarAdminTable";
import {
  OPSI_EXCEL,
  kecil,
  fetchAllAdmins,
  importPerisetDiDb,
  hapusAkunDiDb,
  type AdminRingkas,
  type ModeForm,
  type TargetHapus,
} from "../components/kelolaAkun/shared";

function FormbaruKonten() {
  const [formMode, setFormMode] = useState<ModeForm | null>(null);
  const [versi, setVersi] = useState(0);

  const [target, setTarget] = useState<TargetHapus | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [galatModal, setGalatModal] = useState("");

  const [dbList, setDbList] = useState<PerisetRingkas[]>([]);
  const [dbMemuat, setDbMemuat] = useState(true);
  const [dbGalat, setDbGalat] = useState("");

  const [tab, setTab] = useState<"periset" | "admin">("periset");
  const [showImport, setShowImport] = useState(false);

  const [adminList, setAdminList] = useState<AdminRingkas[]>([]);
  const [adminMemuat, setAdminMemuat] = useState(true);
  const [adminGalat, setAdminGalat] = useState("");

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

  // `versi` sengaja jadi pemicu muat ulang daftar browser setelah menghapus
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const aktifNama = useMemo(() => ambilLogbookAktif()?.header.namaKetua ?? "", [versi]);

  const bukaFormBaru = () => setFormMode({ jenis: "baru" });
  const bukaFormAkt = (p: PerisetRingkas) =>
    setFormMode({ jenis: "tambahAkt", periset: { id: p.id, nama: p.nama, unitKerja: p.unitKerja } });
  const tutupForm = () => setFormMode(null);

  /** Hapus semua logbook milik satu periset di penyimpanan browser (dikenali dari nama ketua) */
  const hapusDiBrowser = (nama: string) => {
    const sisa = daftarLogbook().filter((x) => kecil(x.header.namaKetua) !== kecil(nama));
    const aktifBaru = kecil(aktifNama) === kecil(nama) ? (sisa[0]?.header.namaKetua ?? "") : aktifNama;

    if (!simpanLogbook(sisa, aktifBaru)) {
      throw new Error("Gagal menghapus: penyimpanan browser diblokir atau tidak merespons.");
    }
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
      } else if (target.tipe === "akun") {
        await hapusAkunDiDb(target.id);
      } else {
        await deleteActivitiesInDb(target.aktivitas.map((a) => a.id));
      }
      if (target.sumber === "db") await muatDb();
      setTarget(null);
    } catch (err) {
      setGalatModal((err as Error).message);
      if (target.sumber === "db") void muatDb();
    } finally {
      setMenghapus(false);
    }
  };

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

    if (target.tipe === "akun") {
      return {
        judul: `Yakin ingin menghapus akun ${target.nama || "ini"}?`,
        isi: (
          <>
            <p className="rounded-lg bg-[#fee2e2] px-3 py-2 font-semibold text-[#991b1b] [overflow-wrap:anywhere]">
              Akun login periset ini akan ikut terhapus — bukan cuma aktivitasnya.
            </p>
            <p>
              {target.jumlahAktivitas > 0
                ? `${target.jumlahAktivitas} aktivitas beserta seluruh log bulanannya`
                : "Profil periset ini"}{" "}
              akan terhapus permanen dan tidak bisa dikembalikan. Periset tidak akan bisa login lagi
              setelah ini.
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
              <li key={a.id} className="[overflow-wrap:anywhere]">{a.judul || "(tanpa judul)"}</li>
            ))}
          </ul>
          {sisa > 0 && <p className="text-xs">dan {sisa} aktivitas lainnya.</p>}
          <p className="text-xs">Akun login periset tidak ikut terhapus.</p>
        </>
      ),
    };
  };

  const modal = isiModal();

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
                  tab === k ? "border-[#1f4e8c] text-[#1f4e8c]" : "border-transparent text-slate-500 hover:text-[#1b3560]"
                }`}
              >
                {label}
                <span className="ml-2 rounded-full bg-[#eaf0fa] px-2 py-0.5 text-xs text-[#1b3560]">{n}</span>
              </button>
            ))}
          </div>

          {tab === "periset" && (
            <DaftarPerisetTable
              dbList={dbList}
              dbMemuat={dbMemuat}
              dbGalat={dbGalat}
              onRetry={() => void muatDb()}
              onTambahAktivitas={bukaFormAkt}
              onRequestDelete={bukaModal}
            />
          )}

          {tab === "admin" && (
            <DaftarAdminTable
              adminList={adminList}
              adminMemuat={adminMemuat}
              adminGalat={adminGalat}
              onRetry={() => void muatAdmin()}
            />
          )}
        </div>
      </main>

      {formMode && (
        <FormPeristModal
          mode={formMode}
          onClose={tutupForm}
          onSavedBaru={() => {
            setVersi((v) => v + 1);
            void muatDb();
          }}
          onSavedTambahAkt={() => muatDb()}
        />
      )}

      {showImport && (
        <ImportExcelModal
          opsi={OPSI_EXCEL}
          sudahAda={(nama) => dbList.some((p) => kecil(p.nama) === kecil(nama))}
          onClose={() => setShowImport(false)}
          onSimpan={async (data: PerisetImport[]) => {
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

/** Gerbang akses: halaman ini hanya untuk role "admin". */
export default function Formbaru() {
  const guard = useAdminGuard();

  if (guard.status === "memuat") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f5fa]">
        <p className="text-sm text-slate-500">Memeriksa akses…</p>
      </div>
    );
  }

  if (guard.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f2f5fa] px-4 text-center">
        <p className="text-sm font-semibold text-[#991b1b]">Gagal memeriksa akses: {guard.pesan}</p>
      </div>
    );
  }

  if (guard.status === "ditolak") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[#f2f5fa] px-4 text-center">
        <p className="text-lg font-extrabold text-[#1b3560]">Akses ditolak</p>
        <p className="text-sm text-slate-500">Halaman ini khusus untuk akun admin.</p>
      </div>
    );
  }

  return <FormbaruKonten />;
}