import { useState, useMemo } from "react";
import { useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { calculateRoomDays, formatActualCheckInDateTime, formatCurrency } from "../utils/format";
import {
  Search,
  Calendar,
  Grid,
  List,
  TrendingUp,
  AlertCircle,
  Download,
  Filter,
  Eye,
  X,
  Phone,
  BedDouble,
  Clock,
} from "lucide-react";
import { BookingPreviewModal } from "../components/BookingPreviewModal";
import { Booking } from "../contexts/PMSContext";
import { useMediaQuery } from "../hooks/useMediaQuery";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef08a", text: "#a16207" },
  confirmed: { bg: "#fef08a", text: "#a16207" },
  "checked-in": { bg: "#dcfce7", text: "#166534" },
  checked_in: { bg: "#dcfce7", text: "#166534" },
  "checked-out": { bg: "#ede9fe", text: "#6b21a8" },
  cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

export function BookingsPage() {
  const { user } = useAuth();
  const { bookings, rooms, hotels } = usePMS();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const segment = location.pathname.split("/").pop() || "list";
  const [search, setSearch] = useState("");
  const [filterHotel, setFilterHotel] = useState(
    isAdmin ? "all" : user?.hotelId || "",
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);

  const statusPriority: Record<string, number> = {
    pending: 1,
    confirmed: 1,
    checked_in: 2,
    "checked-in": 2,
    checked_out: 3,
    "checked-out": 3,
    cancelled: 4,
  };

  const filtered = useMemo(() => {
    const data = bookings.filter((b) => {
      const matchHotel = filterHotel === "all" || b.hotelId === filterHotel;
      const matchSearch =
        !search ||
        b.guestName.toLowerCase().includes(search.toLowerCase()) ||
        b.roomNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchFrom = !dateFrom || b.checkInDate >= dateFrom;
      const matchTo = !dateTo || b.checkInDate <= dateTo; // Usually filtered by check-in date
      return matchHotel && matchSearch && matchStatus && matchFrom && matchTo;
    });

    return [...data].sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;

      if (pA !== pB) return pA - pB;

      // Within same priority, sort by date (latest first)
      const dateA = a.createdAt || a.checkInDate;
      const dateB = b.createdAt || b.checkInDate;
      return dateB.localeCompare(dateA);
    });
  }, [bookings, filterHotel, search, filterStatus, dateFrom, dateTo]);

  const pageTitle =
    {
      list: "All Bookings — List View",
      grid: "All Bookings — Grid View",
      chart: "Reservation Chart",
      rates: "Channel Manager Rates",
      new: "New E-Booking",
    }[segment] || "Bookings";

  const exportCSV = () => {
    const csv = [
      [
        "Guest",
        "Phone",
        "Room",
        "Hotel",
        "Check-In",
        "Check-Out",
        "Amount",
        "Status",
      ].join(","),
      ...filtered.map((b) => {
        const hotel = hotels.find((h) => h.id === b.hotelId);
        return [
          b.guestName,
          b.guestPhone,
          b.roomNumber,
          hotel?.name || "",
          formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate),
          b.checkOutDate,
          b.totalAmount,
          b.status,
        ].join(",");
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${segment}.csv`;
    a.click();
  };

  const isMobile = useMediaQuery("(max-width: 1024px)");

  // ── CHART VIEW ─────────────────────────────────────────────────────────────
  if (segment === "chart") {
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i - 3);
      return d.toISOString().split("T")[0];
    });

    const hotelRooms = rooms.filter(
      (r) => filterHotel === "all" || r.hotelId === filterHotel,
    );
    const todayStr = today.toISOString().split("T")[0];

    return (
      <AppLayout title="Reservation Chart">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            {isAdmin && (
              <select
                className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
                style={{
                  border: `1.5px solid ${BORDER}`,
                  background: CARD,
                  color: DARKGOLD,
                }}
                value={filterHotel}
                onChange={(e) => setFilterHotel(e.target.value)}
              >
                <option value="all">All Hotels</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            className="rounded-2xl overflow-auto"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-6 py-4"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <h2
                className="font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                14-Day Reservation Chart
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ background: "#FFFFFF" }}>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold uppercase sticky left-0 z-10"
                      style={{
                        color: DARKGOLD,
                        borderBottom: `2px solid ${BORDER}`,
                        background: "#FFFFFF",
                        minWidth: "80px",
                      }}
                    >
                      Room
                    </th>
                    {days.map((d) => (
                      <th
                        key={d}
                        className="px-2 py-3 text-center text-xs font-bold"
                        style={{
                          color: d === todayStr ? GOLD : DARKGOLD,
                          borderBottom: `2px solid ${BORDER}`,
                          background:
                            d === todayStr
                              ? "rgba(229,225,218,0.5)"
                              : "#FFFFFF",
                          minWidth: "70px",
                        }}
                      >
                        <div>
                          {new Date(d + "T00:00:00").toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short" },
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hotelRooms.slice(0, 20).map((room) => (
                    <tr
                      key={room.id}
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                      <td
                        className="px-4 py-2 font-bold text-xs sticky left-0 z-10"
                        style={{
                          color: DARKGOLD,
                          background: CARD,
                          borderRight: `1px solid ${BORDER}`,
                        }}
                      >
                        Room {room.roomNumber}
                        <div
                          className="text-xs font-normal"
                          style={{ color: "#9CA3AF" }}
                        >
                          {(room as any).type || room.roomType?.name}
                        </div>
                      </td>
                      {days.map((d) => {
                        const booking = bookings.find(
                          (b) =>
                            b.roomId === room.id &&
                            b.checkInDate <= d &&
                            b.checkOutDate > d &&
                            b.status !== "cancelled",
                        );
                        return (
                          <td
                            key={d}
                            className="px-1 py-2 text-center"
                            style={{
                              background:
                                d === todayStr
                                  ? "rgba(184,134,11,0.04)"
                                  : "transparent",
                            }}
                          >
                            {booking ? (
                              <div
                                className="rounded px-1 py-0.5 text-xs truncate max-w-16"
                                style={{
                                  background:
                                    booking.status === "checked_in"
                                      ? "#dcfce7"
                                      : (booking.status === "pending" || booking.status === "confirmed")
                                        ? "#fef08a"
                                        : "#fef08a",
                                  color:
                                    booking.status === "checked_in"
                                      ? "#166534"
                                      : (booking.status === "pending" || booking.status === "confirmed")
                                        ? "#a16207"
                                        : "#a16207",
                                  fontSize: "0.65rem",
                                }}
                              >
                                {booking.guestName.split(" ")[0]}
                              </div>
                            ) : (
                              <div
                                className="text-xs"
                                style={{ color: "#E5E7EB" }}
                              >
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="flex items-center gap-4 text-xs"
            style={{ color: "#6B7280" }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-3 rounded"
                style={{ background: "#dcfce7" }}
              />{" "}
              Checked-In
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-3 rounded"
                style={{ background: "#dbeafe" }}
              />{" "}
              Reserved
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-3 rounded bg-white border"
                style={{ borderColor: BORDER }}
              />{" "}
              Vacant
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── RATES VIEW ─────────────────────────────────────────────────────────────
  if (segment === "rates") {
    const hotelRooms = rooms.filter(
      (r) => filterHotel === "all" || r.hotelId === filterHotel,
    );
    const roomTypes = [...new Set(hotelRooms.map((r) => (r as any).type || r.roomType?.name || "Unknown"))];
    return (
      <AppLayout title="Channel Manager Rates">
        <div className="space-y-5 max-w-4xl">
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: `1.5px solid ${BORDER}`,
                background: CARD,
                color: DARKGOLD,
              }}
              value={filterHotel}
              onChange={(e) => setFilterHotel(e.target.value)}
            >
              <option value="all">All Hotels</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-6 py-4"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <h2
                className="font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                Channel Rate Mapping
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Room Type",
                    "Base Rate",
                    "Walk-In",
                    "OTA (MakeMyTrip)",
                    "OTA (Goibibo)",
                    "Online (Direct)",
                    "Corporate",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-bold uppercase"
                      style={{
                        color: DARKGOLD,
                        borderBottom: `2px solid ${BORDER}`,
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomTypes.map((type) => {
                  const room = hotelRooms.find((r) => ((r as any).type || r.roomType?.name || "Unknown") === type);
                  const base = Number((room as any)?.price || room?.basePrice || 0);
                  return (
                    <tr
                      key={type}
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#FFFFFF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = CARD)
                      }
                    >
                      <td
                        className="px-4 py-3 font-bold text-sm"
                        style={{ color: DARKGOLD }}
                      >
                        {type}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(base)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(base)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {formatCurrency(Math.round(base * 1.12))}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {formatCurrency(Math.round(base * 1.1))}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        {formatCurrency(Math.round(base * 1.05))}
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-600">
                        {formatCurrency(Math.round(base * 0.9))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            * Rates shown are base rate + channel markup. OTA rates include
            10–12% commission overhead. Adjust in Settings.
          </p>
        </div>
      </AppLayout>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────────────────────────
  if (segment === "grid") {
    return (
      <AppLayout title="All Bookings — Grid View">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                style={{ color: GOLD }}
              />
              <input
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
                placeholder="Search guest / room…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && (
              <select
                className="px-3 py-2 rounded-xl text-sm outline-none appearance-none flex-1 sm:flex-none"
                style={{
                  border: `1.5px solid ${BORDER}`,
                  background: CARD,
                  color: DARKGOLD,
                }}
                value={filterHotel}
                onChange={(e) => setFilterHotel(e.target.value)}
              >
                <option value="all">All Hotels</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all flex-1 sm:flex-none" style={{ border: `1.5px solid ${BORDER}`, background: CARD }}>
              <Calendar className="w-4 h-4" style={{ color: GOLD }} />
              <input
                type="date"
                className="bg-transparent outline-none text-xs flex-1 min-w-0"
                style={{ color: DARKGOLD }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="date"
                className="bg-transparent outline-none text-xs flex-1 min-w-0"
                style={{ color: DARKGOLD }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
              {(dateFrom || dateTo) && (
                <button 
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.slice(0, 40).map((b) => {
              const { bg, text } = STATUS_COLORS[b.status] || {
                bg: "#f3f4f6",
                text: "#6B7280",
              };
              const nights = calculateRoomDays(
                `${b.checkInDate}T${(b as any)?.checkInTime || "12:00"}`,
                `${b.checkOutDate}T${(b as any)?.checkOutTime || "12:00"}`,
              );
              return (
                <div
                  key={b.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="px-4 py-3" style={{ background: bg }}>
                    <div
                      className="font-bold text-sm truncate"
                      style={{
                        color: text,
                        fontFamily: "Times New Roman, serif",
                      }}
                    >
                      {b.guestName}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="text-xs font-bold"
                        style={{ color: text }}
                      >
                        Room {b.roomNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewBooking(b)}
                          className="p-2.5 rounded-lg bg-white/60 hover:bg-white active:bg-white transition-all shadow-sm flex items-center justify-center"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5 md:w-3.5 md:h-3.5" style={{ color: text }} />
                        </button>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-current opacity-70"
                          style={{ color: text }}
                        >
                          {b.status.replace("_", "-")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-1">
                    <div className="text-[11px] font-medium" style={{ color: "#6B7280" }}>
                      <Calendar className="w-3 h-3 inline mr-1 opacity-60" />
                      {formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate)} → {b.checkOutDate}
                    </div>
                    <div className="text-[11px]" style={{ color: "#6B7280" }}>
                      {nights} nights · {b.adults + b.children} guests
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <div className="font-bold text-sm" style={{ color: GOLD }}>
                        {formatCurrency(b.totalAmount)}
                      </div>
                      {(b as any).source && (
                        <div className="text-[10px] text-gray-400 capitalize bg-gray-50 px-1.5 rounded">
                          {(b as any).source}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div
                className="col-span-full py-12 text-center text-sm"
                style={{ color: "#9CA3AF" }}
              >
                No bookings found
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── LIST VIEW (default) ────────────────────────────────────────────────────
  return (
    <AppLayout title={pageTitle}>
      <div className="space-y-4 sm:space-y-5 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              style={{ color: GOLD }}
            />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
              placeholder="Search guest / room…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {isAdmin && (
              <select
                className="px-3 py-2 rounded-xl text-sm outline-none appearance-none flex-1 sm:flex-none"
                style={{
                  border: `1.5px solid ${BORDER}`,
                  background: CARD,
                  color: DARKGOLD,
                }}
                value={filterHotel}
                onChange={(e) => setFilterHotel(e.target.value)}
              >
                <option value="all">Hotels (A)</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none flex-1 sm:flex-none"
              style={{
                border: `1.5px solid ${BORDER}`,
                background: CARD,
                color: DARKGOLD,
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Status (A)</option>
              <option value="pending">Pending</option>
              <option value="checked_in">C-In</option>
              <option value="checked_out">C-Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all flex-1 sm:flex-none" style={{ border: `1.5px solid ${BORDER}`, background: CARD }}>
              <Calendar className="w-4 h-4" style={{ color: GOLD }} />
              <input
                type="date"
                className="bg-transparent outline-none text-xs flex-1 min-w-0"
                style={{ color: DARKGOLD }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="date"
                className="bg-transparent outline-none text-xs flex-1 min-w-0"
                style={{ color: DARKGOLD }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white ml-auto"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
              }}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <div
            className="px-6 py-4"
            style={{
              background: "#FFFFFF",
              borderBottom: `2px solid ${BORDER}`,
            }}
          >
            <h2
              className="font-bold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              {pageTitle} ({filtered.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isMobile ? (
              <div className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    No bookings found
                  </div>
                ) : (
                  filtered.map((b) => {
                    const nights = calculateRoomDays(
                      `${b.checkInDate}T${(b as any)?.checkInTime || "12:00"}`,
                      `${b.checkOutDate}T${(b as any)?.checkOutTime || "12:00"}`,
                    );
                    const { bg, text } = STATUS_COLORS[b.status] || {
                      bg: "#f3f4f6",
                      text: "#6B7280",
                    };
                    return (
                      <div key={b.id} className="p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-bold text-gray-900">{b.guestName}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {b.guestPhone}
                            </div>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: bg, color: text }}
                          >
                            {(b.status === "pending" || b.status === "confirmed") ? "pending" : b.status.replace("_", "-")}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <BedDouble className="w-3.5 h-3.5" style={{ color: GOLD }} />
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase font-bold leading-tight">Room</div>
                              <div className="text-xs font-bold text-gray-700">{b.roomNumber}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <Clock className="w-3.5 h-3.5" style={{ color: GOLD }} />
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase font-bold leading-tight">Nights</div>
                              <div className="text-xs font-bold text-gray-700">{nights}N</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold leading-tight">Total Amount</div>
                            <div className="text-sm font-bold" style={{ color: DARKGOLD }}>{formatCurrency(b.totalAmount)}</div>
                          </div>
                          <button
                            onClick={() => setPreviewBooking(b)}
                            className="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                            style={{ 
                              background: "white", 
                              color: DARKGOLD,
                              border: `1.5px solid ${BORDER}`,
                            }}
                          >
                            <Eye className="w-4 h-4" /> DETAILS
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FFFFFF" }}>
                    {[
                      "Guest",
                      "Phone",
                      "Room",
                      ...(isAdmin ? ["Hotel"] : []),
                      "Source",
                      "Check-In",
                      "Check-Out",
                      "Nights",
                      "Amount",
                      "Advance",
                      "Status",
                      "Action",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-bold uppercase"
                        style={{
                          color: DARKGOLD,
                          borderBottom: `2px solid ${BORDER}`,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-12 text-center text-sm"
                        style={{ color: "#9CA3AF" }}
                      >
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const nights = calculateRoomDays(
                        `${b.checkInDate}T${(b as any)?.checkInTime || "12:00"}`,
                        `${b.checkOutDate}T${(b as any)?.checkOutTime || "12:00"}`,
                      );
                      const hotel = hotels.find((h) => h.id === b.hotelId);
                      const { bg, text } = STATUS_COLORS[b.status] || {
                        bg: "#f3f4f6",
                        text: "#6B7280",
                      };
                      return (
                        <tr
                          key={b.id}
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#FFFFFF")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = CARD)
                          }
                        >
                          <td className="px-4 py-3">
                            <div
                              className="font-semibold text-sm"
                              style={{ color: "#1F2937" }}
                            >
                              {b.guestName}
                            </div>
                            <div className="text-xs" style={{ color: "#9CA3AF" }}>
                              {b.guestEmail}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{b.guestPhone}</td>
                          <td
                            className="px-4 py-3 font-bold text-sm"
                            style={{ color: DARKGOLD }}
                          >
                            Room {b.roomNumber}
                          </td>
                          {isAdmin && (
                            <td
                              className="px-4 py-3 text-xs"
                              style={{ color: "#6B7280" }}
                            >
                              {hotel?.name || "—"}
                            </td>
                          )}
                          <td
                            className="px-4 py-3 text-xs capitalize"
                            style={{ color: "#6B7280" }}
                          >
                            {b.source || "direct"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate)}
                          </td>
                          <td className="px-4 py-3 text-sm">{b.checkOutDate}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            {nights}N
                          </td>
                          <td
                            className="px-4 py-3 font-bold text-sm"
                            style={{ color: GOLD }}
                          >
                            {formatCurrency(b.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            {formatCurrency(b.advanceAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                              style={{ background: bg, color: text }}
                            >
                              {(b.status === "pending" || b.status === "confirmed") ? "pending" : b.status.replace("_", "-")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setPreviewBooking(b)}
                              className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border flex items-center gap-1"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {previewBooking && (
        <BookingPreviewModal
          booking={previewBooking}
          room={rooms.find((r) => r.id === previewBooking.roomId)}
          onClose={() => setPreviewBooking(null)}
        />
      )}
    </AppLayout>
  );
}
