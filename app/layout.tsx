import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import type { ReactNode } from "react";
import { LangProvider } from "@/components/i18n";
import { getLang, getT } from "@/lib/i18n/server";
import "./globals.css";

const bengali = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.appName,
    description: t.appDescription,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0F5C45",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={bengali.variable}>
      <body>
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
