import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SFA Portal — Enterprise Sales Management",
  description: "Enterprise Sales Force Automation & Management Portal",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#2952e3" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ChunkErrorBoundary>
          <Suspense>{children}</Suspense>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}
