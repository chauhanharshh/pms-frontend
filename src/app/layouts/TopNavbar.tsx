import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { Calendar, Bell, Hotel, Menu } from "lucide-react";
import { resolveBrandName, resolveLogoUrl, handleLogoImageError } from "../utils/branding";

interface TopNavbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function TopNavbar({ title, onMenuClick }: TopNavbarProps) {
  const { user, currentHotelId } = useAuth();
  const { hotels } = usePMS();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentHotel = currentHotelId
    ? hotels.find((h) => h.id === currentHotelId)
    : null;

  const brandName = resolveBrandName(currentHotel);
  const logoUrl = resolveLogoUrl(currentHotel?.logoUrl);

  return (
    <div
      className="flex items-center justify-between px-4 sm:px-6 pb-3 flex-shrink-0"
      style={{
        paddingTop: "38px",
        background: "var(--background)",
        borderBottom: "1px solid #E5E1DA",
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
      } as any}
    >
      {/* Left: Menu Toggle + Title + Hotel */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 -ml-2 rounded-lg transition-colors hover:bg-gray-100 active:bg-gray-200"
            style={{ color: "var(--accent-color, #C6A75E)" }}
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        
        {/* Logo in Header */}
        {currentHotel && (
          <div className="hidden sm:flex w-10 h-10 items-center justify-center flex-shrink-0 bg-white rounded-lg border border-[#E5E1DA] p-1 shadow-sm">
            <img
              src={logoUrl}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={handleLogoImageError}
            />
          </div>
        )}

        <div className="min-w-0">
          <h1
            className="text-lg sm:text-2xl font-semibold leading-tight truncate"
            style={{ fontFamily: "Times New Roman, serif", color: "#7a5c00" }}
          >
            {title}
          </h1>
          {currentHotel && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] sm:text-xs truncate max-w-[120px] sm:max-w-none font-medium" style={{ color: "var(--accent-color, #A8832D)" }}>
                {brandName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: User + Date */}
      <div className="flex flex-col items-end gap-1">
        {/* User Block */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: "#1F2937" }}
            >
              {user?.username}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--accent-color, #A8832D)" }}>
              {user?.role === "super_admin"
                ? "Super Administrator"
                : user?.role === "admin"
                  ? "Administrator"
                  : user?.role === "restaurant_staff"
                    ? "Restaurant Staff"
                    : "Hotel Staff"}
            </p>
          </div>
          {/* Avatar */}
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white relative overflow-hidden shadow-sm"
            style={{ backgroundColor: "var(--accent-color, #C6A75E)" }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Date Block */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-80" style={{ color: "#A8832D" }}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">{today}</span>
        </div>
      </div>
    </div>
  );
}
