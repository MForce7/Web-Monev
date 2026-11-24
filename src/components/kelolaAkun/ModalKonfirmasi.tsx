import { useEffect, type ReactNode } from "react";

/** Pop-up konfirmasi: di HP naik dari bawah, di layar lebar di tengah. Esc / klik latar = batal. */
export function ModalKonfirmasi({
  judul,
  children,
  menghapus,
  galat,
  onYa,
  onBatal,
}: {
  judul: string;
  children: ReactNode;
  menghapus: boolean;
  galat: string;
  onYa: () => void;
  onBatal: () => void;
}) {
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !menghapus) onBatal();
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [menghapus, onBatal]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !menghapus) onBatal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-modal-hapus"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fee2e2]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="judul-modal-hapus" className="text-base font-extrabold text-[#1b3560] [overflow-wrap:anywhere]">
              {judul}
            </h3>
            <div className="mt-1.5 space-y-2 text-sm text-slate-600">{children}</div>
          </div>
        </div>

        {galat && (
          <p role="alert" className="mt-3 rounded-lg bg-[#fee2e2] px-3 py-2 text-xs font-semibold text-[#991b1b] [overflow-wrap:anywhere]">
            {galat}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            disabled={menghapus}
            onClick={onBatal}
            className="rounded-full border border-[#9db8e0] px-5 py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd] disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={menghapus}
            onClick={onYa}
            className="rounded-full bg-[#dc2626] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {menghapus ? "Menghapus…" : "Ya, hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}