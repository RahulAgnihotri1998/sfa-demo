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
  title: "Master Baker — Manager & Customer Portal",
  description: "Master Baker Enterprise Manager & Customer Portal",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#2952e3" />
      </head>
      <body className="antialiased font-sans">
        <ChunkErrorBoundary>
          <Suspense>{children}</Suspense>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}
