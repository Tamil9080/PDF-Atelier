"use client";

import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { ScanText, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";
import { saveAs } from "file-saver";

interface OcrResult {
  name: string;
  text: string;
}

export default function OcrWorkspace() {
  const [files, setFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState("eng");
  const [results, setResults] = useState<OcrResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Upload scans or photos, then convert them into selectable text.");

  const handleDrop = (accepted: File[]) => {
    setFiles(accepted);
    setResults([]);
    setStatus("Files ready. Choose a language and start OCR.");
  };

  const runOcr = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);

    const nextResults: OcrResult[] = [];
    try {
      for (const file of files) {
        setStatus(`Processing ${file.name}...`);
        const { data } = await Tesseract.recognize(file, language, {
          logger: ({ progress, status: step }) => {
            if (progress) {
              setStatus(`${step} ${(progress * 100).toFixed(0)}% for ${file.name}`);
            }
          },
        });
        nextResults.push({ name: file.name, text: data.text.trim() });
      }
      setResults(nextResults);
      setStatus("OCR complete ✔");
    } catch (error) {
      console.error("OCR failed", error);
      setStatus("Something went wrong. Try with clearer scans.");
      alert("OCR error. Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadTextBundle = () => {
    if (!results.length) return;
    const combined = results
      .map((entry, index) => `File ${index + 1}: ${entry.name}\n\n${entry.text}\n\n-----\n\n`)
      .join("");
    saveAs(new Blob([combined], { type: "text/plain;charset=utf-8" }), "ocr-results.txt");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
          <ScanText className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold text-white">OCR Text Extraction</h1>
        <p className="text-slate-300">Turn scanned PDFs or photos into editable text using Tesseract.js.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-xl space-y-8">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] }}
          maxFiles={8}
          multiple
          label="Upload scans or screenshots"
        />

        {files.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {files.map((entry) => (
              <div key={entry.name} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-base font-semibold text-white">{entry.name}</p>
                <p className="text-sm text-slate-400">{(entry.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <label className="text-sm font-semibold text-white">
            Recognition language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-violet-400 focus:outline-none"
            >
              <option value="eng">English</option>
              <option value="spa">Spanish</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
            </select>
          </label>

          <button
            onClick={runOcr}
            disabled={!files.length || processing}
            className="w-full md:w-auto rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {processing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {processing ? "Extracting..." : "Start OCR"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-white">Results ({results.length})</h2>
              <button
                onClick={downloadTextBundle}
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
              >
                Download TXT bundle
              </button>
            </div>
            <div className="space-y-5 max-h-[28rem] overflow-y-auto pr-2">
              {results.map((entry) => (
                <article key={entry.name} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-slate-300">{entry.name}</p>
                  <p className="whitespace-pre-wrap text-sm text-white/90 mt-2">{entry.text || "(No text detected)"}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-slate-400 text-center">{status}</p>
      </section>
    </div>
  );
}
