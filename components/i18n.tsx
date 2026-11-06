"use client";

import { Languages } from "lucide-react";
import { createContext, useContext, useTransition, type ReactNode } from "react";
import { setLanguage } from "@/lib/actions";
import { messages, type Lang } from "@/lib/i18n/messages";

const LangContext = createContext<Lang>("bn");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useT() {
  return messages[useContext(LangContext)];
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const lang = useContext(LangContext);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      lang={lang === "bn" ? "en" : "bn"}
      onClick={() =>
        start(async () => {
          await setLanguage(lang === "bn" ? "en" : "bn");
          // The language sits on <html> and in every layout, so load the page afresh.
          window.location.reload();
        })
      }
      className={`inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted hover:bg-paper hover:text-ink disabled:opacity-50 ${className}`}
    >
      <Languages size={18} aria-hidden />
      {messages[lang].switchTo}
    </button>
  );
}
