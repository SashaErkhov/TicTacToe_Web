import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import Start from './Start.tsx'

const router = createBrowserRouter([
    { path: "/", element: <Start /> },
    { path: "/login", element: <div>Login Page</div> },
    { path: "/register", element: <div>Register Page</div> }
])

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)