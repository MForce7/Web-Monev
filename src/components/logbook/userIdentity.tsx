import React from "react";
import { useAuth } from "../../lib/AuthContext";
import { useAvatar } from "../../lib/useAvatar";
import { useProfile } from "../../lib/useProfile";
import identityBackground from "../../assets/identityBackground.svg";

interface ProfileCardProps {
  /** Opsional: paksa nilai tertentu, menimpa data dari tabel profiles. */
  namaKetua?: string;
  unitKerja?: string;
  satuanKerja?: string;
  /** Opsional: paksa pakai foto tertentu (menimpa foto dari profil). */
  avatarUrl?: string;
  /** Opsional: ID user pemilik profil & foto. Kosong = user yang sedang login. */
  userId?: string;
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
  userId,
}) => {
  const { session } = useAuth();
  const targetId = userId ?? session?.user.id;

  // Data dari tabel profiles (hanya di-fetch kalau targetId ada)
  const { profile, loading: profileLoading } = useProfile(targetId);

  // Foto diambil dari hook useAvatar. Kalau avatarUrl diisi manual, hook tidak dijalankan.
  const { photoUrl, loading: avatarLoading } = useAvatar(avatarUrl ? undefined : targetId);
  const shownPhoto = avatarUrl ?? photoUrl;
  const showAvatarSkeleton = !avatarUrl && avatarLoading && !photoUrl;

  // Prioritas: prop manual > data dari DB > fallback teks
  const shownNama = namaKetua ?? profile?.fullName ?? (profileLoading ? "" : FALLBACK.namaKetua);
  const shownUnitKerja = unitKerja ?? profile?.unitKerja ?? (profileLoading ? "" : FALLBACK.unitKerja);
  const shownSatuanKerja = satuanKerja ?? profile?.satuanKerja ?? (profileLoading ? "" : FALLBACK.satuanKerja);

  // Skeleton teks hanya saat benar-benar masih menunggu DB dan tidak ada prop override
  const showTextSkeleton = profileLoading && !namaKetua && !profile;

  return (
    <div
      className="flex w-full items-center gap-6 overflow-hidden rounded-2xl border border-blue-200 bg-blue-100 bg-cover bg-center p-6 shadow-md"
      style={{ backgroundImage: `url(${identityBackground})` }}
    >
      {/* Avatar Container */}
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 shadow-sm md:h-28 md:w-28">
        {showAvatarSkeleton ? (
          <div
            role="img"
            aria-label="Memuat foto"
            className="h-full w-full animate-pulse rounded-xl bg-gray-200 motion-reduce:animate-none"
          />
        ) : shownPhoto ? (
          <img
            src={shownPhoto}
            alt={shownNama || "Foto profil"}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={shownNama || "Foto profil"}
            className="flex h-full w-full items-center justify-center rounded-xl bg-blue-100 text-2xl font-bold text-blue-900"
          >
            {getInitials(shownNama || "?")}
          </div>
        )}
      </div>

      {/* Info Details */}
      <div className="flex flex-col gap-2.5 text-sm font-bold text-blue-900 sm:text-base md:text-lg">
        {/* Row 1: Nama Ketua */}
        <div className="grid grid-cols-[120px_10px_1fr] items-center sm:grid-cols-[140px_10px_1fr]">
          <span>Nama Ketua</span>
          <span>:</span>
          {showTextSkeleton ? (
            <span className="h-4 w-32 animate-pulse rounded bg-blue-200/60 motion-reduce:animate-none" />
          ) : (
            <span>{shownNama}</span>
          )}
        </div>

        {/* Row 2: Unit Kerja */}
        <div className="grid grid-cols-[120px_10px_1fr] items-center sm:grid-cols-[140px_10px_1fr]">
          <span>Unit Kerja</span>
          <span>:</span>
          {showTextSkeleton ? (
            <span className="h-4 w-40 animate-pulse rounded bg-blue-200/60 motion-reduce:animate-none" />
          ) : (
            <span>{shownUnitKerja}</span>
          )}
        </div>

        {/* Row 3: Satuan Kerja */}
        <div className="grid grid-cols-[120px_10px_1fr] items-center sm:grid-cols-[140px_10px_1fr]">
          <span>Satuan Kerja</span>
          <span>:</span>
          {showTextSkeleton ? (
            <span className="h-4 w-48 animate-pulse rounded bg-blue-200/60 motion-reduce:animate-none" />
          ) : (
            <span>{shownSatuanKerja}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;