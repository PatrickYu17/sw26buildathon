import type { Metadata } from "next";
import { Bagel_Fat_One, Geist_Mono } from "next/font/google";
import { FloatingNav } from "@/app/components/FloatingNav";
import "./globals.css";

const bagelFatOne = Bagel_Fat_One({
  weight: "400",
  variable: "--font-bagel-fat-one",
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
        className={`${bagelFatOne.variable} ${geistMono.variable} antialiased bg-background font-sans`}
      >
        <div className="mx-auto w-full lg:w-[75vw] min-h-screen pb-24 px-6 sm:px-10">
          {children}
        </div>
        <FloatingNav />
      </body>
    </html>
  );
}
