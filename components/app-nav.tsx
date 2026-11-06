"use client";

import { ClipboardList, Home, LogOut, Package, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import { LanguageToggle, useT } from "./i18n";

const LINKS = [
  { href: "/", key: "home", icon: Home },
  { href: "/purchases", key: "purchases", icon: Truck },
  { href: "/sales", key: "sales", icon: ShoppingBag },
  { href: "/preorders", key: "preorders", icon: ClipboardList },
  { href: "/products", key: "products", icon: Package },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <form action={logout} className={className}>
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted hover:bg-paper hover:text-ink"
      >
        <LogOut size={18} aria-hidden />
        {t.nav.logout}
      </button>
    </form>
  );
}

export function SideNav() {
  const isActive = useIsActive();
  const t = useT();
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-card p-4 lg:flex">
      <p className="px-3 py-2 text-lg font-bold text-pitch">{t.appName}</p>
      <nav className="mt-3 space-y-1">
        {LINKS.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
              isActive(href) ? "bg-pitch-soft text-pitch-dark" : "text-muted hover:bg-paper hover:text-ink"
            }`}
          >
            <Icon size={18} aria-hidden />
            {t.nav[key]}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <LanguageToggle className="w-full" />
        <LogoutButton />
      </div>
    </aside>
  );
}

export function BottomNav() {
  const isActive = useIsActive();
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      {LINKS.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            isActive(href) ? "text-pitch" : "text-muted"
          }`}
        >
          <Icon size={20} aria-hidden />
          {t.nav[key]}
        </Link>
      ))}
    </nav>
  );
}
