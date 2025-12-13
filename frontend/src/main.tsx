import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import Start from './pages/Start.tsx'
import Login from './pages/Login.tsx'
import Register from "./pages/Register.tsx";
import New from "./pages/New.tsx";
import Profile from "./pages/Profile.tsx";
import Leaders from "./pages/Leaders.tsx";

const router = createBrowserRouter([
    { path: "/", element: <Start /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/new", element: <New /> },
    { path: "/profile", element: <Profile /> },
    { path: "/leaders", element: <Leaders /> }
])

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)