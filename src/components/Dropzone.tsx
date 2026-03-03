"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  className?: string;
  label?: string;
  multiple?: boolean;
}

export function Dropzone({ onDrop, accept, maxFiles, className, label, multiple = true }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-4 bg-slate-900/60 border-white/15 hover:border-cyan-400/60 hover:shadow-cyan-500/20 hover:shadow-xl",
        isDragActive ? "border-cyan-400 bg-cyan-500/10" : "",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-400/30 via-sky-500/20 to-indigo-500/30">
        <UploadCloud className="h-8 w-8 text-cyan-300" />
      </div>
      <div>
        <p className="text-lg font-semibold text-white">
          {isDragActive ? "Drop the files here" : "Click to upload or drag and drop"}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          {label || "Supported files: depending on tool"}
        </p>
      </div>
    </div>
  );
}
