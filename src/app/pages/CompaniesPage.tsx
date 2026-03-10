import { useState, useMemo } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Company } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import {
  Search,
  Plus,
  X,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  Check
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

export function CompaniesPage() {
  const { user } = useAuth();
  const { companies, addCompany, updateCompany, deleteCompany, toggleCompanyStatus } = usePMS();

  const isAdmin = user?.role === "admin";
  const hotelFilter = isAdmin ? null : user?.hotelId;

  // Filter companies by context permissions
  const visibleCompanies = companies.filter((c) =>
    hotelFilter ? c.hotelId === hotelFilter : true
  );

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Company>>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    creditLimit: "",
    paymentTerms: "",
    address: "",
  });

  const f = (k: keyof Company, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const filtered = useMemo(
    () =>
      visibleCompanies.filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
          c.gstNumber?.toLowerCase().includes(search.toLowerCase())
      ),
    [visibleCompanies, search],
  );

  const openModal = (company?: Company) => {
    if (company) {
      setEditingId(company.id);
      setForm({
        name: company.name,
        contactPerson: company.contactPerson || "",
        phone: company.phone || "",
        email: company.email || "",
        gstNumber: company.gstNumber || "",
        creditLimit: company.creditLimit || "",
        paymentTerms: company.paymentTerms || "",
        address: company.address || "",
      });
    } else {
      setEditingId(null);
      setForm({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        gstNumber: "",
        creditLimit: "",
        paymentTerms: "",
        address: "",
      });
    }
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) return alert("Company name is required.");
    try {
      if (editingId) {
        await updateCompany(editingId, {
          ...form,
          creditLimit: form.creditLimit ? Number(form.creditLimit) : null,
        } as Partial<Company>);
      } else {
        const targetHotel = hotelFilter || user?.hotelId || "all";

        await addCompany({
          ...(form as Omit<Company, "id" | "hotelId" | "isActive" | "createdAt" | "updatedAt">),
          hotelId: targetHotel,
          creditLimit: form.creditLimit ? Number(form.creditLimit) : null,
          isActive: true,
        });
      }
      setShowForm(false);
    } catch (err: any) {
      alert("Error saving company: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this company?")) {
      try {
        await deleteCompany(id);
      } catch (err: any) {
        alert("Failed to delete company: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <AppLayout title="Companies">
      <div className="space-y-5 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Registered Companies
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              {filtered.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Credit Allowed
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: GOLD }}
            >
              {formatCurrency(filtered.reduce((s, c) => s + Number(c.creditLimit || 0), 0))}
            </p>
          </div>
          <div
            className="rounded-xl p-4 hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Outstanding
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: "#dc2626" }}
            >
              {/* Requires pulling aggregate bookings dynamically in future sprints */}
              {formatCurrency(0)}
            </p>
          </div>
        </div>

        {/* Filters + Add */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: GOLD }}
            />
            <input
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-full shadow-sm"
              style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
              placeholder="Search by name, contact, GST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
            }}
          >
            <Plus className="w-5 h-5" /> Register Company
          </button>
        </div>

        {/* Add Form / Overlay */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
              className="rounded-2xl overflow-hidden w-full max-w-2xl shadow-xl"
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
                  className="text-xl font-bold flex items-center gap-2"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: DARKGOLD,
                  }}
                >
                  <Building className="w-6 h-6" />
                  {editingId ? "Edit Company Record" : "New Corporate Profile"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                {[
                  { k: "name", label: "Company Name *", span: 2, ph: "Acme Corp Ltd." },
                  { k: "contactPerson", label: "Contact Person", ph: "John Doe" },
                  { k: "phone", label: "Phone", type: "tel", ph: "9876543210" },
                  { k: "email", label: "Email", type: "email", ph: "john@acme.com" },
                  { k: "gstNumber", label: "GST Number", ph: "22AAAAA0000A1Z5" },
                  { k: "creditLimit", label: "Credit Limit (₹)", type: "number", ph: "50000" },
                  { k: "paymentTerms", label: "Payment Terms", ph: "Net 30 Days" },
                ].map((field) => (
                  <div
                    key={field.k}
                    className={field.span === 2 ? "col-span-2" : ""}
                  >
                    <label
                      className="block text-xs font-bold mb-1 uppercase"
                      style={{ color: DARKGOLD }}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      className="w-full px-3 py-2.5 rounded-lg outline-none text-sm transition-shadow focus:shadow-md"
                      style={{ border: `2px solid ${BORDER}` }}
                      placeholder={field.ph}
                      value={(form as any)[field.k] || ""}
                      onChange={(e) =>
                        f(
                          field.k as keyof Company,
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label
                    className="block text-xs font-bold mb-1 uppercase"
                    style={{ color: DARKGOLD }}
                  >
                    Corporate Address
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none text-sm transition-shadow focus:shadow-md"
                    style={{ border: `2px solid ${BORDER}` }}
                    placeholder="123 Business Avenue, City"
                    value={form.address || ""}
                    onChange={(e) => f("address", e.target.value)}
                  />
                </div>
              </div>
              <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  style={{ border: `1px solid ${BORDER}`, color: DARKGOLD }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                  }}
                >
                  <Save className="w-4 h-4" /> Save Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Cards Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div
                className="px-4 py-4 flex items-center justify-between"
                style={{
                  borderBottom: `1px solid ${BORDER}`,
                  background: "#fafaf5",
                }}
              >
                <div className="flex gap-3 items-center min-w-0 pr-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                    }}
                  >
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="font-bold text-sm truncate"
                      style={{
                        fontFamily: "Times New Roman, serif",
                        color: "#1F2937",
                      }}
                    >
                      {c.name}
                    </div>
                    {c.contactPerson && (
                      <div className="text-xs truncate" style={{ color: "#6B7280" }}>
                        Attn: {c.contactPerson}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openModal(c)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Company"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleCompanyStatus(c.id)}
                    className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
                      }`}
                    title={c.isActive ? "Deactivate Company" : "Activate Company"}
                  >
                    {c.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors bg-white/50"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "#6B7280" }}
                >
                  <Phone
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: GOLD }}
                  />{" "}
                  {c.phone || "No phone provided"}
                </div>
                {(c.email || c.address) && (
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "#6B7280" }}
                  >
                    <Mail
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: GOLD }}
                    />{" "}
                    {c.email || "No email"}
                    {(c.email && c.address) && <span className="text-gray-300">|</span>}
                    {c.address && (
                      <span className="truncate">
                        <MapPin
                          className="w-3.5 h-3.5 inline mr-1"
                          style={{ color: GOLD, paddingBottom: 1 }}
                        />
                        {c.address}
                      </span>
                    )}
                  </div>
                )}
                {c.gstNumber && (
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "#6B7280" }}
                  >
                    <FileText
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: GOLD }}
                    />{" "}
                    GST: {c.gstNumber}
                  </div>
                )}
                <div
                  className="flex justify-between pt-2.5 mt-2"
                  style={{ borderTop: `1px dashed ${BORDER}` }}
                >
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "#6B7280" }}>
                      Credit Limit
                    </div>
                    <div className="font-bold text-sm" style={{ color: GOLD }}>
                      {c.creditLimit ? formatCurrency(Number(c.creditLimit)) : "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs mb-0.5" style={{ color: "#6B7280" }}>
                      Terms
                    </div>
                    <div className="font-semibold text-sm" style={{ color: "#4B5563" }}>
                      {c.paymentTerms || "Standard"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              className="col-span-full py-16 text-center border-2 border-dashed rounded-xl"
              style={{ color: "#9CA3AF", borderColor: "#E5E1DA" }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "#F3F4F6" }}
              >
                <Building className="w-8 h-8 opacity-40 text-gray-500" />
              </div>
              <p className="font-medium text-gray-500">No companies found</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                {search ? "Try adjusting your search terms" : "Start by registering your first corporate client or partner."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
