import { useState, useMemo } from "react";
import { useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import {
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  List,
  Calendar,
  Filter,
  Plus,
  X,
  Save,
  Building,
  Truck,
  IndianRupee,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

export function LiabilitiesPage() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { hotels, liabilities, addLiability, updateLiability, addLiabilityPayment } = usePMS();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const segment = location.pathname.split("/").pop() || "all";
  const [search, setSearch] = useState("");

  const hotelFilter = isAdmin ? (currentHotelId || "all") : (user?.hotelId || "");
  const [showForm, setShowForm] = useState(segment === "new");
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState(0);
  const [payMode, setPayMode] = useState("Cash");
  const [form, setForm] = useState<any>({
    hotelId: isAdmin ? (currentHotelId || hotels[0]?.id) : user?.hotelId || "",
    vendorType: "Supplier",
    status: "pending",
    paidAmount: 0,
    paymentHistory: [],
    createdAt: new Date().toISOString().split("T")[0],
    dueDate: "",
  });
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const filtered = useMemo(
    () =>
      liabilities.filter((l) => {
        const matchHotel = hotelFilter === "all" || l.hotelId === hotelFilter;
        const matchSearch =
          !search ||
          l.vendorName.toLowerCase().includes(search.toLowerCase()) ||
          (l.description && l.description.toLowerCase().includes(search.toLowerCase()));
        const matchSegment =
          segment === "all" || segment === "new" || l.status === segment;
        return matchHotel && matchSearch && matchSegment;
      }),
    [liabilities, hotelFilter, search, segment],
  );

  const totalPending = filtered
    .filter((l) => l.status !== "paid")
    .reduce((s, l) => s + (l.amount - l.paidAmount), 0);

  const saveLiability = async () => {
    if (!form.vendorName || !form.amount) return;
    try {
      await addLiability(form);
      setShowForm(false);
      setForm({
        hotelId: form.hotelId,
        vendorType: "Supplier",
        status: "pending",
        paidAmount: 0,
        paymentHistory: [],
        createdAt: new Date().toISOString().split("T")[0],
        dueDate: "",
      });
    } catch (e) {
      alert("Failed to save liability");
    }
  };

  const recordPayment = async (id: string) => {
    try {
      await addLiabilityPayment(id, {
        amount: payAmt,
        mode: payMode,
        date: new Date().toISOString().split("T")[0],
      });
      setShowPayment(null);
      setPayAmt(0);
    } catch (e) {
      alert("Failed to record payment");
    }
  };

  const pageTitle =
    {
      all: "All Liabilities",
      pending: "Pending Liabilities",
      paid: "Paid Liabilities",
      new: "Add New Liability",
    }[segment] || "Liabilities";

  return (
    <AppLayout title={pageTitle}>
      <div className="space-y-5 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Outstanding
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: "#dc2626" }}
            >
              {formatCurrency(totalPending)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Pending Liabilities
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              {liabilities.filter((l) => l.status === "pending").length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Paid Liabilities
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: "#16a34a" }}
            >
              {liabilities.filter((l) => l.status === "paid").length}
            </p>
          </div>
        </div>

        {/* Add Form */}
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
                className="font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                New Liability
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {isAdmin && (
                <div className="col-span-2">
                  <label
                    className="block text-xs font-bold mb-1 uppercase"
                    style={{ color: DARKGOLD }}
                  >
                    Hotel *
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                    style={{ border: `2px solid ${BORDER}` }}
                    value={form.hotelId}
                    onChange={(e) => f("hotelId", e.target.value)}
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Vendor Name *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.vendorName || ""}
                  onChange={(e) => f("vendorName", e.target.value)}
                  placeholder="Vendor / Supplier name"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Vendor Type
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.vendorType}
                  onChange={(e) => f("vendorType", e.target.value as any)}
                >
                  {["Supplier", "Contractor", "Bank", "Staff", "Other"].map(
                    (t) => (
                      <option key={t}>{t}</option>
                    ),
                  )}
                </select>
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
                  value={form.description || ""}
                  onChange={(e) => f("description", e.target.value)}
                  placeholder="What is this liability for?"
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
                  min={0}
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.amount || ""}
                  onChange={(e) => f("amount", +e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Due Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.dueDate || ""}
                  onChange={(e) => f("dueDate", e.target.value)}
                />
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
                  onClick={saveLiability}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                  }}
                >
                  <Save className="w-4 h-4" /> Add Liability
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters + Add */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: GOLD }}
            />
            <input
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-56"
              style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
              placeholder="Search vendor or description…"
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
          {segment !== "new" && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
              }}
            >
              <Plus className="w-4 h-4" /> Add Liability
            </button>
          )}
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
                    "Vendor",
                    "Type",
                    "Description",
                    "Total",
                    "Paid",
                    "Balance",
                    "Due Date",
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
                      colSpan={9}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No liabilities found
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => {
                    const balance = l.amount - l.paidAmount;
                    const isOverdue =
                      new Date(l.dueDate) < new Date() && l.status !== "paid";
                    return (
                      <tr
                        key={l.id}
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
                          {l.vendorName}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(221, 215, 204,0.1)",
                              color: DARKGOLD,
                            }}
                          >
                            {l.vendorType}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-sm max-w-32 truncate"
                          style={{ color: "#6B7280" }}
                        >
                          {l.description}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-sm"
                          style={{ color: GOLD }}
                        >
                          {formatCurrency(l.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600">
                          {formatCurrency(l.paidAmount)}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-sm"
                          style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}
                        >
                          {formatCurrency(balance)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: isOverdue ? "#dc2626" : "#6B7280" }}
                        >
                          {isOverdue ? "⚠ " : ""}
                          {l.dueDate}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background:
                                l.status === "paid"
                                  ? "#dcfce7"
                                  : l.status === "partial"
                                    ? "#fef9c3"
                                    : "#fee2e2",
                              color:
                                l.status === "paid"
                                  ? "#166534"
                                  : l.status === "partial"
                                    ? "#854d0e"
                                    : "#dc2626",
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {l.status !== "paid" && (
                            <button
                              onClick={() => {
                                setShowPayment(l.id);
                                setPayAmt(l.amount - l.paidAmount);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                              style={{ background: "#16a34a" }}
                            >
                              Pay
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

        {/* Payment Modal */}
        {showPayment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: CARD }}
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
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
                  Record Payment
                </h2>
                <button onClick={() => setShowPayment(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
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
                    className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ border: `2px solid ${BORDER}` }}
                    value={payAmt}
                    onChange={(e) => setPayAmt(+e.target.value)}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-bold mb-2 uppercase"
                    style={{ color: DARKGOLD }}
                  >
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "Cash",
                      "Bank Transfer",
                      "UPI",
                      "Cheque",
                      "Card",
                      "NEFT",
                    ].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPayMode(m)}
                        className="py-2 rounded-xl text-xs font-medium"
                        style={{
                          background:
                            payMode === m
                              ? `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`
                              : "#FFFFFF",
                          color: payMode === m ? "white" : DARKGOLD,
                          border: `1.5px solid ${payMode === m ? GOLD : BORDER}`,
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => recordPayment(showPayment!)}
                  className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, #16a34a, #15803d)`,
                  }}
                >
                  <CheckCircle className="w-4 h-4" /> Confirm Payment of{" "}
                  {formatCurrency(payAmt)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
