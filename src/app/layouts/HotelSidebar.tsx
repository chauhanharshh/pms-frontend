import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext.js";
import { usePMS } from "../contexts/PMSContext.js";
import { handleLogoImageError, resolveBrandName, resolveLogoUrl } from "../utils/branding";
import {
  Building2,
  FileText,
  Receipt,
  Wallet,
  CreditCard,
  Tag,
  BookmarkCheck,
  UserPlus,
  UserMinus,
  UtensilsCrossed,
  BookOpen,
  BarChart3,
  ChefHat,
  LogOut,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  IndianRupee,
  ClipboardList,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  icon: ReactNode;
  color?: string;
  items: NavItem[];
}

const HOTEL_SECTIONS: NavSection[] = [
  {
    title: "Hotel Management",
    icon: <Building2 className="w-4 h-4" />,
    items: [
      {
        label: "Dashboard",
        path: "/hotel",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        label: "Bills",
        path: "/hotel/bills",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: "Invoices",
        path: "/hotel/invoices",
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        label: "Expenses",
        path: "/hotel/expenses",
        icon: <Wallet className="w-4 h-4" />,
      },
      {
        label: "Advance Payments",
        path: "/hotel/advances",
        icon: <CreditCard className="w-4 h-4" />,
      },
      {
        label: "Misc. Charges",
        path: "/hotel/misc-charges",
        icon: <Tag className="w-4 h-4" />,
      },
      {
        label: "Payment Vouchers",
        path: "/hotel/vouchers",
        icon: <BookmarkCheck className="w-4 h-4" />,
      },
      {
        label: "New Reservation",
        path: "/hotel/reservations",
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        label: "New Check-In",
        path: "/hotel/check-in",
        icon: <UserPlus className="w-4 h-4" />,
      },
      {
        label: "Checkout",
        path: "/hotel/checkout",
        icon: <UserMinus className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Restaurant",
    icon: <UtensilsCrossed className="w-4 h-4" />,
    items: [
      {
        label: "Rooms",
        path: "/hotel/restaurant/rooms",
        icon: <BedDouble className="w-4 h-4" />,
      },
      {
        label: "Edit Menu",
        path: "/hotel/restaurant/menu",
        icon: <ChefHat className="w-4 h-4" />,
      },
      {
        label: "Stewards",
        path: "/hotel/restaurant/stewards",
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: "POS / Billing",
        path: "/hotel/restaurant/pos",
        icon: <IndianRupee className="w-4 h-4" />,
      },
      {
        label: "KOTs",
        path: "/hotel/restaurant/kots",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        label: "Restaurant Invoices",
        path: "/hotel/restaurant/invoices",
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        label: "Reports",
        path: "/hotel/restaurant/reports?tab=restaurant",
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        label: "Expenses",
        path: "/hotel/restaurant/expenses",
        icon: <Wallet className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Reports & Control",
    icon: <ClipboardList className="w-4 h-4" />,
    items: [
      {
        label: "Reports",
        path: "/hotel/reports",
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        label: "Day Closing",
        path: "/hotel/day-closing",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        label: "Room Panel",
        path: "/hotel/rooms",
        icon: <BedDouble className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "GST Reports",
    icon: <BarChart3 className="w-4 h-4" />,
    items: [
      {
        label: "GST Summary",
        path: "/hotel/gst/summary",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: "Room GST",
        path: "/hotel/gst/room",
        icon: <BedDouble className="w-4 h-4" />,
      },
      {
        label: "Restaurant GST",
        path: "/hotel/gst/restaurant",
        icon: <UtensilsCrossed className="w-4 h-4" />,
      },
      {
        label: "Misc GST",
        path: "/hotel/gst/misc",
        icon: <Tag className="w-4 h-4" />,
      },
      {
        label: "Invoice-wise GST",
        path: "/hotel/gst/invoice-wise",
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        label: "SAC/HSN Summary",
        path: "/hotel/gst/sac-hsn",
        icon: <ClipboardList className="w-4 h-4" />,
      },
    ],
  },
];

export function HotelSidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout, currentHotelId } = useAuth();
  const { hotels } = usePMS();
  const navigate = useNavigate();
  const location = useLocation();

  const sections = HOTEL_SECTIONS;
  const defaultOpen: Record<string, boolean> = {};
  sections.forEach((s) => {
    defaultOpen[s.title] = s.title === "Hotel Management";
  });

  const [openSections, setOpenSections] =
    useState<Record<string, boolean>>(defaultOpen);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  const isActive = (path: string) => location.pathname === path;

  const activeHotel = currentHotelId
    ? hotels.find((h) => h.id === currentHotelId)
    : user?.hotelId
      ? hotels.find((h) => h.id === user.hotelId)
      : null;
  const brandName = resolveBrandName(activeHotel);
  const logoUrl = resolveLogoUrl(activeHotel?.logoUrl);

  return (
    <div
      className="flex flex-col h-full transition-[width] duration-300"
      style={{
        width: collapsed ? "64px" : "260px",
        background: "var(--sidebar-bg, linear-gradient(180deg, #1a1f2e 0%, #111827 100%))",
        borderRight: "1px solid #E5E1DA",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          paddingTop: "38px",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          WebkitAppRegion: "drag",
        } as any}
      >
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <img
            src={logoUrl}
            alt="Hotel Logo"
            className="w-full h-full object-contain"
            onError={handleLogoImageError}
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1
              className="font-bold text-base leading-tight truncate"
              style={{ fontFamily: "Times New Roman, serif", color: "var(--accent-color, #C6A75E)" }}
            >
              {brandName}
            </h1>
            <p
              className="text-xs truncate"
              style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }}
            >
              Hotel Panel
            </p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors no-drag"
          style={{ color: "#FFFFFF", WebkitAppRegion: "no-drag" } as any}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(221, 215, 204,0.1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div
        className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 premium-scrollbar"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.2) transparent",
        }}
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-0.5">
            {!collapsed ? (
              <>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-bold tracking-widest uppercase transition-colors"
                  style={{ color: "#C6A75E" }}
                  onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <span
                    className="opacity-80 transition-colors"
                  >
                    {section.icon}
                  </span>
                  <span className="flex-1 text-left">{section.title}</span>
                  {openSections[section.title] ? (
                    <ChevronUp className="w-3 h-3 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  )}
                </button>

                {openSections[section.title] && (
                  <div className="mt-0.5 space-y-0.5 pl-1">
                    {section.items.map((item) => (
                      <button
                        key={item.path + item.label}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-all duration-200"
                        style={{
                          background: isActive(item.path)
                            ? "rgba(255,255,255,0.06)"
                            : "transparent",
                          color: isActive(item.path)
                            ? "#C6A75E"
                            : "#D6D3CE",
                          borderLeft: isActive(item.path)
                            ? "3px solid #C6A75E"
                            : "3px solid transparent",
                          fontWeight: isActive(item.path) ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.path))
                            e.currentTarget.style.backgroundColor =
                              "rgba(255,255,255,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.path))
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                        }}
                      >
                        <span
                          style={{
                            color: isActive(item.path)
                              ? "var(--accent-color, #C6A75E)"
                              : "#D6D3CE",
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.path + item.label}
                    onClick={() => navigate(item.path)}
                    title={item.label}
                    className="w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200"
                    style={{
                      background: isActive(item.path)
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                      color: isActive(item.path)
                        ? "#C6A75E"
                        : "#D6D3CE",
                      borderLeft: isActive(item.path)
                        ? "3px solid #C6A75E"
                        : "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path))
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path))
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Info + Logout */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        {!collapsed && (
          <div
            className="px-2 py-2 mb-2 rounded-lg border"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.08)"
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--accent-color, #C6A75E)" }}>
              {user?.username}
            </p>
            <p
              className="text-xs capitalize"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {user?.hotel?.name || "Hotel Staff"}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-sm"
          style={{ color: "#D6D3CE" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#D6D3CE";
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
