import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'


import Dashboard2 from './pages/dashboard_v2.tsx'
import Tester from './pages/tester.tsx'
import LoginPage from './pages/loginPage.tsx'
// import LoginPage from './pages/login_v2.tsx'
import TestUpload from './pages/TestUpload.tsx'
import Rekapitulasi from './pages/rekapitulasi.tsx'
import LogbookPages from './pages/logbookPages.tsx'


import MainLayout from './components/mainLayout.tsx'

const router = createBrowserRouter([
  // Halaman TANPA navbar & footer
  // { path: '/login', element: <Login /> },
  { path: '/login', element: <LoginPage /> },

  // Halaman DENGAN navbar & footer
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Dashboard2 /> },
      { path: '/dashboard', element: <Dashboard2 /> },
      { path: '/tester', element: <Tester /> },
      { path: '/rekapitulasi', element: <Rekapitulasi /> },
      { path: '/logbook', element: <LogbookPages /> },
      { path: "/test-upload", element: <TestUpload /> },
      { path: '/test-upload', element: <TestUpload /> },


    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)