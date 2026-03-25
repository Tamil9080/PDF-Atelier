import type { Metadata } from "next";
import Link from "next/link";

const sections = [
  {
    title: "Use of the platform",
    body:
      "You may process files that you own or are authorized to handle. Automated abuse, scraping, or reselling of the interface without permission is prohibited.",
  },
  {
    title: "Accountless access",
    body:
      "PDF Atelier runs without logins today. If we ever introduce accounts, new credentials and customer agreements will govern those features and you will be notified.",
  },
  {
    title: "Service availability",
    body:
      "We strive for 99.9% uptime, but the service is provided on an “as is” basis. Planned maintenance windows are posted on the status feed.",
  },
];

const responsibilities = [
  "Ensure you have the right to process the files you upload to our local interface.",
  "Avoid using the tools for malicious or infringing activities.",
  "Keep exported files secure once they leave your device.",
];

export const metadata: Metadata = {
  title: "Terms & Conditions | PDF Atelier",
  description: "Legal terms governing your use of PDF Atelier's client-side PDF utilities.",
};

export default function TermsPage() {
  return (
    <section className="space-y-10">
      <header className="rounded-[32px] border border-white/10 bg-slate-950/70 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Terms</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Terms & Conditions</h1>
        <p className="mt-4 text-sm text-slate-300 max-w-3xl">
          These terms outline the legal agreement between you (&quot;User&quot;) and PDF Atelier (&quot;We&quot;) for the use of the tools available on
          pdfatelier.in. By accessing or using the tools you agree to the terms below.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200">Policy</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{section.body}</p>
          </article>
        ))}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8">
        <h2 className="text-2xl font-semibold text-white">User responsibilities</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          {responsibilities.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8">
          <h3 className="text-xl font-semibold text-white">Indemnity</h3>
          <p className="mt-3 text-sm text-slate-300">
            You agree to indemnify and hold PDF Atelier harmless from any claims arising out of your misuse of the tools or violation of these
            terms. This includes reasonable legal fees.
          </p>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8">
          <h3 className="text-xl font-semibold text-white">Updates</h3>
          <p className="mt-3 text-sm text-slate-300">
            We may update these terms to reflect product or legal changes. Major updates will be announced in-app. Continuing to use the
            platform after an update constitutes acceptance.
          </p>
        </article>
      </div>

      <footer className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-white">Questions about these terms?</p>
          <p>Contact us and we will respond within two business days.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="mailto:legal@pdfatelier.in"
            className="rounded-2xl bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950"
          >
            Email legal
          </Link>
          <Link
            href="/privacy"
            className="rounded-2xl border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:border-white/40"
          >
            View privacy policy
          </Link>
        </div>
      </footer>
    </section>
  );
}
