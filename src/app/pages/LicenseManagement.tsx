import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarClock,
  Copy,
  KeyRound,
  Loader2,
  Monitor,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface HotelOption {
  id: string;
  name: string;
}

interface AdminOption {
  id: string;
  username: string;
  fullName: string;
}

interface LicenseRow {
  id: string;
  hotelId: string;
  hotelName: string;
  adminName?: string | null;
  adminUsername?: string | null;
  licenseKey: string;
  planType: string;
  durationMonths: number;
  amount: number;
  startDate: string;
  expiryDate: string;
  status: string;
  statusLabel: string;
  devices: number;
  daysLeft?: number;
}

interface DeviceRow {
  id: string;
  deviceName?: string | null;
  os?: string | null;
  ip?: string | null;
  version?: string | null;
  lastActive: string;
}

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  notes?: string | null;
  extendedFrom?: string | null;
  extendedTo?: string | null;
  createdAt: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const getStatusBadge = (status: string) => {
  const value = String(status || "").toLowerCase();
  if (value === "active") return { label: "Active", cls: "bg-green-100 text-green-700" };
  if (value === "grace_period") return { label: "Grace Period", cls: "bg-yellow-100 text-yellow-700" };
  if (value === "read_only") return { label: "Read Only", cls: "bg-orange-100 text-orange-700" };
  if (value === "expired") return { label: "Expired", cls: "bg-red-100 text-red-700" };
  if (value === "expiring_soon") return { label: "Expiring Soon", cls: "bg-blue-100 text-blue-700" };
  return { label: status || "Unknown", cls: "bg-gray-100 text-gray-700" };
};

function isSuperAdminRole(role?: string) {
  return role === "super_admin" || role === "superadmin";
}

export function LicenseManagement() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [planType, setPlanType] = useState<"monthly" | "annual">("monthly");
  const [durationMonths, setDurationMonths] = useState(1);
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendRow, setExtendRow] = useState<LicenseRow | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendAmount, setExtendAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [extendNotes, setExtendNotes] = useState("");
  const [extending, setExtending] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"devices" | "payments">("devices");
  const [viewRow, setViewRow] = useState<LicenseRow | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/");
      return;
    }
    if (!isSuperAdminRole(user.role)) {
      navigate(user.role === "admin" ? "/admin" : "/hotel", { replace: true });
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, navigate]);

  const loadAll = async () => {
    setLoadingData(true);
    setError("");
    try {
      const [hotelsRes, licensesRes] = await Promise.all([
        api.get("/users/admins"),
        api.get("/license/all"),
      ]);
      const adminRows: AdminOption[] = (hotelsRes.data?.data || []).map((a: any) => ({
        id: a.id,
        username: a.username,
        fullName: a.fullName,
      }));
      setAdmins(adminRows);
      setLicenses(licensesRes.data?.data || []);
      if (!selectedAdminId && adminRows.length > 0) {
        setSelectedAdminId(adminRows[0].id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load license data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAdminId) {
      setError("Please select an admin.");
      return;
    }

    setCreating(true);
    setError("");
    setGeneratedKey("");

    try {
      const res = await api.post("/license/create", {
        adminId: selectedAdminId,
        planType,
        durationMonths,
        amount: Number(amount || 0),
      });
      const created = res.data?.data;
      setGeneratedKey(created?.licenseKey || "");
      setLicenses((prev) => [created, ...prev]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to generate license");
    } finally {
      setCreating(false);
    }
  };

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op fallback
    }
  };

  const openExtend = (row: LicenseRow) => {
    setExtendRow(row);
    setExtendMonths(1);
    setExtendAmount("");
    setPaymentMethod("Cash");
    setExtendNotes("");
    setExtendOpen(true);
  };

  const previewNewExpiry = useMemo(() => {
    if (!extendRow) return "-";
    const base = new Date(extendRow.expiryDate);
    const now = new Date();
    const from = base > now ? base : now;
    from.setMonth(from.getMonth() + extendMonths);
    return formatDate(from.toISOString());
  }, [extendMonths, extendRow]);

  const confirmExtend = async () => {
    if (!extendRow) return;

    setExtending(true);
    setError("");
    try {
      const res = await api.post("/license/extend", {
        licenseId: extendRow.id,
        extendMonths,
        amount: Number(extendAmount || 0),
        paymentMethod,
        notes: extendNotes || null,
      });
      const updated = res.data?.data;
      setLicenses((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
      setExtendOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to extend license");
    } finally {
      setExtending(false);
    }
  };

  const openView = async (row: LicenseRow, tab: "devices" | "payments" = "devices") => {
    setViewRow(row);
    setViewTab(tab);
    setViewOpen(true);
    setViewLoading(true);
    try {
      const [devicesRes, paymentsRes] = await Promise.all([
        api.get(`/license/${row.id}/devices`),
        api.get(`/license/${row.id}/payments`),
      ]);
      setDevices(devicesRes.data?.data || []);
      setPayments(paymentsRes.data?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load license details");
    } finally {
      setViewLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C6A75E]" />
      </div>
    );
  }

  if (!user || !isSuperAdminRole(user.role)) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#FAF7F2" }}>
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <aside className="bg-white border border-[#E5E1DA] rounded-2xl p-3 h-fit">
          <p className="text-xs uppercase tracking-wider text-gray-500 px-2 py-1">Super Admin</p>
          <button
            onClick={() => navigate("/superadmin")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-[#f9f7f3]"
          >
            <ShieldCheck className="w-4 h-4 text-[#A8832D]" />
            Admin Management
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#f8f1e3] text-[#7a5c00] font-medium"
          >
            <KeyRound className="w-4 h-4 text-[#A8832D]" />
            License Management
          </button>
        </aside>

        <div className="space-y-6">
          <div className="bg-[#1F2937] rounded-2xl p-5 border border-[#E5E1DA] text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#C6A75E]" />
                <h1 className="text-2xl" style={{ fontFamily: "Times New Roman, serif", color: "#F8EBCB" }}>
                  License Management
                </h1>
              </div>
              <p className="text-sm mt-1 text-[#D1D5DB]">
                Create, track, extend, and verify hotel licenses.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadAll}
                className="px-3 py-2 rounded-lg text-sm border border-[#C6A75E] text-[#F8EBCB] hover:bg-white/10 transition"
              >
                <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm bg-[#C6A75E] text-white hover:opacity-90 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#A8832D]" />
              <h2 className="font-semibold" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>
                Create New License
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Select Admin</label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                >
                  <option value="">-- Select Admin --</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>{admin.fullName} (@{admin.username})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Plan</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as "monthly" | "annual")}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDurationMonths(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${durationMonths === m
                        ? "bg-[#C6A75E] text-white border-[#C6A75E]"
                        : "bg-white text-gray-700 border-[#E5E1DA]"
                        }`}
                    >
                      {m} Month{m > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Amount</label>
                <div className="flex items-center rounded-lg border border-[#E5E1DA] px-3 py-2">
                  <span className="text-gray-500 mr-2">₹</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    className="w-full outline-none"
                    placeholder="Enter amount in ₹"
                  />
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={handleGenerate}
                disabled={creating}
                className="px-5 py-2 rounded-lg text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #C6A75E, #A8832D)" }}
              >
                {creating ? "Generating..." : "Generate License Key"}
              </button>

              {generatedKey && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-700 font-medium">License Generated!</p>
                  <div className="mt-2 flex items-center justify-between gap-3 bg-white border border-green-200 rounded-lg px-3 py-2">
                    <span className="font-semibold text-gray-800 tracking-wide break-all">{generatedKey}</span>
                    <button
                      onClick={() => copyText(generatedKey)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#E5E1DA] text-sm"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E1DA] shadow-sm">
            <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>
                All Licenses
              </h2>
              {loadingData && <Loader2 className="w-4 h-4 animate-spin text-[#A8832D]" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-[#f9f7f3] text-left text-xs uppercase tracking-wider text-[#7a5c00]">
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">License Key</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Devices</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-sm text-gray-500 text-center" colSpan={8}>
                        No licenses found.
                      </td>
                    </tr>
                  ) : (
                    licenses.map((row) => {
                      const badge = getStatusBadge(row.status);
                      return (
                        <tr key={row.id} className="border-t border-[#EFE8DC]">
                          <td className="px-4 py-3 text-sm text-gray-800">{row.adminName || "-"}{row.adminUsername ? ` (@${row.adminUsername})` : ""}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.licenseKey}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 capitalize">{row.planType}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDate(row.startDate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDate(row.expiryDate)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.devices || 0}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => openExtend(row)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] hover:bg-[#f9f7f3]"
                              >
                                <CalendarClock className="w-3.5 h-3.5" /> Extend
                              </button>
                              <button
                                onClick={() => openView(row, "devices")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] hover:bg-[#f9f7f3]"
                              >
                                <Monitor className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => copyText(row.licenseKey)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] hover:bg-[#f9f7f3]"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy Key
                              </button>
                            </div>
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
      </div>

      {extendOpen && extendRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-[#E5E1DA] shadow-xl">
            <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
              <h3 className="text-lg" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>
                Extend License - {extendRow.hotelName}
              </h3>
              <button onClick={() => setExtendOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700">Current Expiry: <span className="font-semibold">{formatDate(extendRow.expiryDate)}</span></p>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Extend by</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => setExtendMonths(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${extendMonths === m
                        ? "bg-[#C6A75E] text-white border-[#C6A75E]"
                        : "bg-white text-gray-700 border-[#E5E1DA]"
                        }`}
                    >
                      {m} Month{m > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Amount Paid</label>
                <div className="flex items-center rounded-lg border border-[#E5E1DA] px-3 py-2">
                  <span className="text-gray-500 mr-2">₹</span>
                  <input
                    value={extendAmount}
                    onChange={(e) => setExtendAmount(e.target.value)}
                    type="number"
                    className="w-full outline-none"
                    placeholder="Enter paid amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Notes</label>
                <input
                  value={extendNotes}
                  onChange={(e) => setExtendNotes(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                />
              </div>

              <p className="text-sm text-gray-700">
                New Expiry will be: <span className="font-semibold">{previewNewExpiry}</span>
              </p>
            </div>

            <div className="px-5 py-4 border-t border-[#E5E1DA] flex items-center justify-end gap-2">
              <button
                onClick={() => setExtendOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E5E1DA] text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmExtend}
                disabled={extending}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #C6A75E, #A8832D)" }}
              >
                {extending ? "Extending..." : "Confirm Extension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewOpen && viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white border border-[#E5E1DA] shadow-xl">
            <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
              <h3 className="text-lg" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>
                License Details - {viewRow.hotelName}
              </h3>
              <button onClick={() => setViewOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-4 flex gap-2 border-b border-[#E5E1DA]">
              <button
                onClick={() => setViewTab("devices")}
                className={`px-3 py-2 text-sm rounded-t-lg ${viewTab === "devices" ? "bg-[#f8f1e3] text-[#7a5c00]" : "text-gray-600"}`}
              >
                View Devices
              </button>
              <button
                onClick={() => setViewTab("payments")}
                className={`px-3 py-2 text-sm rounded-t-lg ${viewTab === "payments" ? "bg-[#f8f1e3] text-[#7a5c00]" : "text-gray-600"}`}
              >
                Payment History
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-auto">
              {viewLoading ? (
                <div className="py-8 flex items-center justify-center text-sm text-gray-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : viewTab === "devices" ? (
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="bg-[#f9f7f3] text-left text-xs uppercase tracking-wider text-[#7a5c00]">
                      <th className="px-3 py-2">Device Name</th>
                      <th className="px-3 py-2">OS</th>
                      <th className="px-3 py-2">IP</th>
                      <th className="px-3 py-2">Version</th>
                      <th className="px-3 py-2">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>No devices found.</td>
                      </tr>
                    ) : (
                      devices.map((d) => (
                        <tr key={d.id} className="border-t border-[#EFE8DC]">
                          <td className="px-3 py-2 text-sm">{d.deviceName || "-"}</td>
                          <td className="px-3 py-2 text-sm">{d.os || "-"}</td>
                          <td className="px-3 py-2 text-sm">{d.ip || "-"}</td>
                          <td className="px-3 py-2 text-sm">{d.version || "-"}</td>
                          <td className="px-3 py-2 text-sm">{new Date(d.lastActive).toLocaleString("en-IN")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="bg-[#f9f7f3] text-left text-xs uppercase tracking-wider text-[#7a5c00]">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Notes</th>
                      <th className="px-3 py-2">Extended To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>No payment history found.</td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="border-t border-[#EFE8DC]">
                          <td className="px-3 py-2 text-sm">{formatDate(p.createdAt)}</td>
                          <td className="px-3 py-2 text-sm">{formatCurrency(p.amount)}</td>
                          <td className="px-3 py-2 text-sm">{p.method}</td>
                          <td className="px-3 py-2 text-sm">{p.notes || "-"}</td>
                          <td className="px-3 py-2 text-sm">{formatDate(p.extendedTo)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
