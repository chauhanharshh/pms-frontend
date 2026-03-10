import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, Printer } from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const CHART_COLORS = ["#C6A75E", "#3b82f6", "#16a34a", "#dc2626", "#8b5cf6"];

export function Reports() {
  const { user } = useAuth();
  const { hotels, bookings, expenses, restaurantOrders, rooms } = usePMS();
  const isAdmin = user?.role === "admin";
  const [filterHotel, setFilterHotel] = useState(
    isAdmin ? "all" : user?.hotelId || "",
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") as "revenue" | "occupancy" | "expense" | "restaurant" | null;
  const [activeTab, setActiveTab] = useState<
    "revenue" | "occupancy" | "expense" | "restaurant"
  >(initialTab || "revenue");

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: "revenue" | "occupancy" | "expense" | "restaurant") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const displayHotels =
    filterHotel === "all"
      ? hotels
      : hotels.filter((h) => h.id === filterHotel);

  // Revenue Data
  const revenueData = displayHotels.map((h) => {
    const hBookings = bookings.filter(
      (b) =>
        b.hotelId === h.id &&
        (b.status === "checked_in" || b.status === "checked_out"),
    );
    const restRevenue = restaurantOrders
      .filter((o) => o.hotelId === h.id && o.status === "billed")
      .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const roomRevenue = hBookings.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
    return {
      hotel: h.name.split(" ")[0],
      "Room Revenue": roomRevenue,
      Restaurant: restRevenue,
    };
  });

  // Occupancy Data
  const occupancyData = displayHotels.map((h) => {
    const hRooms = rooms.filter((r) => r.hotelId === h.id);
    const occupied = hRooms.filter((r) => r.status === "occupied").length;
    return {
      hotel: h.name.split(" ")[0],
      Occupancy: Math.round((occupied / hRooms.length) * 100),
      Rooms: hRooms.length,
    };
  });

  // Expense Data by Category
  const expData =
    filterHotel === "all"
      ? (
        [
          "Utilities",
          "Maintenance",
          "Staff",
          "Marketing",
          "Supplies",
          "Other",
        ] as const
      )
        .map((cat) => ({
          name: cat,
          value: expenses
            .filter((e) => e.category === cat)
            .reduce((s, e) => s + Number(e.amount || 0), 0),
        }))
        .filter((d) => d.value > 0)
      : (
        [
          "Utilities",
          "Maintenance",
          "Staff",
          "Marketing",
          "Supplies",
          "Other",
        ] as const
      )
        .map((cat) => ({
          name: cat,
          value: expenses
            .filter((e) => e.category === cat && e.hotelId === filterHotel)
            .reduce((s, e) => s + Number(e.amount || 0), 0),
        }))
        .filter((d) => d.value > 0);

  // Restaurant Data
  const restaurantData = displayHotels.map((h) => {
    const orders = restaurantOrders.filter(
      (o) => o.hotelId === h.id && o.status === "billed",
    );
    return {
      hotel: h.name.split(" ")[0],
      Revenue: orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
      Orders: orders.length,
    };
  });

  const totalRoomRevenue = displayHotels.reduce(
    (s, h) =>
      s +
      bookings
        .filter(
          (b) =>
            b.hotelId === h.id &&
            (b.status === "checked_in" || b.status === "checked_out"),
        )
        .reduce((ss, b) => ss + Number(b.totalAmount || 0), 0),
    0,
  );
  const totalRestRevenue = restaurantOrders
    .filter(
      (o) =>
        (filterHotel === "all" || o.hotelId === filterHotel) &&
        o.status === "billed",
    )
    .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalExpenses = expenses
    .filter((e) => filterHotel === "all" || e.hotelId === filterHotel)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const handlePrint = () => window.print();

  const tabs = [
    { key: "revenue", label: "Revenue" },
    { key: "occupancy", label: "Occupancy" },
    { key: "expense", label: "Expenses" },
    { key: "restaurant", label: "Restaurant" },
  ] as const;

  return (
    <AppLayout title="Reports & Analytics">
      <div className="space-y-5 max-w-6xl">
        {/* Controls */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{
              border: "2px solid #E5E1DA",
              color: DARKGOLD,
            }}
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Room Revenue",
              value: formatCurrency(totalRoomRevenue),
              color: GOLD,
            },
            {
              label: "Restaurant Revenue",
              value: formatCurrency(totalRestRevenue),
              color: "#16a34a",
            },
            {
              label: "Total Expenses",
              value: formatCurrency(totalExpenses),
              color: "#dc2626",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-5 text-center"
              style={{
                background: "white",
                border: "1px solid #E5E1DA",
                boxShadow: "0 2px 8px rgba(221, 215, 204,0.05)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: s.color, fontFamily: "Times New Roman, serif" }}
              >
                {s.value}
              </div>
              <div className="text-sm mt-1" style={{ color: "#6B7280" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "rgba(229,225,218,0.5)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "white" : "transparent",
                color: activeTab === tab.key ? DARKGOLD : "#9CA3AF",
                boxShadow:
                  activeTab === tab.key
                    ? "0 1px 4px #E5E1DA"
                    : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "white",
            border: "1px solid #E5E1DA",
            boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
          }}
        >
          {activeTab === "revenue" && (
            <div>
              <h3
                className="font-semibold mb-6"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                Hotel-wise Revenue Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <XAxis
                    dataKey="hotel"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar
                    dataKey="Room Revenue"
                    fill="#C6A75E"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Restaurant"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#FFFFFF" }}>
                      {[
                        "Hotel",
                        "Room Revenue",
                        "Restaurant",
                        "Expenses",
                        "Net",
                      ].map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left text-xs font-semibold uppercase"
                          style={{ color: DARKGOLD }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayHotels.map((h) => {
                      const hBookings = bookings.filter((b) => b.hotelId === h.id);
                      const hOrders = restaurantOrders.filter((o) => o.hotelId === h.id && o.status === "billed");
                      const totalRevenue = hBookings
                        .filter((b) => b.status === "checked_in" || b.status === "checked_out")
                        .reduce((s, b) => s + Number(b.totalAmount || 0), 0);
                      const restaurantRevenue = hOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
                      const exp = expenses
                        .filter((e) => e.hotelId === h.id)
                        .reduce((s, e) => s + Number(e.amount || 0), 0);
                      const net = totalRevenue + restaurantRevenue - exp;
                      return (
                        <tr
                          key={h.id}
                          style={{
                            borderTop: "1px solid rgba(221, 215, 204,0.1)",
                          }}
                        >
                          <td className="px-4 py-2 font-medium text-sm">
                            {h.name}
                          </td>
                          <td
                            className="px-4 py-2 text-sm"
                            style={{ color: GOLD }}
                          >
                            {formatCurrency(totalRevenue)}
                          </td>
                          <td
                            className="px-4 py-2 text-sm"
                            style={{ color: "#16a34a" }}
                          >
                            {formatCurrency(restaurantRevenue)}
                          </td>
                          <td
                            className="px-4 py-2 text-sm"
                            style={{ color: "#dc2626" }}
                          >
                            {formatCurrency(exp)}
                          </td>
                          <td
                            className="px-4 py-2 font-bold text-sm"
                            style={{ color: net >= 0 ? "#16a34a" : "#dc2626" }}
                          >
                            {formatCurrency(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "occupancy" && (
            <div>
              <h3
                className="font-semibold mb-6"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                Occupancy Rates
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={occupancyData}>
                  <XAxis
                    dataKey="hotel"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar
                    dataKey="Occupancy"
                    fill="#C6A75E"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {occupancyData.map((d) => (
                  <div
                    key={d.hotel}
                    className="rounded-xl p-4 text-center"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E1DA",
                    }}
                  >
                    <div className="text-3xl font-bold" style={{ color: GOLD }}>
                      {d.Occupancy}%
                    </div>
                    <div className="text-sm mt-1" style={{ color: "#6B7280" }}>
                      {d.hotel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "expense" && (
            <div className="flex gap-8 items-start">
              <div className="flex-1">
                <h3
                  className="font-semibold mb-6"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: DARKGOLD,
                  }}
                >
                  Expenses by Category
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {expData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-64">
                <h3
                  className="font-semibold mb-3 text-sm"
                  style={{ color: DARKGOLD }}
                >
                  Category Breakdown
                </h3>
                {expData.map((d, idx) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid rgba(221, 215, 204,0.1)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-sm" style={{ color: "#1F2937" }}>
                        {d.name}
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#dc2626" }}
                    >
                      {formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
                <div
                  className="flex justify-between pt-2 font-bold"
                  style={{ color: DARKGOLD }}
                >
                  <span>Total</span>
                  <span>
                    {formatCurrency(expData.reduce((s, d) => s + d.value, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "restaurant" && (
            <div>
              <h3
                className="font-semibold mb-6"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                Restaurant Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={restaurantData}>
                  <XAxis
                    dataKey="hotel"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#FFFFFF" }}>
                      {["Hotel", "Orders", "Revenue"].map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left text-xs font-semibold uppercase"
                          style={{ color: DARKGOLD }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantData.map((d) => (
                      <tr
                        key={d.hotel}
                        style={{ borderTop: "1px solid rgba(221, 215, 204,0.1)" }}
                      >
                        <td className="px-4 py-2 font-medium text-sm">
                          {d.hotel}
                        </td>
                        <td className="px-4 py-2 text-sm">{d.Orders}</td>
                        <td
                          className="px-4 py-2 font-bold text-sm"
                          style={{ color: "#16a34a" }}
                        >
                          {formatCurrency(d.Revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
