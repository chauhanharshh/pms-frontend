import React, { useState, useEffect } from "react";
import { Save, RotateCcw, Building2, Paintbrush } from "lucide-react";
import { usePMS } from "../contexts/PMSContext";
import { useAuth } from "../contexts/AuthContext";

// Optional: you can extract these to a robust validation util, but standard hex is easy
const isValidHex = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

export function AppearanceSettings() {
    const {
        systemSettings,
        updateSystemSettings,
        hotels,
        updateHotel,
        isLoading
    } = usePMS();

    const { currentHotelId } = useAuth();

    // --- Global Theme State ---
    const [globalSidebar, setGlobalSidebar] = useState(systemSettings?.globalSidebarColor || "#1F2937");
    const [globalHeader, setGlobalHeader] = useState(systemSettings?.globalHeaderColor || "#ffffff");
    const [globalAccent, setGlobalAccent] = useState(systemSettings?.globalAccentColor || "#C6A75E");

    // --- Per-Hotel Theme State ---
    const [selectedHotelId, setSelectedHotelId] = useState(hotels?.length > 0 ? hotels[0]?.id : "");
    const [isCustomTheme, setIsCustomTheme] = useState(false);
    const [hotelSidebar, setHotelSidebar] = useState("#1F2937");
    const [hotelHeader, setHotelHeader] = useState("#ffffff");
    const [hotelAccent, setHotelAccent] = useState("#C6A75E");

    const [message, setMessage] = useState({ text: "", type: "" });

    // Sync Global Theme when systemSettings updates
    useEffect(() => {
        if (systemSettings) {
            setGlobalSidebar(systemSettings.globalSidebarColor || "#1F2937");
            setGlobalHeader(systemSettings.globalHeaderColor || "#ffffff");
            setGlobalAccent(systemSettings.globalAccentColor || "#C6A75E");
        }
    }, [systemSettings]);

    // Sync Per-Hotel Theme when selected hotel changes
    useEffect(() => {
        if (selectedHotelId) {
            const hotel = hotels.find((h) => h.id === selectedHotelId);
            if (hotel) {
                setIsCustomTheme(hotel.isCustomTheme || false);
                setHotelSidebar(hotel.sidebarColor || globalSidebar);
                setHotelHeader(hotel.headerColor || globalHeader);
                setHotelAccent(hotel.accentColor || globalAccent);
            }
        }
    }, [selectedHotelId, hotels, globalSidebar, globalHeader, globalAccent]);

    // --- Handlers ---
    const handleSaveGlobal = async () => {
        if (!isValidHex(globalSidebar) || !isValidHex(globalHeader) || !isValidHex(globalAccent)) {
            setMessage({ text: "Please provide valid hex codes (e.g., #FFFFFF).", type: "error" });
            return;
        }
        try {
            await updateSystemSettings({
                globalSidebarColor: globalSidebar,
                globalHeaderColor: globalHeader,
                globalAccentColor: globalAccent,
            });
            setMessage({ text: "Global theme saved successfully.", type: "success" });
        } catch (e) {
            setMessage({ text: "Error saving global theme.", type: "error" });
        }
    };

    const handleResetGlobal = () => {
        setGlobalSidebar("#1F2937");
        setGlobalHeader("#ffffff");
        setGlobalAccent("#C6A75E");
    };

    const handleSaveHotel = async () => {
        if (!selectedHotelId) return;
        if (isCustomTheme && (!isValidHex(hotelSidebar) || !isValidHex(hotelHeader) || !isValidHex(hotelAccent))) {
            setMessage({ text: "Please provide valid hex codes for the hotel theme.", type: "error" });
            return;
        }

        try {
            await updateHotel(selectedHotelId, {
                isCustomTheme,
                // Only override if custom theme is checked
                ...(isCustomTheme && {
                    sidebarColor: hotelSidebar,
                    headerColor: hotelHeader,
                    accentColor: hotelAccent,
                }),
            });
            setMessage({ text: "Hotel theme configuration saved successfully.", type: "success" });
        } catch (e) {
            setMessage({ text: "Error saving hotel theme.", type: "error" });
        }
    };

    const handleRemoveHotelTheme = async () => {
        if (!selectedHotelId) return;
        try {
            await updateHotel(selectedHotelId, {
                isCustomTheme: false,
            });
            setIsCustomTheme(false);
            setMessage({ text: "Custom theme removed. Hotel will use global theme.", type: "success" });
        } catch (e) {
            setMessage({ text: "Error removing hotel theme.", type: "error" });
        }
    };

    // Hide message after 3 seconds
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (isLoading && !systemSettings) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold font-serif text-[var(--accent-color)] flex items-center gap-2">
                    <Paintbrush className="w-6 h-6" />
                    Appearance Settings
                </h1>
                <p className="text-sm opacity-70 mt-1">Manage global and per-hotel branding colors.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg flex items-center justify-center font-medium transition-all ${message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {/* SECTION A: GLOBAL THEME */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        System-Wide Global Theme
                    </h2>
                    <p className="text-sm text-gray-500">These settings act as the default fallback for all hotels unless overridden.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ColorPickerField
                        label="Sidebar Background"
                        value={globalSidebar}
                        onChange={setGlobalSidebar}
                    />
                    <ColorPickerField
                        label="Header Background"
                        value={globalHeader}
                        onChange={setGlobalHeader}
                    />
                    <ColorPickerField
                        label="Accent Color"
                        value={globalAccent}
                        onChange={setGlobalAccent}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={handleResetGlobal}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Default
                    </button>
                    <button
                        onClick={handleSaveGlobal}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: "var(--accent-color)", color: "#000" }}
                    >
                        <Save className="w-4 h-4" />
                        Save Global Theme
                    </button>
                </div>
            </div>


            {/* SECTION B: PER HOTEL THEME */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Paintbrush className="w-5 h-5 text-gray-400" />
                        Per-Hotel Custom Theme
                    </h2>
                    <p className="text-sm text-gray-500">Override the global theme for specific hotels.</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 py-2">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium mb-1">Select Hotel</label>
                        <select
                            value={selectedHotelId}
                            onChange={(e) => setSelectedHotelId(e.target.value)}
                            className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                        >
                            {hotels.map((h: any) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-2/3 flex items-center pt-5">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className={`w-12 h-6 rounded-full transition-colors relative ${isCustomTheme ? 'bg-[var(--accent-color)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <input
                                    type="checkbox"
                                    className="opacity-0 absolute w-full h-full cursor-pointer z-10"
                                    checked={isCustomTheme}
                                    onChange={(e) => setIsCustomTheme(e.target.checked)}
                                />
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isCustomTheme ? 'left-7' : 'left-1'}`} />
                            </div>
                            <span className="font-medium text-sm">Enable Custom Theme for This Hotel</span>
                        </label>
                    </div>
                </div>

                {isCustomTheme ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t animate-fade-in">
                        <ColorPickerField
                            label="Hotel Sidebar Color"
                            value={hotelSidebar}
                            onChange={setHotelSidebar}
                        />
                        <ColorPickerField
                            label="Hotel Header Color"
                            value={hotelHeader}
                            onChange={setHotelHeader}
                        />
                        <ColorPickerField
                            label="Hotel Accent Color"
                            value={hotelAccent}
                            onChange={setHotelAccent}
                        />
                    </div>
                ) : (
                    <div className="p-6 text-center text-gray-500 border rounded-lg bg-gray-50 dark:bg-gray-900/50 pt-4 border-t">
                        Currently using the Global Theme fallback. Enable the toggle above to customize.
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={handleRemoveHotelTheme}
                        disabled={!isCustomTheme}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-red-600 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 dark:hover:bg-red-900/20 dark:border-red-900/50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Remove Custom Theme
                    </button>
                    <button
                        onClick={handleSaveHotel}
                        disabled={!isCustomTheme && !hotels.find(h => h.id === selectedHotelId)?.isCustomTheme}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: "var(--accent-color)", color: "#000" }}
                    >
                        <Save className="w-4 h-4" />
                        Save Hotel Theme
                    </button>
                </div>

            </div>

        </div>
    );
}

// --- Color Picker Helper Component ---
function ColorPickerField({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium">{label}</label>
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg shadow-inner border"
                    style={{ backgroundColor: isValidHex(value) ? value : 'transparent' }}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 border rounded-lg p-2 text-sm uppercase font-mono dark:bg-gray-900 dark:border-gray-700"
                    placeholder="#FFFFFF"
                />
                <input
                    type="color"
                    value={isValidHex(value) ? value : "#000000"}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-0 h-0 opacity-0 absolute pointer-events-none"
                    id={`color-picker-${label}`}
                />
                <label
                    htmlFor={`color-picker-${label}`}
                    className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-gray-800"
                    title="Pick Color"
                >
                    <Paintbrush className="w-4 h-4" />
                </label>
            </div>
        </div>
    );
}
