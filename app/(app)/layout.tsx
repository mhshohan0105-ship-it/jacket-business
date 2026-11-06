import type { ReactNode } from "react";
import { BottomNav, LogoutButton, SideNav } from "@/components/app-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">
        {children}
        {/* The phone tab bar has no room for this, so it sits at the end of the page. */}
        <LogoutButton className="mt-6 flex justify-center lg:hidden" />
      </main>
      <BottomNav />
    </div>
  );
}
