"use client";

import { useMemo, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Settings2, Loader2 } from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib-plus-encrypt";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const modes = [
  { value: "rotate", label: "Rotate pages" },
  { value: "watermark", label: "Add watermark" },
  { value: "protect", label: "Add password" },
] as const;

type Mode = (typeof modes)[number]["value"];

export default function BatchProcessing() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("rotate");
  const [rotation, setRotation] = useState(90);
  const [watermarkText, setWatermarkText] = useState("Confidential");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.15);
  const [password, setPassword] = useState("secure123");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Upload multiple PDFs and run the same transformation on all of them.");

  const valid = files.length > 0 && (!((mode === "protect") && !password.trim()));

  const operationDescription = useMemo(() => {
    switch (mode) {
      case "rotate":
        return `Rotates every page by ${rotation}°.`;
      case "watermark":
        return `Applies \"${watermarkText}\" diagonally with ${(watermarkOpacity * 100).toFixed(0)}% opacity.`;
      case "protect":
        return `Locks each PDF with password \"${password || ""}\".`;
      default:
        return "";
    }
  }, [mode, rotation, watermarkText, watermarkOpacity, password]);

  const handleDrop = (accepted: File[]) => {
    setFiles(accepted);
    setStatus("Files ready. Configure the batch options below.");
  };

  const runBatch = async () => {
    if (!valid) return;
    setProcessing(true);
    setStatus("Processing files...");

    try {
      const zip = new JSZip();
      for (const file of files) {
        setStatus(`Working on ${file.name}...`);
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(bytes);

        if (mode === "rotate") {
          const angle = degrees(rotation);
          const pages = pdfDoc.getPages();
          pages.forEach((page) => {
            page.setRotation(angle);
          });
        }

        if (mode === "watermark") {
          const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const pages = pdfDoc.getPages();
          const textColor = rgb(1, 1, 1);
          pages.forEach((page) => {
            const { width, height } = page.getSize();
            page.drawText(watermarkText, {
              x: width / 6,
              y: height / 2,
              size: Math.max(width, height) / 12,
              font: helveticaBold,
              color: textColor,
              opacity: watermarkOpacity,
              rotate: degrees(-30),
            });
          });
        }

        if (mode === "protect") {
          await pdfDoc.encrypt({
            userPassword: password.trim(),
            ownerPassword: password.trim(),
          });
        }

        const processed = await pdfDoc.save();
        const name = file.name.replace(/\.pdf$/i, "") || "document";
        zip.file(`${name}-${mode}.pdf`, processed);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `batch-${mode}-${Date.now()}.zip`);
      setStatus("Batch complete ✔");
    } catch (error) {
      console.error("Batch processor error", error);
      setStatus("Batch failed. Check console for details.");
      alert("Batch processing error.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 shadow-lg shadow-cyan-400/30">
          <Settings2 className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">Batch PDF Processing</h1>
        <p className="text-slate-300">Apply a single transformation to every selected PDF in one go.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          multiple
          maxFiles={12}
          label="Drop all PDFs that need the same treatment"
        />

        {files.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            {files.length} file(s) queued · {operationDescription}
          </div>
        )}

        <div className="space-y-6">
          <label className="text-sm font-semibold text-white">
            Batch action
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as Mode)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            >
              {modes.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          {mode === "rotate" && (
            <label className="text-sm font-semibold text-white">
              Rotation angle
              <select
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
              >
                {[0, 90, 180, 270].map((value) => (
                  <option key={value} value={value}>
                    {value}°
                  </option>
                ))}
              </select>
            </label>
          )}

          {mode === "watermark" && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-white">
                Watermark text
                <input
                  value={watermarkText}
                  onChange={(event) => setWatermarkText(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-white">
                Opacity ({(watermarkOpacity * 100).toFixed(0)}%)
                <input
                  type="range"
                  min={0.05}
                  max={0.6}
                  step={0.05}
                  value={watermarkOpacity}
                  onChange={(event) => setWatermarkOpacity(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
          )}

          {mode === "protect" && (
            <label className="text-sm font-semibold text-white">
              Password applied to all files
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Required"
              />
            </label>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={runBatch}
            disabled={!valid || processing}
            className="w-full md:w-auto rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 px-10 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-400/30 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Processing..." : "Run batch"}
          </button>
          <p className="text-sm text-slate-400 text-center">{status}</p>
        </div>
      </section>
    </div>
  );
}
