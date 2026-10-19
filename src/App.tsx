import { Outlet, Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="app-container">
      {/* Header / Navbar Global */}
      <header style={{ padding: '1rem', background: '#222', color: '#fff' }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" style={{ color: '#fff' }}>Home</Link>
          <Link to="/tester" style={{ color: '#fff' }}>Tester</Link>
          <Link to="/login" style={{ color: '#4caf50', marginLeft: 'auto' }}>Login</Link>
        </nav>
      </header>

      {/* Outlet adalah tempat halaman anak (Home, Tester, dll) disisipkan */}
      <main style={{ padding: '2rem' }} className="flex flex-col items-center justify-center ">
        <Outlet />
      </main>

      {/* Footer Global */}
      <footer style={{ padding: '1rem', borderTop: '1px solid #ccc', textAlign: 'center' }}>
        <p>&copy; 2026 My App</p>
      </footer>
    </div>
  )
}