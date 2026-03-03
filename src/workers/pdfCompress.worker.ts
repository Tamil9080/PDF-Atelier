/// <reference lib="webworker" />

import { PDFDocument } from "pdf-lib";

type CompressRequest = {
  id: string;
  arrayBuffer: ArrayBuffer;
};

type CompressResponse =
  | { id: string; success: true; data: Uint8Array }
  | { id: string; success: false; error: string };

self.onmessage = async (event: MessageEvent<CompressRequest>) => {
  const { id, arrayBuffer } = event.data;

  try {
    const sourceDoc = await PDFDocument.load(arrayBuffer);
    const targetDoc = await PDFDocument.create();
    const copiedPages = await targetDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
    copiedPages.forEach((page) => targetDoc.addPage(page));
    const pdfBytes = await targetDoc.save();

    const response: CompressResponse = { id, success: true, data: pdfBytes };
    (self as DedicatedWorkerGlobalScope).postMessage(response, [pdfBytes.buffer]);
  } catch (error) {
    console.error("PDF compression worker error", error);
    const response: CompressResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown worker error",
    };
    (self as DedicatedWorkerGlobalScope).postMessage(response);
  }
};

export {};