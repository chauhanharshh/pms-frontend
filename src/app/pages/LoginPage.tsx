import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Hotel, Lock, User, Loader2 } from "lucide-react";
import { DEFAULT_BRAND_NAME, handleLogoImageError, resolveBrandName, resolveLogoUrl } from "../utils/branding";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayBrandName, setDisplayBrandName] = useState(DEFAULT_BRAND_NAME);
  const [displayLogoUrl, setDisplayLogoUrl] = useState(resolveLogoUrl(null));
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setDisplayBrandName(DEFAULT_BRAND_NAME);
      setDisplayLogoUrl(resolveLogoUrl(null));
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await api.get("/auth/branding", { params: { username: trimmed } });
        const branding = res.data?.data;
        setDisplayBrandName(resolveBrandName({ brandName: branding?.brandName }));
        setDisplayLogoUrl(resolveLogoUrl(branding?.logoUrl));
      } catch {
        setDisplayBrandName(DEFAULT_BRAND_NAME);
        setDisplayLogoUrl(resolveLogoUrl(null));
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [username]);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "super_admin") {
        navigate("/superadmin");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        // hotel_manager, hotel_user → hotel dashboard
        navigate("/hotel");
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(username, password);
      // navigation handled by useEffect above
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid credentials. Please try again.";
      setError(msg);
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
    <div className="h-full flex flex-col items-center justify-center p-4" style={{ background: "#f5f0e8", paddingTop: "38px" }}>
      <div className="w-full" style={{ maxWidth: "420px" }}>
        {/* Logo and Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center" style={{ marginTop: 0 }}>
            <img
              src={displayLogoUrl}
              alt="Hotel Logo"
              className="object-contain"
              style={{ width: "90px", display: "block", margin: "0 auto", marginTop: 0 }}
              onError={handleLogoImageError}
            />
          </div>

          <h1
            className="mt-2"
            style={{
              fontFamily: "Times New Roman, serif",
              color: "#b8963e",
              fontSize: "2.2rem",
              lineHeight: 1.15,
            }}
          >
            {displayBrandName}
          </h1>

          <p
            className="mt-1 text-sm"
            style={{
              fontFamily: "Georgia, serif",
              color: "#334155",
              letterSpacing: "0.5px",
              fontSize: "0.9rem",
            }}
          >
            Property Management System
          </p>
        </div>

        {/* Login Card */}
        <div
          className="bg-white border border-[#e8e2d8]"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "32px 40px",
          }}
        >
          <h2
            className="text-2xl mb-6 text-center"
            style={{
              fontFamily: "Times New Roman, serif",
              color: "#b8963e",
            }}
          >
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full outline-none transition"
                  style={{
                    height: "48px",
                    border: "1px solid #e0d9cc",
                    borderRadius: "8px",
                    padding: "0 16px 0 44px",
                    background: "#ffffff",
                    fontSize: "0.95rem",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#b8963e";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,150,62,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e0d9cc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Enter username"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full outline-none transition"
                  style={{
                    height: "48px",
                    border: "1px solid #e0d9cc",
                    borderRadius: "8px",
                    padding: "0 16px 0 44px",
                    background: "#ffffff",
                    fontSize: "0.95rem",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#b8963e";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(184,150,62,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e0d9cc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Enter password"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-medium text-white transition duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #c5a148, #b8963e)",
                height: "48px",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '1rem', color: '#9CA3AF', fontFamily: 'Times New Roman, serif', fontWeight: 'bold' }}>
          Developed by{' '}          <a 
            href="https://www.avaialable.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#080808', textDecoration: 'none' }}
            title="Avaialable.com - Website | Webapp | Android app"
          >
            Avaialable.com
          </a>
        </div>
      </div>
    </div>
  );
}
