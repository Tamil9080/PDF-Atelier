"use client";

import { useState } from "react";
import JSZip from "jszip";
import jsPDF from "jspdf";
import { Dropzone } from "@/components/Dropzone";
import { Loader2, FileSignature } from "lucide-react";

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Drop a DOCX file to start");

  const handleDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0] ?? null);
    setStatus("Document ready for conversion");
  };

  const convertToPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setStatus("Parsing DOCX XML and shaping the PDF...");

    try {
      const text = await extractDocxText(file);
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      const lines = doc.splitTextToSize(text || "[No textual content detected]", 500);
      let cursorY = 72;

      lines.forEach((line: string) => {
        if (cursorY > 760) {
          doc.addPage();
          cursorY = 72;
        }
        doc.text(line, 50, cursorY);
        cursorY += 18;
      });

      const nextName = file.name.replace(/\.docx$/i, "") || "word-to-pdf";
      doc.save(`${nextName}-converted.pdf`);
      setStatus("PDF exported ✔");
    } catch (error) {
      console.error("DOCX → PDF conversion failed", error);
      setStatus("Unable to convert this file. Please verify it is a DOCX.");
      alert("Error converting Word document to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30">
          <FileSignature className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">Word to PDF</h1>
        <p className="text-slate-300">
          Flatten DOCX files into lightweight PDFs directly inside your browser. Great for final reviews and signed
          handoffs.
        </p>
      </div>

      <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }}
          maxFiles={1}
          label="Upload a DOCX document"
        />

        {file && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div>
              <p className="text-base font-semibold text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm font-semibold text-emerald-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10"
            >
              Remove
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-semibold text-white">Beta limitation</p>
          <p className="mt-2">
            This converter focuses on text layers. Embedded images, smart art, or comments are skipped to keep exports
            fast and fully offline.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={convertToPdf}
            disabled={!file || processing}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-semibold text-lg shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Rendering PDF..." : "Convert to PDF"}
          </button>
          <p className="text-sm text-slate-400">{status}</p>
        </div>
      </div>
    </div>
  );
}

async function extractDocxText(file: File) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");

  if (!documentXml) {
    throw new Error("Invalid DOCX file structure");
  }

  const plainText = documentXml
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return plainText;
}
