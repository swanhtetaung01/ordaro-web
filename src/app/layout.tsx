import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Myanmar } from "next/font/google";
import { headers } from "next/headers";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const myanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-myanmar",
});

export const metadata: Metadata = {
  title: "TrilloPOS",
  description: "TrilloPOS — sales, stock and money for your shop, by Trillotech",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (await headers()).get("x-next-intl-locale") ?? "en";
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${myanmar.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-surface text-ink">{children}</body>
    </html>
  );
}
