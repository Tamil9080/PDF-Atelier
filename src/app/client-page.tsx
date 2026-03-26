"use client";

import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { motion, useScroll, useTransform, type Transition, type Variants } from "framer-motion";
import Tilt from "react-parallax-tilt";
import {
  ArrowUpRight,
  Cpu,
  Droplets,
  FileText,
  Image as ImageIcon,
  Layers,
  Lock,
  Merge,
  Minimize2,
  RotateCcw,
  Scissors,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Unlock,
  Zap,
} from "lucide-react";
import { useRef } from "react";

const displayFont = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const heroStats = [
  { label: "Documents optimized", value: "2.3M+", detail: "processed fully on-device" },
  { label: "Avg. export time", value: "4.2s", detail: "even on large PDFs" },
  { label: "Compression saved", value: "68%", detail: "storage reclaimed" },
];

const featureCards = [
  { title: "PDF to Image", description: "Slice multipage PDFs into gallery-ready PNG or JPG assets.", href: "/pdf-to-image", icon: ImageIcon, palette: "from-cyan-400 via-sky-400 to-indigo-400", badge: "Convert", meta: "PNG · JPG" },
  { title: "Image to PDF", description: "Lay out crisp PDF decks from raw shots or mockups in seconds.", href: "/image-to-pdf", icon: FileText, palette: "from-emerald-400 to-lime-400", badge: "Assemble", meta: "Batch ready" },
  { title: "Compress PDF", description: "Dial in file sizes without crushing typography or brand colors.", href: "/pdf-compress", icon: Minimize2, palette: "from-amber-400 to-orange-500", badge: "Refine", meta: "Loss-aware" },
  { title: "Compress Image", description: "Ship web-speed imagery that still feels print-grade sharp.", href: "/image-compress", icon: Layers, palette: "from-fuchsia-400 to-rose-500", badge: "Polish", meta: "Web · Mobile" },
  { title: "Merge PDF", description: "Drag multiple PDFs into a single narrative with zero upload.", href: "/merge-pdf", icon: Merge, palette: "from-indigo-400 to-purple-500", badge: "Compile", meta: "Smart order" },
  { title: "Split PDF", description: "Extract custom ranges into perfectly packaged ZIP bundles.", href: "/pdf-split", icon: Scissors, palette: "from-rose-400 to-pink-500", badge: "Segment", meta: "Ranges" },
  { title: "Rotate PDF", description: "Fix sideways scans in bulk with one precise rotation.", href: "/pdf-rotate", icon: RotateCcw, palette: "from-cyan-400 to-blue-500", badge: "Edit", meta: "0° · 90° · 180°" },
  { title: "Add Watermark", description: "Lay diagonal brand watermarks with tunable opacity per page.", href: "/pdf-watermark", icon: Droplets, palette: "from-indigo-400 to-violet-500", badge: "Secure", meta: "Text layer" },
  { title: "Protect PDF", description: "Encrypt documents with user/owner passwords and rules.", href: "/pdf-protect", icon: Shield, palette: "from-emerald-400 to-cyan-500", badge: "Lock", meta: "Permissions" },
  { title: "Unlock PDF", description: "Strip passwords (with authorization) for easier sharing.", href: "/pdf-unlock", icon: Unlock, palette: "from-amber-400 to-orange-500", badge: "Unlock", meta: "Decrypt" },
  { title: "Batch Processing", description: "Apply rotate, watermark, or lock actions to entire folders.", href: "/batch-processing", icon: Settings2, palette: "from-sky-400 to-emerald-400", badge: "Automate", meta: "ZIP output" },
];

const workflowSteps = [
  { title: "Drop files anywhere", description: "Drag a stack of PDFs or images and we auto-detect intent.", badge: "01" },
  { title: "Tune the outcome", description: "Adjust compression, format, margins, and brand presets live.", badge: "02" },
  { title: "Export instantly", description: "Processing finishes before your cursor leaves the button.", badge: "03" },
];

const trustSignals = [
  { title: "Local-first privacy", description: "All conversions run in-browser so nothing ever hits a server.", icon: ShieldCheck, colors: "from-emerald-400 to-teal-400" },
  { title: "Encrypted cache", description: "Temporary data is sealed and cleared every session automatically.", icon: Lock, colors: "from-sky-400 to-indigo-400" },
  { title: "Performance cores", description: "Optimized WebAssembly pipelines crunch multi-hundred page docs.", icon: Cpu, colors: "from-amber-400 to-rose-400" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const springInTransition: Transition = {
  type: "spring",
  stiffness: 100,
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: springInTransition },
};

export default function ClientPage() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="space-y-24" ref={ref}>
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 px-6 py-12 sm:px-10 lg:px-14">
        <motion.div style={{ y: yBg }} className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-[120px]" />
        <motion.div style={{ y: yBg }} className="absolute -bottom-32 right-8 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[150px]" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="space-y-8">
            <motion.span variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              New Flow Engine
            </motion.span>
            <motion.h1 variants={itemVariants} className={`${displayFont.className} text-4xl leading-tight text-slate-50 sm:text-5xl lg:text-6xl`}>
              Design-forward PDF & image automation for teams that obsess over detail.
            </motion.h1>
            <motion.p variants={itemVariants} className="text-base text-slate-300 sm:text-lg">
              PDF Atelier is the free PDF to image converter online for teams that demand polish and privacy. Convert PDF to image without
              upload, orchestrate a client side PDF converter workflow, and rely on a secure PDF converter online that never ships your files
              to a server.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Link
                href="/pdf-to-image"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_20px_45px_-25px_rgba(6,182,212,0.8)] transition-transform hover:scale-105"
              >
                Launch Converter
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-slate-100 transition-colors hover:bg-white/10"
              >
                Explore Toolkit
              </Link>
            </motion.div>
            <motion.div variants={containerVariants} className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <motion.div variants={itemVariants} key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 hover:border-cyan-400/50">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                  <p className={`${displayFont.className} mt-2 text-3xl text-white`}>{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.detail}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative">
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} perspective={1000} scale={1.02} transitionSpeed={2000} className="relative z-10">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_40px_120px_-60px_rgba(15,118,255,0.8)] backdrop-blur-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Preview</p>
                    <p className={`${displayFont.className} text-3xl text-white`}>Atelier Console</p>
                  </div>
                  <div className="flex -space-x-3">
                    {["#0ea5e9", "#f472b6", "#a855f7"].map((color) => (
                      <span key={color} className="h-10 w-10 rounded-full border-2 border-slate-900" style={{ background: color }} />
                    ))}
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  {featureCards.slice(0, 3).map((feature) => (
                    <div key={feature.title} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:border-cyan-400/30">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.palette} text-slate-900`}>
                          <feature.icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{feature.title}</p>
                          <p className="text-xs text-slate-400">{feature.meta}</p>
                        </div>
                      </div>
                      <Zap className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 text-sm font-semibold text-slate-900 shadow-inner">
                  Everything runs locally—zero uploads, zero waiting.
                </div>
              </div>
            </Tilt>
            <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-[24px] border border-white/10 bg-slate-900/80 blur-[1px]" />
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="space-y-8">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="flex flex-col gap-3 text-center sm:text-left"
        >
          <motion.p variants={itemVariants} className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Toolkit</motion.p>
          <motion.div variants={itemVariants} className="grid gap-4 sm:items-end sm:justify-between lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.6fr)]">
            <h2 className={`${displayFont.className} text-3xl text-white sm:text-4xl`}>
              A studio of converters, compressors, and editors for polished delivery.
            </h2>
            <p className="text-sm text-slate-400 sm:text-base">
              Mix and match tools without page refreshes. Every card below deep-links into its focused workspace.
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div 
             initial="hidden" 
             whileInView="visible" 
             viewport={{ once: true, margin: "-50px" }}
             variants={containerVariants}
             className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {featureCards.map((feature) => (
            <motion.div variants={itemVariants} key={feature.title}>
              <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} perspective={1500} scale={1.01} transitionSpeed={1000} className="h-full">
                <Link
                  href={feature.href}
                  className="group flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 transition-colors hover:bg-slate-900/80 hover:border-cyan-400/50 hover:shadow-[0_25px_60px_-35px_rgba(8,145,178,0.8)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{feature.badge}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-cyan-300" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.palette} text-slate-950 shadow-lg shadow-white/10 transition-transform group-hover:scale-110`}>
                      <feature.icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-slate-400">{feature.meta}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 flex-grow">
                    {feature.description}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500 transition-colors group-hover:text-cyan-400">Open tool</span>
                </Link>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <motion.section 
         initial="hidden" 
         whileInView="visible" 
         viewport={{ once: true, margin: "-100px" }}
         variants={containerVariants}
         className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <motion.div variants={itemVariants} className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Workflow</p>
              <h3 className={`${displayFont.className} mt-2 text-3xl text-white`}>
                Three tactile steps from import to export.
              </h3>
            </div>
            <span className="rounded-full border border-white/10 px-4 py-1 text-xs font-semibold text-slate-300">Realtime preview</span>
          </div>
          <ol className="mt-8 space-y-6">
            {workflowSteps.map((step, idx) => (
              <motion.li 
                variants={itemVariants} 
                custom={idx}
                key={step.badge} 
                className="relative rounded-3xl border border-white/5 bg-white/5 p-5 pl-14 transition-colors hover:bg-white/10 hover:border-white/20"
              >
                <span className="absolute left-5 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-slate-950 text-sm font-semibold text-white shadow-[0_10px_40px_-20px_rgba(14,165,233,0.8)]">
                  {step.badge}
                </span>
                <p className="text-sm font-semibold text-cyan-200">{step.title}</p>
                <p className="text-sm text-slate-300">{step.description}</p>
              </motion.li>
            ))}
          </ol>
        </motion.div>

        <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} perspective={1000} scale={1.01} transitionSpeed={2000}>
          <motion.div variants={itemVariants} className="relative overflow-hidden h-full rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl">
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/40 blur-[120px]" />
            <div className="relative space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Assurance</p>
              <h3 className={`${displayFont.className} text-3xl text-white`}>
                Built for privacy-critical organizations.
              </h3>
              <p className="text-sm text-slate-300">
                No uploads, no queues, no mystery servers. PDF Atelier leans on WebAssembly + service workers to keep everything inside your browser sandbox.
              </p>
              <ul className="space-y-5">
                {trustSignals.map((signal) => (
                  <li key={signal.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${signal.colors} text-slate-950 shadow-lg`}>
                      <signal.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{signal.title}</p>
                      <p className="text-sm text-slate-400">{signal.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </Tilt>
      </motion.section>

      <motion.section 
         initial="hidden" 
         whileInView="visible" 
         viewport={{ once: true, margin: "-100px" }}
         variants={itemVariants}
         className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-8 py-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.25),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(244,114,182,0.2),transparent_40%)] opacity-60" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200">Next Up</p>
            <h3 className={`${displayFont.className} text-3xl text-white sm:text-4xl`}>
              Spin up your next PDF experiment in under a minute.
            </h3>
            <p className="text-sm text-slate-300 sm:text-base">
              Start free, stay private, and feel the difference of an interface crafted like a product launch site.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/image-to-pdf"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 transition-transform hover:scale-105"
            >
              Launch Studio
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Browse features
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
