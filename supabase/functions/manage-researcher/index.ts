
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

type ImportAttachment = { label: string; url: string };
type ImportOutput = {
  jenis: string;
  judul: string;
  status: string;
  capaian: number;
  keterangan: string;
  dataDukung: ImportAttachment[];
};
type ImportMonth = {
  bulan: string;
  aktivitas: {
    uraian: string;
    kendala: string;
    mitigasi: string;
    dataDukung: ImportAttachment[];
  };
  output: ImportOutput;
  outputTambahan: ImportOutput[];
};
type ImportEntry = {
  header: {
    namaKetua: string;
    unitKerja: string;
    satuanKerja: string;
    judulAktivitas: string;
    tahunPelaksanaan: number;
    targetOutputs: TargetPayload[];
    progresTotal: number;
    progresKeterangan: string;
    statusPelaksanaan: string;
  };
  bulanan: ImportMonth[];
};
type ImportProfile = {
  id: string;
  full_name: string | null;
  unit_kerja: string | null;
  satuan_kerja: string | null;
  role: string;
};

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function percentage(value: unknown, label: string): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${label} harus berupa angka antara 0 sampai 100.`);
  }
  return parsed;
}

function parseAttachments(value: unknown): ImportAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = record(item);
    const label = text(row.label);
    const rawUrl = text(row.url);
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : "";
    return label || url ? [{ label: label || url, url }] : [];
  });
}

function parseOutput(value: unknown, label: string): ImportOutput {
  const row = record(value);
  return {
    jenis: text(row.jenis),
    judul: text(row.judul),
    status: text(row.status),
    capaian: percentage(row.capaian, `${label} capaian`),
    keterangan: text(row.keterangan),
    dataDukung: parseAttachments(row.dataDukung),
  };
}

function parseImportEntry(value: unknown, index: number): ImportEntry {
  const row = record(value);
  const header = record(row.header);
  const namaKetua = text(header.namaKetua);
  if (!namaKetua) throw new Error(`Nama ketua pada data ke-${index + 1} wajib diisi.`);

  const tahunPelaksanaan = Number(header.tahunPelaksanaan);
  if (!Number.isInteger(tahunPelaksanaan) || tahunPelaksanaan < 2000 || tahunPelaksanaan > 2100) {
    throw new Error(`Tahun pelaksanaan pada data ke-${index + 1} tidak valid.`);
  }

  const targetOutputs = Array.isArray(header.targetOutputs)
    ? header.targetOutputs.flatMap((item) => {
        const target = record(item);
        const jenis = text(target.jenis);
        const jumlah = Number(target.jumlah);
        return jenis && Number.isInteger(jumlah) && jumlah >= 0
          ? [{ jenis, jumlah }]
          : [];
      })
    : [];
  const bulananRaw = Array.isArray(row.bulanan) ? row.bulanan : [];
  const bulanan = bulananRaw.map((monthRaw, monthIndex) => {
    const month = record(monthRaw);
    const bulan = text(month.bulan);
    if (!BULAN.includes(bulan)) {
      throw new Error(`Bulan pada data ke-${index + 1}, baris ${monthIndex + 1} tidak valid.`);
    }

    const aktivitas = record(month.aktivitas);
    const outputs = [
      parseOutput(month.output, `${bulan} output utama`),
      ...(Array.isArray(month.outputTambahan)
        ? month.outputTambahan.map((output, outputIndex) =>
            parseOutput(output, `${bulan} output ${outputIndex + 2}`))
        : []),
    ];

    return {
      bulan,
      aktivitas: {
        uraian: text(aktivitas.uraian),
        kendala: text(aktivitas.kendala),
        mitigasi: text(aktivitas.mitigasi),
        dataDukung: parseAttachments(aktivitas.dataDukung),
      },
      output: outputs[0],
      outputTambahan: outputs.slice(1),
    };
  });

  return {
    header: {
      namaKetua,
      unitKerja: text(header.unitKerja),
      satuanKerja: text(header.satuanKerja),
      judulAktivitas: text(header.judulAktivitas),
      tahunPelaksanaan,
      targetOutputs,
      progresTotal: percentage(header.progresTotal, `Progres total data ke-${index + 1}`),
      progresKeterangan: text(header.progresKeterangan),
      statusPelaksanaan: text(header.statusPelaksanaan),
    },
    bulanan,
  };
}

function isFilledOutput(output: ImportOutput): boolean {
  return Boolean(
    output.jenis ||
    output.judul ||
    (output.status && output.status !== "Belum Mulai") ||
    output.keterangan ||
    output.capaian > 0 ||
    output.dataDukung.length
  );
}

function isFilledMonth(month: ImportMonth): boolean {
  return Boolean(
    month.aktivitas.uraian ||
    month.aktivitas.kendala ||
    month.aktivitas.mitigasi ||
    month.aktivitas.dataDukung.length ||
    [month.output, ...month.outputTambahan].some(isFilledOutput)
  );
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

async function rollbackNewActivity(activityId: string): Promise<void> {
  const { data: reports, error: reportsError } = await adminClient
    .from("monthly_reports")
    .select("id")
    .eq("activity_id", activityId);
  if (reportsError) throw new Error(reportsError.message);

  const reportIds = (reports ?? []).map((report) => report.id);
  if (reportIds.length > 0) {
    const { error: filesError } = await adminClient
      .from("support_files")
      .delete()
      .in("monthly_report_id", reportIds);
    if (filesError) throw new Error(filesError.message);

    const { error: reportsDeleteError } = await adminClient
      .from("monthly_reports")
      .delete()
      .in("id", reportIds);
    if (reportsDeleteError) throw new Error(reportsDeleteError.message);
  }

  const { error: targetsError } = await adminClient
    .from("target_outputs")
    .delete()
    .eq("activity_id", activityId);
  if (targetsError) throw new Error(targetsError.message);

  const { error: activityError } = await adminClient
    .from("activities")
    .delete()
    .eq("id", activityId);
  if (activityError) throw new Error(activityError.message);
}

async function simpanImportLogbook(
  entry: ImportEntry,
  gabung: boolean,
  profiles: ImportProfile[],
) {
  const { header } = entry;
  const nameMatches = profiles.filter(
    (profile) => normalizeText(profile.full_name ?? "") === normalizeText(header.namaKetua)
  );
  const profileMatches = nameMatches.filter(
    (profile) =>
      !header.unitKerja ||
      normalizeText(profile.unit_kerja ?? "") === normalizeText(header.unitKerja)
  );

  if (profileMatches.length !== 1) {
    throw new Error(
      profileMatches.length === 0
        ? `Profil periset "${header.namaKetua}"${header.unitKerja ? ` (${header.unitKerja})` : ""} tidak ditemukan.`
        : `Profil periset "${header.namaKetua}" tidak unik; pastikan Unit Kerja terisi dengan benar.`
    );
  }

  const profile = profileMatches[0];
  const judul = header.judulAktivitas;
  let activity: Record<string, unknown> | null = null;

  if (gabung && judul) {
    const { data: matches, error: activityError } = await adminClient
      .from("activities")
      .select("*")
      .eq("owner_id", profile.id)
      .eq("judul_aktivitas", judul)
      .eq("tahun_pelaksanaan", header.tahunPelaksanaan)
      .limit(2);

    if (activityError) throw new Error(activityError.message);
    if ((matches ?? []).length > 1) {
      throw new Error(`Aktivitas "${judul}" tahun ${header.tahunPelaksanaan} ditemukan lebih dari satu.`);
    }
    activity = matches?.[0] ?? null;
  }

  const activityPayload = {
    owner_id: profile.id,
    nama_ketua: profile.full_name ?? header.namaKetua,
    unit_kerja: header.unitKerja || profile.unit_kerja || "",
    satuan_kerja: header.satuanKerja || profile.satuan_kerja || "",
    judul_aktivitas: judul || String(activity?.judul_aktivitas ?? ""),
    tahun_pelaksanaan: header.tahunPelaksanaan,
    progres_total: header.progresTotal || Number(activity?.progres_total ?? 0),
    progres_keterangan: header.progresKeterangan || String(activity?.progres_keterangan ?? ""),
    status_pelaksanaan: header.statusPelaksanaan || String(activity?.status_pelaksanaan ?? "Persiapan"),
    kategori_pendanaan: String(activity?.kategori_pendanaan ?? "Rupiah Murni"),
    unit_pengampu_difa: String(activity?.unit_pengampu_difa ?? ""),
    program_skema_pendanaan: String(activity?.program_skema_pendanaan ?? ""),
    judul_kontrak: String(activity?.judul_kontrak ?? ""),
    target_penerimaan: Number(activity?.target_penerimaan ?? 0),
    target_penggunaan: Number(activity?.target_penggunaan ?? 0),
    banyak_termin: Number(activity?.banyak_termin ?? 0),
    status_kontrak: String(activity?.status_kontrak ?? ""),
    updated_at: new Date().toISOString(),
  };

  let activityId = typeof activity?.id === "string" ? activity.id : "";
  let created = false;
  let perubahanDimulai = false;
  try {
    if (activityId) {
      const { error } = await adminClient
        .from("activities")
        .update(activityPayload)
        .eq("id", activityId);
      if (error) throw new Error(error.message);
      perubahanDimulai = true;
    } else {
      const { data, error } = await adminClient
        .from("activities")
        .insert(activityPayload)
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Aktivitas gagal dibuat.");
      activityId = data.id;
      created = true;
      perubahanDimulai = true;
    }

    const targets = header.targetOutputs
      .filter((target) => target.jenis)
      .map((target) => ({
        activity_id: activityId,
        jenis: target.jenis,
        jumlah: target.jumlah,
      }));

    if (targets.length > 0) {
      const { error: deleteTargetsError } = await adminClient
        .from("target_outputs")
        .delete()
        .eq("activity_id", activityId);
      if (deleteTargetsError) throw new Error(deleteTargetsError.message);

      const { error: insertTargetsError } = await adminClient
        .from("target_outputs")
        .insert(targets);
      if (insertTargetsError) throw new Error(insertTargetsError.message);
    }

    for (const month of entry.bulanan) {
      if (!isFilledMonth(month)) continue;
      const bulan = BULAN.indexOf(month.bulan) + 1;
      const outputs = [month.output, ...month.outputTambahan].filter(isFilledOutput);

      const { data: reports, error: reportLookupError } = await adminClient
        .from("monthly_reports")
        .select("id")
        .eq("activity_id", activityId)
        .eq("bulan", bulan)
        .limit(2);
      if (reportLookupError) throw new Error(reportLookupError.message);
      if ((reports ?? []).length > 1) {
        throw new Error(`Ditemukan lebih dari satu laporan bulan ${month.bulan} pada aktivitas "${judul}".`);
      }

      const firstOutput = outputs[0];
      const reportPayload = {
        activity_id: activityId,
        bulan,
        uraian: month.aktivitas.uraian,
        kendala: month.aktivitas.kendala,
        mitigasi: month.aktivitas.mitigasi,
        output_jenis: firstOutput?.jenis ?? "",
        output_judul: firstOutput?.judul ?? "",
        output_status: firstOutput?.status ?? "",
        output_capaian: firstOutput?.capaian ?? 0,
        updated_at: new Date().toISOString(),
      };

      let reportId = reports?.[0]?.id as string | undefined;
      if (reportId) {
        const { error } = await adminClient
          .from("monthly_reports")
          .update(reportPayload)
          .eq("id", reportId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await adminClient
          .from("monthly_reports")
          .insert(reportPayload)
          .select("id")
          .single();
        if (error || !data) throw new Error(error?.message ?? `Laporan ${month.bulan} gagal dibuat.`);
        reportId = data.id;
      }

      const { error: deleteFilesError } = await adminClient
        .from("support_files")
        .delete()
        .eq("monthly_report_id", reportId);
      if (deleteFilesError) throw new Error(deleteFilesError.message);

      const { error: deleteOutputsError } = await adminClient
        .from("monthly_report_outputs")
        .delete()
        .eq("monthly_report_id", reportId);
      if (deleteOutputsError) throw new Error(deleteOutputsError.message);

      const outputRows = outputs.map((output, urutan) => ({
        monthly_report_id: reportId,
        urutan,
        jenis: output.jenis,
        judul: output.judul,
        status: output.status,
        capaian: output.capaian,
        keterangan: output.keterangan,
      }));

      const { data: insertedOutputs, error: insertOutputsError } =
        outputRows.length > 0
          ? await adminClient
              .from("monthly_report_outputs")
              .insert(outputRows)
              .select("id, urutan")
          : { data: [], error: null };
      if (insertOutputsError) throw new Error(insertOutputsError.message);

      const files = [
        ...month.aktivitas.dataDukung.map((file) => ({
          monthly_report_id: reportId,
          kategori: "aktivitas",
          label: file.label,
          url: file.url || null,
          storage_path: null,
          monthly_report_output_id: null,
        })),
        ...outputs.flatMap((output, urutan) => {
          const outputId = insertedOutputs?.find((item) => item.urutan === urutan)?.id;
          if (!outputId) return [];
          return output.dataDukung.map((file) => ({
            monthly_report_id: reportId,
            kategori: "output",
            label: file.label,
            url: file.url || null,
            storage_path: null,
            monthly_report_output_id: outputId,
          }));
        }),
      ];

      if (files.length > 0) {
        const { error: insertFilesError } = await adminClient
          .from("support_files")
          .insert(files);
        if (insertFilesError) throw new Error(insertFilesError.message);
      }
    }

    return {
      nama: header.namaKetua,
      unitKerja: header.unitKerja,
      activityId,
      success: true,
      message: "Tersimpan.",
    };
  } catch (error) {
    if (created && activityId) {
      try {
        await rollbackNewActivity(activityId);
      } catch (rollbackError) {
        const detail = error instanceof Error ? error.message : "Gagal menyimpan logbook.";
        throw new Error(
          `${detail} Pembersihan aktivitas baru juga gagal: ${
            rollbackError instanceof Error ? rollbackError.message : "kesalahan tidak diketahui"
          }`,
        );
      }
    } else if (perubahanDimulai) {
      const detail = error instanceof Error ? error.message : "Gagal menyimpan logbook.";
      throw new Error(`Sebagian data aktivitas mungkin sudah diperbarui. ${detail}`);
    }
    throw error;
  }
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

    if (body.action === "import_logbook") {
      if (!Array.isArray(body.entries) || body.entries.length === 0) {
        throw new Error("Tidak ada logbook yang bisa diimport.");
      }

      const entries = body.entries.map(parseImportEntry);
      const gabung = body.gabung !== false;
      const { data: profiles, error: profilesError } = await adminClient
        .from("profiles")
        .select("id, full_name, unit_kerja, satuan_kerja, role")
        .eq("role", "researcher");
      if (profilesError) throw new Error(profilesError.message);

      const hasil: {
        nama: string;
        unitKerja: string;
        activityId?: string;
        success: boolean;
        message: string;
      }[] = [];

      for (const entry of entries) {
        try {
          hasil.push(await simpanImportLogbook(entry, gabung, profiles ?? []));
        } catch (error) {
          hasil.push({
            nama: entry.header.namaKetua,
            unitKerja: entry.header.unitKerja,
            success: false,
            message: error instanceof Error ? error.message : "Gagal menyimpan logbook.",
          });
        }
      }

      const berhasil = hasil.filter((item) => item.success).length;
      return response({
        success: berhasil === hasil.length,
        total: hasil.length,
        berhasil,
        gagal: hasil.length - berhasil,
        hasil,
      });
    }

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
