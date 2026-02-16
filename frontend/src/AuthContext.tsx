import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "./config.ts";

interface User {
    id: number;
    username: string;
    rating?: number;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => Promise<void>;
    setAccessToken: (token: string | null) => void;
    fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    const setAccessToken = useCallback((token: string | null) => {
        setAccessTokenState(token);

        if (token)
            localStorage.setItem("accessToken", token);
        else
            localStorage.removeItem("accessToken");
    }, []);

    const fetchMe = async (token: string | null) => {
        return fetch(`${BACKEND_URL}/users/me`, {
            method: "GET",
            credentials: "include",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    };

    const fetchUser = useCallback(async () => {
        if (!accessToken) {
            setUser(null);
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/users/me`, {
                method: "GET",
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else if (response.status === 401) {
                setAccessToken(null);
                setUser(null);
            } else {
                setAccessToken(null);
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
            setAccessToken(null);
            setUser(null);
        }
    }, [accessToken, setAccessToken]);

    const restoreSession = useCallback(async () => {
        let token = localStorage.getItem("accessToken");

        if (!token) {
            setUser(null);
            return;
        }

        let response = await fetchMe(token);

        // AccessToken is up
        if (response.status === 401) {
            const refresh = await fetch(`${BACKEND_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (!refresh.ok) {
                setAccessToken(null);
                setUser(null);
                return;
            }

            const data = await refresh.json();
            token = data.accessToken

            setAccessToken(token);
            response = await fetchMe(token);
        }

        if (!response.ok) {
            setUser(null);
            return;
        }

        const userData = await response.json();

        setAccessToken(token);
        setUser(userData);
    }, [setAccessToken]);

    useEffect(() => {
        restoreSession().finally(() => setIsLoading(false));
    }, [restoreSession]);

    const logout = async () => {
        try {
            await fetch(`${BACKEND_URL}/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            setAccessToken(null);
            setUser(null);
            navigate("/");
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isAuthenticated: !!user,
                isLoading,
                logout,
                setAccessToken,
                fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
