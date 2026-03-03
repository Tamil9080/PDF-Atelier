"use client";

import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Unlock, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib-plus-encrypt";
import { saveAs } from "file-saver";

export default function PdfUnlock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Provide the current password to export an open copy.");
  const [processing, setProcessing] = useState(false);

  const handleDrop = (accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setStatus("Ready to unlock. Enter the password first.");
  };

  const removeFile = () => {
    setFile(null);
    setStatus("Provide the current password to export an open copy.");
    setPassword("");
  };

  const unlockPdf = async () => {
    if (!file) return;
    if (!password.trim()) {
      setStatus("Password required to open protected PDF.");
      return;
    }

    setProcessing(true);
    setStatus("Decrypting PDF...");

    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { password: password.trim() } as unknown as Parameters<typeof PDFDocument.load>[1]);
      // Re-save without encryption
      const unlockedBytes = await pdfDoc.save();
      const blob = new Blob([unlockedBytes as BlobPart], { type: "application/pdf" });
      const name = file.name.replace(/\.pdf$/i, "") || "document";
      saveAs(blob, `${name}-unlocked.pdf`);
      setStatus("Password removed ✔");
    } catch (error) {
      console.error("Unlock failed", error);
      setStatus("Incorrect password or file not supported.");
      alert("Unable to unlock PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 via-orange-400 to-amber-300 shadow-lg shadow-rose-400/40">
          <Unlock className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">Remove PDF Password</h1>
        <p className="text-slate-300">Decrypt a locked PDF and export a copy without restrictions.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload a locked PDF"
        />

        {file && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-white">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={removeFile}
                className="text-xs font-semibold uppercase tracking-wide text-rose-300 hover:text-white border border-white/10 rounded-xl px-3 py-1"
              >
                Remove
              </button>
            </div>

            <label className="block text-sm font-semibold text-white">
              Current password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-rose-300 focus:outline-none"
                placeholder="••••••"
              />
            </label>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={unlockPdf}
            disabled={!file || processing}
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 px-10 py-4 text-lg font-semibold text-slate-900 shadow-lg shadow-rose-400/30 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Decrypting..." : "Remove Password"}
          </button>
          <p className="text-sm text-slate-400 text-center">{status}</p>
        </div>
      </section>
    </div>
  );
}
