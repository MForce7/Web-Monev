import logoBrin from "../../assets/dashboardLogo.svg";
import bgLeftPattern from "../../assets/login_page_background3.svg";
import buildingPicture from "../../assets/brin_login_picture.png";

export const ASSETS = {
  bgLeft: bgLeftPattern,
  logo: logoBrin,
  building: buildingPicture,
};

// jeda awal isi panel kanan, supaya muncul setelah panel meluncur masuk
export const FORM_DELAY = 450;

export const inputClass =
  "w-full rounded-full border border-gray-400 bg-gray-50/50 px-5 py-3 text-gray-800 transition duration-200 focus:border-transparent focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-600";

export const linkClass =
  "font-medium text-indigo-600 transition duration-150 hover:text-indigo-800";