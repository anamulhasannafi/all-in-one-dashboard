"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "@/components/icons";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-rosewood-200 px-4 text-sm font-semibold hover:bg-rosewood-50 disabled:opacity-50"
    >
      <LogOut size={16} aria-hidden /> Sign out
    </button>
  );
}
