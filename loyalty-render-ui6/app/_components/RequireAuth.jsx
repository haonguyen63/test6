"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, hasRole } from "../_lib/auth-client";

export default function RequireAuth({ allowRoles, children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    setReady(true);
    if (!auth) { router.replace("/login"); return; }
    const role = auth.user?.role || auth.role;
    if (!hasRole(allowRoles, role)) { router.replace("/"); return; }
    setOk(true);
  }, [router, allowRoles]);

  if (!ready) return null;
  return ok ? children : null;
}
