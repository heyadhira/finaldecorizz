import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setSuccess(true);
      setResetToken(data.resetToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------
  // SUCCESS SCREEN
  // ----------------------------------------------

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center">

            {/* SUCCESS ICON */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Check Your Email
            </h2>

            <p className="text-gray-600 mb-6">
              A password reset link has been sent to <strong>{email}</strong>
            </p>

            {/* DEMO RESET LINK */}
            {/* {resetToken && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 mb-2 font-medium">
                  Demo Mode:
                </p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="text-[var(--primary)] hover:underline break-all font-medium"
                >
                  Reset Password Link
                </Link>
              </div>
            )} */}

            {/* BACK TO LOGIN */}
            <Link
              to="/login"
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              Back to Login
            </Link>

          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------
  // FORM SCREEN
  // ----------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200">

        {/* LOGO + TITLE */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
            Forgot Password?
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your email to receive a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* INPUT */}
          <div>
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 
                focus:ring-[var(--primary)] focus:outline-none transition"
              style={{ color: 'var(--text-main)' }}
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition disabled:opacity-50"
            style={{ backgroundColor: loading ? "#9ca3af" : "var(--primary)" }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {/* BACK TO LOGIN */}
          <div className="text-center mt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
