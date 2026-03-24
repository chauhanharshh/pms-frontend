import { useState, ReactNode, useMemo } from "react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { HotelSidebar } from "./HotelSidebar";
import { TopNavbar } from "./TopNavbar";
import { usePMS } from "../contexts/PMSContext";
import { QRScannerModal } from "../components/QRScannerModal";
import { QRScanResultModal } from "../components/QRScanResultModal";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface AppLayoutProps {
  title: string;
  children: ReactNode;
  requiredRole?: "admin" | "hotel" | "superadmin" | "any";
}

// Backend returns: admin | hotel_manager | hotel_user | restaurant_staff
// Frontend treats these as hotel-shell roles, with restaurant_staff restricted to restaurant routes only.
function isHotelRole(role: string) {
  return ["admin", "hotel_manager", "hotel_staff", "restaurant_staff", "hotel", "restaurant_admin"].includes(role);
}

function isRestaurantOnlyRole(role: string) {
  return role === "restaurant_staff" || role === "restaurant_admin";
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
  const { 
    isQRScannerOpen, 
    setIsQRScannerOpen, 
    handleQRScan,
    scannedBooking,
    setScannedBooking
  } = usePMS();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const SidebarComponent = (user.role === "admin" || user.role === "restaurant_admin") ? AdminSidebar : HotelSidebar;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "#FAF7F2" }}
    >
      <style>
        {`
          @media print {
            body, html, #root {
              overflow: visible !important;
              height: auto !important;
              background: white !important;
            }
            .overflow-hidden, .overflow-y-auto {
              overflow: visible !important;
            }
          }
        `}
      </style>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="print:hidden h-full">
          <SidebarComponent
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
          />
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          {/* Sidebar Drawer */}
          <div 
            className={`fixed top-0 bottom-0 left-0 z-[101] transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <SidebarComponent
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto">
        <div className="print:hidden flex-shrink-0">
          <TopNavbar title={title} onMenuClick={isMobile ? () => setMobileMenuOpen(true) : undefined} />
        </div>
        <main
          className="flex-1 overflow-y-auto print:overflow-visible print:h-auto"
          style={{
            background: "var(--background)",
            padding: isMobile ? "12px" : "24px",
          }}
        >
          {children}
        </main>
      </div>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />

      <QRScanResultModal
        isOpen={!!scannedBooking}
        onClose={() => setScannedBooking(null)}
        booking={scannedBooking}
      />
    </div>
  );
}
