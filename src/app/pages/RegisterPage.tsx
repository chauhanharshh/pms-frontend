import { useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import api from "../services/api";

export function RegisterPage(): null {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await api.post("/auth/register", {
        fullName,
        email,
        username,
        password,
        hotelName,
      });
      setMessage("Account created successfully. Your account is pending super admin approval.");
      setFullName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setHotelName("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* HIDDEN - Next patch update
  return (
    <div className="h-full flex flex-col items-center justify-center p-4" style={{ background: "#f5f0e8", paddingTop: "38px" }}>
      <div className="w-full" style={{ maxWidth: "420px" }}>
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
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full outline-none transition"
                style={{
                  height: "44px",
                  border: "1px solid #e0d9cc",
                  borderRadius: "8px",
                  padding: "0 12px",
                  background: "#ffffff",
                  fontSize: "0.95rem",
                }}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full outline-none transition"
                style={{
                  height: "44px",
                  border: "1px solid #e0d9cc",
                  borderRadius: "8px",
                  padding: "0 12px",
                  background: "#ffffff",
                  fontSize: "0.95rem",
                }}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full outline-none transition"
                style={{
                  height: "44px",
                  border: "1px solid #e0d9cc",
                  borderRadius: "8px",
                  padding: "0 12px",
                  background: "#ffffff",
                  fontSize: "0.95rem",
                }}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full outline-none transition"
                style={{
                  height: "44px",
                  border: "1px solid #e0d9cc",
                  borderRadius: "8px",
                  padding: "0 12px",
                  background: "#ffffff",
                  fontSize: "0.95rem",
                }}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Hotel Name</label>
              <input
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full outline-none transition"
                style={{
                  height: "44px",
                  border: "1px solid #e0d9cc",
                  borderRadius: "8px",
                  padding: "0 12px",
                  background: "#ffffff",
                  fontSize: "0.95rem",
                }}
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-medium text-white transition duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #c5a148, #b8963e)",
                height: "46px",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-gray-500 text-sm">Already have account? </span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-[#B8860B] font-semibold text-sm hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  */

  return null;
}
