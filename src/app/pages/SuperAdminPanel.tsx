import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Building2, KeyRound, Loader2, Pencil, Plus, Power, RefreshCw, ShieldCheck, UserCog, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface AdminAccount {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  hotelId?: string | null;
  isActive: boolean;
  hotel?: { id: string; name: string } | null;
}

interface HotelOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface AdminFormState {
  fullName: string;
  username: string;
  password: string;
  hotelId: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const DEFAULT_FORM: AdminFormState = {
  fullName: "",
  username: "",
  password: "",
  hotelId: "",
  phone: "",
  email: "",
  isActive: true,
};

export function SuperAdminPanel() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminFormState>(DEFAULT_FORM);

  const activeAdmins = useMemo(() => admins.filter((a) => a.isActive).length, [admins]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/");
      return;
    }

    if (user.role !== "super_admin") {
      navigate(user.role === "admin" ? "/admin" : "/hotel", { replace: true });
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, navigate]);

  const fetchData = async () => {
    setIsFetching(true);
    setError("");
    try {
      const [adminsRes, hotelsRes] = await Promise.all([
        api.get("/users/admins"),
        api.get("/hotels"),
      ]);
      setAdmins(adminsRes.data?.data || []);
      setHotels(hotelsRes.data?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load Super Admin data");
    } finally {
      setIsFetching(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  };

  const openEdit = (admin: AdminAccount) => {
    setEditingId(admin.id);
    setForm({
      fullName: admin.fullName || "",
      username: admin.username || "",
      password: "",
      hotelId: admin.hotelId || "",
      phone: admin.phone || "",
      email: admin.email || "",
      isActive: admin.isActive,
    });
    setShowForm(true);
  };

  const saveAdmin = async () => {
    if (!form.fullName.trim() || !form.username.trim() || !form.hotelId) {
      setError("Admin Name, Username and Hotel are required.");
      return;
    }
    if (!editingId && !form.password.trim()) {
      setError("Password is required for new admin accounts.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const res = await api.put(`/users/admins/${editingId}`, {
          fullName: form.fullName,
          username: form.username,
          hotelId: form.hotelId,
          phone: form.phone || null,
          email: form.email || null,
          isActive: form.isActive,
        });
        setAdmins((prev) => prev.map((a) => (a.id === editingId ? res.data.data : a)));
      } else {
        const res = await api.post("/users/admins", {
          fullName: form.fullName,
          username: form.username,
          password: form.password,
          hotelId: form.hotelId,
          phone: form.phone || null,
          email: form.email || null,
          isActive: form.isActive,
        });
        setAdmins((prev) => [res.data.data, ...prev]);
      }

      setShowForm(false);
      setForm(DEFAULT_FORM);
      setEditingId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save admin account");
    } finally {
      setSaving(false);
    }
  };

  const toggleAdminStatus = async (admin: AdminAccount) => {
    try {
      const res = await api.patch(`/users/admins/${admin.id}/status`, {
        isActive: !admin.isActive,
      });
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? res.data.data : a)));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update admin status");
    }
  };

  const resetPassword = async (admin: AdminAccount) => {
    const newPassword = window.prompt(`Enter a new password for ${admin.username}:`);
    if (!newPassword || !newPassword.trim()) return;

    try {
      await api.patch(`/users/admins/${admin.id}/reset-password`, {
        password: newPassword.trim(),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to reset password");
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

  if (!user || user.role !== "super_admin") {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#FAF7F2" }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-[#1F2937] rounded-2xl p-5 border border-[#E5E1DA] text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#C6A75E]" />
              <h1 className="text-2xl" style={{ fontFamily: "Times New Roman, serif", color: "#F8EBCB" }}>
                Super Admin Panel
              </h1>
            </div>
            <p className="text-sm mt-1 text-[#D1D5DB]">
              Manage multi-client admin accounts, hotel assignment, access status, and password resets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-white border border-[#E5E1DA]">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total Admin Accounts</p>
            <p className="text-3xl mt-1" style={{ color: "#A8832D", fontFamily: "Times New Roman, serif" }}>{admins.length}</p>
          </div>
          <div className="rounded-xl p-4 bg-white border border-[#E5E1DA]">
            <p className="text-xs uppercase tracking-wider text-gray-500">Active Admins</p>
            <p className="text-3xl mt-1" style={{ color: "#15803d", fontFamily: "Times New Roman, serif" }}>{activeAdmins}</p>
          </div>
          <div className="rounded-xl p-4 bg-white border border-[#E5E1DA]">
            <p className="text-xs uppercase tracking-wider text-gray-500">Hotels Available</p>
            <p className="text-3xl mt-1" style={{ color: "#1d4ed8", fontFamily: "Times New Roman, serif" }}>{hotels.length}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E1DA] shadow-sm">
          <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#A8832D]" />
              <h2 className="font-semibold" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>Admin Management</h2>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: "linear-gradient(135deg, #C6A75E, #A8832D)" }}
            >
              <Plus className="w-4 h-4" /> Add Admin
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="bg-[#f9f7f3] text-left text-xs uppercase tracking-wider text-[#7a5c00]">
                  <th className="px-4 py-3">Admin Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Hotel Name</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={6}>
                      <div className="flex items-center justify-center text-sm text-gray-500 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading admin accounts...
                      </div>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500 text-center" colSpan={6}>
                      No admin accounts found.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-[#EFE8DC]">
                      <td className="px-4 py-3 text-sm text-gray-800">{admin.fullName || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{admin.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#A8832D]" />
                          {admin.hotel?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{admin.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: admin.isActive ? "#dcfce7" : "#fee2e2",
                            color: admin.isActive ? "#166534" : "#b91c1c",
                          }}
                        >
                          {admin.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(admin)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] hover:bg-[#f9f7f3]"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => resetPassword(admin)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] hover:bg-[#f9f7f3]"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Reset Password
                          </button>
                          <button
                            onClick={() => toggleAdminStatus(admin)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] hover:bg-[#f9f7f3]"
                          >
                            <Power className="w-3.5 h-3.5" /> {admin.isActive ? "Disable" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E1DA] shadow-xl">
            <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
              <h3 className="text-lg" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>
                {editingId ? "Edit Admin Account" : "Create Admin Account"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Admin Name *</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Username *</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password {editingId ? "(optional)" : "*"}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Hotel Name *</label>
                <select
                  value={form.hotelId}
                  onChange={(e) => setForm((f) => ({ ...f, hotelId: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                >
                  <option value="">Select hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}{hotel.isActive ? "" : " (Inactive)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Contact Number</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active account
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#E5E1DA] flex items-center justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-[#E5E1DA] text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveAdmin}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #C6A75E, #A8832D)" }}
              >
                {saving ? "Saving..." : editingId ? "Update Admin" : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
