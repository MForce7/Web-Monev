import footBg from "../assets/foot-bg.webp";

export default function Footer() {
  return (
    <footer
      className="relative w-full overflow-hidden bg-cover bg-center bg-no-repeat text-center text-white"
      style={{ backgroundImage: `url(${footBg})` }}
    >
      {/* Overlay tipis supaya teks tetap terbaca di gambar yang terang (opsional) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-black/30"
      />

      <div className="relative mx-auto flex min-h-52 w-full max-w-360 flex-col items-center justify-between gap-6 px-4 pb-4 pt-8 sm:min-h-64 sm:gap-9 sm:px-6 sm:pt-10 lg:min-h-75 lg:pt-11.75">
        <div>
          <h3 className="m-0 text-xl font-bold leading-8 sm:text-2xl sm:leading-10 lg:text-[32px] lg:leading-12">
            Organisasi Riset Penerbangan dan Antariksa
          </h3>
          <p className="m-0 mt-1 text-base font-normal leading-7 sm:text-lg sm:leading-9 lg:mt-0 lg:text-[20px] lg:leading-12">
            Badan Riset dan Inovasi Nasional
          </p>
        </div>

        <p className="m-0 text-xs font-normal leading-8 sm:leading-10">
          © 2026 ORPA – BRIN
        </p>
      </div>
    </footer>
  );
}