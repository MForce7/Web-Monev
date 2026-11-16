import type { CSSProperties, ReactNode } from "react";
import Item from "./item";
import { ASSETS } from "./constants";

// Pola segitiga tipis untuk latar merah di HP (di desktop pola sudah ada di background SVG).
// Ubah fill-opacity (0.05) kalau mau lebih tebal/tipis.
const PATTERN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'><path d='M8 8L34 21L8 34Z M42 42L62 52L42 62Z' fill='white' fill-opacity='0.05'/></svg>`;
const PATTERN_URL = `url("data:image/svg+xml,${encodeURIComponent(PATTERN_SVG)}")`;

export default function LoginCard({ children }: { children: ReactNode }) {
  return (
    // CARD: di HP susunannya atas-bawah (latar merah + pola). Mulai layar md (768px) kiri-kanan dengan
    // background SVG seperti desain desktop.
    // @container: ukuran logo di desktop mengikuti lebar card (satuan cqw), jadi tidak meluber di layar sedang.
    <div
      className="login-card @container relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#8b0000] bg-cover bg-top bg-no-repeat shadow-2xl md:min-h-[clamp(520px,82dvh,640px)] md:flex-row md:bg-[image:var(--login-bg)]"
      style={{ "--login-bg": `url('${ASSETS.bgLeft}')` } as CSSProperties}
    >
      {/* Pola latar merah (hanya HP) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 md:hidden"
        style={{ backgroundImage: PATTERN_URL, backgroundSize: "72px 72px" }}
      />

      {/* ============ KIRI: teks ============ */}
      <div className="relative z-10 flex flex-none flex-col p-6 pt-24 text-white sm:p-10 sm:pt-28 md:flex-1 md:basis-1/2 md:p-8 md:pt-28 lg:p-12 lg:pt-12">
        {/* Logo di HP: hanya gambar, tanpa pembungkus putih. */}
        <img
          src={ASSETS.logo}
          alt="Logo BRIN"
          className="login-left absolute left-0 top-0 z-20 h-auto w-[40vw] max-w-[11rem] object-contain md:hidden"
        />

        {/* Logo di desktop: menempel di pojok kiri atas, lebar dibatasi 20% lebar card. */}
        <img
          src={ASSETS.logo}
          alt="Logo BRIN"
          className="login-left absolute left-0 top-0 z-20 hidden h-auto w-auto max-w-[20cqw] object-contain md:block"
          style={{ "--i": 0, "--d": "200ms" } as CSSProperties}
        />

        <div className="my-auto py-4 md:py-12">
          <Item index={0} delay={400} className="login-left">
            <h1 className="mb-3 break-words text-3xl font-extrabold uppercase leading-tight tracking-wide sm:mb-4 sm:text-4xl md:text-3xl lg:text-5xl">
              Monitoring &amp;
              <br />
              Evaluasi
            </h1>
          </Item>
          <Item index={1} delay={400} className="login-left">
            <p className="text-base font-light text-red-100 sm:text-xl">
              Sistem Pemantauan Capaian Output
            </p>
          </Item>
        </div>
      </div>

      {/* ============ KANAN: panel putih, ujung kiri rounded ============ */}
      <section className="login-panel relative z-10 flex flex-1 flex-col justify-between overflow-hidden rounded-t-[32px] bg-white p-6 sm:rounded-t-[40px] sm:p-10 md:basis-1/2 md:rounded-l-[60px] md:rounded-tr-none md:p-8 lg:p-12">
        {/* watermark gedung */}
        <div
          className="login-watermark pointer-events-none absolute bottom-0 right-0 h-1/2 w-full bg-contain bg-bottom bg-no-repeat opacity-20"
          style={{ backgroundImage: `url('${ASSETS.building}')` }}
        />

        {children}
      </section>
    </div>
  );
}