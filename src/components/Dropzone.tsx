"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ALLOWED_EXTENSIONS,
  DEFAULT_ALLOWED_MIME,
  DEFAULT_MAX_FILE_SIZE,
  formatBytes,
  validateFileSecurity,
} from "@/lib/security";

interface DropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  className?: string;
  label?: string;
  multiple?: boolean;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
  onSecurityError?: (errors: string[]) => void;
}

export function Dropzone({
  onDrop,
  accept,
  maxFiles,
  className,
  label,
  multiple = true,
  allowedMimeTypes,
  maxSizeBytes,
  onSecurityError,
}: DropzoneProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const normalizedAllowedMime = useMemo(() => {
    if (allowedMimeTypes?.length) {
      return allowedMimeTypes.map((type) => type.toLowerCase());
    }
    if (accept) {
      return Object.keys(accept).map((type) => type.toLowerCase());
    }
    return DEFAULT_ALLOWED_MIME;
  }, [accept, allowedMimeTypes]);

  const normalizedAllowedExtensions = useMemo(() => {
    if (!accept) {
      return DEFAULT_ALLOWED_EXTENSIONS;
    }
    const extensions = Object.values(accept).flat();
    return extensions.length ? extensions : DEFAULT_ALLOWED_EXTENSIONS;
  }, [accept]);

  const normalizedMaxSize = maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE;

  const allowedLabels = useMemo(
    () =>
      normalizedAllowedMime.map((type) => {
        const label = type.split("/").pop();
        return label ? label.toUpperCase() : type.toUpperCase();
      }),
    [normalizedAllowedMime]
  );

  const effectiveAccept = useMemo(() => {
    if (accept) {
      return accept;
    }
    return normalizedAllowedMime.reduce<Record<string, string[]>>((map, type) => {
      map[type] = [];
      return map;
    }, {});
  }, [accept, normalizedAllowedMime]);

  const validator = useCallback(
    (file: File) => {
      const message = validateFileSecurity(file, {
        allowedMimeTypes: normalizedAllowedMime,
        allowedExtensions: normalizedAllowedExtensions,
        maxSizeBytes: normalizedMaxSize,
      });
      return message ? { code: "security-reject", message } : null;
    },
    [normalizedAllowedExtensions, normalizedAllowedMime, normalizedMaxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setErrors([]);
      onDrop(acceptedFiles);
    },
    onDropRejected: (rejections) => {
      const rejectionMessages = rejections.flatMap((rejection) => rejection.errors.map((error) => error.message));
      setErrors(rejectionMessages);
      onSecurityError?.(rejectionMessages);
    },
    accept: effectiveAccept,
    maxFiles,
    multiple,
    maxSize: normalizedMaxSize,
    validator,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "group border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 bg-slate-900/60 border-white/15 hover:border-cyan-400/60 hover:shadow-cyan-500/20 hover:shadow-xl",
          isDragActive ? "border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-cyan-500/30 shadow-2xl" : "",
          className
        )}
        aria-label="Secure file dropzone"
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            "relative p-4 rounded-2xl bg-gradient-to-br from-cyan-400/30 via-sky-500/20 to-indigo-500/30 transition-transform duration-300 group-hover:scale-105",
            isDragActive ? "animate-pulse" : ""
          )}
        >
          {isDragActive && (
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan-300/70"
              aria-hidden="true"
            />
          )}
          <UploadCloud className="h-8 w-8 text-cyan-300" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">
            {isDragActive ? "Drop the files here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {label || "Files stay on-device and never leave your browser."}
          </p>
          <p className="text-xs text-cyan-300/90 mt-1" aria-live="polite">
            {isDragActive ? "Release to start secure processing" : "Drag files in to see instant preview"}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Max {formatBytes(normalizedMaxSize)} · Allowed: {allowedLabels.join(", ")}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="assertive">
          {errors.map((message, index) => (
            <li
              key={`${message}-${index}`}
              className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
            >
              {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
