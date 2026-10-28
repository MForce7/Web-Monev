import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Dashboard from './pages/dashboard.tsx'
import Dashboard2 from './pages/dashboard_v2.tsx'
import Tester from './pages/tester.tsx'
import Login from './pages/login.tsx'
import Data from './pages/data.tsx'
import Visdata from './pages/visdata.tsx'
import TestUpload from './pages/TestUpload.tsx'
import LogbookPages from './pages/LogbookPages.tsx'
// import Visdata from './pages/visdata.tsx'

import MainLayout from './components/mainLayout.tsx'

const router = createBrowserRouter([
  // Halaman TANPA navbar & footer
  { path: '/login', element: <Login /> },

  // Halaman DENGAN navbar & footer
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/dashboard-v2', element: <Dashboard2 /> },
      { path: '/tester', element: <Tester /> },
      { path: '/logbook', element: <LogbookPages /> },
      { path: "/test-upload", element: <TestUpload /> },
      { path: "/visdata", element: <Visdata /> },
      { path: "/data", element: <Data /> },
      { path: '/test-upload', element: <TestUpload /> },
      { path: '/data', element: <Data /> },
      // { path: '/vis_data', element: <Visdata /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)