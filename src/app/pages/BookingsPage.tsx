import { useState, useMemo } from "react";
import { useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
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
} from "lucide-react";
import { BookingPreviewModal } from "../components/BookingPreviewModal";
import { Booking } from "../contexts/PMSContext";

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

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        const matchHotel = filterHotel === "all" || b.hotelId === filterHotel;
        const matchSearch =
          !search ||
          b.guestName.toLowerCase().includes(search.toLowerCase()) ||
          b.roomNumber.includes(search);
        const matchStatus = filterStatus === "all" || b.status === filterStatus;
        const matchFrom = !dateFrom || b.checkInDate >= dateFrom;
        const matchTo = !dateTo || b.checkOutDate <= dateTo;
        return matchHotel && matchSearch && matchStatus && matchFrom && matchTo;
      }),
    [bookings, filterHotel, search, filterStatus, dateFrom, dateTo],
  );

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
          b.checkInDate,
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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: GOLD }}
              />
              <input
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-56"
                style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
                placeholder="Search guest / room…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.slice(0, 40).map((b) => {
              const { bg, text } = STATUS_COLORS[b.status] || {
                bg: "#f3f4f6",
                text: "#6B7280",
              };
              const nights = Math.max(
                1,
                Math.ceil(
                  (new Date(b.checkOutDate).getTime() -
                    new Date(b.checkInDate).getTime()) /
                  86400000,
                ),
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
                      className="font-bold text-sm"
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
                          className="px-1.5 py-1 rounded bg-white/50 hover:bg-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" style={{ color: text }} />
                        </button>
                        <span
                          className="text-xs font-medium"
                          style={{ color: text }}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-1">
                    <div className="text-xs" style={{ color: "#6B7280" }}>
                      {b.checkInDate} → {b.checkOutDate}
                    </div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>
                      {nights} nights · {b.adults + b.children} guests
                    </div>
                    <div className="font-bold text-sm" style={{ color: GOLD }}>
                      {formatCurrency(b.totalAmount)}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div
                className="col-span-4 py-12 text-center text-sm"
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
      <div className="space-y-5 max-w-7xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: GOLD }}
            />
            <input
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-56"
              style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
              placeholder="Search guest / room…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
          <select
            className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
            style={{
              border: `1.5px solid ${BORDER}`,
              background: CARD,
              color: DARKGOLD,
            }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="checked_in">Checked-In</option>
            <option value="checked_out">Checked-Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex-1" />
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
            }}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
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
                    const nights = Math.max(
                      1,
                      Math.ceil(
                        (new Date(b.checkOutDate).getTime() -
                          new Date(b.checkInDate).getTime()) /
                        86400000,
                      ),
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
                        <td className="px-4 py-3 text-sm">{b.checkInDate}</td>
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
