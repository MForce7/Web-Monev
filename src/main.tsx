import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Tester from './pages/tester.tsx'
import Login from './pages/login.tsx'
import TestUpload from './pages/TestUpload.tsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/tester", element: <Tester /> },
  { path: "/test-upload", element: <TestUpload /> },
]);






createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
