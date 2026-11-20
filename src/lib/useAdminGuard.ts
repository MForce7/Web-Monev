import { useEffect, useState } from "react";

import { supabase } from "./supabase"; // sesuaikan path client Supabase kamu

export type StatusGuardAdmin =
  | { status: "memuat" }
  | { status: "ditolak" }
  | { status: "error"; pesan: string }
  | { status: "diizinkan" };

/** Mengecek apakah user yang sedang login punya role "admin" di tabel profiles. */
export function useAdminGuard(): StatusGuardAdmin {
  const [state, setState] = useState<StatusGuardAdmin>({ status: "memuat" });

  useEffect(() => {
    let batal = false;

    async function cek() {
      try {
        const { data: sesi, error: errorSesi } = await supabase.auth.getUser();

        if (errorSesi || !sesi?.user) {
          if (!batal) setState({ status: "ditolak" });
          return;
        }

        const { data: profil, error: errorProfil } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sesi.user.id)
          .maybeSingle();

        if (errorProfil) {
          if (!batal) setState({ status: "error", pesan: errorProfil.message });
          return;
        }

        if (!batal) {
          setState(
            profil?.role === "admin"
              ? { status: "diizinkan" }
              : { status: "ditolak" },
          );
        }
      } catch (err) {
        if (!batal) {
          setState({
            status: "error",
            pesan: err instanceof Error ? err.message : "Gagal memeriksa akses.",
          });
        }
      }
    }

    void cek();

    return () => {
      batal = true;
    };
  }, []);

  return state;
}