import type { Metadata } from "next";
import Link from "next/link";

const dataPractices = [
  {
    title: "Local-first processing",
    detail: "Uploads never leave your browser sandbox; every conversion happens in-memory using WebAssembly workers.",
  },
  {
    title: "Ephemeral sessions",
    detail: "Temporary blobs are cleared when you close the tab or hit the reset button, ensuring no long-term storage.",
  },
  {
    title: "No analytics beacons",
    detail: "We skip ad pixels and fingerprinting scripts. Basic traffic metrics are aggregated without personal identifiers.",
  },
];

const contactPoints = [
  {
    label: "Email",
    value: "hello@pdfatelier.in",
    href: "mailto:hello@pdfatelier.in",
  },
  {
    label: "Support desk",
    value: "Status & Support",
    href: "/contact",
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy | PDF Atelier",
  description: "Understand how PDF Atelier keeps every document private and secured on-device.",
};

export default function PrivacyPage() {
  return (
    <section className="space-y-10">
      <header className="rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-[0_30px_120px_-80px_rgba(14,165,233,0.8)]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Privacy</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-300 max-w-3xl">
          We built PDF Atelier for privacy-critical teams. This page explains exactly what data touches our systems,
          how we safeguard it, and the rights you have as a user of the platform.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {dataPractices.map((practice) => (
          <article
            key={practice.title}
            className="rounded-3xl border border-white/10 bg-slate-900/60 p-6"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Commitment</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{practice.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{practice.detail}</p>
          </article>
        ))}
      </div>

      <div className="space-y-6 rounded-[28px] border border-white/10 bg-slate-900/60 p-8">
        <h2 className="text-2xl font-semibold text-white">What we collect</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-100">Information stored locally</p>
            <p className="mt-2 text-sm text-slate-300">
              Processing happens with browser APIs, so raw documents, previews, cache layers, and encryption keys stay on your
              device. You may clear them at any time by refreshing the page.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Telemetry</p>
            <p className="mt-2 text-sm text-slate-300">
              We only log high-level performance timings (tool used, duration bucket, success/failure) with no file names or
              personal identifiers. Logs rotate every 30 days.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <h2 className="text-2xl font-semibold text-white">Your controls</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li>• Export or delete local caches directly inside each tool.</li>
          <li>• Revoke previous passwords or watermarks through the batch dashboard.</li>
          <li>• Contact us for data questions; we respond within two business days.</li>
        </ul>
      </div>

      <footer className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-white">Need an audit log or DPA?</p>
          <p>Reach out and we will provision region-specific builds for enterprise teams.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {contactPoints.map((point) => (
            <div key={point.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{point.label}</p>
              {point.href ? (
                point.href.startsWith("mailto:") ? (
                  <a
                    href={point.href}
                    className="text-sm font-semibold text-white underline-offset-4 hover:underline"
                  >
                    {point.value}
                  </a>
                ) : (
                  <Link
                    href={point.href}
                    className="text-sm font-semibold text-white underline-offset-4 hover:underline"
                  >
                    {point.value}
                  </Link>
                )
              ) : (
                <p className="text-sm font-semibold text-white">{point.value}</p>
              )}
            </div>
          ))}
          <Link
            href="mailto:hello@pdfatelier.in"
            className="rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950"
          >
            Contact us
          </Link>
        </div>
      </footer>
    </section>
  );
}
