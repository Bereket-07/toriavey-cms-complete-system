import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, hydrated } = useAuth();

  // If already authenticated (persisted from previous session), skip login screen
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      navigate("/cms/dashboard", { replace: true });
    }
  }, [hydrated, isAuthenticated, navigate]);

  // Google OAuth login handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    // Directly hit the backend login endpoint which will redirect to Google
    const backend =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    window.location.href = `${backend}/auth/login`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream to-cream-dark">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border border-border p-10 flex flex-col items-center">
        {/* Logo or Brand Icon */}
        <div className="mb-6 flex items-center justify-center w-32 h-16 bg-[#e9ecef]">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWbcdlPhqd2hCcUi3QmH7IqfbjANs5yaF8bw&s"
            alt="Tori Avey Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">
          Tori Avey's Unified Dashboard
        </h1>
        <p className="text-muted-foreground mb-8 text-sm text-center">
          Sign in to access analytics, content, and insights in one place
        </p>

        {/* Error Message Display */}
        {(() => {
          const params = new URLSearchParams(window.location.search);
          const error = params.get("error");
          if (error) {
            let msg = "An error occurred during login.";
            if (error === "unauthorized_email")
              msg = "Access Denied: Your email is not authorized.";
            if (error === "auth_failed")
              msg = "Authentication failed. Please try again.";
            return (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded w-full text-center">
                {msg}
              </div>
            );
          }
          return null;
        })()}

        {/* Google OAuth Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow hover:bg-gray-50 transition mb-4"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            className="w-5 h-5 mr-2"
          />
          {loading ? "Redirecting..." : "Sign in with Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center w-full my-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Username/Password (optional, visually de-emphasized) */}
        <form
          className="w-full space-y-5 opacity-60 pointer-events-none"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              disabled
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 transition"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              disabled
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-md transition text-base"
            disabled
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Tori Avey. All rights reserved.
        </div>
      </div>
    </div>
  );
}
