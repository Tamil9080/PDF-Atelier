"use client";

import { useEffect, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Loader2, FileText } from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Pick a PDF to begin");

  useEffect(() => {
    const initWorker = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    };
    initWorker();
  }, []);

  const handleDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0] ?? null);
    setStatus("PDF ready for conversion");
  };

  const convertToWord = async () => {
    if (!file) return;

    setProcessing(true);
    setStatus("Extracting text from each PDF page...");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const paragraphs: Paragraph[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => (typeof item === "object" && item !== null && "str" in item ? (item as { str: string }).str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Page ${pageNumber}`, bold: true, color: "2563EB" }),
            ],
            spacing: { after: 180 },
          })
        );
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: pageText.length > 0 ? pageText : "[No selectable text detected on this page]",
                break: 1,
              }),
            ],
            spacing: { after: 280 },
          })
        );
      }

      if (paragraphs.length === 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun("No textual content found in this PDF.")],
          })
        );
      }

      setStatus("Building DOCX file...");
      const doc = new Document({
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const nextName = file.name.replace(/\.pdf$/i, "") || "pdf-to-word";
      saveAs(blob, `${nextName}-converted.docx`);
      setStatus("DOCX download ready ✔");
    } catch (error) {
      console.error("PDF → Word conversion failed", error);
      setStatus("Sorry, something went wrong. Try another file.");
      alert("Error converting PDF to Word document.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/30">
          <FileText className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">PDF to Word</h1>
        <p className="text-slate-300">
          Extract selectable text from any PDF and instantly download a clean DOCX file. Everything runs locally
          inside your browser.
        </p>
      </div>

      <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload a PDF (text-based works best)"
        />

        {file && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div>
              <p className="text-base font-semibold text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm font-semibold text-cyan-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10"
            >
              Remove
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-semibold text-white">Heads-up</p>
          <p className="mt-2">
            This extractor focuses on text. Complex layouts, images, or tables will be flattened into paragraphs to
            keep the DOCX lightweight.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={convertToWord}
            disabled={!file || processing}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 text-slate-950 font-semibold text-lg shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Converting..." : "Convert to DOCX"}
          </button>
          <p className="text-sm text-slate-400">{status}</p>
        </div>
      </div>
    </div>
  );
}
