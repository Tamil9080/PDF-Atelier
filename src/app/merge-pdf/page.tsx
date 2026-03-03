"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { Loader2, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dropzone } from "@/components/Dropzone";

type FileEntry = {
  id: string;
  file: File;
};

export default function MergePdf() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [processing, setProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
      })),
    ]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setFiles((prev) => {
      const oldIndex = prev.findIndex((entry) => entry.id === active.id);
      const newIndex = prev.findIndex((entry) => entry.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleMerge = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const entry of files) {
        const arrayBuffer = await entry.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      saveAs(blob, "merged.pdf");
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Error merging PDFs.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
          Merge PDF Files
        </h1>
        <p className="text-slate-300">
          Combine multiple PDF files into one document. Drag to reorder before merging.
        </p>
      </div>

      <div className="bg-slate-900/60 p-6 rounded-2xl shadow-lg border border-white/10">
        <Dropzone
          onDrop={handleDrop}
          accept={{ "application/pdf": [".pdf"] }}
          label="Upload PDFs to merge"
        />

        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Files to Merge ({files.length})</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={files.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {files.map((entry, index) => (
                    <SortableFileRow
                      key={entry.id}
                      id={entry.id}
                      index={index + 1}
                      file={entry.file}
                      onRemove={removeFile}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleMerge}
                disabled={processing}
                className="bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 hover:from-cyan-300 hover:via-sky-400 hover:to-indigo-400 text-slate-950 px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-500/30"
              >
                {processing && <Loader2 className="animate-spin h-4 w-4" />}
                {processing ? "Merging..." : "Merge PDFs"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type SortableFileRowProps = {
  id: string;
  file: File;
  index: number;
  onRemove: (id: string) => void;
};

function SortableFileRow({ id, file, index, onRemove }: SortableFileRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  } as CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg border border-white/10 transition-colors ${isDragging ? "bg-cyan-500/20 border-cyan-400/50" : "bg-slate-950/40 hover:border-cyan-400/40 hover:bg-cyan-500/10"}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="text-xs font-semibold text-slate-400 w-6 text-center">{index}</div>
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold">PDF</div>
        <span className="truncate font-medium text-white">{file.name}</span>
        <span className="text-xs text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="text-slate-400 hover:text-rose-300 p-1 rounded-full hover:bg-rose-500/10 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
