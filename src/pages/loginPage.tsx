import LoginBackground from "../components/login/loginBackground";
import LoginCard from "../components/login/loginCard";
import LoginForm, { type LoginValues } from "../components/login/loginForm";

export default function LoginPage() {
  const handleLogin = (values: LoginValues) => {
    // TODO: panggil API login di sini, lalu navigate("/dashboard") kalau berhasil
    console.log(values);
  };

  return (
    <LoginBackground>
      <LoginCard>
        <LoginForm onSubmit={handleLogin} />
      </LoginCard>
    </LoginBackground>
  );
}