import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { ArrowLeft, Save, Building2, Clock3, SlidersHorizontal } from "lucide-react";

export function Settings() {
  const { currentHotelId } = useAuth();
  const { hotels } = usePMS();
  const navigate = useNavigate();
  const currentHotel = hotels.find((h) => h.id === currentHotelId);

  const [settings, setSettings] = useState({
    hotelName: currentHotel?.name || "",
    address: currentHotel?.address || "",
    phone: currentHotel?.phone || "",
    email: currentHotel?.email || "",
    gstNumber: currentHotel?.gstNumber || "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
  });
  const [showFinancialSummary, setShowFinancialSummary] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("showFinancialSummary") ?? "true");
    } catch {
      return true;
    }
  });

  const handleSave = () => {
    localStorage.setItem("showFinancialSummary", JSON.stringify(showFinancialSummary));
    alert("Settings saved successfully!");
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
                <SlidersHorizontal className="w-4 h-4" /> Display Preferences
              </h2>

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
                className="flex-1 px-6 py-3 rounded-lg font-medium transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-white"
                style={{ background: "#B8860B" }}
              >
                <Save className="w-5 h-5" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
