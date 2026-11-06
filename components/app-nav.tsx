"use client";

import { ClipboardList, Home, LogOut, Package, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";

const LINKS = [
  { href: "/", label: "হোম", icon: Home },
  { href: "/purchases", label: "কেনা", icon: Truck },
  { href: "/sales", label: "বিক্রি", icon: ShoppingBag },
  { href: "/preorders", label: "প্রি-অর্ডার", icon: ClipboardList },
  { href: "/products", label: "প্রোডাক্ট", icon: Package },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logout} className={className}>
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted hover:bg-paper hover:text-ink"
      >
        <LogOut size={18} aria-hidden />
        লগআউট
      </button>
    </form>
  );
}

export function SideNav() {
  const isActive = useIsActive();
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-card p-4 lg:flex">
      <p className="px-3 py-2 text-lg font-bold text-pitch">জ্যাকেট হিসাব</p>
      <nav className="mt-3 space-y-1">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
              isActive(href) ? "bg-pitch-soft text-pitch-dark" : "text-muted hover:bg-paper hover:text-ink"
            }`}
          >
            <Icon size={18} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <LogoutButton className="mt-auto" />
    </aside>
  );
}

export function BottomNav() {
  const isActive = useIsActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            isActive(href) ? "text-pitch" : "text-muted"
          }`}
        >
          <Icon size={20} aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
