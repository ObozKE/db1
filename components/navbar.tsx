/**
 * ==============================================================================
 * Navigation Bar Component
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * WHY A SERVER COMPONENT:
 * The navbar is static and declarative; it contains navigational links and brand
 * elements without requiring client-side React hooks (like useState or useEffect).
 * Rendering it on the server reduces JavaScript bundle size sent to the browser.
 */

import Link from "next/link";
import { Boxes, LayoutDashboard, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base tracking-tight font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MongoInventory
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                v1.0 (MongoDB Driver)
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Boxes className="h-4 w-4" />
              <span>Inventory List</span>
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/products/new">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>New Product</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
