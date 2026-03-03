"use client";

import { useState } from "react";
import JSZip from "jszip";
import jsPDF from "jspdf";
import { Dropzone } from "@/components/Dropzone";
import { Loader2, Presentation } from "lucide-react";

export default function PowerPointToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Drop a PPTX deck to begin");

  const handleDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0] ?? null);
    setStatus("Deck detected. Ready to flatten.");
  };

  const convertToPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setStatus("Extracting slide copy and composing PDF...");

    try {
      const slideTexts = await extractSlides(file);
      if (slideTexts.length === 0) {
        throw new Error("No slides found");
      }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      slideTexts.forEach((text, index) => {
        if (index > 0) {
          doc.addPage();
        }
        doc.setFontSize(14);
        doc.text(`Slide ${index + 1}`, 50, 60);
        doc.setFontSize(12);

        const lines = doc.splitTextToSize(text || "[No textual content detected]", 500);
        let cursorY = 90;

        lines.forEach((line: string) => {
          if (cursorY > 760) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text(`Slide ${index + 1} (cont.)`, 50, 60);
            doc.setFontSize(12);
            cursorY = 90;
          }
          doc.text(line, 50, cursorY);
          cursorY += 18;
        });
      });

      const nextName = file.name.replace(/\.pptx$/i, "") || "powerpoint-to-pdf";
      doc.save(`${nextName}-converted.pdf`);
      setStatus("Deck flattened to PDF ✔");
    } catch (error) {
      console.error("PPTX → PDF conversion failed", error);
      setStatus("Unable to process this deck. Make sure it is a PPTX file.");
      alert("Error converting PowerPoint to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400 via-purple-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30">
          <Presentation className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">PowerPoint to PDF</h1>
        <p className="text-slate-300">
          Turn PPTX decks into downloadable PDFs for async reviews, while keeping everything on-device.
        </p>
      </div>

      <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] }}
          maxFiles={1}
          label="Upload a PPTX deck"
        />

        {file && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div>
              <p className="text-base font-semibold text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm font-semibold text-fuchsia-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10"
            >
              Remove
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-semibold text-white">Text-first export</p>
          <p className="mt-2">
            This converter focuses on pulling out slide copy. Images, charts, and media are skipped for now so you can
            quickly share readable drafts.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={convertToPdf}
            disabled={!file || processing}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-400 via-purple-500 to-indigo-500 text-white font-semibold text-lg shadow-lg shadow-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Exporting..." : "Convert to PDF"}
          </button>
          <p className="text-sm text-slate-400">{status}</p>
        </div>
      </div>
    </div>
  );
}

async function extractSlides(file: File) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((path) => path.startsWith("ppt/slides/slide") && path.endsWith(".xml"))
    .sort((a, b) => {
      const numberFrom = (value: string) => parseInt(value.match(/slide(\d+)/)?.[1] || "0", 10);
      return numberFrom(a) - numberFrom(b);
    });

  const slides: string[] = [];

  for (const slidePath of slideFiles) {
    const xml = await zip.file(slidePath)?.async("string");
    if (!xml) continue;

    const matches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)].map((match) => decodeHtml(match[1] ?? ""));
    const text = matches.join(" ").replace(/\s+/g, " ").trim();
    slides.push(text.length > 0 ? text : "[Slide had design-only elements]");
  }

  return slides;
}

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
