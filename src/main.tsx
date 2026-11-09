import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Dashboard2 from './pages/dashboard_v2.tsx'
import Tester from './pages/tester.tsx'
import LoginPage from './pages/loginPage.tsx'
import TestUpload from './pages/TestUpload.tsx'
import Rekapitulasi from './pages/rekapitulasi.tsx'
import LogbookPages from './pages/logbookPages.tsx'
import Profile from './pages/profile.tsx'

import MainLayout from './components/mainLayout.tsx'
import ProtectedRoute from './components/protectedRoute.tsx'
import { AuthProvider } from './lib/AuthContext.tsx'
import KelompokRiset from './pages/kelompokriset.tsx'
import Rekappendanaan from './pages/Rekappendanaan.tsx'

import MainLayout from './components/mainLayout.tsx'
import ProtectedRoute from './components/protectedRoute.tsx'
import Importjson from './pages/importjson.tsx'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Dashboard2 /> },
      { path: '/dashboard', element: <Dashboard2 /> },

 { path: '/kelompokriset', element: <KelompokRiset /> },
      { path: '/importjson', element: <Importjson /> },
  
      // Wajib login
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/logbook', element: <LogbookPages /> },
          { path: '/rekapitulasi', element: <Rekapitulasi /> },
          { path: '/profile', element: <Profile /> },
          { path: '/tester', element: <Tester /> },
          { path: '/test-upload', element: <TestUpload /> },
          { path: '/rekappendanaan', element: <Rekappendanaan /> },
        ],
              
                  
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)