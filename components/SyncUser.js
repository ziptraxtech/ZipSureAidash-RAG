"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function SyncUser() {
  const { isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    // Only sync once per user (persists across sessions)
    const key = `neon_synced_${userId}`;
    if (localStorage.getItem(key)) return;

    fetch("/api/user/sync", { method: "POST" })
      .then(r => { if (r.ok) localStorage.setItem(key, "1"); })
      .catch(() => {});
  }, [isSignedIn, userId]);

  return null;
}
