import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  role: "super_admin" | "admin" | "hotel_manager" | "hotel_user" | "restaurant_staff";
  maxHotels?: number | null;
  hotelId?: string | null;
  hotel?: { id: string; name: string; brandName?: string | null; logoUrl?: string | null } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  currentHotelId: string | null;
  setCurrentHotelId: (hotelId: string | null) => void;
  // Derived convenience flag
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentHotelId, setCurrentHotelIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("pms_token");
    const storedUser = localStorage.getItem("pms_user");
    const storedHotelId = localStorage.getItem("pms_hotel_ctx");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedHotelId) setCurrentHotelIdState(storedHotelId);
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    const response = await api.post("/auth/login", { username, password });
    const { token: newToken, user: newUser } = response.data.data;
    localStorage.setItem("pms_token", newToken);
    localStorage.setItem("pms_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    // Set default hotel context if user has one
    if (newUser.hotelId) {
      setCurrentHotelIdState(newUser.hotelId);
      localStorage.setItem("pms_hotel_ctx", newUser.hotelId);
    } else {
      setCurrentHotelIdState(null);
      localStorage.removeItem("pms_hotel_ctx");
    }
  };

  const loginWithGoogle = async (credential: string): Promise<void> => {
    const response = await api.post("/auth/google", { credential });
    const { token: newToken, user: newUser } = response.data.data;
    localStorage.setItem("pms_token", newToken);
    localStorage.setItem("pms_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    // Set default hotel context if user has one
    if (newUser.hotelId) {
      setCurrentHotelIdState(newUser.hotelId);
      localStorage.setItem("pms_hotel_ctx", newUser.hotelId);
    } else {
      setCurrentHotelIdState(null);
      localStorage.removeItem("pms_hotel_ctx");
    }
  };

  const logout = () => {
    localStorage.removeItem("pms_token");
    localStorage.removeItem("pms_user");
    localStorage.removeItem("pms_hotel_ctx");
    setUser(null);
    setToken(null);
    setCurrentHotelIdState(null);
  };

  const setCurrentHotelId = (hotelId: string | null) => {
    setCurrentHotelIdState(hotelId);
    if (hotelId) {
      localStorage.setItem("pms_hotel_ctx", hotelId);
    } else {
      localStorage.removeItem("pms_hotel_ctx");
    }
  };

  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        logout,
        currentHotelId,
        setCurrentHotelId,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
