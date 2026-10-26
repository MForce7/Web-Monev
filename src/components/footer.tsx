// export default function Footer() {
//   return (
//     <footer className="relative h-[300px] overflow-hidden bg-[url('../assets/foot-bg.webp')] bg-cover bg-center bg-no-repeat text-center text-white">
//       <div className="relative pt-[47px]">
//         <h3 className="m-0 text-[40px] font-bold leading-[48px]">
//           Organisasi Riset Penerbangan dan Antariksa
//         </h3>
//         <p className="m-0 text-[40px] font-normal leading-[48px]">
//           Badan Riset dan Inovasi Nasionala
//         </p>
//         <p className="m-0 mt-[36px] text-[32px] font-normal leading-[40px]">
//           © 2026 ORPA – BRIN
//         </p>
//       </div>
//     </footer>
//   );
// }



import footBg from "../assets/foot-bg.webp";

export default function Footer() {
  return (
    <footer
      className="relative h-max-[300px] overflow-hidden bg-cover bg-center bg-no-repeat text-center text-white"
      style={{ backgroundImage: `url(${footBg})` }}
    >
      {/* <div className="relative pt-[47px]"> */}
      <div className="flex h-auto flex-col items-center justify-center gap-[36px] pt-[47px]">
        <div>
          <h3 className="m-0 text-[36px] font-bold leading-[48px]">
            Organisasi Riset Penerbangan dan Antariksa
          </h3>
          <p className="m-0 text-[24px] font-normal leading-[48px]">
            Badan Riset dan Inovasi Nasional
          </p>
        </div>
        <p className="m-0 mt-auto text-[12px] font-normal leading-[40px]">
          © 2026 ORPA – BRIN
        </p>
      </div>
    </footer>
  );
}