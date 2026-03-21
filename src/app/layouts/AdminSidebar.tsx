import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
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
  LogIn,
  UtensilsCrossed,
  BookOpen,
  BarChart3,
  ChefHat,
  Users,
  Settings,
  Store,
  LogOut,
  ChevronDown,
  ChevronUp,
  Calendar,
  LayoutDashboard,
  IndianRupee,
  ClipboardList,
  Sun,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  BookMarked,
  List,
  LayoutGrid,
  Shuffle,
  TrendingUp,
  PackagePlus,
  Archive,
  Banknote,
  Building,
  Truck,
  DoorOpen,
  Lock,
  AlertCircle,
  PiggyBank,
  Key,
  HardDrive,
  Info,
  UserCheck,
  FileBarChart,
  ArrowRightLeft,
  PlusCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Paintbrush,
} from "lucide-react";
import { handleLogoImageError, resolveBrandName, resolveLogoUrl } from "../utils/branding";

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

const ADMIN_SECTIONS: NavSection[] = [
  {
    title: "Today's",
    icon: <Sun className="w-4 h-4" />,
    color: "#f59e0b",
    items: [
      {
        label: "Today's Check-Ins",
        path: "/admin/today/check-ins",
        icon: <UserCheck className="w-4 h-4" />,
      },
      {
        label: "Today's Check-Outs",
        path: "/admin/today/check-outs",
        icon: <LogOut className="w-4 h-4" />,
      },
      {
        label: "Today's Bookings",
        path: "/admin/today/bookings",
        icon: <BookMarked className="w-4 h-4" />,
      },
      {
        label: "Today's Invoices",
        path: "/admin/today/invoices",
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        label: "Advance Payments",
        path: "/admin/today/advances",
        icon: <CreditCard className="w-4 h-4" />,
      },
      {
        label: "Today's Settlements",
        path: "/admin/today/settlements",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      {
        label: "Paid Payments",
        path: "/admin/today/payments",
        icon: <Banknote className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Hotel Management",
    icon: <Building2 className="w-4 h-4" />,
    color: "#C6A75E",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        label: "New Check-In",
        path: "/admin/check-in",
        icon: <UserPlus className="w-4 h-4" />,
      },
      {
        label: "New Reservation",
        path: "/admin/reservations",
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        label: "Checkout",
        path: "/admin/checkout",
        icon: <UserMinus className="w-4 h-4" />,
      },
      {
        label: "Bills",
        path: "/admin/bills",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: "Expenses",
        path: "/admin/expenses",
        icon: <Wallet className="w-4 h-4" />,
      },
      {
        label: "Advance Payments",
        path: "/admin/advances",
        icon: <CreditCard className="w-4 h-4" />,
      },
      {
        label: "Misc. Charges",
        path: "/admin/misc-charges",
        icon: <Tag className="w-4 h-4" />,
      },
      {
        label: "Payment Vouchers",
        path: "/admin/vouchers",
        icon: <BookmarkCheck className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Check-In Records",
    icon: <LogIn className="w-4 h-4" />,
    color: "#16a34a",
    items: [
      {
        label: "All Check-Ins",
        path: "/admin/checkins/all",
        icon: <List className="w-4 h-4" />,
      },
      {
        label: "Checked Out – No Invoice",
        path: "/admin/checkins/no-invoice",
        icon: <AlertCircle className="w-4 h-4" />,
      },
      {
        label: "Cancelled",
        path: "/admin/checkins/cancelled",
        icon: <XCircle className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Invoices",
    icon: <Receipt className="w-4 h-4" />,
    color: "#3b82f6",
    items: [
      {
        label: "All Invoices",
        path: "/admin/invoices",
        icon: <FileBarChart className="w-4 h-4" />,
      },
      {
        label: "Pending Settlement",
        path: "/admin/invoices/pending",
        icon: <ClipboardCheck className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Bookings",
    icon: <BookOpen className="w-4 h-4" />,
    color: "#8b5cf6",
    items: [
      {
        label: "New E-Booking",
        path: "/admin/bookings/new",
        icon: <Globe className="w-4 h-4" />,
      },
      {
        label: "All Bookings – List",
        path: "/admin/bookings/list",
        icon: <List className="w-4 h-4" />,
      },
      {
        label: "All Bookings – Grid",
        path: "/admin/bookings/grid",
        icon: <LayoutGrid className="w-4 h-4" />,
      },
      {
        label: "Reservation Chart",
        path: "/admin/bookings/chart",
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        label: "Channel Rates",
        path: "/admin/bookings/rates",
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Misc Charges",
    icon: <Tag className="w-4 h-4" />,
    color: "#f97316",
    items: [
      {
        label: "New Misc Booking",
        path: "/admin/misc/booking/new",
        icon: <PackagePlus className="w-4 h-4" />,
      },
      {
        label: "Charge Booking Records",
        path: "/admin/misc/booking/records",
        icon: <Archive className="w-4 h-4" />,
      },
      {
        label: "New Misc Billing",
        path: "/admin/misc/billing/new",
        icon: <PlusCircle className="w-4 h-4" />,
      },
      {
        label: "Billing Records",
        path: "/admin/misc-charges",
        icon: <ClipboardList className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Settlements & Payments",
    icon: <ArrowRightLeft className="w-4 h-4" />,
    color: "#0ea5e9",
    items: [
      {
        label: "Payments",
        path: "/admin/settlements/payments",
        icon: <Banknote className="w-4 h-4" />,
      },
      {
        label: "Co. Credit Settlements",
        path: "/admin/settlements/credit",
        icon: <Building className="w-4 h-4" />,
      },
      {
        label: "Room Transfer Settlements",
        path: "/admin/settlements/room-transfer",
        icon: <Shuffle className="w-4 h-4" />,
      },
      {
        label: "Payment Vouchers",
        path: "/admin/vouchers",
        icon: <BookmarkCheck className="w-4 h-4" />,
      },
      {
        label: "Other Collections",
        path: "/admin/settlements/other",
        icon: <PiggyBank className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Restaurant",
    icon: <UtensilsCrossed className="w-4 h-4" />,
    color: "#ef4444",
    items: [
      {
        label: "Rooms",
        path: "/admin/restaurant/rooms",
        icon: <BedDouble className="w-4 h-4" />,
      },
      {
        label: "Edit Menu",
        path: "/admin/restaurant/menu",
        icon: <ChefHat className="w-4 h-4" />,
      },
      {
        label: "Stewards",
        path: "/admin/restaurant/stewards",
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: "Service Charge Report",
        path: "/admin/restaurant/service-charge-report",
        icon: <IndianRupee className="w-4 h-4" />,
      },
      {
        label: "POS / Billing",
        path: "/admin/restaurant/pos",
        icon: <IndianRupee className="w-4 h-4" />,
      },
      {
        label: "KOTs",
        path: "/admin/restaurant/kots",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        label: "Restaurant Invoices",
        path: "/admin/restaurant/invoices",
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        label: "Reports",
        path: "/admin/restaurant/reports",
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        label: "Expenses",
        path: "/admin/restaurant/expenses",
        icon: <Wallet className="w-4 h-4" />,
      },
      {
        label: "Day Closing",
        path: "/admin/restaurant/day-closing",
        icon: <Lock className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Other Actions",
    icon: <ClipboardList className="w-4 h-4" />,
    color: "#64748b",
    items: [
      {
        label: "Petty Cash Book",
        path: "/admin/petty-cash",
        icon: <PiggyBank className="w-4 h-4" />,
      },
      {
        label: "Guests",
        path: "/admin/guests",
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: "Companies",
        path: "/admin/companies",
        icon: <Building className="w-4 h-4" />,
      },
      {
        label: "Vendors",
        path: "/admin/vendors",
        icon: <Truck className="w-4 h-4" />,
      },
      {
        label: "Rooms",
        path: "/admin/rooms",
        icon: <DoorOpen className="w-4 h-4" />,
      },
      {
        label: "Block Rooms",
        path: "/admin/room-blocking",
        icon: <Lock className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Liabilities",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "#dc2626",
    items: [
      {
        label: "Add Liability",
        path: "/admin/liabilities/new",
        icon: <PlusCircle className="w-4 h-4" />,
      },
      {
        label: "Pending Liabilities",
        path: "/admin/liabilities/pending",
        icon: <ClipboardCheck className="w-4 h-4" />,
      },
      {
        label: "Paid Liabilities",
        path: "/admin/liabilities/paid",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      {
        label: "All Liabilities",
        path: "/admin/liabilities",
        icon: <Archive className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Reports & Admin",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "#C6A75E",
    items: [
      {
        label: "Reports",
        path: "/admin/reports",
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        label: "Day Closing",
        path: "/admin/day-closing",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        label: "Hotel Management",
        path: "/admin/hotels",
        icon: <Building2 className="w-4 h-4" />,
      },
      {
        label: "User Management",
        path: "/admin/users",
        icon: <Users className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "System",
    icon: <Settings className="w-4 h-4" />,
    color: "#6b7280",
    items: [
      {
        label: "Change Password",
        path: "/admin/system/password",
        icon: <Key className="w-4 h-4" />,
      },
      {
        label: "Appearance Settings",
        path: "/admin/system/appearance",
        icon: <Paintbrush className="w-4 h-4" />,
      },
      {
        label: "Branding",
        path: "/admin/settings/branding",
        icon: <Store className="w-4 h-4" />,
      },
      {
        label: "POS Features",
        path: "/admin/system/features",
        icon: <Store className="w-4 h-4" />,
      },
      {
        label: "Backup",
        path: "/admin/system/backup",
        icon: <HardDrive className="w-4 h-4" />,
      },
      {
        label: "About System",
        path: "/admin/system/about",
        icon: <Info className="w-4 h-4" />,
      },
      {
        label: "Settings",
        path: "/admin/settings",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "GST Reports (Admin)",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "#6b7280",
    items: [
      {
        label: "GST Summary",
        path: "/admin/gst/summary",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: "Room GST",
        path: "/admin/gst/room",
        icon: <BedDouble className="w-4 h-4" />,
      },
      {
        label: "Restaurant GST",
        path: "/admin/gst/restaurant",
        icon: <UtensilsCrossed className="w-4 h-4" />,
      },
      {
        label: "Misc GST",
        path: "/admin/gst/misc",
        icon: <Tag className="w-4 h-4" />,
      },
      {
        label: "Invoice-wise GST",
        path: "/admin/gst/invoice-wise",
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        label: "SAC/HSN Summary",
        path: "/admin/gst/sac-hsn",
        icon: <ClipboardList className="w-4 h-4" />,
      },
    ],
  },
];

export function AdminSidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout, currentHotelId, setCurrentHotelId } = useAuth();
  const { hotels } = usePMS();
  const navigate = useNavigate();
  const location = useLocation();

  const sections = ADMIN_SECTIONS;
  const defaultOpen: Record<string, boolean> = {};
  sections.forEach((s) => {
    defaultOpen[s.title] =
      s.title === "Hotel Management" || s.title === "Today's";
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
              PMS Admin Panel
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

      {/* Hotel Selector (Admin Only) */}
      {!collapsed && (
        <div
          className="px-3 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <label
            className="block text-xs mb-1"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Active Hotel
          </label>
          <select
            value={currentHotelId || "all"}
            onChange={(e) =>
              setCurrentHotelId(
                e.target.value === "all" ? null : e.target.value,
              )
            }
            className="w-full px-2 py-1.5 rounded text-xs outline-none appearance-none cursor-pointer"
            style={{
              background: "rgba(229,225,218,0.5)",
              border: "1px solid #E5E1DA",
              color: "var(--accent-color, #C6A75E)",
            }}
          >
            <option value="all">All Hotels (Consolidated)</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
              Administrator
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
