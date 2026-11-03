import { Link, Outlet } from "react-router-dom";
import Navbar from "./navbar.tsx";
import Footer from "./footer.tsx";
import { supabase } from '../lib/supabase'

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}