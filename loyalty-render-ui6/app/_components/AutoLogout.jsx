"use client";
import { useEffect } from "react";
import { startAutoLogout, clearAuth, stopAutoLogout, getAuth } from "../_lib/auth-client";

export default function AutoLogout() {
  useEffect(() => {
    const auth = getAuth();
    if (!auth) return;
    startAutoLogout({
      onLogout: () => { stopAutoLogout(); clearAuth(); location.href = "/login?reason=inactive"; }
    });
    return () => stopAutoLogout();
  }, []);
  return null;
}
