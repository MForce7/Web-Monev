
import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import MonevEditor from './MonevEditor'






// Komponen Halaman Utama (Home)
function Home({ onLogin }: { onLogin: () => void }) {
  return (
    <div>
      <h1>Selamat Datang</h1>
      <p>Silakan masuk ke akun Anda.</p>

      <button
        type="button"
        onClick={onLogin}
      >
        Ke Halaman Login
      </button>
    </div>
  )
}

// Komponen Halaman Login
function LoginPage({ onHome }: { onHome: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleEmailLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Contoh sementara, belum melakukan autentikasi
    alert(`Logging in with Email: ${email}`)
  }

  const handleGoogleLogin = () => {
    // Contoh sementara, belum terhubung ke Google OAuth
    alert('Google login clicked')
  }

  return (
    <div>
      <h2>Sign In</h2>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
      >
        Continue with Google
      </button>

      <hr />

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit">Sign In</button>
      </form>

      <p style={{ marginTop: '20px' }}>
        <button type="button" onClick={onHome}>Kembali ke Beranda</button>
      </p>
    </div>
  )
}

// Komponen Utama App
function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  return (
    path === '/login'
      ? <LoginPage onHome={() => navigate('/')} />
      : <Home onLogin={() => navigate('/login')} />
  )
}

export default App
