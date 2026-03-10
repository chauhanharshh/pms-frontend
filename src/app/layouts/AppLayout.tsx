import { useState, ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { HotelSidebar } from "./HotelSidebar";
import { TopNavbar } from "./TopNavbar";

interface AppLayoutProps {
  title: string;
  children: ReactNode;
  requiredRole?: "admin" | "hotel" | "any";
}

// Backend returns: admin | hotel_manager | hotel_user
// Frontend treats hotel_manager and hotel_user both as "hotel" role
function isHotelRole(role: string) {
  return role === "hotel_manager" || role === "hotel_user" || role === "hotel";
}

export function AppLayout({
  title,
  children,
  requiredRole = "any",
}: AppLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/");
      return;
    }

    // Strict URL-based routing enforcement
    const isAdminRoute = location.pathname.startsWith("/admin");
    const isHotelRoute = location.pathname.startsWith("/hotel");

    if (isAdminRoute && user.role !== "admin") {
      navigate("/hotel", { replace: true });
      return;
    }

    if (isHotelRoute && !isHotelRole(user.role)) {
      navigate("/admin", { replace: true });
      return;
    }

    if (requiredRole === "admin" && user.role !== "admin") {
      navigate("/hotel", { replace: true });
      return;
    }
    if (requiredRole === "hotel" && !isHotelRole(user.role)) {
      navigate("/admin", { replace: true });
      return;
    }
  }, [user, loading, requiredRole, navigate, location.pathname]);

  if (loading || !user) return null;

  // Additional strict guard during render
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHotelRoute = location.pathname.startsWith("/hotel");

  if (isAdminRoute && user.role !== "admin") return null;
  if (isHotelRoute && !isHotelRole(user.role)) return null;
  if (requiredRole === "admin" && user.role !== "admin") return null;
  if (requiredRole === "hotel" && !isHotelRole(user.role)) return null;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "#FAF7F2" }}
    >
      {user.role === "admin" ? (
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
      ) : (
        <HotelSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar title={title} />
        <main
          className="flex-1 overflow-y-auto"
          style={{
            background: "var(--background)",
            padding: "24px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
