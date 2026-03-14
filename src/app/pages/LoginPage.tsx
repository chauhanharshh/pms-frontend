import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Hotel, KeyRound, Lock, User, Loader2 } from "lucide-react";
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
    <div className="h-full bg-gradient-to-br from-[#f8f5ef] via-white to-[#f3efe6] flex flex-col items-center justify-center p-4 pt-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <img
              src={displayLogoUrl}
              alt="Hotel Logo"
              className="w-32 object-contain"
              onError={handleLogoImageError}
            />
          </div>

          <h1
            className="mt-2 text-4xl"
            style={{
              fontFamily: "Times New Roman, serif",
              color: "#C6A75E",
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
            }}
          >
            Property Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#e5e7eb]">
          <h2
            className="text-2xl mb-6 text-center"
            style={{
              fontFamily: "Times New Roman, serif",
              color: "#A8832D",
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
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg 
                focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 
                outline-none transition"
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
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg 
                focus:border-[#C6A75E] focus:ring-2 focus:ring-[#C6A75E]/30 
                outline-none transition"
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
                background: "linear-gradient(135deg, #C6A75E, #A8832D)",
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

        {/* Credentials */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800">Login Credentials</h3>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Super Admin:</span>
              <code className="font-mono text-[#A8832D]">superadmin / superadmin123</code>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>System Admin:</span>
              <code className="font-mono text-[#A8832D]">admin / admin123</code>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Hotel Manager:</span>
              <code className="font-mono text-[#A8832D]">
                manager / manager123
              </code>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Front Desk:</span>
              <code className="font-mono text-[#A8832D]">
                frontdesk / user123
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
