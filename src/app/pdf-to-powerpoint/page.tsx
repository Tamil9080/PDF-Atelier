"use client";

import { useEffect, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Loader2, Presentation } from "lucide-react";
import { saveAs } from "file-saver";
import PptxGenJS from "pptxgenjs";

export default function PdfToPowerPoint() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Waiting for a PDF upload");

  useEffect(() => {
    const initWorker = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    };
    initWorker();
  }, []);

  const handleDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0] ?? null);
    setStatus("PDF loaded. Ready to storyboard.");
  };

  const convertToPptx = async () => {
    if (!file) return;
    setProcessing(true);
    setStatus("Parsing PDF pages and building slides...");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => (typeof item === "object" && item !== null && "str" in item ? (item as { str: string }).str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        const slide = pptx.addSlide();
        slide.background = { color: "141B2F" };
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.4,
          y: 0.4,
          w: 9.1,
          h: 0.8,
          fill: { color: "0EA5E9" },
          line: { color: "0EA5E9" },
        });
        slide.addText(`Page ${pageNumber}`, {
          x: 0.55,
          y: 0.5,
          w: 8.6,
          h: 0.5,
          color: "ffffff",
          bold: true,
          fontSize: 20,
          fontFace: "Space Grotesk",
        });
        slide.addText(pageText.length > 0 ? pageText : "[This page did not contain selectable text]", {
          x: 0.7,
          y: 1.5,
          w: 8.6,
          h: 4.5,
          color: "E2E8F0",
          fontSize: 18,
          lineSpacing: 28,
          valign: "top",
          fontFace: "Inter",
        });
      }

      const blob = (await pptx.write({ outputType: "blob" })) as Blob;
      const nextName = file.name.replace(/\.pdf$/i, "") || "pdf-to-powerpoint";
      saveAs(blob, `${nextName}-converted.pptx`);
      setStatus("Slides exported as PPTX ✔");
    } catch (error) {
      console.error("PDF → PPTX conversion failed", error);
      setStatus("Unable to convert this PDF. Please try a different file.");
      alert("Error converting PDF to PowerPoint deck.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-rose-500 to-fuchsia-500 shadow-lg shadow-rose-500/40">
          <Presentation className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">PDF to PowerPoint</h1>
        <p className="text-slate-300">
          Transform document pages into widescreen slides with typography-safe text blocks. Content never leaves your
          device.
        </p>
      </div>

      <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload a PDF to storyboard"
        />

        {file && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div>
              <p className="text-base font-semibold text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm font-semibold text-rose-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10"
            >
              Remove
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-semibold text-white">Formatting note</p>
          <p className="mt-2">
            This beta exporter pulls text content. Complex charts or imagery are not reconstructed yet, but are noted in
            the slide copy so you can add visuals manually.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={convertToPptx}
            disabled={!file || processing}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-400 via-rose-500 to-fuchsia-500 text-white font-semibold text-lg shadow-lg shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Generating slides..." : "Convert to PPTX"}
          </button>
          <p className="text-sm text-slate-400">{status}</p>
        </div>
      </div>
    </div>
  );
}
