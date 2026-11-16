import Background from "../../assets/gedung-landing.png";

export default function Jumbotron() {
  return (
    <header
      className="relative min-h-80 w-full bg-[#1e1e1e] bg-cover bg-center text-white sm:min-h-96 lg:min-h-110.25"
      style={{ backgroundImage: `url("${Background}")` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1e1e1e_21%,rgba(33,33,33,0.8)_82%,rgba(0,0,0,0.3)_100%)]" />

      <div className="relative mx-auto w-full max-w-360 px-4 pb-10 pt-28 text-center sm:px-6 sm:pt-40 lg:pb-12 lg:pt-52.5">
        <h1 className="m-0 bg-[linear-gradient(90deg,#fff_0%,#d9d9d9_60%)] bg-clip-text text-3xl font-extrabold uppercase leading-tight tracking-tight text-transparent filter-[drop-shadow(0_2px_3px_rgba(0,0,0,0.45))] sm:text-4xl lg:text-[44px] lg:leading-14 lg:tracking-[-1.5px]">
          Organisasi Riset Penerbangan dan Antariksa
        </h1>
        <p className="mx-auto mt-3 max-w-185 text-base font-semibold leading-6 text-[#e9e9e9] [text-shadow:0_2px_4px_rgba(0,0,0,0.5)] sm:text-xl lg:mt-0.75 lg:text-[24px] lg:leading-7">
          Pusat informasi perencanaan, penganggaran, dan pemantauan
          <br className="hidden md:block" />{" "}
          kinerja Organisasi Riset Penerbangan dan Antariksa.
        </p>
      </div>
    </header>
  );
}