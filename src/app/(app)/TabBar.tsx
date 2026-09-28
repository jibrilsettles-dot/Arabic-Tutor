"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, ProgressIcon, SettingsIcon } from "@/components/icons";

const TABS = [
  { href: "/chat", label: "Tutor", icon: ChatIcon },
  { href: "/progress", label: "Progress", icon: ProgressIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe shrink-0 border-t border-line bg-surface/90 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 pb-2 pt-2.5 text-[0.7rem] font-semibold transition ${
                  active ? "text-primary" : "text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                    active ? "bg-primary-soft" : ""
                  }`}
                >
                  <Icon size={21} strokeWidth={active ? 2.1 : 1.8} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
