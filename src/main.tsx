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
import Profile from './pages/profile.tsx'
import KelompokRiset from './pages/kelompokriset.tsx'


import MainLayout from './components/mainLayout.tsx'
import ProtectedRoute from './components/protectedRoute.tsx'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    element: <MainLayout />,
    children: [
      // Publik
      { path: '/', element: <Dashboard2 /> },
      { path: '/dashboard', element: <Dashboard2 /> },
 { path: '/kelompokriset', element: <KelompokRiset /> },
      // Wajib login
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/logbook', element: <LogbookPages /> },
          { path: '/rekapitulasi', element: <Rekapitulasi /> },
          { path: '/profile', element: <Profile /> },
          { path: '/tester', element: <Tester /> },
          { path: '/test-upload', element: <TestUpload /> },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)