import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { ArrowLeft, Save, Building2, Clock3, SlidersHorizontal, FileText, DownloadCloud } from "lucide-react";
import api from "../services/api";
import { toast } from "sonner";

export function Settings() {
  const { currentHotelId } = useAuth();
  const { hotels, refreshAll } = usePMS();
  const navigate = useNavigate();
  const currentHotel = hotels.find((h) => h.id === currentHotelId);

  const [settings, setSettings] = useState({
    hotelName: currentHotel?.name || "",
    address: currentHotel?.address || "",
    phone: currentHotel?.phone || "",
    email: currentHotel?.email || "",
    gstNumber: currentHotel?.gstNumber || "",
    checkInTime: currentHotel?.checkInTime || "14:00",
    checkOutTime: currentHotel?.checkOutTime || "11:00",
    invoiceShowCustomLines: currentHotel?.invoiceShowCustomLines ?? false,
    invoiceLine1: currentHotel?.invoiceLine1 ?? "A UNIT OF",
    invoiceLine2: currentHotel?.invoiceLine2 ?? "UTTARAKHAND HOTELS4U",
    invoiceLine1Size: currentHotel?.invoiceLine1Size ?? 14,
    invoiceLine2Size: currentHotel?.invoiceLine2Size ?? 16,
    invoiceHotelNameColor: currentHotel?.invoiceHotelNameColor || "#000000",
    invoiceHeaderColor: currentHotel?.invoiceHeaderColor || "#000000",
    showInvoiceWatermark: currentHotel?.showInvoiceWatermark ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("showFinancialSummary") ?? "true");
    } catch {
      return true;
    }
  });
  const [restaurantEnabled, setRestaurantEnabled] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("restaurantEnabled") ?? "false");
    } catch {
      return false;
    }
  });

  // Added: electron-updater for automatic updates
  const [appVersion, setAppVersion] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      window.electronAPI.getAppVersion().then(v => setAppVersion(v)).catch(() => {});
    }
  }, []);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      // @ts-ignore
      const res = await window.electronAPI?.checkForUpdates();
      if (res?.status === 'error') {
        toast.error('Update check failed: ' + res.message);
      } else if (res?.status === 'dev-mode') {
        toast.info(res.message);
      } else {
        toast.success("Checking for updates...");
      }
    } catch (err: any) {
      toast.error('Failed to check for updates: ' + err?.message);
    } finally {
      setTimeout(() => setCheckingUpdate(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!currentHotelId) return;
    setSaving(true);
    try {
      const payload = {
        name: settings.hotelName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        gstNumber: settings.gstNumber,
        checkInTime: settings.checkInTime,
        checkOutTime: settings.checkOutTime,
        invoiceShowCustomLines: settings.invoiceShowCustomLines,
        invoiceLine1: settings.invoiceLine1,
        invoiceLine2: settings.invoiceLine2,
        invoiceLine1Size: Number(settings.invoiceLine1Size),
        invoiceLine2Size: Number(settings.invoiceLine2Size),
        invoiceHotelNameColor: settings.invoiceHotelNameColor,
        invoiceHeaderColor: settings.invoiceHeaderColor,
        showInvoiceWatermark: settings.showInvoiceWatermark,
      };
      
      await api.put(`/hotels/${currentHotelId}`, payload);
      
      localStorage.setItem("showFinancialSummary", JSON.stringify(showFinancialSummary));
      localStorage.setItem("restaurantEnabled", JSON.stringify(restaurantEnabled));
      
      await refreshAll(true);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#F7F4EE" }}>
      <style>{`
        .settings-container {
          height: calc(100vh - 80px);
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        .settings-container::-webkit-scrollbar {
          width: 6px;
        }

        .settings-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .settings-container::-webkit-scrollbar-thumb {
          background: #B8860B;
          border-radius: 10px;
        }

        .settings-container::-webkit-scrollbar-thumb:hover {
          background: #9A7209;
        }
      `}</style>
      <div className="bg-white border-b shadow-sm" style={{ borderColor: "#E8DCC8" }}>
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/hotel")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#B8860B", fontFamily: "Times New Roman, serif" }}>
              {currentHotel?.name || "Hotel Settings"}
            </h1>
            <p className="text-sm text-gray-500">Manage your hotel configuration</p>
          </div>
        </div>
        <div className="mx-6 pb-4">
          <div className="h-px" style={{ background: "linear-gradient(90deg, #B8860B 0%, #E8DCC8 55%, transparent 100%)" }} />
        </div>
      </div>

      <div className="p-6 settings-container">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-5">
            <div
              className="rounded-xl p-6"
              style={{
                background: "#ffffff",
                border: "1px solid #E8DCC8",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                className="text-[15px] font-semibold mb-4 pb-2.5 flex items-center gap-2"
                style={{ color: "#B8860B", borderBottom: "1px solid #F0E6D3" }}
              >
                <Building2 className="w-4 h-4" /> Basic Information
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel Name
                  </label>
                  <input
                    type="text"
                    value={settings.hotelName}
                    onChange={(e) =>
                      setSettings({ ...settings, hotelName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                    style={{ borderColor: "#D4B896", background: "#FAFAFA" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#B8860B";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,134,11,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D4B896";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) =>
                      setSettings({ ...settings, address: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                    style={{ borderColor: "#D4B896", background: "#FAFAFA" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#B8860B";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,134,11,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D4B896";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                    style={{ borderColor: "#D4B896", background: "#FAFAFA" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#B8860B";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,134,11,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D4B896";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                    style={{ borderColor: "#D4B896", background: "#FAFAFA" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#B8860B";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,134,11,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D4B896";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={settings.gstNumber}
                    onChange={(e) =>
                      setSettings({ ...settings, gstNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                    style={{ borderColor: "#D4B896", background: "#FAFAFA" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#B8860B";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,134,11,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D4B896";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "#ffffff",
                border: "1px solid #E8DCC8",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                className="text-[15px] font-semibold mb-4 pb-2.5 flex items-center gap-2"
                style={{ color: "#B8860B", borderBottom: "1px solid #F0E6D3" }}
              >
                <Clock3 className="w-4 h-4" /> Check-In / Check-Out Times
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Check-In Time
                  </label>
                  <input
                    type="time"
                    value={settings.checkInTime}
                    onChange={(e) =>
                      setSettings({ ...settings, checkInTime: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                    style={{ borderColor: "#D4B896", background: "#FAFAFA" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#B8860B";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,134,11,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D4B896";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Check-Out Time
                  </label>
                  <input
                    type="time"
                    value={settings.checkOutTime}
                    onChange={(e) =>
                      setSettings({ ...settings, checkOutTime: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                    style={{ borderColor: "#D4B896", background: "#FAFAFA" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#B8860B";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,134,11,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D4B896";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "#ffffff",
                border: "1px solid #E8DCC8",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                className="text-[15px] font-semibold mb-4 pb-2.5 flex items-center gap-2"
                style={{ color: "#B8860B", borderBottom: "1px solid #F0E6D3" }}
              >
                <SlidersHorizontal className="w-4 h-4" /> Module Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8DCC8]">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Show Financial Summary</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Display financial details in Check-In Details modal
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`relative w-14 h-7 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${showFinancialSummary ? "bg-[#B8860B]" : "bg-gray-300"}`}
                    onClick={() => setShowFinancialSummary((prev) => !prev)}
                    aria-label="Toggle show financial summary"
                    style={{ boxShadow: showFinancialSummary ? "0 0 8px rgba(184, 134, 11, 0.5)" : "none" }}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${showFinancialSummary ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8DCC8]">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Enable Restaurant Module</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Show restaurant section in hotel dashboard and sidebar
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`relative w-14 h-7 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${restaurantEnabled ? "bg-[#B8860B]" : "bg-gray-300"}`}
                    onClick={() => setRestaurantEnabled((prev) => !prev)}
                    aria-label="Toggle restaurant module"
                    style={{ boxShadow: restaurantEnabled ? "0 0 8px rgba(184, 134, 11, 0.5)" : "none" }}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${restaurantEnabled ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "#ffffff",
                border: "1px solid #E8DCC8",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                className="text-[15px] font-semibold mb-4 pb-2.5 flex items-center gap-2"
                style={{ color: "#B8860B", borderBottom: "1px solid #F0E6D3" }}
              >
                <FileText className="w-4 h-4" /> Invoice Customization
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[white] rounded-xl border border-[#E8DCC8]">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Show Custom Invoice Lines</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Enable the custom text lines on the invoice header
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`relative w-14 h-7 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${settings.invoiceShowCustomLines ? "bg-[#B8860B]" : "bg-gray-300"}`}
                    onClick={() => setSettings({ ...settings, invoiceShowCustomLines: !settings.invoiceShowCustomLines })}
                    aria-label="Toggle custom invoice lines"
                    style={{ boxShadow: settings.invoiceShowCustomLines ? "0 0 8px rgba(184, 134, 11, 0.5)" : "none" }}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-[white] rounded-full shadow-md transition-transform duration-300 ${settings.invoiceShowCustomLines ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[white] rounded-xl border border-[#E8DCC8]">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Invoice Watermark</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Show logo watermark on paid invoices
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`relative w-14 h-7 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${settings.showInvoiceWatermark ? "bg-[#B8860B]" : "bg-gray-300"}`}
                    onClick={() => setSettings({ ...settings, showInvoiceWatermark: !settings.showInvoiceWatermark })}
                    aria-label="Toggle invoice watermark"
                    style={{ boxShadow: settings.showInvoiceWatermark ? "0 0 8px rgba(184, 134, 11, 0.5)" : "none" }}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-[white] rounded-full shadow-md transition-transform duration-300 ${settings.showInvoiceWatermark ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                {settings.invoiceShowCustomLines && (
                  <div className="grid grid-cols-2 gap-6 p-4 bg-[#FAFAFA] rounded-xl border border-[#E8DCC8]">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Line 1 Text
                      </label>
                      <input
                        type="text"
                        value={settings.invoiceLine1 || ""}
                        onChange={(e) => setSettings({ ...settings, invoiceLine1: e.target.value })}
                        className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                        style={{ borderColor: "#D4B896", background: "#ffffff" }}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Line 1 Font Size (px)
                      </label>
                      <input
                        type="number"
                        min="8"
                        max="40"
                        value={settings.invoiceLine1Size}
                        onChange={(e) => setSettings({ ...settings, invoiceLine1Size: parseInt(e.target.value) || 14 })}
                        className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                        style={{ borderColor: "#D4B896", background: "#ffffff" }}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Line 2 Text
                      </label>
                      <input
                        type="text"
                        value={settings.invoiceLine2 || ""}
                        onChange={(e) => setSettings({ ...settings, invoiceLine2: e.target.value })}
                        className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                        style={{ borderColor: "#D4B896", background: "#ffffff" }}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Line 2 Font Size (px)
                      </label>
                      <input
                        type="number"
                        min="8"
                        max="40"
                        value={settings.invoiceLine2Size}
                        onChange={(e) => setSettings({ ...settings, invoiceLine2Size: parseInt(e.target.value) || 16 })}
                        className="w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm transition"
                        style={{ borderColor: "#D4B896", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 p-4 bg-[white] rounded-xl border border-[#E8DCC8]">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hotel Name Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.invoiceHotelNameColor || "#000000"}
                        onChange={(e) => setSettings({ ...settings, invoiceHotelNameColor: e.target.value })}
                        className="w-10 h-10 border-0 rounded cursor-pointer p-0"
                      />
                      <span className="text-sm font-mono text-gray-600 uppercase">{settings.invoiceHotelNameColor || "#000000"}</span>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Header Text Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.invoiceHeaderColor || "#000000"}
                        onChange={(e) => setSettings({ ...settings, invoiceHeaderColor: e.target.value })}
                        className="w-10 h-10 border-0 rounded cursor-pointer p-0"
                      />
                      <span className="text-sm font-mono text-gray-600 uppercase">{settings.invoiceHeaderColor || "#000000"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Added: electron-updater for automatic updates */}
            <div
              className="rounded-xl p-6"
              style={{
                background: "#ffffff",
                border: "1px solid #E8DCC8",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                className="text-[15px] font-semibold mb-4 pb-2.5 flex items-center gap-2"
                style={{ color: "#B8860B", borderBottom: "1px solid #F0E6D3" }}
              >
                <DownloadCloud className="w-4 h-4" /> Application Updates
              </h2>
              
              <div className="flex items-center justify-between p-4 bg-[white] rounded-xl border border-[#E8DCC8]">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">System Version</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Currently installed version: <strong className="text-gray-700">{appVersion || "Unknown"}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate || !appVersion}
                  className="px-4 py-2 bg-[#F7F4EE] border border-[#D4B896] rounded text-sm font-medium text-[#B8860B] hover:bg-[#F0EAE1] transition disabled:opacity-50"
                >
                  {checkingUpdate ? "Checking..." : "Check for Updates"}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/hotel")}
                className="flex-1 px-6 py-3 border rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                style={{ borderColor: "#D1D5DB" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-[white] disabled:opacity-70"
                style={{ background: "#B8860B" }}
              >
                {saving ? "Saving..." : <><Save className="w-5 h-5" /> Save Settings</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
