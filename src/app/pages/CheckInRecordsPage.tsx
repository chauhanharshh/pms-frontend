import { useState, useMemo } from "react";
import { useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { calculateRoomDays, formatActualCheckInDateTime, formatCurrency } from "../utils/format";
import { exportToCSV } from "../utils/tableExport";
import {
  Search,
  Plus,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  List,
  Calendar,
  Printer,
} from "lucide-react";
import { printReport, PrintConfig } from "../utils/printReport";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

const statusColors: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "#dbeafe", text: "#1e40af" },
  "checked-in": { bg: "#dcfce7", text: "#166534" },
  "checked-out": { bg: "#ede9fe", text: "#6b21a8" },
  cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

export function CheckInRecordsPage() {
  const { user } = useAuth();
  const { bookings, hotels, updateBooking } = usePMS();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const segment = location.pathname.split("/").pop() || "all";
  const [search, setSearch] = useState("");
  const [filterHotel, setFilterHotel] = useState(
    isAdmin ? "all" : user?.hotelId || "",
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        const matchHotel = filterHotel === "all" || b.hotelId === filterHotel;
        const matchSearch =
          !search ||
          b.guestName.toLowerCase().includes(search.toLowerCase()) ||
          b.roomNumber.includes(search);
        const matchStatus =
          segment === "all"
            ? true
            : segment === "cancelled"
              ? b.status === "cancelled"
              : segment === "no-invoice"
                ? b.status === "checked_out"
                : true;
        const matchDateFrom = !dateFrom || b.checkInDate >= dateFrom;
        const matchDateTo = !dateTo || b.checkOutDate <= dateTo;
        return (
          matchHotel &&
          matchSearch &&
          matchStatus &&
          matchDateFrom &&
          matchDateTo
        );
      }),
    [bookings, filterHotel, search, segment, dateFrom, dateTo],
  );

  const pageTitle =
    {
      all: "All Check-Ins",
      cancelled: "Cancelled Bookings",
      "no-invoice": "Checked-Out · Invoice Pending",
    }[segment] || "Check-In Records";

  const exportCSV = () => {
    const dataToExport = filtered.map((b) => ({
      Guest: b.guestName,
      Phone: b.guestPhone,
      Room: b.roomNumber,
      "Check-In": formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate),
      "Check-Out": b.checkOutDate || "—",
      Amount: b.totalAmount,
      Advance: b.advanceAmount,
      Status: b.status,
    }));

    exportToCSV(dataToExport, `${segment}-records`);
  };

  const handlePrint = () => {
    if (filtered.length === 0) return;

    const activeHotelId = filterHotel === "all" ? (hotels.length > 0 ? hotels[0]?.id : "") : filterHotel;
    const activeHotel = hotels.find(h => h.id === activeHotelId);

    const config: PrintConfig = {
      title: pageTitle,
      hotelName: activeHotel?.name || "Hotel Suvidha Deluxe",
      dateFrom: dateFrom || "N/A",
      dateTo: dateTo || "N/A",
      columns: [
        "Guest", "Phone", "Room", "Check-In", "Check-Out", "Nights", "Amount", "Advance", "Status"
      ],
      rows: filtered.map(b => {
        const nights = calculateRoomDays(
          `${b.checkInDate}T${(b as any)?.checkInTime || "12:00"}`,
          `${b.checkOutDate}T${(b as any)?.checkOutTime || "12:00"}`
        );
        return [
          b.guestName,
          b.guestPhone,
          `Room ${b.roomNumber}`,
          formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate),
          b.checkOutDate || "—",
          `${nights}N`,
          formatCurrency(b.totalAmount),
          formatCurrency(b.advanceAmount),
          b.status
        ];
      }),
      totalsRow: [
        'TOTAL', '', '', '', '', '',
        formatCurrency(filtered.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)),
        formatCurrency(filtered.reduce((sum, b) => sum + Number(b.advanceAmount || 0), 0)),
        ''
      ]
    };

    printReport(config);
  };

  return (
    <AppLayout title={pageTitle}>
      <div className="space-y-5 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Shown", value: filtered.length, color: DARKGOLD },
            {
              label: "Confirmed",
              value: bookings.filter(
                (b) =>
                  b.status === "confirmed" &&
                  (filterHotel === "all" || b.hotelId === filterHotel),
              ).length,
              color: "#3b82f6",
            },
            {
              label: "Checked-In",
              value: bookings.filter(
                (b) =>
                  b.status === "checked_in" &&
                  (filterHotel === "all" || b.hotelId === filterHotel),
              ).length,
              color: "#16a34a",
            },
            {
              label: "Cancelled",
              value: bookings.filter(
                (b) =>
                  b.status === "cancelled" &&
                  (filterHotel === "all" || b.hotelId === filterHotel),
              ).length,
              color: "#dc2626",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {s.label}
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: "Times New Roman, serif", color: s.color }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {segment === "no-invoice" && (
          <div
            className="px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: "#fef9c3", border: "1px solid #fde047" }}
          >
            <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              These guests have checked out but their invoice has not been
              generated. Please process their bills.
            </p>
          </div>
        )}

        {/* Filters */}
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
          <input
            type="date"
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            title="Check-in from"
          />
          <input
            type="date"
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            title="Check-out to"
          />
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
          <div className="flex-1" />
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#C6A75E]" />
            Print {/* Updated: uses printReport utility for proper landscape print */}
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
            }}
          >
            Export CSV
          </button>
        </div>

        {/* Table */}
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
                    "Check-In",
                    "Check-Out",
                    "Nights",
                    "Amount",
                    "Advance",
                    "Status",
                    "Actions",
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
                      No records found
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const nights = calculateRoomDays(
                      `${b.checkInDate}T${(b as any)?.checkInTime || "12:00"}`,
                      `${b.checkOutDate}T${(b as any)?.checkOutTime || "12:00"}`,
                    );
                    const hotelName =
                      hotels.find((h) => h.id === b.hotelId)?.name || "—";
                    const { bg, text } = statusColors[b.status] || {
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
                            {hotelName}
                          </td>
                        )}
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
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: bg, color: text }}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status === "confirmed" && (
                            <button
                              onClick={() =>
                                updateBooking(b.id, { status: "cancelled" })
                              }
                              className="text-xs px-2 py-1 rounded-lg"
                              style={{
                                border: "1px solid #fca5a5",
                                color: "#dc2626",
                              }}
                            >
                              Cancel
                            </button>
                          )}
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
