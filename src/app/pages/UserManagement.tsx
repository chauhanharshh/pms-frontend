import { useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { AppUser } from "../contexts/PMSContext";
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";

const emptyUser = (): Omit<AppUser, "id" | "createdAt"> => ({
  username: "",
  password: "",
  fullName: "",
  role: "hotel_manager",
  hotelId: "",
  email: "",
  phone: "",
  isActive: true,
});

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { appUsers, hotels, addUser, updateUser, deleteUser } = usePMS();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(emptyUser());
  const [showPass, setShowPass] = useState(false);

  const openAdd = () => {
    setForm(emptyUser());
    setEditingId(null);
    setShowForm(true);
  };
  const openEdit = (u: AppUser) => {
    setForm({ ...u });
    setEditingId(u.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.username || !form.password) return;
    if (editingId) {
      updateUser(editingId, form);
    } else {
      addUser(form);
    }
    setShowForm(false);
  };

  return (
    <AppLayout title="User Management" requiredRole="admin">
      <div className="space-y-5 max-w-5xl">
        {/* Admin Note */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "#fef9c3", border: "1px solid #fde68a" }}
        >
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            User management is restricted to Admin only. Hotel accounts can only
            view their hotel's data and cannot edit finalized bills.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: appUsers.length, color: GOLD },
            {
              label: "Admin Accounts",
              value: appUsers.filter((u) => u.role === "admin").length,
              color: "#3b82f6",
            },
            {
              label: "Hotel Accounts",
              value: appUsers.filter(
                (u) => u.role === "hotel_manager" || u.role === "hotel_user" || u.role === "hotel"
              ).length,
              color: "#16a34a",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-5"
              style={{
                background: "white",
                border: "1px solid #E5E1DA",
                boxShadow: "0 2px 8px rgba(221, 215, 204,0.05)",
              }}
            >
              <div
                className="text-3xl font-bold"
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

        {/* Controls */}
        <div className="flex justify-end">
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Plus className="w-4 h-4" /> Add User
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
            <Users className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              User Accounts
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Username",
                    "Role",
                    "Hotel",
                    "Email",
                    "Phone",
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
                {appUsers.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid rgba(184,134,11,0.07)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FFFFFF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <td className="px-4 py-3 ">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{
                            background:
                              u.role === "admin"
                                ? "linear-gradient(135deg, #C6A75E, #A8832D)"
                                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                          }}
                        >
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            className="font-semibold text-sm"
                            style={{ color: "#1F2937" }}
                          >
                            {u.username}
                          </div>
                          <div className="text-xs" style={{ color: "#9CA3AF" }}>
                            {u.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background:
                            u.role === "admin"
                              ? "rgba(221, 215, 204,0.1)"
                              : "#dbeafe",
                          color: u.role === "admin" ? DARKGOLD : "#1e40af",
                        }}
                      >
                        {u.role === "admin" ? "Administrator" : "Hotel Staff"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "#6B7280" }}
                    >
                      {u.role === "admin" ? (
                        <span style={{ color: "#9CA3AF" }}>All Hotels</span>
                      ) : (
                        hotels.find((h: any) => h.id === u.hotelId)?.name || "—"
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "#6B7280" }}
                    >
                      {u.email || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "#6B7280" }}
                    >
                      {u.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: u.isActive ? "#dcfce7" : "#fee2e2",
                          color: u.isActive ? "#166534" : "#dc2626",
                        }}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => openEdit(u as any)}
                              className="p-1.5 rounded-lg"
                              style={{ color: GOLD }}
                              onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(221, 215, 204,0.1)")
                              }
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "transparent")
                              }
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(u.id)}
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
                          </>
                        )}
                        {u.id === currentUser?.id && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "#fef9c3", color: "#854d0e" }}
                          >
                            You
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
                  {editingId ? "Edit User" : "Add User"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Username *
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Password *
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Full Name
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.fullName || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Role
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value as AppUser["role"],
                        hotelId: "",
                      }))
                    }
                  >
                    <option value="admin">Administrator</option>
                    <option value="hotel_manager">Hotel Manager</option>
                    <option value="hotel_user">Front Desk Staff</option>
                  </select>
                </div>
                {(form.role === "hotel_manager" || form.role === "hotel_user" || form.role === "hotel") && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: DARKGOLD }}
                    >
                      Assigned Hotel *
                    </label>
                    <select
                      className="w-full px-3 py-2.5 rounded-lg outline-none"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={form.hotelId || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, hotelId: e.target.value }))
                      }
                    >
                      <option value="">Select hotel</option>
                      {hotels.map((h: any) => (
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
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.email || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Phone
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.phone || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm"
                    style={{ color: DARKGOLD }}
                  >
                    Active Account
                  </label>
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
                    <Save className="w-4 h-4" />{" "}
                    {editingId ? "Update User" : "Create User"}
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
              <p className="font-semibold mb-2">Delete this user?</p>
              <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
                This action cannot be undone.
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
                    deleteUser(deleteConfirm);
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
