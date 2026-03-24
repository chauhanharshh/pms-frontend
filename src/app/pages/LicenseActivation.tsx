import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import api from "../services/api";
import { handleLogoImageError, resolveBrandName, resolveLogoUrl } from "../utils/branding";

const getDefaultRouteForRole = (role: string) => {
  if (role === "super_admin" || role === "superadmin") return "/superadmin";
  if (role === "admin") return "/admin/dashboard";
  if (role === "restaurant_staff") return "/hotel/restaurant/rooms";
  return "/hotel/dashboard";
};

export function LicenseActivation() {
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  const { hotels } = usePMS();
  const navigate = useNavigate();
  const LICENSE_GATE_FLAG = "pms_license_gate_ready";

  const activeHotel = useMemo(() => {
    if (!user) return null;
    return hotels.find(h => h.id === user.hotelId || h.id === (user as any).hotel?.id) || null;
  }, [hotels, user]);

  const brandName = resolveBrandName(activeHotel);
  const logoUrl = resolveLogoUrl(activeHotel?.logoUrl);

  const normalizedKey = useMemo(() => licenseKey.trim().toUpperCase(), [licenseKey]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const isLicenseGatedRole = user.role === "admin";
    if (!isLicenseGatedRole) {
      navigate(getDefaultRouteForRole(user.role), { replace: true });
      return;
    }

    const licenseAlreadySaved = localStorage.getItem(`license_${user.id}`);
    if (licenseAlreadySaved) {
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    }
  }, [loading, navigate, user]);

  const handleActivate = async () => {
    if (!user) return;

    if (!normalizedKey) {
      setError("Please enter license key");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/license/activate", {
        licenseKey: normalizedKey,
      });

      const success = res.data?.data?.success === true || res.data?.success === true;
      if (!success) {
        setError("Invalid license key");
        return;
      }

      // Save against ADMIN ID (from response)
      const adminId = res.data?.data?.adminId || res.data?.adminId;
      if (adminId) {
        localStorage.setItem(`license_${adminId}`, normalizedKey);
      }

      // Also save against current user id as backup:
      localStorage.setItem(`license_${user.id}`, normalizedKey);
      
      sessionStorage.removeItem(LICENSE_GATE_FLAG);
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "";
      if (msg.includes("no_license") || msg.toLowerCase().includes("not activated")) {
        setError(`License is not activated. Please contact ${brandName} support.`);
      } else {
        setError(msg || "Invalid license key");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C6A75E]" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f0e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Calibri, sans-serif",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "48px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          display: "flex", // added for flex-start alignment
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => {
            localStorage.removeItem("token"); // user requested
            localStorage.removeItem("user");  // user requested
            localStorage.removeItem("pms_token");
            localStorage.removeItem("pms_user");
            localStorage.removeItem("pms_hotel_ctx");
            window.location.href = "/login";
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "none",
            border: "none",
            color: "#B8860B",
            fontSize: "13px",
            cursor: "pointer",
            padding: "0",
            marginBottom: "20px",
            alignSelf: "flex-start",
          }}
        >
          ← Back to Login
        </button>

        <img
          src={logoUrl}
          alt={brandName}
          style={{ width: "100px", height: "100px", objectFit: "contain", marginBottom: "16px" }}
          onError={handleLogoImageError}
        />

        <h2 style={{ color: "#B8860B", fontSize: "22px", marginBottom: "8px" }}>
          Activate Your License
        </h2>
        <p style={{ color: "#888", fontSize: "14px", marginBottom: "28px" }}>
          Enter the license key provided by {brandName}
        </p>

        <input
          type="text"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
          placeholder="HTLS-XXXX-XXXX-XXXX-XXXX"
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid #D4B896",
            borderRadius: "8px",
            fontSize: "15px",
            textAlign: "center",
            letterSpacing: "2px",
            marginBottom: "12px",
            boxSizing: "border-box",
            outline: "none",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleActivate()}
          disabled={isSubmitting}
        />

        {error && (
          <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleActivate}
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "14px",
            background: "#B8860B",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Validating..." : "Activate Software"}
        </button>

        <p style={{ color: "#aaa", fontSize: "12px", marginTop: "20px" }}>
          Contact support if you do not have a license key
        </p>
      </div>
    </div>
  );
}
