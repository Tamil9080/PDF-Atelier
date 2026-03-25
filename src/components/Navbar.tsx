"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const links = [
  { href: "/pdf-to-image", label: "PDF to Image" },
  { href: "/image-to-pdf", label: "Image to PDF" },
  { href: "/pdf-compress", label: "Compress PDF" },
  { href: "/image-compress", label: "Compress Image" },
  { href: "/merge-pdf", label: "Merge PDF" },
  { href: "/pdf-split", label: "Split PDF" },
  { href: "/pdf-rotate", label: "Rotate PDF" },
  { href: "/pdf-watermark", label: "Add Watermark" },
  { href: "/pdf-protect", label: "Protect PDF" },
  { href: "/pdf-unlock", label: "Unlock PDF" },
  { href: "/batch-processing", label: "Batch" },
];

export function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    return window.localStorage.getItem("theme") === "light" ? "light" : "dark";
  });

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
    window.localStorage.setItem("theme", nextTheme);
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b transition-colors",
        theme === "light" ? "bg-white/80 border-slate-300/60" : "bg-slate-950/80 border-white/10"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className={cn("text-lg font-semibold tracking-tight", theme === "light" ? "text-slate-900" : "text-white")}>
                PDF Atelier
              </p>
              <p className={cn("text-xs", theme === "light" ? "text-slate-600" : "text-slate-400")}>
                Convert · Edit · Automate
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold border transition",
              theme === "light"
                ? "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                : "bg-white/5 text-slate-100 border-white/15 hover:bg-white/10"
            )}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          <div className="hidden lg:flex flex-wrap items-center justify-end gap-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-2xl px-4 py-2 font-medium transition",
                  isActive(link.href)
                    ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/60"
                    : theme === "light"
                      ? "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="lg:hidden w-full overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex min-w-max gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium border transition",
                    isActive(link.href)
                      ? "bg-cyan-400/20 text-cyan-100 border-cyan-300/60"
                      : theme === "light"
                        ? "text-slate-700 bg-slate-100 border-slate-300"
                        : "text-slate-200 bg-white/5 border-white/10"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
