import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatActualCheckInDateTime, formatCurrency } from "../utils/format";
import {
  UserCheck,
  LogOut,
  BookMarked,
  Receipt,
  CreditCard,
  CheckCircle,
  Banknote,
  Search,
  Download,
  Calendar,
  Filter,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  Users,
  DoorOpen,
} from "lucide-react";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";
const BG = "var(--background, #FAF7F2)";
const CARD = "#FFFFFF";
const BORDER = "#E5E1DA";

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_CONFIGS: Record<
  string,
  {
    title: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }
> = {
  "check-ins": {
    title: "Today's Check-Ins",
    icon: <UserCheck className="w-5 h-5" />,
    color: "#16a34a",
  },
  "check-outs": {
    title: "Today's Check-Outs",
    icon: <LogOut className="w-5 h-5" />,
    color: "#dc2626",
  },
  bookings: {
    title: "Today's Bookings",
    icon: <BookMarked className="w-5 h-5" />,
    color: "#3b82f6",
  },
  invoices: {
    title: "Today's Invoices",
    icon: <Receipt className="w-5 h-5" />,
    color: "#8b5cf6",
  },
  advances: {
    title: "Today's Advance Payments",
    icon: <CreditCard className="w-5 h-5" />,
    color: "#f59e0b",
  },
  settlements: {
    title: "Today's Settlements",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "#0ea5e9",
  },
  payments: {
    title: "Today's Paid Payments",
    icon: <Banknote className="w-5 h-5" />,
    color: "#10b981",
  },
};

export function TodaysView() {
  const { user, currentHotelId } = useAuth();
  const { bookings, invoices, advances, hotels } = usePMS();
  const location = useLocation();
  const navigate = useNavigate();

  const segment = location.pathname.split("/").pop() || "check-ins";
  const config = PAGE_CONFIGS[segment] || PAGE_CONFIGS["check-ins"];

  const isAdmin = user?.role === "admin";
  const { setCurrentHotelId } = useAuth();
  const hotelFilter = isAdmin ? (currentHotelId || "all") : (user?.hotelId || "");
  const [dateFilter, setDateFilter] = useState(today());
  const [search, setSearch] = useState("");

  const todayStr = dateFilter || today();

  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const matchHotel = hotelFilter === "all" || b.hotelId === hotelFilter;
        const matchSearch =
          !search ||
          b.guestName?.toLowerCase().includes(search.toLowerCase()) ||
          b.room?.roomNumber?.includes(search);
        const matchDate = (b.checkInDate as string)?.startsWith(todayStr);
        return (
          matchHotel && matchSearch && (segment === "bookings" || matchDate)
        );
      }),
    [bookings, hotelFilter, search, todayStr, segment],
  );

  const todayCheckIns = useMemo(
    () =>
      bookings.filter((b) => {
        const matchHotel = hotelFilter === "all" || b.hotelId === hotelFilter;
        const matchSearch =
          !search ||
          b.guestName?.toLowerCase().includes(search.toLowerCase()) ||
          b.room?.roomNumber?.includes(search);
        return (
          matchHotel &&
          matchSearch &&
          (b.checkInDate as string)?.startsWith(todayStr) &&
          b.status === "checked_in"
        );
      }),
    [bookings, hotelFilter, search, todayStr],
  );

  const todayCheckOuts = useMemo(
    () =>
      bookings.filter((b) => {
        const matchHotel = hotelFilter === "all" || b.hotelId === hotelFilter;
        const matchSearch =
          !search ||
          b.guestName?.toLowerCase().includes(search.toLowerCase()) ||
          b.room?.roomNumber?.includes(search);
        return (
          matchHotel &&
          matchSearch &&
          (b.checkOutDate as string)?.startsWith(todayStr) &&
          (b.status === "checked_out" || b.status === "checked_in")
        );
      }),
    [bookings, hotelFilter, search, todayStr],
  );

  const todayInvoices = useMemo(
    () =>
      invoices.filter((inv) => {
        const guestName = inv.bill?.booking?.guestName || "";
        const matchHotel = hotelFilter === "all" || inv.hotelId === hotelFilter;
        const matchSearch =
          !search || guestName.toLowerCase().includes(search.toLowerCase());
        return matchHotel && matchSearch && (inv.createdAt as string)?.startsWith(todayStr);
      }),
    [invoices, hotelFilter, search, todayStr],
  );

  const todayAdvances = useMemo(
    () =>
      advances.filter((a: any) => {
        const matchHotel = hotelFilter === "all" || a.hotelId === hotelFilter;
        const matchSearch =
          !search || a.guestName?.toLowerCase().includes(search.toLowerCase());
        return matchHotel && matchSearch && (a.paymentDate as string)?.startsWith(todayStr);
      }),
    [advances, hotelFilter, search, todayStr],
  );

  const todaySettlements = useMemo(
    () =>
      invoices.filter((inv: any) => {
        const matchHotel = hotelFilter === "all" || inv.hotelId === hotelFilter;
        const status = String(inv.status || "").toLowerCase();
        return (
          matchHotel &&
          status !== "paid" &&
          inv.createdAt?.startsWith(todayStr)
        );
      }),
    [invoices, hotelFilter, todayStr],
  );

  const todayPayments = useMemo(
    () =>
      invoices.filter((inv: any) => {
        const matchHotel = hotelFilter === "all" || inv.hotelId === hotelFilter;
        const status = String(inv.status || "").toLowerCase();
        return (
          matchHotel &&
          status === "paid" &&
          inv.createdAt?.startsWith(todayStr)
        );
      }),
    [invoices, hotelFilter, todayStr],
  );

  const filteredCreated = useMemo(
    () =>
      bookings.filter((b) => {
        const matchDate = b.createdAt?.split("T")[0] === today();
        const matchHotel = hotelFilter === "all" || b.hotelId === hotelFilter;
        return matchDate && matchHotel;
      }),
    [bookings, hotelFilter],
  );

  const getRows = () => {
    switch (segment) {
      case "check-ins":
        return todayCheckIns;
      case "check-outs":
        return todayCheckOuts;
      case "bookings":
        return filteredBookings;
      case "settlements":
        return todaySettlements;
      case "payments":
        return todayPayments;
      case "invoices":
        return todayInvoices;
      case "advances":
        return todayAdvances;
      default:
        return [];
    }
  };

  const rows = getRows();
  const totalRevenue = todayCheckOuts.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const totalAdvanceAmt = todayAdvances.reduce((s, a) => s + Number(a.amount || 0), 0);

  const exportCSV = () => {
    const headers = [
      "Guest Name",
      "Room",
      "Check-In",
      "Check-Out",
      "Amount",
      "Status",
    ];
    const csvRows = [
      headers.join(","),
      ...rows.map((b: any) =>
        [
          b.guestName,
          b.room?.roomNumber || "—",
          formatActualCheckInDateTime(b, b?.reservation, b?.checkInDate),
          (b.checkOutDate as string)?.split("T")[0],
          b.totalAmount,
          b.status,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${segment}-${todayStr}.csv`;
    a.click();
  };

  // Summary cards
  const summaryCards = [
    {
      label: "Check-Ins",
      value: todayCheckIns.length,
      color: "#16a34a",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      label: "Check-Outs",
      value: todayCheckOuts.length,
      color: "#dc2626",
      icon: <LogOut className="w-5 h-5" />,
    },
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      color: GOLD,
      icon: <IndianRupee className="w-5 h-5" />,
    },
    {
      label: "Advances",
      value: formatCurrency(totalAdvanceAmt),
      color: "#8b5cf6",
      icon: <CreditCard className="w-5 h-5" />,
    },
  ];

  return (
    <AppLayout title={config.title}>
      <div className="space-y-5 max-w-7xl">
        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4">
          {summaryCards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl p-4 flex items-center gap-4"
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: c.color + "15", color: c.color }}
              >
                {c.icon}
              </div>
              <div>
                <div
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: "#1F2937",
                  }}
                >
                  {c.value}
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>
                  {c.label}
                </div>
              </div>
            </div>
          ))}
        </div>

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
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: GOLD }} />
            <input
              type="date"
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
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
              value={currentHotelId || "all"}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentHotelId(val === "all" ? null : val);
              }}
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
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
            }}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Data Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{
              background: "#FFFFFF",
              borderBottom: `2px solid ${BORDER}`,
            }}
          >
            <span style={{ color: config.color }}>{config.icon}</span>
            <h2
              style={{
                fontFamily: "Times New Roman, serif",
                color: DARKGOLD,
                fontWeight: 700,
              }}
            >
              {config.title} — {dateFilter}
            </h2>
            <span
              className="ml-auto text-sm font-medium"
              style={{ color: DARKGOLD }}
            >
              {rows.length} records
            </span>
          </div>

          {/* Bookings table */}
          {(segment === "check-ins" ||
            segment === "check-outs" ||
            segment === "bookings") && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#FFFFFF" }}>
                      {[
                        "Guest",
                        "Room",
                        "Check-In",
                        "Check-Out",
                        "Adults",
                        "Amount",
                        "Advance",
                        "Status",
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
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-sm"
                          style={{ color: "#9CA3AF" }}
                        >
                          No records for {dateFilter}
                        </td>
                      </tr>
                    ) : (
                      (rows as any[]).map((b: any) => (
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
                              {b.guestPhone}
                              {(b.companyName || b.company?.name) && ` • ${b.companyName || b.company?.name}`}
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 font-bold text-sm"
                            style={{ color: DARKGOLD }}
                          >
                            Room {b.room?.roomNumber || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm">{formatActualCheckInDateTime(b, b?.reservation, b?.checkInDate)}</td>
                          <td className="px-4 py-3 text-sm">{(b.checkOutDate as string)?.split("T")[0]}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            {b.adults + (b.children || 0)}
                          </td>
                          <td
                            className="px-4 py-3 font-bold text-sm"
                            style={{ color: GOLD }}
                          >
                            {formatCurrency(Number(b.totalAmount))}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            {formatCurrency(Number(b.advanceAmount))}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background:
                                  b.status === "checked_in"
                                    ? "#dcfce7"
                                    : b.status === "checked_out"
                                      ? "#ede9fe"
                                      : "#dbeafe",
                                color:
                                  b.status === "checked_in"
                                    ? "#166534"
                                    : b.status === "checked_out"
                                      ? "#6d28d9"
                                      : "#1e40af",
                              }}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* Invoices */}
          {segment === "invoices" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FFFFFF" }}>
                    {[
                      "Invoice #",
                      "Guest",
                      "Room",
                      "Check-In",
                      "Check-Out",
                      "Amount",
                      "Status",
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
                  {todayInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm"
                        style={{ color: "#9CA3AF" }}
                      >
                        No invoices for {dateFilter}
                      </td>
                    </tr>
                  ) : (
                    todayInvoices.map((inv: any) => (
                      <tr
                        key={inv.id}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FFFFFF")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = CARD)
                        }
                      >
                        <td
                          className="px-4 py-3 font-mono text-sm font-bold"
                          style={{ color: DARKGOLD }}
                        >
                          {inv.invoiceNumber}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-semibold"
                          style={{ color: "#1F2937" }}
                        >
                          {inv.bill?.booking?.guestName || "—"}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: DARKGOLD }}
                        >
                          Room {inv.bill?.booking?.room?.roomNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">{formatActualCheckInDateTime(inv.bill?.booking, inv.bill?.booking?.reservation, inv.bill?.booking?.checkInDate)}</td>
                        <td className="px-4 py-3 text-sm">
                          {inv.bill?.booking?.checkOutDate?.split("T")[0] || "—"}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-sm"
                          style={{ color: GOLD }}
                        >
                          {formatCurrency(Number(inv.totalAmount))}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background:
                                inv.status === "issued" ? "#dcfce7" : "#fef9c3",
                              color:
                                inv.status === "issued" ? "#166534" : "#854d0e",
                            }}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Advance Payments */}
          {segment === "advances" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FFFFFF" }}>
                    {[
                      "Guest",
                      "Room",
                      "Amount",
                      "Payment Mode",
                      "Date",
                      "Status",
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
                  {todayAdvances.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm"
                        style={{ color: "#9CA3AF" }}
                      >
                        No advance payments for {dateFilter}
                      </td>
                    </tr>
                  ) : (
                    todayAdvances.map((a: any) => (
                      <tr
                        key={a.id}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FFFFFF")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = CARD)
                        }
                      >
                        <td
                          className="px-4 py-3 font-semibold text-sm"
                          style={{ color: "#1F2937" }}
                        >
                          {a.guestName}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: DARKGOLD }}
                        >
                          Room {a.booking?.room?.roomNumber || "—"}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-sm"
                          style={{ color: GOLD }}
                        >
                          {formatCurrency(Number(a.amount))}
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">
                          {a.paymentMethod ||
                            a.paymentMode ||
                            "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">{(a.paymentDate as string)?.split("T")[0]}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: "#dcfce7", color: "#166534" }}
                          >
                            {a.status || "received"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Payments / Settlements */}
          {(segment === "settlements" || segment === "payments") && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FFFFFF" }}>
                    {[
                      "Invoice #",
                      "Guest",
                      "Room",
                      "Amount",
                      "Date",
                      "Status",
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
                  {(segment === "payments" ? todayPayments : todaySettlements).length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm"
                        style={{ color: "#9CA3AF" }}
                      >
                        {segment === "payments" ? `No payments for ${dateFilter}` : `No settlements for ${dateFilter}`}
                      </td>
                    </tr>
                  ) : (
                    (segment === "payments" ? todayPayments : todaySettlements).map((inv: any) => (
                      <tr
                        key={inv.id}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FFFFFF")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = CARD)
                        }
                      >
                        <td
                          className="px-4 py-3 font-mono text-sm font-bold"
                          style={{ color: DARKGOLD }}
                        >
                          {inv.invoiceNumber}
                        </td>
                        <td
                          className="px-4 py-3 font-semibold text-sm"
                          style={{ color: "#1F2937" }}
                        >
                          {inv.bill?.booking?.guestName || "—"}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: DARKGOLD }}
                        >
                          Room {inv.bill?.booking?.room?.roomNumber || "—"}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-sm"
                          style={{ color: GOLD }}
                        >
                          {formatCurrency(Number(inv.totalAmount))}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(inv.createdAt as string)?.split("T")[0]}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: "#dcfce7", color: "#166534" }}
                          >
                            {segment === "payments" ? "paid" : "settled"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
