import type { CSSProperties, ReactNode } from "react";
import Item from "./Item";
import { ASSETS } from "./constants";

export default function LoginCard({ children }: { children: ReactNode }) {
  return (
    // CARD: background SVG membentang sampai sisi kanan
    <div
      className="login-card relative z-10 flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#8b0000] bg-cover bg-top bg-no-repeat shadow-2xl md:flex-row"
      style={{ backgroundImage: `url('${ASSETS.bgLeft}')` }}
    >
      {/* ============ KIRI: hanya teks (tanpa panel) ============ */}
      <div className="relative z-10 flex flex-1 flex-col p-8 text-white sm:p-12 md:basis-1/2">
        <img
          src={ASSETS.logo}
          alt="Logo BRIN"
          className="login-left absolute left-0 top-0 z-20 h-100 w-auto object-contain sm:h-auto"
          style={{ "--i": 0, "--d": "200ms" } as CSSProperties}
        />

        <div className="my-auto py-12">
          <Item index={0} delay={400} className="login-left">
            <h1 className="mb-4 text-3xl font-extrabold uppercase leading-tight tracking-wide sm:text-4xl lg:text-5xl">
              Monitoring &amp;
              <br />
              Evaluasi
            </h1>
          </Item>
          <Item index={1} delay={400} className="login-left">
            <p className="text-lg font-light text-red-100 sm:text-xl">
              Sistem Pemantauan Capaian Output
            </p>
          </Item>
        </div>
      </div>

      {/* ============ KANAN: panel putih, ujung kiri rounded ============ */}
      <section className="login-panel relative z-10 flex flex-1 flex-col justify-between overflow-hidden rounded-t-[40px] bg-white p-8 sm:p-12 md:basis-1/2 md:rounded-l-[60px] md:rounded-tr-none">
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