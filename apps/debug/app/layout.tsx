import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debug Suite",
  description: "Standalone UI for testing backend auth and AI routes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
