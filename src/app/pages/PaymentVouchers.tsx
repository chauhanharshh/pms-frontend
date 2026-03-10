import { useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { PaymentVoucher } from "../contexts/PMSContext";
import {
  BookmarkCheck,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Printer,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

export function PaymentVouchers() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { vouchers, addVoucher, updateVoucher, deleteVoucher, hotels } = usePMS();
  const isAdmin = user?.role === "admin";

  const hotelFilter = isAdmin ? (currentHotelId || "all") : (user?.hotelId || "");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = (): Omit<PaymentVoucher, "id" | "voucherNumber"> => ({
    hotelId: isAdmin ? "" : user?.hotelId || "",
    payee: "",
    amount: 0,
    voucherDate: new Date().toISOString().split("T")[0],
    purpose: "",
    paymentMethod: "cash",
    approvedBy: "",
    type: "payment",
    status: "pending",
  } as any);
  const [form, setForm] = useState(emptyForm());

  const filtered = vouchers.filter((v) => {
    const matchHotel = hotelFilter === "all" || v.hotelId === hotelFilter;
    const matchFrom = !filterDateFrom || (v as any).voucherDate >= filterDateFrom;
    const matchTo = !filterDateTo || (v as any).voucherDate <= filterDateTo;
    const matchType = filterType === "all" || (v as any).type === filterType;
    return matchHotel && matchFrom && matchTo && matchType;
  });

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };
  const openEdit = (v: PaymentVoucher) => {
    setForm({ ...v, voucherDate: (v as any).voucherDate || (v as any).date, purpose: (v as any).purpose || (v as any).description } as any);
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.payee || Number(form.amount) <= 0) return;
    if (editingId) {
      updateVoucher(editingId, form);
    } else {
      addVoucher(form);
    }
    setShowForm(false);
  };

  const handlePrint = (v: PaymentVoucher) => {
    const hotel = hotels.find((h) => h.id === v.hotelId);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Voucher ${v.voucherNumber}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #C6A75E; padding-bottom: 20px; margin-bottom: 20px; }
        .title { font-size: 1.8rem; color: #C6A75E; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8d48a; }
        .label { color: #A8832D; font-size: 0.9rem; }
        .value { font-weight: 600; }
        .amount { font-size: 1.5rem; color: #C6A75E; text-align: center; margin: 20px 0; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; font-size: 0.85rem; }
        @media print { body { margin: 0; } }
      </style></head>
      <body>
        <div class="header">
          <div class="title">Hotels4U PMS</div>
          <div>${hotel?.name || ""}</div>
          <h2>PAYMENT VOUCHER</h2>
          <div>Voucher No: <b>${v.voucherNumber}</b></div>
        </div>
        <div class="row"><span class="label">Date:</span><span class="value">${formatDate((v as any).voucherDate || (v as any).date)}</span></div>
        <div class="row"><span class="label">Payee:</span><span class="value">${v.payee}</span></div>
        <div class="row"><span class="label">Description:</span><span class="value">${(v as any).purpose || (v as any).description}</span></div>
        <div class="row"><span class="label">Payment Method:</span><span class="value">${v.paymentMethod.toUpperCase()}</span></div>
        <div class="row"><span class="label">Type:</span><span class="value">${(v as any).type?.toUpperCase() || ''}</span></div>
        <div class="amount">Amount: ₹${Number(v.amount).toLocaleString()}</div>
        <div class="footer">
          <div class="sig-line">Prepared By</div>
          <div class="sig-line">Approved By: ${(v as any).approvedBy || ''}</div>
          <div class="sig-line">Received By</div>
        </div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: "#fef9c3", text: "#854d0e" },
    approved: { bg: "#dcfce7", text: "#166534" },
    cancelled: { bg: "#fee2e2", text: "#dc2626" },
    pending: { bg: "#fef9c3", text: "#854d0e" },
    rejected: { bg: "#fee2e2", text: "#dc2626" },
  };

  return (
    <AppLayout title="Payment Vouchers">
      <div className="space-y-5 max-w-6xl">
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
          <select
            className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
            style={{
              border: "2px solid #E5E1DA",
              background: "white",
              color: DARKGOLD,
            }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="payment">Payment</option>
            <option value="receipt">Receipt</option>
          </select>
          <div className="flex-1" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Plus className="w-4 h-4" /> Add Voucher
          </button>
        </div>

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
            <BookmarkCheck className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Vouchers ({filtered.length})
            </h2>
            <span className="ml-auto text-sm font-bold" style={{ color: GOLD }}>
              Total:{" "}
              {formatCurrency(
                filtered
                  .filter((v) => (v as any).status !== "cancelled" && (v as any).status !== "rejected")
                  .reduce((s, v) => s + (Number(v.amount) || 0), 0),
              )}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Voucher No",
                    "Payee",
                    "Description",
                    "Hotel",
                    "Date",
                    "Method",
                    "Type",
                    "Amount",
                    "Status",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase"
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
                {filtered.map((v) => {
                  const { bg, text } = statusColors[(v as any).status || "draft"];
                  return (
                    <tr
                      key={v.id}
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
                      <td
                        className="px-4 py-3 font-mono text-xs font-bold"
                        style={{ color: GOLD }}
                      >
                        {v.voucherNumber}
                      </td>
                      <td
                        className="px-4 py-3 font-medium text-sm"
                        style={{ color: "#1F2937" }}
                      >
                        {v.payee}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1F2937" }}>
                        {(v as any).purpose || (v as any).description}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {hotels.find((h) => h.id === v.hotelId)?.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate((v as any).voucherDate || (v as any).date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 uppercase">
                          {v.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 capitalize">
                          {(v as any).type}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 font-bold text-sm"
                        style={{ color: GOLD }}
                      >
                        {formatCurrency(v.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: bg, color: text }}
                        >
                          {(v as any).status || "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePrint(v)}
                            className="p-1.5 rounded-lg text-blue-500"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#eff6ff")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(v)}
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
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteConfirm(v.id)}
                              className="p-1.5 rounded-lg text-red-400"
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fee2e2")
                              }
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "transparent")
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(v as any).status === "pending" && (
                            <button
                              onClick={() => updateVoucher(v.id, { ...v, status: "approved" } as any)}
                              className="p-1.5 rounded-lg text-green-500"
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#dcfce7")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                              }
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
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
                      colSpan={10}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No vouchers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-full max-w-md rounded-2xl"
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
                  {editingId ? "Edit Voucher" : "Add Voucher"}
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
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Payee *
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: DARKGOLD }}>
                    Description / Purpose *
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).purpose || (form as any).description || ""}
                    onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value, description: e.target.value }) as any)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: DARKGOLD }}>
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).voucherDate || (form as any).date || ""}
                    onChange={(e) => setForm(f => ({ ...f, voucherDate: e.target.value, date: e.target.value }) as any)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: DARKGOLD }}>
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setForm(f => ({ ...f, type: "payment" }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${(form as any).type === "payment"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-500 hover:border-red-200"
                        }`}
                    >
                      Payment
                    </button>
                    <button
                      onClick={() => setForm(f => ({ ...f, type: "receipt" }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${(form as any).type === "receipt"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-green-200"
                        }`}
                    >
                      Receipt
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Payment Method
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        paymentMethod: e.target
                          .value as PaymentVoucher["paymentMethod"],
                      }))
                    }
                  >
                    {["cash", "bank", "card", "upi"].map((m) => (
                      <option key={m} value={m}>
                        {m.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: DARKGOLD }}>
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-span-2 flex justify-end gap-3">
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
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <p className="font-semibold mb-4">Delete this voucher?</p>
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
                    deleteVoucher(deleteConfirm);
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
