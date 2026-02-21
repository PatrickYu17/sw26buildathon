import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingNav } from "@/app/components/FloatingNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relationship ORM",
  description: "Your personal relationship companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background font-sans`}
      >
        <div className="mx-auto w-full max-w-[1080px] min-h-screen pb-24 px-6 sm:px-10 bg-white rounded-none sm:rounded-3xl sm:my-4 sm:min-h-[calc(100vh-2rem)] border-x sm:border border-border">
          {children}
        </div>
        <FloatingNav />
      </body>
    </html>
  );
}
