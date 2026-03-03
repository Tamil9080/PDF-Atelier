"use client";

import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { Loader2, Download } from "lucide-react";
import { Dropzone } from "@/components/Dropzone";

export default function ImageCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [qualityLevel, setQualityLevel] = useState(80);
  const [maxSizeMB, setMaxSizeMB] = useState(1);

  const derivedQuality = useMemo(() => {
    const normalized = qualityLevel / 100;
    return 0.2 + Math.pow(normalized, 1.6) * 0.75; // finer control near the high end
  }, [qualityLevel]);

  const qualityLabel = useMemo(() => {
    if (qualityLevel >= 85) return "Print perfect";
    if (qualityLevel >= 65) return "Presentation";
    if (qualityLevel >= 45) return "Web optimized";
    return "Thumbnail";
  }, [qualityLevel]);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setCompressedFile(null);
    }
  };

  const handleCompress = async () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    setProcessing(true);
    try {
      const { default: imageCompression } = await import("browser-image-compression");

      const options = {
        maxSizeMB: maxSizeMB || 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: derivedQuality,
      };

      const compressedBlob = await imageCompression(file, options);
      setCompressedFile(compressedBlob);
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("Error compressing image.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadCompressed = () => {
    if (compressedFile) {
      saveAs(compressedFile, `compressed-${file?.name}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
          Image Compressor
        </h1>
        <p className="text-slate-300 mt-2">
          Compress JPG, PNG, and WEBP images securely in your browser.
        </p>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-2xl shadow-lg border border-white/10">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
          maxFiles={1}
          label="Upload an image to compress"
        />

        <div className="mt-6 space-y-6">
          {/* Settings Section - Always Visible */}
          <div className="p-5 bg-slate-950/40 rounded-xl border border-white/10">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span>Compression Settings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-200 flex justify-between">
                  <span>Quality</span>
                  <span className="text-cyan-300 font-bold">{qualityLabel}</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={qualityLevel}
                  onChange={(e) => setQualityLevel(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-xs text-slate-400">Lower values favor smaller exports. Current target ≈ {Math.round(derivedQuality * 100)}% fidelity.</p>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-200 block">Max File Size (MB)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={maxSizeMB}
                    onChange={(e) => setMaxSizeMB(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-white/10 bg-slate-950/40 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all pr-12 text-white placeholder-slate-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">MB</span>
                </div>
                 <p className="text-xs text-slate-400">Target maximum size (approximate)</p>
              </div>
            </div>
          </div>

          {file && (
          <div className="mt-6 space-y-4">
              <div className="p-4 bg-slate-950/40 rounded-lg flex justify-between items-center border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-300 font-bold text-xs uppercase">
                    {file.name.split('.').pop()}
                  </div>
                  <div>
                    <p className="font-medium text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  className="text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 p-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Remove
                </button>
              </div>
  
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleCompress}
                  disabled={processing}
                  className="bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 hover:from-cyan-300 hover:via-sky-400 hover:to-indigo-400 text-slate-950 px-8 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
                >
                  {processing && <Loader2 className="animate-spin h-5 w-5" />}
                  {processing ? "Compressing..." : "Compress Image Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {compressedFile && (
        <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-400/30">
          <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-300">Compression Complete!</h3>
              <p className="text-emerald-200 mt-1">
                New Size: <span className="font-bold text-white">{(compressedFile.size / 1024 / 1024).toFixed(2)} MB</span> 
                {' '}({Math.round((1 - compressedFile.size / (file?.size || 1)) * 100)}% reduction)
              </p>
            </div>
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
