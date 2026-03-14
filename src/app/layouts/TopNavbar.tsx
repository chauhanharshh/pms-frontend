import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { Calendar, Bell, Hotel } from "lucide-react";

interface TopNavbarProps {
  title: string;
}

export function TopNavbar({ title }: TopNavbarProps) {
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

  return (
    <div
      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{
        background: "var(--background)",
        borderBottom: "1px solid #E5E1DA",
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
      } as any}
    >
      {/* Left: Title + Hotel */}
      <div>
        <h1
          className="text-xl font-semibold leading-tight"
          style={{ fontFamily: "Times New Roman, serif", color: "#7a5c00" }}
        >
          {title}
        </h1>
        {currentHotel && (
          <div className="flex items-center gap-1 mt-0.5">
            <Hotel className="w-3 h-3" style={{ color: "var(--accent-color, #C6A75E)" }} />
            <span className="text-xs" style={{ color: "var(--accent-color, #A8832D)" }}>
              {currentHotel.name}
            </span>
          </div>
        )}
      </div>

      {/* Right: User + Date */}
      <div className="flex flex-col items-end gap-1">
        {/* User Block */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: "#1F2937" }}
            >
              {user?.username}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--accent-color, #A8832D)" }}>
              {user?.role === "super_admin" ? "Super Administrator" : user?.role === "admin" ? "Administrator" : "Hotel Staff"}
            </p>
          </div>
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white relative overflow-hidden shadow-sm"
            style={{ backgroundColor: "var(--accent-color, #C6A75E)" }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Date Block */}
        <div className="flex items-center gap-1.5 opacity-80" style={{ color: "#A8832D" }}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">{today}</span>
        </div>
      </div>
    </div>
  );
}
