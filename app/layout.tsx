import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import ReferralTracker from "../components/ReferralTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "사수자패트 (SasujaFate) - 무료 온라인 사주 운명 진단",
  description: "복잡한 미신을 걷어낸 정확한 사주 분석 솔루션 사수자패트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <ReferralTracker />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

