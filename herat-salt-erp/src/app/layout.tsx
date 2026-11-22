import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Vazirmatn } from "next/font/google";
import { SwRegistrar } from "@/components/SwRegistrar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Herat Salt Mine ERP — Ghoryan & Kuhsan Operations",
  description:
    "Offline-first Salt Mine Enterprise Resource Planning, Digital Weighbridge (Kanta), Extraction Logs, and MoMP/Customs Compliance for Herat, Afghanistan.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SwRegistrar />
        {children}
      </body>
    </html>
  );
}
