import Link from "next/link";
import { FileText, Image as ImageIcon, Layers, Minimize2, Merge } from "lucide-react";

const features = [
  {
    title: "PDF to Image",
    description: "Convert PDF pages to high-quality images (JPG/PNG).",
    href: "/pdf-to-image",
    icon: ImageIcon,
    color: "bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400",
  },
  {
    title: "Image to PDF",
    description: "Convert images to PDF documents.",
    href: "/image-to-pdf",
    icon: FileText,
    color: "bg-gradient-to-r from-emerald-400 to-lime-400",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality.",
    href: "/pdf-compress",
    icon: Minimize2,
    color: "bg-gradient-to-r from-amber-400 to-orange-500",
  },
  {
    title: "Compress Image",
    description: "Compress images without losing visible quality.",
    href: "/image-compress",
    icon: Layers,
    color: "bg-gradient-to-r from-fuchsia-400 to-rose-500",
  },
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one.",
    href: "/merge-pdf",
    icon: Merge,
    color: "bg-gradient-to-r from-indigo-400 to-purple-500",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            All-in-One PDF & Image Tools
          </span>
        </h1>
        <p className="text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
          Secure, private, and fast. Every conversion and compression happens locally in your browser—your files never leave your device.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40 hover:border-cyan-400/40 hover:shadow-cyan-500/20 transition-all"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} text-slate-950 shadow-lg shadow-white/20`}>
              <feature.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-cyan-300">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
