import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { KeyRound, Loader2, Pencil, Plus, Power, RefreshCw, ShieldCheck, Trash2, UserCog, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface AdminAccount {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  hotelsCount?: number;
  maxHotels?: number;
  role: string;
  isActive: boolean;
}

interface AdminFormState {
  fullName: string;
  username: string;
  password: string;
  phone: string;
  email: string;
  maxHotels: number;
  isActive: boolean;
  role: string;
}

const DEFAULT_FORM: AdminFormState = {
  fullName: "",
  username: "",
  password: "",
  phone: "",
  email: "",
  maxHotels: 1,
  isActive: true,
  role: "admin",
};

function isSuperAdminRole(role?: string) {
  return role === "super_admin" || role === "superadmin";
}

export function SuperAdminPanel() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
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

    if (!isSuperAdminRole(user.role)) {
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
      const adminsRes = await api.get("/users/admins");
      setAdmins(adminsRes.data?.data || []);
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
      phone: admin.phone || "",
      email: admin.email || "",
      maxHotels: Math.max(1, Number(admin.maxHotels || 1)),
      isActive: admin.isActive,
      role: admin.role || "admin",
    });
    setShowForm(true);
  };

  const saveAdmin = async () => {
    if (!form.fullName.trim() || !form.username.trim()) {
      setError("Admin Name and Username are required.");
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
          ...(form.password.trim() ? { password: form.password } : {}),
          phone: form.phone || null,
          email: form.email || null,
          maxHotels: Math.max(1, Number(form.maxHotels || 1)),
          isActive: form.isActive,
          role: form.role,
        });
        setAdmins((prev) => prev.map((a) => (a.id === editingId ? res.data.data : a)));
      } else {
        const res = await api.post("/users/admins", {
          fullName: form.fullName,
          username: form.username,
          password: form.password,
          phone: form.phone || null,
          email: form.email || null,
          maxHotels: Math.max(1, Number(form.maxHotels || 1)),
          isActive: form.isActive,
          role: form.role,
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

  const deleteAdmin = async (admin: AdminAccount) => {
    const confirmed = window.confirm(
      `Delete admin account "${admin.username}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      try {
        // Preferred endpoint on newer backends.
        await api.delete(`/users/admins/${admin.id}`);
      } catch (deleteErr: any) {
        // Backward compatibility for deployments that only support legacy delete.
        if (deleteErr?.response?.status === 404) {
          await api.delete(`/users/${admin.id}`);
        } else {
          throw deleteErr;
        }
      }
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete admin account");
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
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#f8f1e3] text-[#7a5c00] font-medium"
          >
            <UserCog className="w-4 h-4 text-[#A8832D]" />
            Admin Management
          </button>
          <button
            onClick={() => navigate('/superadmin/licenses')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-[#f9f7f3]"
          >
            <KeyRound className="w-4 h-4 text-[#A8832D]" />
            License Management
          </button>
        </aside>

        <div className="space-y-6">
        <div className="bg-[#1F2937] rounded-2xl p-5 border border-[#E5E1DA] text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#C6A75E]" />
              <h1 className="text-2xl" style={{ fontFamily: "Times New Roman, serif", color: "#F8EBCB" }}>
                Super Admin Panel
              </h1>
            </div>
            <p className="text-sm mt-1 text-[#D1D5DB]">
              Manage multi-client admin accounts, access status, and password resets.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 bg-white border border-[#E5E1DA]">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total Admin Accounts</p>
            <p className="text-3xl mt-1" style={{ color: "#A8832D", fontFamily: "Times New Roman, serif" }}>{admins.length}</p>
          </div>
          <div className="rounded-xl p-4 bg-white border border-[#E5E1DA]">
            <p className="text-xs uppercase tracking-wider text-gray-500">Active Admins</p>
            <p className="text-3xl mt-1" style={{ color: "#15803d", fontFamily: "Times New Roman, serif" }}>{activeAdmins}</p>
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
                  <th className="px-4 py-3">Hotels</th>
                  <th className="px-4 py-3">Max Allowed</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={7}>
                      <div className="flex items-center justify-center text-sm text-gray-500 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading admin accounts...
                      </div>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500 text-center" colSpan={7}>
                      No admin accounts found.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-[#EFE8DC]">
                      <td className="px-4 py-3 text-sm text-gray-800">{admin.fullName || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{admin.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{Number(admin.hotelsCount || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{Math.max(1, Number(admin.maxHotels || 1))}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="capitalize font-medium text-gray-600">
                          {admin.role === "restaurant_admin" ? "Restaurant Admin" : "Full Admin"}
                        </span>
                      </td>
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
                          <button
                            onClick={() => deleteAdmin(admin)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
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
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E1DA] shadow-xl">
            <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
              <h3 className="text-lg" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>
                {editingId ? `Edit Admin - ${form.fullName || "Admin"}` : "Create Admin Account"}
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
                <label className="block text-sm text-gray-700 mb-1">Max Hotels</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxHotels}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxHotels: Math.max(1, Number(e.target.value || 1)),
                    }))
                  }
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
                />
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
              <div>
                <label className="block text-sm text-gray-700 mb-1">Access Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E] bg-white"
                >
                  <option value="admin">Standard Admin (Full Access)</option>
                  <option value="restaurant_admin">Restaurant Admin (Restricted)</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
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
