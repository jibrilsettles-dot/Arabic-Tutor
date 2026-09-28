"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserContinueAllowed, isStandalone } from "@/lib/install";
import { Logo } from "./Logo";

/**
 * The app is meant to be used installed. Anyone reaching an in-app page from
 * a plain browser tab is sent back to the install screen first.
 */
export function InstallGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = isStandalone() || browserContinueAllowed();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state after mount
    setAllowed(ok);
    if (!ok) router.replace("/");
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Logo size={56} className="animate-pulse" />
      </div>
    );
  }
  return <>{children}</>;
}
