"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { Loader2, Trash2 } from "lucide-react";
import { Dropzone } from "@/components/Dropzone";

export default function ImageToPdf() {
  const [images, setImages] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleDrop = (acceptedFiles: File[]) => {
    setImages((prev) => [...prev, ...acceptedFiles]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    try {
      const doc = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const imgData = await fileToDataURL(file);
        
        const imgProps = await getImageProperties(imgData);
        const imgWidth = doc.internal.pageSize.getWidth();
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        if (i > 0) doc.addPage();
        
        doc.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      doc.save("converted.pdf");
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      alert("Error converting images.");
    } finally {
      setProcessing(false);
    }
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageProperties = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = url;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-semibold bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Image to PDF Converter
        </h1>
        <p className="text-slate-300">
          Combine multiple images (JPG, PNG) into a single PDF without leaving your browser.
        </p>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-2xl shadow-lg border border-white/10 backdrop-blur">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
          label="Drag & drop images here"
        />

        {images.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Selected Images ({images.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((file, index) => (
                <div key={index} className="relative group border border-white/10 rounded-xl overflow-hidden bg-slate-950/40 aspect-square flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="object-cover w-full h-full"
                    onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-rose-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="absolute bottom-0 w-full bg-slate-950/70 text-white text-xs p-1 truncate text-center">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleConvert}
                disabled={processing}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                {processing && <Loader2 className="animate-spin h-4 w-4" />}
                {processing ? "Converting..." : "Convert to PDF"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
