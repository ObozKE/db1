/**
 * ==============================================================================
 * Root Application Layout
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * This is the root layout wrapping all routes in the App Router.
 * It provides the top navigation bar, common HTML envelope, global styles,
 * and a persistent footer explaining the tech stack.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventory Management System | MongoDB & Next.js App Router",
  description:
    "An educational full-stack inventory management app demonstrating MongoDB driver operations, aggregation pipelines, and atomic updates with React Server Components.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full light" style={{ colorScheme: "light" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col bg-slate-50 font-sans text-slate-900 antialiased`}
      >
        <Navbar />
        <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              Built with Next.js App Router &bull; Official MongoDB Node.js Driver &bull; TypeScript &bull; Zod &bull; Tailwind CSS
            </p>
            <p className="font-mono text-[11px] text-slate-400">
              Database: <span className="text-blue-600 font-semibold">inventory_db</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
