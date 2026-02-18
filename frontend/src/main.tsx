import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Start from './pages/Start.tsx'
import Login from './pages/Login.tsx'
import Register from "./pages/Register.tsx";
import New from "./pages/New.tsx";
import Profile from "./pages/Profile.tsx";
import Leaders from "./pages/Leaders.tsx";
import Match from "./pages/Match.tsx"; // Online game
import MatchHotseat from "./pages/MatchHotseat.tsx";
import {AuthProvider} from "./AuthContext.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";
import HotseatSetup from "./pages/HotseatSetup.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Start />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/new" element={
                        <ProtectedRoute>
                            <New />
                        </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />

                    <Route path="/leaders" element={
                        <ProtectedRoute>
                            <Leaders />
                        </ProtectedRoute>
                    } />

                    <Route path="/match/hotseat/setup" element={
                        <ProtectedRoute>
                            <HotseatSetup/>
                        </ProtectedRoute>
                    } />

                    <Route path="/match/hotseat" element={
                        <ProtectedRoute>
                            <MatchHotseat />
                        </ProtectedRoute>
                    } />

                    <Route path="/match/:matchId" element={
                        <ProtectedRoute>
                            <Match />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
)