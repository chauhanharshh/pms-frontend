import { useState, useMemo } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { formatCurrency } from "../utils/format";
import { usePMS } from "../contexts/PMSContext";
import {
  Search,
  Plus,
  X,
  Save,
  Truck,
  Trash2,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverage": "#16a34a",
  Maintenance: "#f59e0b",
  Housekeeping: "#8b5cf6",
  "IT & Tech": "#3b82f6",
  Laundry: "#0ea5e9",
  Other: "#6b7280",
};

export function VendorsPage() {
  const { vendors, addVendor, updateVendor, deleteVendor } = usePMS();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    category: "Other",
    totalOrders: 0,
    totalPaid: 0,
  });

  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const filtered = useMemo(
    () =>
      vendors.filter((v) => {
        const matchSearch =
          !search ||
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          (v.contactPerson && v.contactPerson.toLowerCase().includes(search.toLowerCase()));
        const matchCat = filterCat === "all" || v.category === filterCat;
        return matchSearch && matchCat;
      }),
    [vendors, search, filterCat],
  );

  const save = async () => {
    if (!form.name) return;
    try {
      if (editingId) {
        await updateVendor(editingId, form);
      } else {
        await addVendor(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ category: "Other", totalOrders: 0, totalPaid: 0 });
    } catch (e) {
      alert("Failed to save vendor");
    }
  };

  const edit = (v: any) => {
    setEditingId(v.id);
    setForm(v);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      await deleteVendor(id);
    }
  };

  const categories = [
    "Food & Beverage",
    "Maintenance",
    "Housekeeping",
    "IT & Tech",
    "Laundry",
    "Other",
  ] as const;

  return (
    <AppLayout title="Vendors">
      <div className="space-y-5 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Vendors
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              {vendors.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Orders
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: "#3b82f6" }}
            >
              {vendors.reduce((s, v) => s + v.totalOrders, 0)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Paid to Vendors
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: GOLD }}
            >
              {formatCurrency(vendors.reduce((s, v) => s + v.totalPaid, 0))}
            </p>
          </div>
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
              placeholder="Search vendor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{
                  background: filterCat === c ? GOLD : "#FFFFFF",
                  color: filterCat === c ? "white" : DARKGOLD,
                  border: `1px solid ${filterCat === c ? GOLD : BORDER}`,
                }}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
            }}
          >
            <Plus className="w-4 h-4" /> Add Vendor
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
                className="font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                {editingId ? "Edit Vendor" : "New Vendor"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ category: "Other", totalOrders: 0, totalPaid: 0 }); }}>
                <X className="w-5 h-5" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Vendor Name *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.name || ""}
                  onChange={(e) => f("name", e.target.value)}
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
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Contact Person
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.contactPerson || ""}
                  onChange={(e) => f("contactPerson", e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Phone
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.phone || ""}
                  onChange={(e) => f("phone", e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.email || ""}
                  onChange={(e) => f("email", e.target.value)}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); setForm({ category: "Other", totalOrders: 0, totalPaid: 0 }); }}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ border: `1px solid ${BORDER}`, color: DARKGOLD }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                  }}
                >
                  <Save className="w-4 h-4" /> {editingId ? "Update" : "Save"} Vendor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="rounded-xl overflow-hidden group relative"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => edit(v)}
                  className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-blue-600"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(v.id)}
                  className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{
                    background: CATEGORY_COLORS[v.category] || "#6b7280",
                  }}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-sm truncate"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color: "#1F2937",
                    }}
                  >
                    {v.name}
                  </div>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        (CATEGORY_COLORS[v.category] || "#6b7280") + "18",
                      color: CATEGORY_COLORS[v.category] || "#6b7280",
                    }}
                  >
                    {v.category}
                  </span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-1">
                <div className="text-xs" style={{ color: "#6B7280" }}>
                  👤 {v.contactPerson}
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>
                  📞 {v.phone}
                </div>
                {v.email && (
                  <div
                    className="text-xs truncate"
                    style={{ color: "#6B7280" }}
                  >
                    ✉ {v.email}
                  </div>
                )}
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <div className="text-xs">
                    <div style={{ color: "#6B7280" }}>Orders</div>
                    <div className="font-bold" style={{ color: "#3b82f6" }}>
                      {v.totalOrders}
                    </div>
                  </div>
                  <div className="text-xs text-right">
                    <div style={{ color: "#6B7280" }}>Total Paid</div>
                    <div className="font-bold" style={{ color: GOLD }}>
                      {formatCurrency(v.totalPaid)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              className="col-span-3 py-12 text-center"
              style={{ color: "#9CA3AF" }}
            >
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No vendors found</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
