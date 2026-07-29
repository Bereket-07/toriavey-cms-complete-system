import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/* Stage colours from the approved category system — used as a quiet
   signature strip so the sign-in screen reads as this product. */
const STAGES = [
  { label: "New", color: "#94A3B8" },
  { label: "Generated", color: "#7C3AED" },
  { label: "Ready", color: "#F59E0B" },
  { label: "Posted", color: "#16A34A" },
];

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

  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get("error");
  let errorMsg: string | null = null;
  if (errorCode) {
    errorMsg = "Something went wrong signing in. Try again.";
    if (errorCode === "unauthorized_email")
      errorMsg =
        "This Google account isn't on the access list. Ask an admin to add it.";
    if (errorCode === "auth_failed")
      errorMsg = "Google sign-in didn't complete. Try again.";
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-lg)] md:grid md:grid-cols-[1.05fr_1fr]">
        {/* ---------- Brand panel (signature plum) ---------- */}
        <div
          className="relative overflow-hidden p-8 sm:p-10 md:p-12 flex flex-col justify-between"
          style={{ background: "#7C3AED" }}
        >
          {/* ambient rings */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/15"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-24 h-56 w-56 rounded-full border border-white/10"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 font-display text-base font-semibold text-white ring-1 ring-white/25">
                TA
              </span>
              <span className="leading-tight">
                <span className="block font-display text-lg font-semibold text-white">
                  Tori Avey
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  Content Studio
                </span>
              </span>
            </div>

            <h1 className="mt-10 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Recipes in.
              <br />
              Posts out.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">
              Generate captions, approve them, publish to every channel, and
              turn videos into clips — from one place.
            </p>
          </div>

          {/* pipeline strip — the colour language of the app */}
          <div className="relative z-10 mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
              Content pipeline
            </p>
            <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              {STAGES.map((s) => (
                <span
                  key={s.label}
                  className="h-full flex-1"
                  style={{ background: s.color }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {STAGES.map((s) => (
                <span
                  key={s.label}
                  className="flex items-center gap-1.5 text-xs text-white/80"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- Sign-in panel ---------- */}
        <div className="flex flex-col justify-center p-8 sm:p-10 md:p-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your approved Google account to continue.
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/8 px-4 py-3 text-sm font-medium text-[#B91C1C]"
            >
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground shadow-[var(--shadow-sm)] transition-all hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/[0.04] hover:shadow-[var(--shadow-md)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt=""
              className="h-5 w-5"
            />
            {loading ? "Opening Google…" : "Continue with Google"}
          </button>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Access is limited to approved team accounts. If your account is
            turned away, ask an admin to add it to the access list.
          </p>

          <div className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Tori Avey. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
