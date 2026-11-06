import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const bengali = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
});

export const metadata: Metadata = {
  title: "জ্যাকেট হিসাব",
  description: "জ্যাকেটের কেনা, বিক্রি, বাকি ও প্রি-অর্ডারের হিসাব",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0F5C45",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className={bengali.variable}>
      <body>{children}</body>
    </html>
  );
}
