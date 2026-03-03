import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto bg-slate-950/80 border-t border-white/10">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 text-center text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} PDF Atelier. Crafted with secure client-side processing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline-block text-slate-600">/</span>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
