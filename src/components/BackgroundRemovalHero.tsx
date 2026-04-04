"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, MoveHorizontal, Wand2, ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import { Dropzone } from "./Dropzone";
import {
  applyMaskToCanvas,
  canvasToBlob,
  createStylizedCanvas,
  MODEL_URL,
  getBackgroundRemovalSession,
  imageToTensor,
  tensorToMask,
} from "@/lib/background-removal";
import { saveAs } from "file-saver";

type ViewMode = "original" | "removed" | "stylized";

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

async function hasLocalModelAsset() {
  try {
    const response = await fetch(MODEL_URL, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function ComparisonFrame({
  originalSrc,
  processedSrc,
  split,
  comparisonLabel,
  setSplit,
}: {
  originalSrc: string;
  processedSrc: string;
  split: number;
  comparisonLabel: string;
  setSplit: Dispatch<SetStateAction<number>>;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const updateSplitFromClientX = (clientX: number) => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const nextSplit = Math.round(((clientX - rect.left) / rect.width) * 100);
    setSplit(Math.min(100, Math.max(0, nextSplit)));
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }

      updateSplitFromClientX(event.clientX);
    };

    const handlePointerUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative overflow-hidden rounded-[24px] border border-white/10 dark:bg-black/60 bg-white/30 aspect-square"
      onWheel={(event) => {
        event.preventDefault();
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (delta === 0) {
          return;
        }

        setSplit((current) => Math.min(100, Math.max(0, current + (delta > 0 ? 3 : -3))));
      }}
    >
      <img src={originalSrc} alt="Original preview" className="absolute inset-0 h-full w-full object-contain" />

      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <img src={processedSrc} alt={comparisonLabel} className="h-full w-full object-contain" />
      </div>

      <div
        className="absolute inset-y-0 cursor-col-resize"
        style={{ left: `${split}%`, transform: "translateX(-50%)" }}
        onPointerDown={(event) => {
          draggingRef.current = true;
          updateSplitFromClientX(event.clientX);
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-cyan-300/80 shadow-[0_0_20px_rgba(103,232,249,0.9)]" />
        <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/50 bg-black/90 text-cyan-100 shadow-[0_0_30px_rgba(56,189,248,0.35)]">
          <MoveHorizontal className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-100 backdrop-blur-sm">
        Before / After
      </div>

      <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-100 backdrop-blur-sm">
        {comparisonLabel}
      </div>
    </div>
  );
}

export function BackgroundRemovalHero() {
  const [file, setFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [removedPreview, setRemovedPreview] = useState<string | null>(null);
  const [stylizedPreview, setStylizedPreview] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("removed");
  const [comparisonSplit, setComparisonSplit] = useState(52);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Drop an image to start.");

  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const removedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stylizedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const removedBlobRef = useRef<Blob | null>(null);
  const stylizedBlobRef = useRef<Blob | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!file) {
      setSourcePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSourcePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview);
      }
      if (stylizedPreview) {
        URL.revokeObjectURL(stylizedPreview);
      }
    };
  }, [removedPreview, stylizedPreview]);

  useEffect(() => {
    if (!file) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const run = async () => {
      setProcessing(true);
      setError(null);
      setStatus("AI Processing...");

      try {
        const { tensor, canvas } = await imageToTensor(file, 512);
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        sourceCanvasRef.current = canvas;

        const localModelExists = await hasLocalModelAsset();
        if (!localModelExists) {
          removedBlobRef.current = null;
          stylizedBlobRef.current = null;
          removedCanvasRef.current = null;
          stylizedCanvasRef.current = null;
          setRemovedPreview(null);
          setStylizedPreview(null);
          setError("Model file missing: add u2netp.onnx to public/models/ and refresh.");
          setStatus("Missing local model.");
          return;
        }

        const session = await getBackgroundRemovalSession();
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        const inputName = session.inputNames[0];
        const outputName = session.outputNames[0];
        const feeds = { [inputName]: tensor } as Record<string, typeof tensor>;
        const results = await session.run(feeds);
        const outputTensor = results[outputName] ?? Object.values(results)[0];

        if (!outputTensor) {
          throw new Error("The ONNX model did not return a segmentation mask.");
        }

        const maskCanvas = tensorToMask(outputTensor);
        const removedCanvas = applyMaskToCanvas(canvas, maskCanvas);
        const stylizedCanvas = createStylizedCanvas(canvas);

        removedCanvasRef.current = removedCanvas;
        stylizedCanvasRef.current = stylizedCanvas;

        const [removedBlob, stylizedBlob] = await Promise.all([
          canvasToBlob(removedCanvas),
          canvasToBlob(stylizedCanvas),
        ]);
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        removedBlobRef.current = removedBlob;
        stylizedBlobRef.current = stylizedBlob;

        setRemovedPreview((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return URL.createObjectURL(removedBlob);
        });

        setStylizedPreview((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return URL.createObjectURL(stylizedBlob);
        });

        setViewMode("removed");
        setComparisonSplit(52);
        setStatus("Background removed locally.");
      } catch (processingError) {
        console.error(processingError);
        const message =
          processingError instanceof Error ? processingError.message : "Unknown processing error.";
        setError(
          message.includes("u2netp.onnx")
            ? "Missing model: place u2netp.onnx inside public/models/."
            : "Local AI processing failed. Make sure the ONNX model is available and reload the page."
        );
        setStatus("Ready to retry.");
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setProcessing(false);
        }
      }
    };

    void run();
  }, [file]);

  const activePreview = [
    { mode: "original" as const, preview: sourcePreview },
    { mode: "removed" as const, preview: removedPreview },
    { mode: "stylized" as const, preview: stylizedPreview },
  ].find((item) => item.mode === viewMode)?.preview || null;

  const handleDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) {
      return;
    }

    setFile(acceptedFiles[0]);
    setError(null);
    setStatus("Preparing local inference...");

    if (removedPreview) {
      URL.revokeObjectURL(removedPreview);
      setRemovedPreview(null);
    }

    if (stylizedPreview) {
      URL.revokeObjectURL(stylizedPreview);
      setStylizedPreview(null);
    }

    setViewMode("removed");
  };

  const handleReset = () => {
    if (removedPreview) {
      URL.revokeObjectURL(removedPreview);
    }

    if (stylizedPreview) {
      URL.revokeObjectURL(stylizedPreview);
    }

    setFile(null);
    setSourcePreview(null);
    setRemovedPreview(null);
    setStylizedPreview(null);
    removedBlobRef.current = null;
    stylizedBlobRef.current = null;
    setError(null);
    setStatus("Drop an image to start.");
    setViewMode("removed");
    setComparisonSplit(52);
    sourceCanvasRef.current = null;
    removedCanvasRef.current = null;
    stylizedCanvasRef.current = null;
  };

  const handleDownload = async () => {
    if (!file) {
      return;
    }

    if (viewMode === "removed" && removedBlobRef.current) {
      saveAs(removedBlobRef.current, `${stripExtension(file.name)}-no-bg.png`);
      return;
    }

    if (viewMode === "stylized" && stylizedBlobRef.current) {
      saveAs(stylizedBlobRef.current, `${stripExtension(file.name)}-nothing-style.png`);
      return;
    }

    const canvas =
      viewMode === "original"
        ? sourceCanvasRef.current
        : viewMode === "stylized"
          ? stylizedCanvasRef.current
          : removedCanvasRef.current;

    if (!canvas) {
      return;
    }

    const blob = await canvasToBlob(canvas);
    const suffix = viewMode === "original" ? "original" : viewMode === "stylized" ? "nothing-style" : "no-bg";
    saveAs(blob, `${stripExtension(file.name)}-${suffix}.png`);
  };

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 dark:bg-slate-950/70 bg-slate-50 px-6 py-12 sm:px-10 lg:px-14 mb-16">
      <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute -bottom-32 right-8 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[150px]" />

      <div className="relative">
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          {/* Left sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="space-y-6"
          >
            <div className="rounded-[28px] border border-white/10 dark:bg-white/5 bg-white/50 p-6 shadow-[0_20px_90px_-55px_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] dark:text-slate-400 text-slate-600">Upload</p>
                  <h2 className="mt-2 text-2xl font-semibold dark:text-white text-slate-900">Drop an image</h2>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  Local AI
                </span>
              </div>

              <Dropzone
                onDrop={handleDrop}
                accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp"] }}
                maxFiles={1}
                multiple={false}
                label="Drop image here. Processing stays in browser."
                className="border-white/10 dark:bg-black/40 bg-white/30"
              />

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { mode: "original" as const, icon: ImageIcon, label: "Original" },
                  { mode: "removed" as const, icon: Sparkles, label: "Removed" },
                  { mode: "stylized" as const, icon: Wand2, label: "Stylized" },
                ].map((item) => {
                  const active = viewMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setViewMode(item.mode)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "border-cyan-300/40 dark:bg-cyan-400/10 bg-cyan-400/20 shadow-[0_18px_60px_-28px_rgba(34,211,238,0.55)]"
                          : "border-white/10 dark:bg-black/30 bg-white/30 hover:border-white/20 dark:hover:bg-white/5"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 mb-2 ${active ? "text-cyan-200" : "dark:text-slate-400 text-slate-600"}`} />
                      <p>{item.label}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!file || processing || !activePreview}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 px-5 py-3 font-semibold text-slate-950 shadow-[0_16px_40px_-20px_rgba(34,211,238,0.95)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 dark:bg-black/30 bg-white/30 px-5 py-3 font-semibold dark:text-white text-slate-900 transition-colors dark:hover:bg-white/5 hover:bg-white/50"
                >
                  <RotateCcw className="h-5 w-5" />
                  Reset
                </button>
              </div>

              {file && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                  ✓ {file.name}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">
                  ✗ {error}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="rounded-[28px] border border-white/10 dark:bg-white/5 bg-white/50 p-4 sm:p-6 shadow-[0_30px_110px_-60px_rgba(34,211,238,0.35)] backdrop-blur-xl"
          >
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] dark:text-slate-400 text-slate-600">Preview</p>
                <h3 className="mt-2 text-lg font-semibold dark:text-white text-slate-900">
                {viewMode === "stylized" ? "∞ Nothing™ Glyph Style" : viewMode === "original" ? "Original" : "Background Removed"}
              </h3>
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-white/10 dark:bg-black/60 bg-white/30 aspect-square">
              <AnimatePresence mode="wait">
                {processing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full"
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
                      <p className="text-sm font-semibold dark:text-white text-slate-900">Processing...</p>
                    </div>
                  </motion.div>
                ) : sourcePreview && activePreview ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="p-3"
                  >
                    <ComparisonFrame
                      originalSrc={sourcePreview}
                      processedSrc={activePreview}
                      split={comparisonSplit}
                      comparisonLabel={viewMode === "stylized" ? "Stylized output" : "Background removed"}
                      setSplit={setComparisonSplit}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full"
                  >
                    <div className="text-center">
                      <Wand2 className="h-12 w-12 mx-auto mb-3 dark:text-slate-600 text-slate-400 opacity-50" />
                      <p className="text-xs dark:text-slate-500 text-slate-600">{status}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            
          </motion.div>
        </div>
      </div>
    </section>
  );
}
