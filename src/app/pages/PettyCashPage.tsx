import { useState, useMemo } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import { exportToCSV } from "../utils/tableExport";
import {
  PiggyBank,
  Plus,
  X,
  Save,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Download,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

type TxnType = "receipt" | "payment";

export function PettyCashPage() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { hotels, pettyCash, addPettyCash } = usePMS();
  const isAdmin = user?.role === "admin";

  const hotelFilter = isAdmin ? (currentHotelId || hotels[0]?.id || "") : (user?.hotelId || "");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "payment" as TxnType,
    amount: 0,
    category: "Miscellaneous",
  });
  const f = (k: keyof typeof form, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const filtered = useMemo(
    () => pettyCash.filter((t) => t.hotelId === hotelFilter),
    [pettyCash, hotelFilter],
  );

  const currentBalance =
    filtered.length > 0 ? filtered[filtered.length - 1].balance : 0;
  const totalIn = filtered
    .filter((t) => t.type === "receipt")
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered
    .filter((t) => t.type === "payment")
    .reduce((s, t) => s + t.amount, 0);

  const save = async () => {
    if (!form.description || form.amount <= 0) return;
    try {
      await addPettyCash({
        ...form,
        hotelId: hotelFilter
      });
      setShowForm(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        description: "",
        type: "payment",
        amount: 0,
        category: "Miscellaneous",
      });
    } catch (e) {
      alert("Failed to save entry");
    }
  };

  const exportCSV = () => {
    const dataToExport = filtered.map((t) => ({
      Date: t.date,
      Description: t.description,
      Type: t.type,
      Amount: t.amount,
      Category: t.category,
      Balance: t.balance
    }));

    exportToCSV(dataToExport, "petty-cash");
  };

  return (
    <AppLayout title="Petty Cash Book">
      <div className="space-y-5 max-w-4xl">
        {/* Balance cards */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: `linear-gradient(135deg, #DDD7CC, #CFC8BC)`,
              border: `1px solid #E5E1DA`,
            }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              Current Balance
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: GOLD }}
            >
              {formatCurrency(currentBalance)}
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "#dcfce7", border: "1px solid #86efac" }}
          >
            <p className="text-xs text-green-700">Total Receipts</p>
            <p className="text-2xl font-bold mt-1 text-green-700">
              {formatCurrency(totalIn)}
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}
          >
            <p className="text-xs text-red-700">Total Payments</p>
            <p className="text-2xl font-bold mt-1 text-red-700">
              {formatCurrency(totalOut)}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: `1.5px solid ${BORDER}`,
                background: CARD,
                color: DARKGOLD,
              }}
              value={currentHotelId || hotels[0]?.id || ""}
              onChange={(e) => {
                setCurrentHotelId(e.target.value);
              }}
            >
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
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ border: `1.5px solid ${BORDER}`, color: DARKGOLD }}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => {
              f("type", "receipt");
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <TrendingUp className="w-4 h-4" /> Add Receipt
          </button>
          <button
            onClick={() => {
              f("type", "payment");
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
          >
            <TrendingDown className="w-4 h-4" /> Add Payment
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: CARD,
              border: `2px solid #E5E1DA`,
            }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <h2
                className="font-bold capitalize"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                New {form.type}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.date}
                  onChange={(e) => f("date", e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.amount || ""}
                  onChange={(e) => f("amount", +e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Description *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.description}
                  onChange={(e) => f("description", e.target.value)}
                  placeholder="What is this for?"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Category
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.category}
                  onChange={(e) => f("category", e.target.value)}
                >
                  {[
                    "Staff Welfare",
                    "Office",
                    "Maintenance",
                    "Cleaning",
                    "Transport",
                    "Top-Up",
                    "Opening",
                    "Miscellaneous",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Type
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.type}
                  onChange={(e) => f("type", e.target.value as TxnType)}
                >
                  <option value="payment">Payment (Expense)</option>
                  <option value="receipt">Receipt (Income)</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ border: `1px solid ${BORDER}`, color: DARKGOLD }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
                  style={{
                    background:
                      form.type === "receipt"
                        ? "linear-gradient(135deg, #16a34a, #15803d)"
                        : "linear-gradient(135deg, #dc2626, #b91c1c)",
                  }}
                >
                  <Save className="w-4 h-4" /> Save Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table */}
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
              Petty Cash Ledger ({filtered.length} entries)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Date",
                    "Description",
                    "Category",
                    "Receipts",
                    "Payments",
                    "Balance",
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
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No entries yet
                    </td>
                  </tr>
                )}
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FFFFFF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = CARD)
                    }
                  >
                    <td className="px-4 py-3 text-sm">{t.date}</td>
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "#1F2937" }}
                    >
                      {t.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(229,225,218,0.5)",
                          color: DARKGOLD,
                        }}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm text-green-600">
                      {t.type === "receipt" ? formatCurrency(t.amount) : "—"}
                    </td>
                    <td className="px-4 py-3 font-bold text-sm text-red-600">
                      {t.type === "payment" ? formatCurrency(t.amount) : "—"}
                    </td>
                    <td
                      className="px-4 py-3 font-bold text-sm"
                      style={{ color: t.balance < 0 ? "#dc2626" : GOLD }}
                    >
                      {formatCurrency(t.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr
                    style={{
                      background: "#FFFFFF",
                      borderTop: `2px solid ${BORDER}`,
                    }}
                  >
                    <td
                      colSpan={3}
                      className="px-4 py-3 font-bold text-sm"
                      style={{ color: DARKGOLD }}
                    >
                      TOTAL
                    </td>
                    <td className="px-4 py-3 font-bold text-sm text-green-600">
                      {formatCurrency(totalIn)}
                    </td>
                    <td className="px-4 py-3 font-bold text-sm text-red-600">
                      {formatCurrency(totalOut)}
                    </td>
                    <td
                      className="px-4 py-3 font-bold text-sm"
                      style={{ color: GOLD }}
                    >
                      {formatCurrency(currentBalance)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
