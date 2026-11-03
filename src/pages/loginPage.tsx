import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import LoginBackground from "../components/login/loginBackground";
import LoginCard from "../components/login/loginCard";
import LoginForm, { type LoginValues } from "../components/login/loginForm";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";

function translateError(message: string, status?: number): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau password salah.";
  if (m.includes("email not confirmed")) return "Akun belum dikonfirmasi. Hubungi admin.";
  if (m.includes("failed to fetch"))
    return "Tidak bisa terhubung ke server. Cek koneksi internet Anda.";
  if (status === 429 || m.includes("rate limit"))
    return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
  return message;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useSession();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Halaman yang tadi ingin dibuka sebelum diarahkan ke login (diisi ProtectedRoute)
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    "/dashboard";

  // Semua hook sudah dipanggil di atas, baru boleh return lebih awal
  if (loading) return null;
  if (session) return <Navigate to={from} replace />;

  const handleLogin = async ({ username, password }: LoginValues) => {
    const email = username.trim();
    if (!email || !password) {
      setError("Isi email dan password dulu.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Format email tidak valid.");
      return;
    }
    setBusy(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (authError) {
      setError(translateError(authError.message, authError.status));
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <LoginBackground>
      <LoginCard>
        <LoginForm onSubmit={handleLogin} busy={busy} error={error} />
      </LoginCard>
    </LoginBackground>
  );
}