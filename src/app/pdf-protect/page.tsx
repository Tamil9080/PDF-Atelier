"use client";

import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { LockKeyhole, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib-plus-encrypt";
import { saveAs } from "file-saver";

export default function PdfProtect() {
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Set a password to lock viewing permissions and restrict copying.");

  const handleDrop = (accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setStatus("Ready to protect. Fill the password fields below.");
  };

  const removeFile = () => {
    setFile(null);
    setStatus("Set a password to lock viewing permissions and restrict copying.");
  };

  const protectPdf = async () => {
    if (!file) return;
    if (!userPassword.trim()) {
      setStatus("A viewer password is required.");
      return;
    }

    setProcessing(true);
    setStatus("Encrypting PDF...");

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      await pdfDoc.encrypt({
        userPassword: userPassword.trim(),
        ownerPassword: ownerPassword.trim() || userPassword.trim(),
        permissions: {
          printing: allowPrinting ? "highResolution" : false,
          copying: allowCopying,
        },
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const nextName = file.name.replace(/\.pdf$/i, "") || "secure";
      saveAs(blob, `${nextName}-protected.pdf`);
      setStatus("Password applied ✔");
    } catch (error) {
      console.error("Protect PDF failed", error);
      setStatus("Unable to encrypt this PDF. Try another file.");
      alert("Error protecting PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30">
          <LockKeyhole className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">Protect PDF with Password</h1>
        <p className="text-slate-300">Choose viewer and owner credentials plus allowed permissions.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload a PDF to protect"
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
              Viewer password (required)
              <input
                type="password"
                value={userPassword}
                onChange={(event) => setUserPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="••••••"
              />
            </label>

            <label className="block text-sm font-semibold text-white">
              Owner password (optional)
              <input
                type="password"
                value={ownerPassword}
                onChange={(event) => setOwnerPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Leave blank to reuse viewer password"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 text-sm font-semibold text-white">
                <input
                  type="checkbox"
                  checked={allowPrinting}
                  onChange={(event) => setAllowPrinting(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-950"
                />
                Allow printing (high resolution)
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-white">
                <input
                  type="checkbox"
                  checked={allowCopying}
                  onChange={(event) => setAllowCopying(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-950"
                />
                Allow copying text/images
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={protectPdf}
            disabled={!file || processing}
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 px-10 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Encrypting..." : "Protect PDF"}
          </button>
          <p className="text-sm text-slate-400 text-center">{status}</p>
        </div>
      </section>
    </div>
  );
}
