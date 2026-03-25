import type { Metadata } from "next";
import ClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Free PDF to Image Converter Online | PDF Atelier",
  description:
    "Use PDF Atelier's client-side toolkit to convert PDF to image without upload, run secure PDF workflows, and keep every document private.",
  keywords: [
    "free pdf to image converter online",
    "convert pdf to image without upload",
    "client side pdf converter",
    "secure pdf converter online",
  ],
};

export default function Home() {
  return <ClientPage />;
}

