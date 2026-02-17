import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DemoModeIndicator } from "@/components/DemoModeIndicator";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momentum",
  description: "AI agent that turns conversations into execution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans min-h-screen">
        {children}
        <DemoModeIndicator />
      </body>
    </html>
  );
}
