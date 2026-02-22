import type { Metadata } from "next";
import { FloatingNav } from "@/app/components/FloatingNav";
import "./globals.css";

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
      <body className="antialiased bg-background font-sans">
        <div className="mx-auto w-full lg:w-[75vw] min-h-screen pb-24 px-6 sm:px-10">
          {children}
        </div>
        <FloatingNav />
      </body>
    </html>
  );
}
