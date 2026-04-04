"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BarChart3,
  Brain,
  BookMarked,
  FileUp,
  Loader2,
  Scale,
  Send,
  Sparkles,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type PresetCategory = "General" | "Contract" | "Finance" | "Resume" | "Report" | "Manual";

type PresetState = {
  categories: PresetCategory[];
  presetsByCategory: Record<PresetCategory, string[]>;
};

const BASE_PRESETS = [
  "Summarize this PDF in 6 bullet points",
  "List key action items with deadlines",
  "Highlight risks and important clauses",
];

const CATEGORY_LABELS: PresetCategory[] = ["General", "Contract", "Finance", "Resume", "Report", "Manual"];

const CATEGORY_ICONS: Record<PresetCategory, LucideIcon> = {
  General: Sparkles,
  Contract: Scale,
  Finance: TrendingUp,
  Resume: Award,
  Report: BarChart3,
  Manual: BookMarked,
};

// Load from environment variables with fallbacks
const MAX_PDF_CONTEXT_CHARS = parseInt(process.env.NEXT_PUBLIC_MAX_PDF_CONTEXT_CHARS || process.env.MAX_PDF_CONTEXT_CHARS || "30000", 10);
const MAX_PDF_CONTEXT_PAGES = parseInt(process.env.NEXT_PUBLIC_MAX_PDF_CONTEXT_PAGES || process.env.MAX_PDF_CONTEXT_PAGES || "50", 10);
const SMART_SAMPLING_THRESHOLD = parseInt(process.env.NEXT_PUBLIC_SMART_SAMPLING_THRESHOLD || process.env.SMART_SAMPLING_THRESHOLD || "50", 10);

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

// Smart sampling for large PDFs
function getPageIndicesToRead(totalPages: number, maxPages: number): number[] {
  if (totalPages <= maxPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // For PDFs larger than threshold, sample strategically
  const indices: number[] = [];
  
  // Always include first 5 pages (likely introduction/TOC)
  for (let i = 1; i <= Math.min(5, totalPages); i += 1) {
    indices.push(i);
  }

  // Sample middle pages evenly
  const step = Math.max(1, Math.floor((totalPages - 10) / (maxPages - 10)));
  for (let i = 6; i < totalPages - 5; i += step) {
    if (indices.length < maxPages - 5) {
      indices.push(i);
    }
  }

  // Always include last 5 pages (likely conclusion/appendix)
  for (let i = Math.max(totalPages - 4, 6); i <= totalPages; i += 1) {
    if (!indices.includes(i)) {
      indices.push(i);
    }
  }

  return indices.slice(0, maxPages).sort((a, b) => a - b);
}

function buildPresetsFromPdf(pdfContext: string, fileName: string): PresetState {
  const lower = `${fileName} ${pdfContext}`.toLowerCase();

  const presetsByCategory: Record<PresetCategory, string[]> = {
    General: [...BASE_PRESETS],
    Contract: [
      "Extract obligations by party with page references",
      "Find termination, renewal, and penalty clauses",
      "List critical deadlines and notice periods",
    ],
    Finance: [
      "Summarize financial highlights and totals",
      "List unusual numbers or cost spikes",
      "Extract all figures with their page references",
    ],
    Resume: [
      "Evaluate candidate strengths and gaps",
      "Draft 5 interview questions from this profile",
      "Summarize skills by category",
    ],
    Report: [
      "Summarize methodology, findings, and conclusion",
      "List assumptions and limitations mentioned",
      "Extract key recommendations with page references",
    ],
    Manual: [
      "Convert this into a step-by-step checklist",
      "Identify prerequisites and common failure points",
      "Extract troubleshooting steps and warnings",
    ],
  };

  const detected: PresetCategory[] = ["General"];

  if (/(contract|agreement|nda|terms|liability|clause)/.test(lower)) detected.push("Contract");
  if (/(invoice|balance sheet|profit|loss|revenue|expense|budget|financial)/.test(lower)) detected.push("Finance");
  if (/(resume|cv|candidate|experience|skills|education)/.test(lower)) detected.push("Resume");
  if (/(report|analysis|study|research|methodology|findings)/.test(lower)) detected.push("Report");
  if (/(manual|guide|procedure|workflow|step)/.test(lower)) detected.push("Manual");

  const categories = CATEGORY_LABELS.filter((cat) => detected.includes(cat));

  return { categories, presetsByCategory };
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
           className={`pdf-chat-bubble max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm border transition-all duration-300 animate-fade-up ${
             isUser ? "pdf-chat-bubble-user" : "pdf-chat-bubble-assistant"
           }`}
      >
         <div className="pdf-chat-bubble-label mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide">
          {isUser ? <User className="h-3.5 w-3.5" aria-hidden="true" /> : <Brain className="h-3.5 w-3.5" aria-hidden="true" />}
          {isUser ? "You" : "AI"}
        </div>
        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
      </article>
    </div>
  );
}

export default function PdfChatPage() {
  const [fileName, setFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [input, setInput] = useState("");
  const [pdfContext, setPdfContext] = useState("");
  const [indexedPages, setIndexedPages] = useState(0);
  const [isIndexingPdf, setIsIndexingPdf] = useState(false);
  const [presetState, setPresetState] = useState<PresetState>({
    categories: ["General"],
    presetsByCategory: {
      General: [...BASE_PRESETS],
      Contract: [],
      Finance: [],
      Resume: [],
      Report: [],
      Manual: [],
    },
  });
  const [activeCategory, setActiveCategory] = useState<PresetCategory>("General");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I am ready to analyze your PDF. Upload a file and ask your first question.",
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activePresets = presetState.presetsByCategory[activeCategory].length
    ? presetState.presetsByCategory[activeCategory]
    : BASE_PRESETS;



  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isResponding]);





  const extractPdfContext = async (file: File) => {
    setIsIndexingPdf(true);
    setPdfContext("");
    setIndexedPages(0);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      // Use the local worker from the pdfjs-dist package
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

      const data = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;

      // Smart page selection for large PDFs
      const pageIndices = getPageIndicesToRead(pdf.numPages, MAX_PDF_CONTEXT_PAGES);
      const isSampling = pdf.numPages > SMART_SAMPLING_THRESHOLD;

      const collected: string[] = [];
      let consumedChars = 0;
      let textPages = 0;

      // If sampling, add a note to the context
      if (isSampling) {
        const samplingNote = `[Note: This is a ${pdf.numPages}-page document. Smart sampling is extracting strategically selected pages to stay within context limits. First 5, last 5, and evenly sampled middle pages are included.]`;
        collected.push(samplingNote);
        consumedChars += samplingNote.length;
      }

      for (const pageNum of pageIndices) {
        if (consumedChars >= MAX_PDF_CONTEXT_CHARS) {
          break;
        }

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = normalizeText(textContent.items.map((item) => ("str" in item ? item.str : "")).join(" "));
        if (!pageText) {
          continue;
        }

        const pageBlock = `[Page ${pageNum}] ${pageText}`;
        const remaining = MAX_PDF_CONTEXT_CHARS - consumedChars;
        if (pageBlock.length > remaining) {
          collected.push(pageBlock.slice(0, remaining));
          consumedChars += remaining;
          textPages += 1;
          break;
        }

        collected.push(pageBlock);
        consumedChars += pageBlock.length;
        textPages += 1;
      }

      const compiled = collected.join("\n\n");
      setPdfContext(compiled);
      setIndexedPages(textPages);

      return { context: compiled, textPages, totalPages: pdf.numPages, isSampled: isSampling };
    } finally {
      setIsIndexingPdf(false);
    }
  };

  const attachFile = async (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: "Please upload a valid PDF file only.",
        },
      ]);
      return;
    }

    setFileName(file.name);
    const { context, textPages } = await extractPdfContext(file);

    if (context) {
      const detected = buildPresetsFromPdf(context, file.name);
      setPresetState(detected);
      setActiveCategory(detected.categories[0] || "General");
    } else {
      setPresetState({
        categories: ["General"],
        presetsByCategory: {
          General: ["Run OCR on this file first", ...BASE_PRESETS].slice(0, 6),
          Contract: [],
          Finance: [],
          Resume: [],
          Report: [],
          Manual: [],
        },
      });
      setActiveCategory("General");
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-upload-${Date.now()}`,
        role: "assistant",
        text:
          textPages > 0
            ? `Loaded ${file.name}. Indexed ${textPages} page${textPages === 1 ? "" : "s"} of text. You can now ask document-aware questions.`
            : `Loaded ${file.name}, but I could not extract readable text. If this is a scanned PDF, run OCR first.`,
      },
    ]);

    if (!context) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-no-pdf-text-${Date.now()}`,
          role: "assistant",
          text: "No readable text was extracted from this PDF. Answers may be limited until text is available.",
        },
      ]);
    }
  };

  const askPdfAnalyzer = async (prompt: string, history: Message[]) => {
    const response = await fetch("/api/pdf-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        fileName,
        history: history.slice(-6),
        pdfContext,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "AI request failed");
    }

    const payload = (await response.json()) as { reply: string };
    return payload.reply;
  };

  const sendMessage = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isResponding) return;
    if (!fileName) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-no-file-${Date.now()}`,
          role: "assistant",
          text: "Upload a PDF first, then I can answer your questions.",
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput("");

    setIsResponding(true);
    askPdfAnalyzer(trimmed, nextHistory)
      .then((reply) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: reply,
          },
        ]);
      })
      .catch((error) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            text: error instanceof Error ? error.message : "Something went wrong while contacting AI.",
          },
        ]);
      })
      .finally(() => {
      setIsResponding(false);
      });
  };

  return (
    <div className="pdf-chat-root flex h-screen overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
         <div className="pdf-chat-header border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <h1 className="pdf-chat-title text-base sm:text-lg font-semibold">PDF AI Chat</h1>
            {fileName && (
               <span className="pdf-chat-file-pill text-xs sm:text-sm px-3 py-1 rounded-full">
                📄 {fileName.slice(0, 20)}...
              </span>
            )}
          </div>
          <div />
        </div>

        {/* Chat Messages Area */}
        {!fileName ? (
             <div className="pdf-chat-stage flex-1 flex flex-col items-center justify-center p-4 sm:p-6 space-y-4">
            <div className="text-center space-y-2 max-w-md">
               <h2 className="pdf-chat-title text-2xl sm:text-3xl font-bold">PDF AI Chat</h2>
               <p className="pdf-chat-muted text-sm sm:text-base">Upload a PDF and start asking questions</p>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragOver(false);
                const droppedFile = event.dataTransfer.files?.[0] ?? null;
                void attachFile(droppedFile);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
               className={`pdf-chat-upload-card w-full max-w-lg rounded-xl border-2 border-dashed px-6 py-12 transition-all duration-300 cursor-pointer ${
                 isDragOver
                   ? "pdf-chat-upload-active"
                   : ""
               }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                  void attachFile(event.target.files?.[0] ?? null);
                }}
              />
              <div className="flex flex-col items-center gap-3">
                 <FileUp className="pdf-chat-upload-icon h-8 w-8" />
                <div className="text-center">
                   <p className="pdf-chat-title font-semibold">Drop your PDF here</p>
                   <p className="pdf-chat-muted text-sm">or click to select</p>
                </div>
              </div>
            </div>

            {isIndexingPdf && (
               <div className="pdf-chat-status w-full max-w-lg rounded-lg border px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing PDF...</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
             <section className="pdf-chat-stage flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 pdf-chat-scrollbar">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isResponding && (
                <div className="w-full flex justify-start">
                   <div className="pdf-chat-status rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </section>

            {/* Quick Actions */}
            {fileName && (
               <div className="pdf-chat-presets px-4 sm:px-6 py-3 border-t space-y-3">
                 <p className="pdf-chat-muted text-xs">Suggested presets for this PDF:</p>
                <div className="flex flex-wrap gap-2">
                  {presetState.categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category];
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`pdf-chat-category-chip inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                          activeCategory === category ? "pdf-chat-category-chip-active" : ""
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{category}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activePresets.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => sendMessage(action)}
                      disabled={isResponding}
                       className="pdf-chat-preset-btn text-xs px-3 py-2 rounded-lg border transition"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Input Area */}
         <form
           className="pdf-chat-inputbar border-t px-4 sm:px-6 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
        >
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={fileName ? "Ask something about your PDF..." : "Upload a PDF first..."}
               className="pdf-chat-input flex-1 rounded-lg border px-4 py-3 text-sm outline-none transition"
              disabled={isResponding || !fileName}
            />
            <button
              type="submit"
              disabled={isResponding || input.trim().length === 0 || !fileName}
               className="pdf-chat-send-btn px-4 py-3 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
