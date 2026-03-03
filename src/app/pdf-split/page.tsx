"use client";

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Dropzone } from "@/components/Dropzone";
import { Loader2, Scissors } from "lucide-react";
import { PDFDocument } from "pdf-lib-plus-encrypt";

const DEFAULT_STATUS = "Upload a PDF and optionally customize the page ranges.";

const gradientBox = "rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl";

export default function PdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("all");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);

  const handleDrop = (accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setStatus(DEFAULT_STATUS);
  };

  const removeFile = () => {
    setFile(null);
    setStatus(DEFAULT_STATUS);
  };

  const parseRanges = (input: string, totalPages: number) => {
    if (!input.trim() || input.trim().toLowerCase() === "all") {
      return Array.from({ length: totalPages }).map((_, idx) => [idx + 1, idx + 1]);
    }

    const tokens = input
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    const segments: Array<[number, number]> = [];

    for (const token of tokens) {
      const [startStr, endStr] = token.split("-").map((value) => value.trim());
      const start = Number(startStr);
      const end = endStr ? Number(endStr) : start;
      if (Number.isNaN(start) || Number.isNaN(end)) {
        throw new Error(`Invalid token: ${token}`);
      }
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        throw new Error(`Range ${token} is outside of the document page count.`);
      }
      segments.push([Math.min(start, end), Math.max(start, end)]);
    }

    return segments;
  };

  const handleSplit = async () => {
    if (!file) return;

    setProcessing(true);
    setStatus("Analyzing PDF...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      const parsedRanges = parseRanges(ranges, totalPages);

      const zip = new JSZip();
      let chunkIndex = 1;

      for (const [start, end] of parsedRanges) {
        setStatus(`Creating part ${chunkIndex} (${start}-${end})`);
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(
          pdfDoc,
          Array.from({ length: end - start + 1 }, (_, idx) => start - 1 + idx)
        );
        copiedPages.forEach((page) => newPdf.addPage(page));
        const bytes = await newPdf.save();
        zip.file(`split-${chunkIndex}-${start}-${end}.pdf`, bytes);
        chunkIndex += 1;
      }

      setStatus("Packaging split files...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const nextName = file.name.replace(/\.pdf$/i, "") || "pdf";
      saveAs(zipBlob, `${nextName}-split.zip`);
      setStatus("Split complete ✔");
    } catch (error) {
      console.error("PDF split failed", error);
      setStatus("Unable to split this file. Check the ranges and try again.");
      alert("Error splitting PDF. Please verify your range input.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 shadow-lg shadow-cyan-500/30">
          <Scissors className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">PDF Splitter</h1>
        <p className="text-slate-300">
          Separate a PDF into perfectly labeled chunks without leaving the browser. Use comma-separated ranges
          like <span className="text-white">1-3, 5, 9-12</span> or just type <span className="text-white">all</span>.
        </p>
      </header>

      <section className={gradientBox}>
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload the PDF you want to split"
        />

        {file && (
          <div className="mt-6 space-y-4">
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
              Page ranges
              <input
                type="text"
                value={ranges}
                onChange={(event) => setRanges(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="all or 1-3,6,10-12"
              />
            </label>
            <p className="text-sm text-slate-400">
              Each range creates its own PDF. Use commas to separate ranges, or enter <span className="text-white">all</span> to
              export one PDF per page.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleSplit}
            disabled={!file || processing}
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 px-10 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:shadow-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Splitting..." : "Split PDF"}
          </button>
          <p className="text-sm text-slate-400 text-center">{status}</p>
        </div>
      </section>
    </div>
  );
}
