import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth() {
  const { isAuthenticated, hydrated } = useAuth();
  const location = useLocation();
  // Wait until auth state has been loaded from storage to avoid flicker/false redirects
  if (!hydrated) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
