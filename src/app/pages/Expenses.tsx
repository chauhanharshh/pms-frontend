import { useState } from "react";
import { exportToCSV, printTable, formatDateForCSV } from '../utils/tableExport';
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { Expense } from "../contexts/PMSContext";
import {
  Wallet,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

const CATEGORIES: Expense["category"][] = [
  "Utilities",
  "Maintenance",
  "Staff",
  "Marketing",
  "Supplies",
  "Other",
];
const PAYMENT_METHODS = ["cash", "bank", "card", "upi"];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Utilities: { bg: "#dbeafe", text: "#1e40af" },
  Maintenance: { bg: "#fee2e2", text: "#dc2626" },
  Staff: { bg: "#dcfce7", text: "#166534" },
  Marketing: { bg: "#f3e8ff", text: "#6b21a8" },
  Supplies: { bg: "#fef9c3", text: "#854d0e" },
  Other: { bg: "#f1f5f9", text: "#475569" },
};

const emptyForm = (): Omit<Expense, "id"> => ({
  hotelId: "",
  category: "Utilities",
  description: "",
  amount: 0,
  expenseDate: new Date().toISOString().split("T")[0],
  payee: "",
  paymentMethod: "cash",
});

export function Expenses() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { expenses, addExpense, updateExpense, deleteExpense, hotels } = usePMS();
  const isAdmin = user?.role === "admin";

  const hotelFilter = isAdmin ? (currentHotelId || "all") : (user?.hotelId || "");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = expenses.filter((e) => {
    const matchHotel = hotelFilter === "all" || e.hotelId === hotelFilter;
    const matchCat = filterCategory === "all" || e.category === filterCategory;
    const matchFrom = !filterDateFrom || e.expenseDate >= filterDateFrom;
    const matchTo = !filterDateTo || e.expenseDate <= filterDateTo;
    return matchHotel && matchCat && matchFrom && matchTo;
  });

  const totalAmount = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const openAdd = () => {
    setForm({
      ...emptyForm(),
      hotelId: isAdmin ? "" : user?.hotelId || "",
    } as any);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (exp: Expense) => {
    setForm({ ...exp });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.description || !form.amount || !form.hotelId) return;
    if (editingId) {
      updateExpense(editingId, form);
    } else {
      addExpense(form);
    }
    setShowForm(false);
  };

  return (
    <AppLayout title="Expenses">
      <div className="space-y-5 max-w-6xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div
            className="rounded-xl p-4 col-span-1"
            style={{
              background: "linear-gradient(135deg, #DDD7CC, #CFC8BC)",
              border: "1px solid #E5E1DA",
            }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              Total Expenses
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ color: "#C6A75E", fontFamily: "Times New Roman, serif" }}
            >
              {formatCurrency(totalAmount)}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {filtered.length} entries
            </p>
          </div>
          {CATEGORIES.slice(0, 3).map((cat) => {
            const catTotal = filtered
              .filter((e) => e.category === cat)
              .reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const { bg, text } = categoryColors[cat];
            return (
              <div
                key={cat}
                className="rounded-xl p-4"
                style={{
                  background: "white",
                  border: "1px solid #E5E1DA",
                }}
              >
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: bg, color: text }}
                >
                  {cat}
                </span>
                <p
                  className="text-xl font-bold mt-2"
                  style={{ color: "#1F2937" }}
                >
                  {formatCurrency(catTotal)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters + Add */}
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
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
          <select
            className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
            style={{
              border: "2px solid #E5E1DA",
              background: "white",
              color: DARKGOLD,
            }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              border: "2px solid #E5E1DA",
              background: "white",
              color: DARKGOLD,
            }}
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <span className="text-xs" style={{ color: "#9CA3AF" }}>
            to
          </span>
          <input
            type="date"
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              border: "2px solid #E5E1DA",
              background: "white",
              color: DARKGOLD,
            }}
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
          <div className="flex-1" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "white",
            border: "1px solid #E5E1DA",
            boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
          }}
        >
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{
              borderBottom: "2px solid #E5E1DA",
              background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
            }}
          >
            <Wallet className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Expense Records
            </h2>
          </div>
          {/* Export/Print Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '12px', marginTop: '8px' }}>
            <button
              onClick={() => {
                const csvData = expenses.map(exp => ({
                  'Date': formatDateForCSV(exp.expenseDate),
                  'Description': exp.description,
                  'Category': exp.category,
                  'Hotel': hotels.find(h => h.id === exp.hotelId)?.name || '-',
                  'Payee': exp.payee || '-',
                  'Payment Method': exp.paymentMethod,
                  'Amount': exp.amount
                }));
                exportToCSV(csvData, 'expenses');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#ffffff',
                border: '1px solid #B8860B',
                borderRadius: '8px',
                color: '#B8860B',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              📥 Export Excel
            </button>
            <button
              onClick={() => printTable('expenses-table', 'Expenses Report')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#B8860B',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              🖨️ Print
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" id="expenses-table">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Date",
                    "Description",
                    "Category",
                    "Hotel",
                    "Payee",
                    "Payment",
                    "Amount",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: DARKGOLD,
                        borderBottom: "2px solid #E5E1DA",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => {
                  const { bg, text } = categoryColors[exp.category];
                  return (
                    <tr
                      key={exp.id}
                      style={{
                        borderBottom: "1px solid rgba(184,134,11,0.07)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#FFFFFF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "white")
                      }
                    >
                      <td className="px-4 py-3 text-sm">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-medium"
                        style={{ color: "#1F2937" }}
                      >
                        {exp.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: bg, color: text }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {hotels.find((h) => h.id === exp.hotelId)?.name}
                      </td>
                      <td className="px-4 py-3 text-sm">{exp.payee}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 uppercase">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 font-bold text-sm"
                        style={{ color: "#dc2626" }}
                      >
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(exp)}
                            className="p-1.5 rounded-lg"
                            style={{ color: GOLD }}
                            onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(221, 215, 204,0.1)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteConfirm(exp.id)}
                              className="p-1.5 rounded-lg text-red-400"
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fee2e2")
                              }
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "transparent")
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-full max-w-lg rounded-2xl"
              style={{ background: "white" }}
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{
                  borderBottom: "2px solid #E5E1DA",
                  background: "#FFFFFF",
                }}
              >
                <h2
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: DARKGOLD,
                  }}
                >
                  {editingId ? "Edit Expense" : "Add Expense"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div className="col-span-2">
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: DARKGOLD }}
                    >
                      Hotel *
                    </label>
                    <select
                      className="w-full px-3 py-2.5 rounded-lg outline-none"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={form.hotelId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, hotelId: e.target.value }))
                      }
                    >
                      <option value="">Select hotel</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Description *
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as Expense["category"],
                      }))
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.expenseDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expenseDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Payee
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.payee}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, payee: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Payment Method
                  </label>
                  <div className="flex gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            paymentMethod: m as Expense["paymentMethod"],
                          }))
                        }
                        className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                        style={{
                          background:
                            form.paymentMethod === m
                              ? "linear-gradient(135deg, #C6A75E, #A8832D)"
                              : "white",
                          border: "2px solid #E5E1DA",
                          color: form.paymentMethod === m ? "white" : DARKGOLD,
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 flex justify-end gap-3 mt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      border: "1px solid #E5E1DA",
                      color: DARKGOLD,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
                    style={{
                      background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                    }}
                  >
                    <Save className="w-4 h-4" />{" "}
                    {editingId ? "Save Changes" : "Add Expense"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-80 rounded-2xl p-6 text-center"
              style={{ background: "white" }}
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
              <p className="font-semibold mb-4" style={{ color: "#1F2937" }}>
                Delete this expense?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{
                    border: "1px solid #E5E1DA",
                    color: DARKGOLD,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteExpense(deleteConfirm);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
