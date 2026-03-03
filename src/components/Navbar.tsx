import Link from "next/link";
import { FileText } from "lucide-react";

const links = [
  { href: "/pdf-to-image", label: "PDF to Image" },
  { href: "/image-to-pdf", label: "Image to PDF" },
  { href: "/pdf-compress", label: "Compress PDF" },
  { href: "/image-compress", label: "Compress Image" },
  { href: "/merge-pdf", label: "Merge PDF" },
  { href: "/pdf-to-word", label: "PDF to Word" },
  { href: "/pdf-to-powerpoint", label: "PDF to PowerPoint" },
  { href: "/word-to-pdf", label: "Word to PDF" },
  { href: "/powerpoint-to-pdf", label: "PowerPoint to PDF" },
  { href: "/pdf-split", label: "Split PDF" },
  { href: "/pdf-rotate", label: "Rotate PDF" },
  { href: "/pdf-watermark", label: "Add Watermark" },
  { href: "/pdf-protect", label: "Protect PDF" },
  { href: "/pdf-unlock", label: "Unlock PDF" },
  { href: "/ocr", label: "OCR" },
  { href: "/batch-processing", label: "Batch" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white tracking-tight">PDF Atelier</p>
              <p className="text-xs text-slate-400">Convert · Edit · Automate</p>
            </div>
          </Link>

          <div className="hidden lg:flex flex-wrap items-center justify-end gap-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-2 font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
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
                  className="whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium text-slate-200 bg-white/5 border border-white/10"
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
