import Link from "next/link";
import { FileText } from "lucide-react";

const links = [
  { href: "/pdf-to-image", label: "PDF to Image" },
  { href: "/image-to-pdf", label: "Image to PDF" },
  { href: "/pdf-compress", label: "Compress PDF" },
  { href: "/image-compress", label: "Compress Image" },
  { href: "/merge-pdf", label: "Merge PDF" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-base font-semibold text-white tracking-tight">PDF Atelier</p>
                <p className="text-xs text-slate-400">Convert · Compress · Merge</p>
              </div>
            </Link>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-200 px-3 py-2 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
