import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { AppLayout } from "../layouts/AppLayout";
import { formatCurrency } from "../utils/format";
import { usePMS } from "../contexts/PMSContext";
import {
  Building2,
  DoorOpen,
  CheckCircle,
  IndianRupee,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  ArrowRight,
  LayoutDashboard,
  Loader2,
  FileText,
} from "lucide-react";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{
        background: "white",
        border: `1px solid #E5E1DA`,
        boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <TrendingUp className="w-4 h-4" style={{ color: "#22c55e" }} />
      </div>
      <div>
        <div
          className="text-2xl font-bold"
          style={{ color: "#1F2937", fontFamily: "Times New Roman, serif" }}
        >
          {value}
        </div>
        <div className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { currentHotelId, setCurrentHotelId } = useAuth();
  const { hotels, rooms, bookings, bills, invoices, expenses, restaurantOrders, isLoading, dashboardStats } = usePMS();
  const navigate = useNavigate();

  const selectedHotelId = useMemo(() => {
    if (!currentHotelId) return null;
    if (hotels.some((h) => h.id === currentHotelId)) return currentHotelId;
    return null;
  }, [currentHotelId, hotels]);

  // Keep these for now as items needing complex logic might still benefit from client filter 
  // until we have full report APIs for them
  const filteredBookings = selectedHotelId
    ? bookings.filter((b) => b.hotelId === selectedHotelId)
    : bookings;

  const filteredExpenses = selectedHotelId
    ? expenses.filter((e) => e.hotelId === selectedHotelId)
    : expenses;

  const filteredOrders = selectedHotelId
    ? restaurantOrders.filter((o) => o.hotelId === selectedHotelId)
    : restaurantOrders;

  const today = new Date().toISOString().slice(0, 10);
  const todayCheckIns = filteredBookings.filter(
    (b) => b.checkInDate?.slice(0, 10) === today && b.status === "checked_in"
  ).length;
  const todayCheckOuts = filteredBookings.filter(
    (b) => b.checkOutDate?.slice(0, 10) === today && b.status === "checked_out"
  ).length;

  const completedRevenue = filteredBookings
    .filter((b) => b.status === "checked_out")
    .reduce((sum: number, b) => sum + Number(b.totalAmount || 0), 0);

  const activeAdvance = filteredBookings
    .filter((b) => b.status === "checked_in")
    .reduce((sum: number, b) => sum + Number(b.advanceAmount || 0), 0);

  const restaurantRevenue = filteredOrders
    .filter((o) => o.status === "billed")
    .reduce((sum: number, o) => sum + Number(o.totalAmount || 0), 0);

  const totalExpenses = filteredExpenses.reduce(
    (sum: number, e) => sum + Number(e.amount || 0),
    0
  );

  // Per-hotel stats for the table
  const hotelRows = hotels.map((hotel) => {
    const hRooms = rooms.filter((r) => r.hotelId === hotel.id);
    const hBookings = bookings.filter((b) => b.hotelId === hotel.id);
    const hOrders = restaurantOrders.filter((o) => o.hotelId === hotel.id);
    const hExpenses = expenses.filter((e) => e.hotelId === hotel.id);

    return {
      id: hotel.id,
      name: hotel.name,
      address: hotel.address ?? hotel.city ?? "—",
      totalRooms: hRooms.length,
      occupied: hRooms.filter((r) => r.status === "occupied").length,
      vacant: hRooms.filter((r) => r.status === "vacant").length,
      completedRevenue: hBookings
        .filter((b) => b.status === "checked_out")
        .reduce((s: number, b) => s + Number(b.totalAmount || 0), 0),
      activeAdvance: hBookings
        .filter((b) => b.status === "checked_in")
        .reduce((s: number, b) => s + Number(b.advanceAmount || 0), 0),
      restaurantRevenue: hOrders
        .filter((o) => o.status === "billed")
        .reduce((s: number, o) => s + Number(o.totalAmount || 0), 0),
      totalExpenses: hExpenses.reduce((s: number, e) => s + Number(e.amount || 0), 0),
    };
  });

  const displayHotel = selectedHotelId
    ? hotels.find((h) => h.id === selectedHotelId)
    : null;

  const selectedHotelStats = selectedHotelId
    ? hotelRows.find((h) => h.id === selectedHotelId)
    : null;

  const totalRooms = selectedHotelStats?.totalRooms ?? dashboardStats?.totalRooms ?? 0;
  const occupied = selectedHotelStats?.occupied ?? dashboardStats?.occupiedRooms ?? 0;
  const vacant = selectedHotelStats?.vacant ?? dashboardStats?.vacantRooms ?? 0;

  if (isLoading && hotels.length === 0) {
    return (
      <AppLayout title="Admin Dashboard" requiredRole="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
          <span className="ml-3 text-gray-500">Loading dashboard...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin Dashboard" requiredRole="admin">
      <div className="space-y-6 max-w-7xl">
        {/* Hotel Selector Banner */}
        <div
          className="rounded-xl p-5 flex items-center gap-5"
          style={{
            background: "#1F2937",
            border: "1px solid #E5E1DA",
          }}
        >
          <div className="flex-1 text-center sm:text-left">
            <h2
              style={{
                fontFamily: "Times New Roman, serif",
                color: "#F9FAFB",
                fontSize: "1.3rem",
              }}
            >
              {displayHotel ? displayHotel.name : "ALL HOTELS"}
            </h2>
            <p
              className="text-sm mt-0.5"
              style={{ color: "#D1D5DB" }}
            >
              {displayHotel
                ? (displayHotel.address ?? displayHotel.city)
                : "Combined data across all properties"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label
              className="text-xs font-semibold"
              style={{ color: "#D1D5DB" }}
            >
              CONTEXT:
            </label>
            <select
              value={selectedHotelId || "all"}
              onChange={(e) =>
                setCurrentHotelId(e.target.value === "all" ? null : e.target.value)
              }
              className="px-4 py-2 rounded-xl text-sm outline-none cursor-pointer appearance-none transition-all hover:bg-gray-800"
              style={{
                background: "#374151",
                border: `1.5px solid ${GOLD}`,
                color: "#FFFFFF",
                boxShadow: `0 0 10px ${GOLD}20`
              }}
            >
              <option value="all">All Hotels</option>
              {hotels.map((h: any) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Hotels"
            value={hotels.length}
            icon={<Building2 className="w-5 h-5" />}
            color={GOLD}
          />
          <StatCard
            label="Total Rooms"
            value={totalRooms}
            icon={<DoorOpen className="w-5 h-5" />}
            color="#3b82f6"
          />
          <StatCard
            label="Occupied"
            value={occupied}
            icon={<CheckCircle className="w-5 h-5" />}
            color="#ef4444"
            sub={`${vacant} vacant`}
          />
          <StatCard
            label="Today's Check-ins"
            value={todayCheckIns}
            icon={<Users className="w-5 h-5" />}
            color="#8b5cf6"
            sub={`${todayCheckOuts} checkouts`}
          />
          <StatCard
            label="Advance Collected"
            value={formatCurrency(activeAdvance)}
            icon={<IndianRupee className="w-5 h-5" />}
            color="#8b5cf6"
          />
          <StatCard
            label="Completed Revenue"
            value={formatCurrency(completedRevenue)}
            icon={<IndianRupee className="w-5 h-5" />}
            color={GOLD}
          />
          <StatCard
            label="Restaurant Revenue"
            value={formatCurrency(restaurantRevenue)}
            icon={<UtensilsCrossed className="w-5 h-5" />}
            color="#059669"
          />
          <StatCard
            label="Total Expenses"
            value={formatCurrency(totalExpenses)}
            icon={<Wallet className="w-5 h-5" />}
            color="#dc2626"
            sub={`Net: ${formatCurrency(completedRevenue + activeAdvance + restaurantRevenue - totalExpenses)}`}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "New Reservation",
                desc: "Book a room",
                path: "/admin/reservations",
                icon: <Building2 className="w-5 h-5" />,
              },
              {
                label: "New Check-In",
                desc: "Walk-in or confirm",
                path: "/admin/check-in",
                icon: <Users className="w-5 h-5" />,
              },
              {
                label: "View Bills",
                desc: "Manage all bills",
                path: "/admin/bills",
                icon: <IndianRupee className="w-5 h-5" />,
              },
              {
                label: "Invoices",
                desc: "GST & Tax Invoices",
                path: "/admin/invoices",
                icon: <FileText className="w-5 h-5" />,
              },
              {
                label: "Reports",
                desc: "Analytics & charts",
                path: "/admin/reports",
                icon: <LayoutDashboard className="w-5 h-5" />,
              },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="rounded-xl p-4 text-left transition-all group"
                style={{
                  background: "white",
                  border: "1px solid #E5E1DA",
                  boxShadow: "0 2px 8px rgba(221, 215, 204,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border =
                    "1px solid rgba(255,255,255,0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(184,134,11,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border =
                    "1px solid #E5E1DA";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(221, 215, 204,0.05)";
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(221, 215, 204,0.1)", color: GOLD }}
                  >
                    {action.icon}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    style={{ color: GOLD }}
                  />
                </div>
                <div
                  className="font-semibold text-sm"
                  style={{ color: "#1F2937" }}
                >
                  {action.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Hotel Performance Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "white",
            border: "1px solid #E5E1DA",
            boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
          }}
        >
          <div
            className="px-6 py-4"
            style={{
              borderBottom: "1px solid #E5E1DA",
              background: "linear-gradient(135deg, #faf5e4, #FFFFFF)",
            }}
          >
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Hotel Summary
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Hotel",
                    "Location",
                    "Rooms",
                    "Occupied",
                    "Vacant",
                    "Occupancy",
                    "Completed Rev",
                    "Active Adv",
                    "Restaurant",
                    "Expenses",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: "#A8832D",
                        borderBottom: "2px solid #E5E1DA",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hotelRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-400">
                      No hotels found. Add a hotel from Hotel Management.
                    </td>
                  </tr>
                ) : (
                  hotelRows
                    .filter(h => !selectedHotelId || h.id === selectedHotelId)
                    .map((hotel) => {
                      const occ = hotel.totalRooms > 0
                        ? ((hotel.occupied / hotel.totalRooms) * 100).toFixed(0)
                        : "0";
                      const isSelected = hotel.id === selectedHotelId;
                      return (
                        <tr
                          key={hotel.id}
                          className="transition-colors cursor-pointer"
                          style={{
                            borderBottom: "1px solid rgba(229,225,218,0.5)",
                            backgroundColor: isSelected ? `${GOLD}10` : "transparent"
                          }}
                          onClick={() => setCurrentHotelId(hotel.id)}
                          onMouseEnter={(e) =>
                            !isSelected && (e.currentTarget.style.background = "#FAFAF8")
                          }
                          onMouseLeave={(e) =>
                            !isSelected && (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            className="px-4 py-3 font-semibold text-sm"
                            style={{ color: "#1F2937" }}
                          >
                            {hotel.name}
                          </td>
                          <td
                            className="px-4 py-3 text-xs"
                            style={{ color: "#6B7280" }}
                          >
                            {hotel.address}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium">
                            {hotel.totalRooms}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: "#fee2e2", color: "#dc2626" }}
                            >
                              {hotel.occupied}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: "#dcfce7", color: "#16a34a" }}
                            >
                              {hotel.vacant}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex-1 h-1.5 rounded-full"
                                style={{ background: "#f3e8c0" }}
                              >
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{
                                    width: `${occ}%`,
                                    background:
                                      "linear-gradient(90deg, #C6A75E, #A8832D)",
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-semibold w-8"
                                style={{ color: GOLD }}
                              >
                                {occ}%
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 text-sm font-semibold"
                            style={{ color: GOLD }}
                          >
                            {formatCurrency(hotel.completedRevenue)}
                          </td>
                          <td
                            className="px-6 py-4 text-sm font-semibold"
                            style={{ color: "#8b5cf6" }}
                          >
                            {formatCurrency(hotel.activeAdvance)}
                          </td>
                          <td
                            className="px-4 py-3 text-sm font-semibold"
                            style={{ color: "#059669" }}
                          >
                            {formatCurrency(hotel.restaurantRevenue)}
                          </td>
                          <td
                            className="px-4 py-3 text-sm font-semibold"
                            style={{ color: "#dc2626" }}
                          >
                            {formatCurrency(hotel.totalExpenses)}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
