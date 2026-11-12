import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Dashboard2 from './pages/dashboard_v2.tsx'
import LoginPage from './pages/loginPage.tsx'
import TestUpload from './pages/TestUpload.tsx'
import Rekapitulasi from './pages/rekapitulasi.tsx'
import LogbookPages from './pages/LogbookPages.tsx'
import AdminLogbookPage from './pages/adminLogbookPage.tsx'
import Profile from './pages/profile.tsx'
// import halaman admin lain yang sudah ada / akan dibuat, contoh:
import ImportJson from './pages/importjson.tsx'
import RekapPendanaan from './pages/Rekappendanaan.tsx'
import KelompokRiset from './pages/kelompokriset.tsx'

import MainLayout from './components/mainLayout.tsx'
import ProtectedRoute from './components/protectedRoute.tsx'
import AdminRoute from './components/AdminRoute.tsx'
import { AuthProvider } from './lib/AuthContext.tsx'
import { LogbookDataProvider } from './lib/LogbookDataContext.tsx'
import Kelompokriset from './pages/kelompokriset.tsx'
import Rekappendanaan from './pages/Rekappendanaan.tsx'
import Importjson from './pages/importjson.tsx'
import Formbaru from './pages/Formbaru.tsx'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Dashboard2 /> },
      { path: '/dashboard', element: <Dashboard2 /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: '/logbook', element: <LogbookPages /> },
          { path: '/profile', element: <Profile /> },
          { path: '/test-upload', element: <TestUpload /> },

          // Grup khusus admin — wajib login DAN role === 'admin'
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin/logbook', element: <AdminLogbookPage /> },
              { path: '/rekapitulasi', element: <Rekapitulasi /> },
              { path: '/importjson', element: <Importjson /> },
              { path: '/rekappendanaan', element: <Rekappendanaan /> },
              { path: '/kelompokriset', element: <Kelompokriset /> },
              { path: '/formbaru', element: <Formbaru /> },
            ],
          },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LogbookDataProvider>
        <RouterProvider router={router} />
      </LogbookDataProvider>
    </AuthProvider>
  </StrictMode>,
) 