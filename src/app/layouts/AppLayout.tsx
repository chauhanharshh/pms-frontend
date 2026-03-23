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
  requiredRole?: "admin" | "hotel" | "superadmin" | "any";
}

// Backend returns: admin | hotel_manager | hotel_user | restaurant_staff
// Frontend treats these as hotel-shell roles, with restaurant_staff restricted to restaurant routes only.
function isHotelRole(role: string) {
  return ["admin", "hotel_manager", "hotel_staff", "restaurant_staff", "hotel"].includes(role);
}

function isRestaurantOnlyRole(role: string) {
  return role === "restaurant_staff";
}

function isRestaurantRoute(pathname: string) {
  const allowedPrefixes = [
    "/hotel/restaurant/rooms",
    "/hotel/restaurant/menu",
    "/hotel/restaurant/stewards",
    "/hotel/restaurant/service-charge-report",
    "/hotel/restaurant/pos",
    "/hotel/restaurant/kots",
    "/hotel/restaurant/kot-wall",
    "/hotel/restaurant/invoices",
    "/hotel/restaurant/day-closing",
  ];

  return allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isSuperAdminRole(role: string) {
  return role === "super_admin" || role === "superadmin";
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
    const isSuperAdminRoute = location.pathname.startsWith("/superadmin");

    if (isRestaurantOnlyRole(user.role) && !isRestaurantRoute(location.pathname)) {
      navigate("/hotel/restaurant/rooms", { replace: true });
      return;
    }

    if (isSuperAdminRole(user.role) && !isSuperAdminRoute) {
      navigate("/superadmin", { replace: true });
      return;
    }

    if (isSuperAdminRoute && !isSuperAdminRole(user.role)) {
      navigate(user.role === "admin" ? "/admin" : "/hotel", { replace: true });
      return;
    }

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
    if (requiredRole === "superadmin" && !isSuperAdminRole(user.role)) {
      navigate(user.role === "admin" ? "/admin" : "/hotel", { replace: true });
      return;
    }
  }, [user, loading, requiredRole, navigate, location.pathname]);

  if (loading || !user) return null;

  // Additional strict guard during render
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHotelRoute = location.pathname.startsWith("/hotel");
  const isSuperAdminRoute = location.pathname.startsWith("/superadmin");

  if (isRestaurantOnlyRole(user.role) && !isRestaurantRoute(location.pathname)) return null;

  if (isSuperAdminRole(user.role) && !isSuperAdminRoute) return null;
  if (isSuperAdminRoute && !isSuperAdminRole(user.role)) return null;
  if (isAdminRoute && user.role !== "admin") return null;
  if (isHotelRoute && !isHotelRole(user.role)) return null;
  if (requiredRole === "admin" && user.role !== "admin") return null;
  if (requiredRole === "hotel" && !isHotelRole(user.role)) return null;
  if (requiredRole === "superadmin" && !isSuperAdminRole(user.role)) return null;

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
