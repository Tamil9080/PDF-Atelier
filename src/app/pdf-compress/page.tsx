"use client";

import { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { Loader2, Download } from "lucide-react";
import { Dropzone } from "@/components/Dropzone";

type WorkerResponse =
  | { id: string; success: true; data: Uint8Array }
  | { id: string; success: false; error: string };

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [compressedPdf, setCompressedPdf] = useState<Uint8Array | null>(null);
  const [compressionMeta, setCompressionMeta] = useState<{ original: number; compressed: number } | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../../workers/pdfCompress.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setCompressedPdf(null);
      setCompressionMeta(null);
    }
  };

  const handleCompress = async () => {
    if (!file || !workerRef.current) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const requestId = crypto.randomUUID();
      const worker = workerRef.current;

      const pdfBytes = await new Promise<Uint8Array>((resolve, reject) => {
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.id !== requestId) return;
          worker.removeEventListener("message", handleMessage);
          worker.removeEventListener("error", handleError);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
        };

        const handleError = (event: ErrorEvent) => {
          worker.removeEventListener("message", handleMessage);
          worker.removeEventListener("error", handleError);
          reject(event.error || new Error("Worker failed"));
        };

        worker.addEventListener("message", handleMessage);
        worker.addEventListener("error", handleError);
        worker.postMessage({ id: requestId, arrayBuffer }, [arrayBuffer]);
      });

      setCompressedPdf(pdfBytes);
      setCompressionMeta({ original: file.size, compressed: pdfBytes.length });
    } catch (error) {
      console.error("Error compressing PDF:", error);
      alert("Error compressing PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadCompressed = () => {
    if (compressedPdf) {
      const blob = new Blob([compressedPdf as BlobPart], { type: "application/pdf" });
      saveAs(blob, `compressed-${file?.name}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
          PDF Compressor
        </h1>
        <p className="text-slate-300">
          Optimize your PDF files by restructuring them locally. No uploads, no limits.
        </p>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-2xl shadow-lg border border-white/10 backdrop-blur">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          label="Upload PDF to compress"
        />

        {file && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-slate-950/40 rounded-xl flex justify-between items-center border border-white/10">
              <div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-rose-400 hover:text-rose-200 text-sm font-medium">
                Remove
              </button>
            </div>

             <div className="flex justify-center pt-4">
              <button
                onClick={handleCompress}
                disabled={processing}
                className="bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 hover:from-cyan-300 hover:via-sky-400 hover:to-indigo-400 text-slate-950 px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-500/30"
              >
                {processing && <Loader2 className="animate-spin h-4 w-4" />}
                {processing ? "Optimizing..." : "Optimize PDF"}
              </button>
            </div>
          </div>
        )}
      </div>

      {compressedPdf && compressionMeta && (
        <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-400/30 space-y-4">
          <div className="flex flex-col gap-2 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <span>Original Size</span>
              <span className="font-semibold text-white">{(compressionMeta.original / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Compressed Size</span>
              <span className="font-semibold text-emerald-200">{(compressionMeta.compressed / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-300">
              <span>Space Saved</span>
              <span>
                {Math.max(
                  0,
                  Math.round((1 - compressionMeta.compressed / compressionMeta.original) * 100)
                )}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
            <p className="text-sm text-slate-300 text-center sm:text-left">
              All restructuring ran inside a dedicated Web Worker so the UI stayed responsive.
            </p>
            <button
              onClick={downloadCompressed}
              className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 px-4 py-2 rounded-xl font-semibold shadow-lg transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
