"use client";

import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Loader2, Droplets } from "lucide-react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib-plus-encrypt";
import { saveAs } from "file-saver";

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.12);
  const [fontSize, setFontSize] = useState(56);
  const [angle, setAngle] = useState(-35);
  const [color, setColor] = useState("#F43F5E");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Drop a PDF, type the watermark copy, and we overlay it on every page.");

  const handleDrop = (accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setStatus("Customize the watermark text, opacity, and size.");
  };

  const removeFile = () => {
    setFile(null);
    setStatus("Drop a PDF, type the watermark copy, and we overlay it on every page.");
  };

  const applyWatermark = async () => {
    if (!file || !text.trim()) {
      setStatus("Enter watermark text before exporting.");
      return;
    }

    setProcessing(true);
    setStatus("Embedding fonts and tiling the watermark across every page...");

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgb(color);

      pdfDoc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const xStep = textWidth + fontSize * 2.5;
        const yStep = fontSize * 3;

        for (let y = -height; y < height * 1.5; y += yStep) {
          for (let x = -width; x < width * 1.5; x += xStep) {
            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(r, g, b),
              opacity,
              rotate: degrees(angle),
            });
          }
        }
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const nextName = file.name.replace(/\.pdf$/i, "") || "watermark";
      saveAs(blob, `${nextName}-watermarked.pdf`);
      setStatus("Watermark added ✔");
    } catch (error) {
      console.error("Add watermark failed", error);
      setStatus("Unable to watermark this PDF. Try a different file.");
      alert("Error adding watermark.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 shadow-lg shadow-rose-500/30">
          <Droplets className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">Add PDF Watermark</h1>
        <p className="text-slate-300">Blend diagonal badges across every page in one pass. All offline and private.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload a PDF to watermark"
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
              Watermark text
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="CONFIDENTIAL"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-white">
                Opacity ({Math.round(opacity * 100)}%)
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-sm font-semibold text-white">
                Font size ({fontSize}px)
                <input
                  type="range"
                  min="24"
                  max="120"
                  step="4"
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-white">
              Angle ({angle}°)
              <input
                type="range"
                min="-60"
                max="60"
                step="5"
                value={angle}
                onChange={(event) => setAngle(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </label>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Color</p>
              <div className="flex flex-wrap items-center gap-3">
                {colorChoices.map((option) => (
                  <button
                    key={option.hex}
                    type="button"
                    onClick={() => setColor(option.hex)}
                    className={`h-10 w-10 rounded-2xl border-2 transition ${
                      color === option.hex ? "border-white scale-105" : "border-white/20"
                    }`}
                    style={{ backgroundColor: option.hex }}
                    aria-label={`Use ${option.label}`}
                  />
                ))}
                <label className="flex items-center gap-2 text-xs text-slate-300 border border-white/10 rounded-2xl px-3 py-2">
                  Custom
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-8 w-12 cursor-pointer border-none bg-transparent p-0"
                  />
                </label>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              Tip: combine with the rotate or split tools for precise placement before sending externally.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={applyWatermark}
            disabled={!file || processing}
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-rose-400 via-purple-500 to-indigo-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-rose-500/30 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Watermarking..." : "Add watermark"}
          </button>
          <p className="text-sm text-slate-400 text-center">{status}</p>
        </div>
      </section>
    </div>
  );
}

const colorChoices = [
  { hex: "#F43F5E", label: "Rose" },
  { hex: "#0EA5E9", label: "Sky" },
  { hex: "#F59E0B", label: "Amber" },
  { hex: "#10B981", label: "Emerald" },
  { hex: "#C084FC", label: "Violet" },
];

function hexToRgb(hex: string) {
  const match = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  const value = match ? match[1] : "F43F5E";
  const bigint = parseInt(value, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}
