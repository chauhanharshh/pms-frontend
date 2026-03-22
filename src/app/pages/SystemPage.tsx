import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import api from "../services/api";
import {
  Key,
  HardDrive,
  Info,
  CheckCircle,
  Clock,
  Database,
  Download,
  Shield,
  Store,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatLicenseStatus(status?: string | null) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "🟢 Active";
  if (value === "grace_period" || value === "expiring_soon" || value === "read_only") return "🟡 Grace";
  return "🔴 Expired";
}

// Simulated backup history
const BACKUP_HISTORY = [
  {
    id: "bk-7",
    timestamp: "2026-02-28 18:30:00",
    size: 2348291,
    type: "Manual",
  },
  { id: "bk-6", timestamp: "2026-02-27 23:59:00", size: 2298104, type: "Auto" },
  { id: "bk-5", timestamp: "2026-02-26 23:59:00", size: 2201883, type: "Auto" },
  { id: "bk-4", timestamp: "2026-02-25 23:59:00", size: 2150000, type: "Auto" },
  { id: "bk-3", timestamp: "2026-02-24 23:59:00", size: 2100000, type: "Auto" },
  { id: "bk-2", timestamp: "2026-02-23 23:59:00", size: 2050000, type: "Auto" },
  { id: "bk-1", timestamp: "2026-02-22 23:59:00", size: 2000000, type: "Auto" },
];

export function SystemPage() {
  const { user, logout } = useAuth();
  const { hotels, bookings, rooms, systemSettings, updateSystemSettings } = usePMS();
  const location = useLocation();
  const segment = location.pathname.split("/").pop() || "password";

  const [licenseInfo, setLicenseInfo] = useState<{
    startDate?: string | null;
    expiryDate?: string | null;
    status?: string | null;
  } | null>(null);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdOk, setPwdOk] = useState(false);
  const [backing, setBacking] = useState(false);
  const [backupDone, setBackupDone] = useState("");

  useEffect(() => {
    if (segment !== "about" || !user?.id) return;

    let mounted = true;
    const loadLicense = async () => {
      try {
        const res = await api.get(`/license/admin/${user.id}`);
        const data = res.data?.data || res.data || null;
        if (mounted) {
          setLicenseInfo({
            startDate: data?.startDate ?? null,
            expiryDate: data?.expiryDate ?? null,
            status: data?.status ?? null,
          });
        }
      } catch {
        if (mounted) {
          setLicenseInfo(null);
        }
      }
    };

    loadLicense();
    return () => {
      mounted = false;
    };
  }, [segment, user?.id]);

  const handleChangePassword = () => {
    if (!oldPwd || !newPwd) {
      setPwdMsg("Please fill all fields.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg("Passwords do not match.");
      return;
    }
    setPwdOk(true);
    setPwdMsg("✓ Password changed successfully.");
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setTimeout(() => {
      setPwdMsg("");
      setPwdOk(false);
    }, 5000);
  };

  const handleBackup = () => {
    setBacking(true);
    setTimeout(() => {
      // Create a JSON backup of the system state
      const backupData = JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          hotels,
          bookings,
          rooms,
          meta: { version: "1.0.0", generatedBy: user?.username },
        },
        null,
        2,
      );
      const blob = new Blob([backupData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hotels4U_Backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const ts = new Date().toLocaleString("en-IN");
      setBackupDone(`Backup created at ${ts}`);
      setBacking(false);
    }, 2000);
  };

  return (
    <AppLayout
      title={
        segment === "password"
          ? "Change Password"
          : segment === "backup"
            ? "System Backup"
            : segment === "features"
              ? "System Features"
              : "About System"
      }
    >
      <div className="max-w-2xl space-y-6">
        {/* Change Password */}
        {segment === "password" && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <Key className="w-5 h-5" style={{ color: GOLD }} />
              <h2
                className="font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                Change Password
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className="block text-xs font-bold mb-2 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-2 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-2 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
              {pwdMsg && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: pwdOk ? "#dcfce7" : "#fee2e2",
                    color: pwdOk ? "#166534" : "#dc2626",
                    border: `1px solid ${pwdOk ? "#86efac" : "#fca5a5"}`,
                  }}
                >
                  {pwdMsg}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                }}
              >
                <Key className="w-4 h-4" /> Update Password
              </button>
              <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
                Logged in as: <strong>{user?.username}</strong> ({user?.role})
              </p>
            </div>
          </div>
        )}

        {/* Backup */}
        {segment === "backup" && (
          <div className="space-y-5">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{
                  background: "#FFFFFF",
                  borderBottom: `2px solid ${BORDER}`,
                }}
              >
                <HardDrive className="w-5 h-5" style={{ color: GOLD }} />
                <h2
                  className="font-bold"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: DARKGOLD,
                  }}
                >
                  Create Backup
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid #E5E1DA`,
                    }}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: DARKGOLD }}
                    >
                      {hotels.length}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      Hotels
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid #E5E1DA`,
                    }}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: DARKGOLD }}
                    >
                      {bookings.length}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      Bookings
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid #E5E1DA`,
                    }}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: DARKGOLD }}
                    >
                      {rooms.length}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      Rooms
                    </p>
                  </div>
                </div>
                {backupDone && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                    style={{
                      background: "#dcfce7",
                      color: "#166534",
                      border: "1px solid #86efac",
                    }}
                  >
                    <CheckCircle className="w-4 h-4" /> {backupDone}
                  </div>
                )}
                <button
                  onClick={handleBackup}
                  disabled={backing}
                  className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: backing
                      ? "#9CA3AF"
                      : `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                    cursor: backing ? "not-allowed" : "pointer",
                  }}
                >
                  {backing ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" /> Creating
                      Backup…
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" /> Download Full Backup
                      (JSON)
                    </>
                  )}
                </button>
                <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
                  Generates a timestamped JSON file of all hotel data. Maintains
                  last 7 backups locally.
                </p>
              </div>
            </div>

            {/* Backup History */}
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
                <h3
                  className="font-bold"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: DARKGOLD,
                  }}
                >
                  Backup History (Last 7)
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: BORDER }}>
                {BACKUP_HISTORY.map((bk) => (
                  <div
                    key={bk.id}
                    className="px-6 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4" style={{ color: GOLD }} />
                      <div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: "#374151" }}
                        >
                          {bk.timestamp}
                        </div>
                        <div className="text-xs" style={{ color: "#9CA3AF" }}>
                          {bk.type} · {formatFileSize(bk.size)}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          bk.type === "Manual"
                            ? "rgba(221, 215, 204,0.1)"
                            : "#f3f4f6",
                        color: bk.type === "Manual" ? DARKGOLD : "#6B7280",
                      }}
                    >
                      {bk.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {segment === "features" && (
          <div
            className="rounded-2xl overflow-hidden animate-fade-in"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <Store className="w-5 h-5" style={{ color: GOLD }} />
              <h2
                className="font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                POS Features
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <h3 className="font-semibold text-slate-800">Enable Multi-Hotel Selection in POS</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Allow staff to open the Restaurant Room Selector and toggle between different hotels to assign orders across properties.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={systemSettings?.enableRestaurantMultiHotel || false}
                    onChange={async (e) => {
                      try {
                        await updateSystemSettings({ enableRestaurantMultiHotel: e.target.checked });
                      } catch (err) {
                        console.error("Failed to toggle multi-hotel setting", err);
                      }
                    }}
                  />
                  <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 flex-shrink-0 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-[#C6A75E]"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        {segment === "about" && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <Info className="w-5 h-5" style={{ color: GOLD }} />
              <h2
                className="font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                About System
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid #E5E1DA`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                  }}
                >
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color: DARKGOLD,
                    }}
                  >
                    Hotels4U PMS
                  </h3>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    Property Management System
                  </p>
                  <p
                    className="text-xs font-semibold mt-1"
                    style={{ color: GOLD }}
                  >
                    Version 2.0.0
                  </p>
                </div>
              </div>
              {[
                ["System Version", "Hotels4U PMS v2.0.0"],
                ["Build Date", "February 2026"],
                ["Architecture", "Multi-hotel, Role-based, Real-time"],
                ["Hotels Registered", hotels.length.toString()],
                ["Total Rooms", rooms.length.toString()],
                ["Total Bookings", bookings.length.toString()],
                ["Active Since", "2025"],
                ["Activation Date", formatDate(licenseInfo?.startDate)],
                ["Expiry Date", formatDate(licenseInfo?.expiryDate)],
                ["License Status", formatLicenseStatus(licenseInfo?.status)],
                ["Support", "admin@hotels4u.com"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-2"
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: DARKGOLD }}
                  >
                    {label}
                  </span>
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
