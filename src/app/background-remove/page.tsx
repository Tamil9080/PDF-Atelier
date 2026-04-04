"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Download, Image as ImageIcon, Loader2, MoveHorizontal, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { saveAs } from "file-saver";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Dropzone } from "@/components/Dropzone";
import {
  applyMaskToCanvas,
  canvasToBlob,
  createStylizedCanvas,
  MODEL_URL,
  getBackgroundRemovalSession,
  imageToTensor,
  tensorToMask,
} from "@/lib/background-removal";

type ViewMode = "original" | "removed" | "stylized";

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
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
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050505] shadow-[0_24px_90px_-45px_rgba(9,180,255,0.45)]"
      onWheel={(event) => {
        event.preventDefault();
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (delta === 0) {
          return;
        }

        setSplit((current) => Math.min(100, Math.max(0, current + (delta > 0 ? 3 : -3))));
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.18),transparent_36%)]" />

      <div className="relative aspect-square w-full">
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
    </div>
  );
}

export default function BackgroundRemovePage() {
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

        const [removedBlob, stylizedBlob] = await Promise.all([canvasToBlob(removedCanvas), canvasToBlob(stylizedCanvas)]);
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
        const message = processingError instanceof Error ? processingError.message : "Unknown processing error.";
        setError(message.includes("u2netp.onnx") ? "Missing model: place u2netp.onnx inside public/models/." : "Local AI processing failed. Make sure the ONNX model is available and reload the page.");
        setStatus("Ready to retry.");
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setProcessing(false);
        }
      }
    };

    void run();
  }, [file]);

  const activePreview = useMemo(() => {
    if (viewMode === "original") {
      return sourcePreview;
    }

    if (viewMode === "stylized") {
      return stylizedPreview;
    }

    return removedPreview;
  }, [removedPreview, sourcePreview, stylizedPreview, viewMode]);

  const activeCanvasRef = useMemo(() => {
    if (viewMode === "original") {
      return sourceCanvasRef;
    }

    if (viewMode === "stylized") {
      return stylizedCanvasRef;
    }

    return removedCanvasRef;
  }, [viewMode]);

  const comparisonLabel = viewMode === "stylized" ? "Stylized output" : "Background removed";

  const modeCards: Array<{
    mode: ViewMode;
    title: string;
    description: string;
    icon: typeof ImageIcon;
  }> = [
    { mode: "original", title: "Original", description: "Source image preview", icon: ImageIcon },
    { mode: "removed", title: "Background Removed", description: "Transparent cutout from U2NetP", icon: Sparkles },
    { mode: "stylized", title: "Stylized", description: "Nothing-style glyph matrix render", icon: Wand2 },
  ];

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
    const canvas = activeCanvasRef.current;
    if (!canvas || !file) {
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

    const blob = await canvasToBlob(canvas);
    const suffix = viewMode === "original" ? "original" : viewMode === "stylized" ? "nothing-style" : "no-bg";
    saveAs(blob, `${stripExtension(file.name)}-${suffix}.png`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#040404_0%,#0b0b0b_48%,#050505_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 px-6 py-8 shadow-[0_20px_80px_-40px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:px-10"
        >
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
                <Cpu className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                Local ONNX Engine
              </span>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Premium background removal with Nothing-style glyph visuals.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Upload an image, run U2NetP fully in the browser with onnxruntime-web, and switch between the original, transparent cutout,
                  and a stylized monochrome render without touching a backend.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">512px max input</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">WASM SIMD + threads</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Transparent PNG export</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { label: "Mode", value: viewMode === "removed" ? "AI cutout" : viewMode === "stylized" ? "Nothing style" : "Original" },
                { label: "Status", value: processing ? "Processing" : status },
                { label: "Input", value: file ? formatMegabytes(file.size) : "No file yet" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="space-y-6"
          >
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_90px_-55px_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Upload</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Drop an image</h2>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  AI Processing...
                </span>
              </div>

              <Dropzone
                onDrop={handleDrop}
                accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp"] }}
                maxFiles={1}
                multiple={false}
                label="Upload a portrait, product shot, or sticker candidate. Everything stays in the browser."
                className="border-white/10 bg-black/40"
              />

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {modeCards.map((card) => {
                  const active = viewMode === card.mode;
                  return (
                    <button
                      key={card.mode}
                      type="button"
                      onClick={() => setViewMode(card.mode)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                        active
                          ? "border-cyan-300/40 bg-cyan-400/10 shadow-[0_18px_60px_-28px_rgba(34,211,238,0.55)]"
                          : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <card.icon className={`h-5 w-5 ${active ? "text-cyan-200" : "text-slate-400"}`} aria-hidden="true" />
                        {active && <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.9)]" />}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-white">{card.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{card.description}</p>
                    </button>
                  );
                })}
              </div>

              {file && (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  Loaded {file.name}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!file || processing || !activePreview}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 px-5 py-3 font-semibold text-slate-950 shadow-[0_16px_40px_-20px_rgba(34,211,238,0.95)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                  Download PNG
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/5"
                >
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                  Reset
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Pipeline</p>
                <p className="mt-2 leading-6">
                  imageToTensor() rescales the upload to 512px max, tensorToMask() converts the ONNX output into a matte, and
                  applyMaskToCanvas() produces the transparent PNG.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_90px_-55px_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-cyan-200">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Nothing-style render</h3>
                  <p className="text-sm text-slate-400">Grayscale, contrast, glyph matrix, and edge glow on a dark canvas.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">Original</div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">Background Removed</div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">Stylized</div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_30px_110px_-60px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{viewMode === "stylized" ? "Stylized" : viewMode === "original" ? "Original" : "Background removed"}</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-slate-300">
                {processing ? "Running local inference" : status}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/60">
              <AnimatePresence mode="wait">
                {processing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex aspect-square w-full items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-5 text-center">
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 shadow-[0_0_70px_rgba(34,211,238,0.18)]">
                        <Loader2 className="h-9 w-9 animate-spin text-cyan-200" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">AI Processing...</p>
                        <p className="mt-2 text-sm text-slate-400">Running U2NetP locally with onnxruntime-web.</p>
                      </div>
                    </div>
                  </motion.div>
                ) : activePreview ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="p-2 sm:p-3"
                  >
                    {viewMode === "original" ? (
                      <div className="relative aspect-square overflow-hidden rounded-[22px] border border-white/5 bg-[#090909]">
                        <img src={activePreview} alt="Original preview" className="h-full w-full object-contain" />
                      </div>
                    ) : sourcePreview && activePreview ? (
                      <div className="space-y-3">
                        <ComparisonFrame
                          originalSrc={sourcePreview}
                          processedSrc={activePreview}
                          split={comparisonSplit}
                          comparisonLabel={comparisonLabel}
                          setSplit={setComparisonSplit}
                        />
                      </div>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex aspect-square w-full items-center justify-center p-10"
                  >
                    <div className="max-w-sm text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
                        <ImageIcon className="h-7 w-7" aria-hidden="true" />
                      </div>
                      <p className="mt-5 text-lg font-semibold text-white">Upload an image to begin</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        The result will render as a transparent PNG, with a stylized Nothing-style view available beside it.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Inference</span>
                U2NetP via onnxruntime-web
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Output</span>
                PNG with transparency
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Style</span>
                Dark glyph matrix treatment
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}