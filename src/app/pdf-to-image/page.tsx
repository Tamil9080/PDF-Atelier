"use client";

import { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Loader2 } from "lucide-react";
import { Dropzone } from "@/components/Dropzone";

export default function PdfToImage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [quality, setQuality] = useState(0.8);

  useEffect(() => {
    // Initialize worker
    const initWorker = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    };
    initWorker();
  }, []);

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setImages([]);
  };

  const convertPdfToImages = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    const pdfFile = files[0];

    try {
      const pdfjsLib = await import("pdfjs-dist");
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const imagesList: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // @ts-expect-error - pdfjs-dist types mismatch
        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const imgData = canvas.toDataURL("image/jpeg", quality);
        imagesList.push(imgData);
      }

      setImages(imagesList);
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      alert("Error processing PDF file.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadImages = () => {
    if (images.length === 0) return;

    if (images.length === 1) {
      saveAs(images[0], "page-1.jpg");
    } else {
      const zip = new JSZip();
      images.forEach((img, index) => {
        const base64Data = img.replace(/^data:image\/jpeg;base64,/, "");
        zip.file(`page-${index + 1}.jpg`, base64Data, { base64: true });
      });

      zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, "pdf-images.zip");
      });
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 rounded-2xl mb-2 shadow-lg shadow-cyan-500/40">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
            PDF to Image Converter
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Convert PDF pages to high-quality JPG images. All processing happens securely in your browser.
          </p>
        </div>

        <div className="bg-slate-900/60 p-8 rounded-2xl shadow-2xl shadow-slate-950/40 border border-white/10 backdrop-blur">
          <Dropzone
            onDrop={handleDrop}
            accept={{ "application/pdf": [".pdf"] }}
            maxFiles={1}
            label="Upload a PDF file to convert"
          />

          {files.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-400/20 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-medium text-white truncate">{files[0].name}</span>
              </div>
              <button
                onClick={() => setFiles([])}
                className="text-sm font-semibold text-cyan-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              >
                Remove
              </button>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 p-5 bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-indigo-500/10 rounded-xl space-y-4 border border-cyan-400/20">
              <div className="flex justify-between items-center">
                <label className="text-base font-semibold text-white">Image Quality</label>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-sm text-slate-300">💡 Lower quality = smaller file size</p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={convertPdfToImages}
              disabled={processing || files.length === 0}
              className="bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 hover:from-cyan-300 hover:via-sky-400 hover:to-indigo-400 text-slate-950 font-semibold text-lg px-10 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl shadow-cyan-500/30 hover:scale-105"
            >
              {processing && <Loader2 className="animate-spin h-6 w-6" />}
              {processing ? "Converting..." : "Convert to Images"}
            </button>
          </div>
        </div>

        {images.length > 0 && (
          <div className="bg-slate-900/60 p-8 rounded-2xl shadow-2xl border border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent">Converted Images</h2>
                <p className="text-base text-slate-300 mt-2">{images.length} {images.length === 1 ? 'page' : 'pages'} ready to download</p>
              </div>
              <button
                onClick={downloadImages}
                className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All {images.length > 1 && '(ZIP)'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img, index) => (
                <div key={index} className="relative group border-2 border-white/10 rounded-xl overflow-hidden shadow-md hover:shadow-cyan-500/30 transition-all hover:scale-105 bg-slate-950/40">
                  <img src={img} alt={`Page ${index + 1}`} className="w-full h-auto" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">Page {index + 1}</span>
                  </div>
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
