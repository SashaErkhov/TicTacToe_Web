import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import Start from './Start.tsx'
import Login from './Login.tsx'
import Register from "./Register.tsx";
import New from "./New.tsx";

const router = createBrowserRouter([
    { path: "/", element: <Start /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/new", element: <New /> }
])

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)