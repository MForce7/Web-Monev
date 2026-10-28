import Background from "../../assets/gedung-landing.png";

export default function Jumbotron() {
  return (
    <header
      className="w-screen relative min-h-[441px] bg-[#1e1e1e] bg-cover bg-center text-white"
      style={{ backgroundImage: `url("${Background}")` }}
    >
      {/* Overlay gradasi */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1e1e1e_21%,rgba(33,33,33,0.8)_82%,rgba(0,0,0,0.3)_100%)]" />

      {/* Konten */}
      <div className="relative mx-auto w-full max-w-[1440px] px-4 pt-[210px] text-center">
        <h1 className="m-0 bg-[linear-gradient(90deg,#fff_0%,#d9d9d9_60%)] bg-clip-text text-[44px] font-extrabold uppercase leading-[56px] tracking-[-1.5px] text-transparent [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.45))]">
          Organisasi Riset Penerbangan dan Antariksa
        </h1>
        <p className="mx-auto mt-[3px] max-w-[740px] text-[24px] font-semibold leading-[28px] text-[#e9e9e9] [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
          Pusat informasi perencanaan, penganggaran, dan pemantauan
          <br />
          kinerja Organisasi Riset Penerbangan dan Antariksa.
        </p>
      </div>
    </header>
  );
}