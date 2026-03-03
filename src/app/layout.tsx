import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfatelier.in"),
  title: "PDF Converter & Image Tools",
  description: "A simple client-side PDF and image processing tool.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PDF Converter & Image Tools",
    description: "Client-side PDF + image automation built for privacy.",
    url: "https://pdfatelier.in",
    siteName: "PDF Atelier",
    images: [
      {
        url: "/file.svg",
        width: 512,
        height: 512,
        alt: "PDF Atelier preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Atelier",
    description: "Convert, compress, and protect PDFs locally in your browser.",
    site: "@pdfatelier",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col text-slate-100`}
      >
        <Navbar />
        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
