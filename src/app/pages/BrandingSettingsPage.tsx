import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { DEFAULT_BRAND_NAME, handleLogoImageError, resolveBrandName, resolveLogoUrl } from "../utils/branding";
import { Image, Loader2, Save, Upload } from "lucide-react";

interface BrandingData {
  id: string;
  name: string;
  brandName?: string | null;
  logoUrl?: string | null;
}

export function BrandingSettingsPage() {
  const { user, currentHotelId } = useAuth();
  const { hotels, refreshAll } = usePMS();
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedHotelId = useMemo(() => currentHotelId || user?.hotelId || "", [currentHotelId, user?.hotelId]);
  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);

  const fetchBranding = async () => {
    setLoading(true);
    setError("");
    try {
      const params = selectedHotelId ? { hotelId: selectedHotelId } : undefined;
      const res = await api.get("/hotels/branding", { params });
      const data = res.data?.data as BrandingData;
      setBranding(data);
      setBrandName(data?.brandName || "");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load branding settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchBranding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotelId, user?.id]);

  const handleSaveBrandName = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const params = selectedHotelId ? { hotelId: selectedHotelId } : undefined;
      const res = await api.put("/hotels/branding", { brandName: brandName || null }, { params });
      setBranding(res.data?.data || null);
      setMessage("Brand name updated successfully.");
      await refreshAll(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update brand name");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (file?: File | null) => {
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError("Invalid file type. Only PNG, JPG, and WEBP are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const params = selectedHotelId ? { hotelId: selectedHotelId } : undefined;
      const res = await api.post("/hotels/branding/logo", formData, {
        params,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBranding(res.data?.data || null);
      setMessage("Logo uploaded successfully.");
      await refreshAll(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Settings - Branding" requiredRole="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#C6A75E]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings - Branding" requiredRole="admin">
      <div className="max-w-3xl space-y-6">
        <div className="rounded-2xl p-6 bg-white border border-[#E5E1DA] shadow-sm space-y-5">
          <div>
            <h2 className="text-xl" style={{ color: "#7a5c00", fontFamily: "Times New Roman, serif" }}>
              Branding
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure your hotel logo and application title.
            </p>
          </div>

          {selectedHotel && (
            <div className="text-sm text-gray-600">
              Active Hotel: <span className="font-semibold text-gray-800">{selectedHotel.name}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Hotel Name / Brand Name</label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={DEFAULT_BRAND_NAME}
                className="w-full rounded-lg border border-[#E5E1DA] px-3 py-2 outline-none focus:border-[#C6A75E]"
              />
              <button
                onClick={handleSaveBrandName}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #C6A75E, #A8832D)" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Brand Name
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Logo Upload (PNG/JPG/WEBP, max 2MB)</label>
              <div className="w-32 h-32 rounded-xl border border-[#E5E1DA] bg-[#FAF7F2] flex items-center justify-center overflow-hidden">
                <img
                  src={resolveLogoUrl(branding?.logoUrl)}
                  alt="Brand Logo"
                  className="w-full h-full object-contain"
                  onError={handleLogoImageError}
                />
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E1DA] cursor-pointer hover:bg-[#f9f7f3] text-sm">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Logo
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleUploadLogo(e.target.files?.[0] || null)}
                />
              </label>
              <p className="text-xs text-gray-500">Recommended size: 512x512</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E1DA] bg-[#FAF7F2] p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Image className="w-4 h-4" /> Live Preview
            </div>
            <div className="flex items-center gap-3">
              <img
                src={resolveLogoUrl(branding?.logoUrl)}
                alt="Logo Preview"
                className="w-12 h-12 object-contain"
                onError={handleLogoImageError}
              />
              <div className="font-semibold" style={{ color: "#7a5c00" }}>{resolveBrandName({ brandName: brandName || branding?.brandName })}</div>
            </div>
          </div>

          {message && <div className="text-sm px-3 py-2 rounded bg-green-50 border border-green-200 text-green-700">{message}</div>}
          {error && <div className="text-sm px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        </div>
      </div>
    </AppLayout>
  );
}
