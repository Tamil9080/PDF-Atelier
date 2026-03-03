"use client";

import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Loader2, RotateCcw } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib-plus-encrypt";
import { saveAs } from "file-saver";

export default function PdfRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Upload a PDF and choose the rotation angle.");

  const handleDrop = (accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setStatus("File ready. Pick an angle.");
  };

  const removeFile = () => {
    setFile(null);
    setStatus("Upload a PDF and choose the rotation angle.");
  };

  const rotatePdf = async () => {
    if (!file) return;
    setProcessing(true);
    setStatus("Applying rotation...");

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      pdfDoc.getPages().forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotation) % 360));
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const nextName = file.name.replace(/\.pdf$/i, "") || "rotated";
      saveAs(blob, `${nextName}-rotated-${rotation}.pdf`);
      setStatus("Rotation complete ✔");
    } catch (error) {
      console.error("Rotate PDF failed", error);
      setStatus("Unable to rotate this PDF. Try another file.");
      alert("Error rotating PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 via-sky-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
          <RotateCcw className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">Rotate PDF</h1>
        <p className="text-slate-300">Fix sideways scans or orient every page with a single click.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload a PDF to rotate"
        />

        {file && (
          <div className="space-y-4">
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
              Rotation angle
              <select
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
              >
                {[0, 90, 180, 270].map((value) => (
                  <option key={value} value={value}>
                    {value}°{value === 0 ? " (no change)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-slate-400">
              Every page receives the same rotation. Want per-page control? Split first, rotate, then merge.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={rotatePdf}
            disabled={!file || processing}
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-indigo-400 via-sky-500 to-cyan-400 px-10 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-indigo-500/30 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Rotating..." : "Rotate PDF"}
          </button>
          <p className="text-sm text-slate-400">{status}</p>
        </div>
      </section>
    </div>
  );
}
