import React from "react";
import { useAvatar } from "../../lib/useAvatar";
import { useLogbookData } from "../../lib/LogbookDataContext";
import identityBackground from "../../assets/identityBackground.svg";

interface ProfileCardProps {
  namaKetua?: string;
  unitKerja?: string;
  satuanKerja?: string;
  avatarUrl?: string;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const FALLBACK = {
  namaKetua: "Nama belum diisi",
  unitKerja: "Unit kerja belum diisi",
  satuanKerja: "Satuan kerja belum diisi",
};

/** Satu baris identitas: HP = label di atas isi, >=640px = label | titik dua | isi */
function InfoLine({ label, skeletonWidth, loading, value }: {
  label: string;
  skeletonWidth: string;
  loading: boolean;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[140px_10px_1fr] sm:items-start sm:gap-0">
      <span className="text-xs font-semibold text-blue-700 sm:text-inherit sm:font-bold sm:text-blue-900">
        {label}
      </span>
      <span className="hidden sm:inline">:</span>
      {loading ? (
        <span className={`h-4 ${skeletonWidth} animate-pulse rounded bg-blue-200/60 motion-reduce:animate-none`} />
      ) : (
        <span className="min-w-0 break-words">{value}</span>
      )}
    </div>
  );
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  namaKetua,
  unitKerja,
  satuanKerja,
  avatarUrl,
}) => {
  const { profile, loading } = useLogbookData();

  const { photoUrl, loading: avatarLoading } = useAvatar(avatarUrl ? undefined : profile?.id);
  const shownPhoto = avatarUrl ?? photoUrl;
  const showAvatarSkeleton = !avatarUrl && avatarLoading && !photoUrl;

  const shownNama = namaKetua ?? profile?.fullName ?? (loading ? "" : FALLBACK.namaKetua);
  const shownUnitKerja = unitKerja ?? profile?.unitKerja ?? (loading ? "" : FALLBACK.unitKerja);
  const shownSatuanKerja = satuanKerja ?? profile?.satuanKerja ?? (loading ? "" : FALLBACK.satuanKerja);
  const showTextSkeleton = loading && !namaKetua && !profile;

  return (
    <div
      className="flex w-full flex-col items-center gap-4 overflow-hidden rounded-2xl border border-blue-200 bg-blue-100 bg-cover bg-center p-4 shadow-md sm:flex-row sm:items-center sm:gap-6 sm:p-6"
      style={{ backgroundImage: `url(${identityBackground})` }}
    >
      {/* Foto: di atas (HP), di kiri (>=640px) */}
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 shadow-sm md:h-28 md:w-28">
        {showAvatarSkeleton ? (
          <div role="img" aria-label="Memuat foto" className="h-full w-full animate-pulse rounded-xl bg-gray-200 motion-reduce:animate-none" />
        ) : shownPhoto ? (
          <img src={shownPhoto} alt={shownNama || "Foto profil"} className="h-full w-full rounded-xl object-cover" />
        ) : (
          <div role="img" aria-label={shownNama || "Foto profil"} className="flex h-full w-full items-center justify-center rounded-xl bg-blue-100 text-2xl font-bold text-blue-900">
            {getInitials(shownNama || "?")}
          </div>
        )}
      </div>

      {/* Identitas */}
      <div className="flex w-full min-w-0 flex-col gap-3 text-base font-bold text-blue-900 sm:flex-1 sm:gap-2.5 md:text-lg">
        <InfoLine label="Nama Ketua" skeletonWidth="w-32" loading={showTextSkeleton} value={shownNama} />
        <InfoLine label="Unit Kerja" skeletonWidth="w-40" loading={showTextSkeleton} value={shownUnitKerja} />
        <InfoLine label="Satuan Kerja" skeletonWidth="w-48" loading={showTextSkeleton} value={shownSatuanKerja} />
      </div>
    </div>
  );
};

export default ProfileCard;