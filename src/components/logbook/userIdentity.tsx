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
      className="flex w-full items-center gap-6 overflow-hidden rounded-2xl border border-blue-200 bg-blue-100 bg-cover bg-center p-6 shadow-md"
      style={{ backgroundImage: `url(${identityBackground})` }}
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 shadow-sm md:h-28 md:w-28">
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

      <div className="flex flex-col gap-2.5 text-sm font-bold text-blue-900 sm:text-base md:text-lg">
        <div className="grid grid-cols-[120px_10px_1fr] items-center sm:grid-cols-[140px_10px_1fr]">
          <span>Nama Ketua</span><span>:</span>
          {showTextSkeleton ? <span className="h-4 w-32 animate-pulse rounded bg-blue-200/60 motion-reduce:animate-none" /> : <span>{shownNama}</span>}
        </div>
        <div className="grid grid-cols-[120px_10px_1fr] items-center sm:grid-cols-[140px_10px_1fr]">
          <span>Unit Kerja</span><span>:</span>
          {showTextSkeleton ? <span className="h-4 w-40 animate-pulse rounded bg-blue-200/60 motion-reduce:animate-none" /> : <span>{shownUnitKerja}</span>}
        </div>
        <div className="grid grid-cols-[120px_10px_1fr] items-center sm:grid-cols-[140px_10px_1fr]">
          <span>Satuan Kerja</span><span>:</span>
          {showTextSkeleton ? <span className="h-4 w-48 animate-pulse rounded bg-blue-200/60 motion-reduce:animate-none" /> : <span>{shownSatuanKerja}</span>}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;