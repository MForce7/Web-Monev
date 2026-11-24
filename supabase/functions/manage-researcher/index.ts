
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const KATEGORI_VALID = ["Rupiah Murni", "PNBP"];

const SKEMA_VALID = ["ORPA", "DFRI", "RIIM", "PRIS", "Hibah", "SBKU"];

type TargetPayload = {
  jenis: string;
  jumlah: number;
};

type AktivitasPayload = {
  judul: string;
  status: string;
  progres: number;
  keterangan: string;
  targetOutputs: TargetPayload[];
  kategoriPendanaan: string;
  skemaMitraProgram: string;
};

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalisasiSkema(value: string): string {
  const v = (value ?? "").trim().toUpperCase();

  if (v.startsWith("ORPA")) return "ORPA";
  if (v.startsWith("DFRI")) return "DFRI";
  if (v.startsWith("RIIM")) return "RIIM";
  if (v.startsWith("PRIS")) return "PRIS";
  if (v.startsWith("SBKU")) return "SBKU";
  if (v.startsWith("HIBAH")) return "Hibah";

  return "";
}

function validasiAktivitas(aktivitas: AktivitasPayload[]) {
  if (!Array.isArray(aktivitas) || aktivitas.length === 0) {
    throw new Error("Minimal harus ada satu aktivitas.");
  }

  for (const [i, a] of aktivitas.entries()) {
    if (!a.judul?.trim()) {
      throw new Error(`Judul aktivitas ke-${i + 1} wajib diisi.`);
    }

    if (!a.status?.trim()) {
      throw new Error(`Status aktivitas ke-${i + 1} wajib diisi.`);
    }

    if (
      !Number.isFinite(Number(a.progres)) ||
      Number(a.progres) < 0 ||
      Number(a.progres) > 100
    ) {
      throw new Error(`Progres aktivitas ke-${i + 1} tidak valid.`);
    }

    if (!KATEGORI_VALID.includes(a.kategoriPendanaan)) {
      throw new Error(
        `Kategori pendanaan aktivitas ke-${i + 1} tidak valid.`
      );
    }

    if (!SKEMA_VALID.includes(a.skemaMitraProgram)) {
      throw new Error(
        `Skema aktivitas ke-${i + 1} tidak valid.`
      );
    }
    if (!normalisasiSkema(a.skemaMitraProgram)) {
        throw new Error(
            `Skema aktivitas ke-${i + 1} tidak valid.`
        );
    }

    if (!Array.isArray(a.targetOutputs) || a.targetOutputs.length === 0) {
      throw new Error(
        `Aktivitas ke-${i + 1} minimal memiliki satu target output.`
      );
    }

    for (const target of a.targetOutputs) {
      if (!target.jenis?.trim()) {
        throw new Error("Jenis target output wajib diisi.");
      }

      if (
        !Number.isInteger(Number(target.jumlah)) ||
        Number(target.jumlah) < 0
      ) {
        throw new Error("Jumlah target output tidak valid.");
      }
    }
  }
}

async function simpanAktivitas(
  ownerId: string,
  nama: string,
  unitKerja: string,
  satuanKerja: string,
  aktivitas: AktivitasPayload[]
) {
  validasiAktivitas(aktivitas);

  const tahun = new Date().getFullYear();

  const rows = aktivitas.map((a) => {
    const skema = normalisasiSkema(a.skemaMitraProgram);

    const unitPengampuDifa =
      skema === "ORPA" || skema === "DFRI" ? skema : "";

    const programSkemaPendanaan =
      ["RIIM", "PRIS", "Hibah", "SBKU"].includes(skema)
        ? skema
        : "";

    return {
      owner_id: ownerId,
      nama_ketua: nama,
      unit_kerja: unitKerja,
      satuan_kerja: satuanKerja,
      judul_aktivitas: a.judul.trim(),
      tahun_pelaksanaan: tahun,
      progres_total: Number(a.progres),
      progres_keterangan: a.keterangan?.trim() ?? "",
      status_pelaksanaan: a.status,
      kategori_pendanaan: a.kategoriPendanaan,
      unit_pengampu_difa: unitPengampuDifa,
      program_skema_pendanaan: programSkemaPendanaan,
    };
  });

  const { data: inserted, error } = await adminClient
    .from("activities")
    .insert(rows)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  const activityIds = inserted.map((row) => row.id);

  try {
    const targetRows = aktivitas.flatMap((a, index) =>
      a.targetOutputs.map((target) => ({
        activity_id: activityIds[index],
        jenis: target.jenis,
        jumlah: Number(target.jumlah),
      }))
    );

    if (targetRows.length > 0) {
      const { error: targetError } = await adminClient
        .from("target_outputs")
        .insert(targetRows);

      if (targetError) {
        throw new Error(targetError.message);
      }
    }
  } catch (error) {
    // Hapus aktivitas yang sudah terlanjur dibuat.
    // Target output dan monthly reports akan ikut terhapus melalui FK.
    await adminClient
      .from("activities")
      .delete()
      .in("id", activityIds);

    throw error;
  }

  return activityIds;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return response({ error: "Method tidak diizinkan." }, 405);
  }

  let createdUserId: string | null = null;

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return response({ error: "Sesi login tidak ditemukan." }, 401);
    }

    const token = authorization.slice(7);

    // Pastikan pemanggil benar-benar pengguna yang login.
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      return response({ error: "Sesi login tidak valid." }, 401);
    }

    // Hanya admin yang boleh membuat akun atau menambahkan aktivitas.
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return response(
        { error: "Akses ditolak. Hanya admin yang dapat melakukan tindakan ini." },
        403
      );
    }

    const body = await req.json();

    if (body.action === "create_researcher") {
      const identitas = body.identitas;
      const aktivitas = body.aktivitas as AktivitasPayload[];

      if (
        !identitas?.nama?.trim() ||
        !identitas?.email?.trim() ||
        !identitas?.unitKerja?.trim() ||
        !identitas?.password
      ) {
        throw new Error("Identitas periset belum lengkap.");
      }

      if (identitas.password.length < 8) {
        throw new Error("Password minimal 8 karakter.");
      }

      validasiAktivitas(aktivitas);

      // Buat akun Supabase Auth.
      const { data: authData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: identitas.email.trim().toLowerCase(),
          password: identitas.password,
          email_confirm: true,
          user_metadata: {
            full_name: identitas.nama.trim(),
          },
        });

      if (createError || !authData.user) {
        throw new Error(
          createError?.message ?? "Gagal membuat akun periset."
        );
      }

      createdUserId = authData.user.id;

      // Buat profil dengan ID yang sama dengan auth.users.
      const { error: insertProfileError } = await adminClient
        .from("profiles")
        .insert({
          id: createdUserId,
          full_name: identitas.nama.trim(),
          role: "researcher",
          unit_kerja: identitas.unitKerja.trim(),
          satuan_kerja: identitas.satuanKerja?.trim() ?? "",
        });

      if (insertProfileError) {
        throw new Error(insertProfileError.message);
      }

      const activityIds = await simpanAktivitas(
        createdUserId,
        identitas.nama.trim(),
        identitas.unitKerja.trim(),
        identitas.satuanKerja?.trim() ?? "",
        aktivitas
      );

      return response({
        success: true,
        id: createdUserId,
        jumlahAktivitas: activityIds.length,
        message: "Akun periset dan aktivitas berhasil dibuat.",
      });
    }

    if (body.action === "add_activities") {
      const perisetId = body.perisetId;
      const aktivitas = body.aktivitas as AktivitasPayload[];

      if (!perisetId) {
        throw new Error("ID periset tidak ditemukan.");
      }

      const { data: targetProfile, error: targetError } =
        await adminClient
          .from("profiles")
          .select("id, full_name, unit_kerja, satuan_kerja, role")
          .eq("id", perisetId)
          .single();

      if (targetError || !targetProfile) {
        throw new Error("Periset tujuan tidak ditemukan.");
      }

      if (targetProfile.role !== "researcher") {
        throw new Error("Akun tujuan bukan akun periset.");
      }

      const activityIds = await simpanAktivitas(
        targetProfile.id,
        targetProfile.full_name ?? "",
        targetProfile.unit_kerja ?? "",
        targetProfile.satuan_kerja ?? "",
        aktivitas
      );

      return response({
        success: true,
        jumlahAktivitas: activityIds.length,
        message: "Aktivitas berhasil ditambahkan.",
      });
    }

    return response({ error: "Action tidak dikenal." }, 400);
  } catch (error) {
    // Jika pembuatan profil/aktivitas gagal, batalkan akun Auth yang dibuat.
    if (createdUserId) {
      await adminClient.auth.admin.deleteUser(createdUserId);
    }

    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan.";

    return response({ error: message }, 400);
  }
});
