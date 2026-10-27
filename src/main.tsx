import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Dashboard from './pages/dashboard.tsx'
import Tester from './pages/tester.tsx'
import Login from './pages/login.tsx'
import Data from './pages/data.tsx'
import Visdata from './pages/visdata.tsx'
import TestUpload from './pages/TestUpload.tsx'
import MonevEditor from './pages/monevEditor.tsx'
import Datapage from './pages/Datapage.tsx'

import MainLayout from './components/mainLayout.tsx'

const router = createBrowserRouter([
  // Halaman TANPA navbar & footer
  { path: '/login', element: <Login /> },
  { path: '/test-upload', element: <TestUpload /> },
  { path: '/data', element: <Data /> }, // halaman data punya navbar sendiri

  // Halaman DENGAN navbar & footer
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/tester', element: <Tester /> },
      { path: '/logbook', element: <MonevEditor /> },
      { path: '/visdata', element: <Visdata /> },
      { path: '/Datapage', element: <Datapage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)