"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-[32px] border border-rose-400/30 bg-slate-950/70 p-8 text-center shadow-[0_40px_140px_-80px_rgba(248,113,113,0.8)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
          <AlertTriangle className="h-8 w-8 text-rose-300" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">Something went off-grid</h1>
        <p className="mt-3 text-sm text-slate-300">
          The workflow hit an unexpected condition. Try refreshing the interface or jump back to the home canvas.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-slate-500">Error ref: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
