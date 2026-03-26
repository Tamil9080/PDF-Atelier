# PDF Converter & Image Tools

PDF Atelier is a secure, client-side workspace for PDF and image manipulation. Every conversion, compression, and merge runs entirely in the browser, so your files never touch a server.

## Features

- **PDF to Image**: Convert PDF pages to high-quality JPG or PNG exports.
- **Image to PDF**: Combine multiple images into a single PDF document.
- **Compress PDF**: Optimize structure and reduce size while keeping legibility.
- **Compress Image**: Shrink images for the web without hurting sharpness.
- **Merge PDF**: Drag multiple PDFs into one cohesive document.
- **Split PDF**: Define page ranges and download each slice inside a ZIP.
- **Rotate PDF**: Fix sideways scans or rotate every page in a stack instantly.
- **Add Watermark**: Stamp diagonal text marks with custom opacity and size.
- **Protect PDF**: Encrypt PDFs with viewer/owner passwords and permissions.
- **Remove Password**: Decrypt PDFs (with the correct password) for sharing.
- **Batch Processing**: Apply rotate, watermark, or protect actions to many PDFs at once.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 App Router with React Server Components + edge-ready APIs.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 with custom gradients plus CSS variables in `globals.css`.
- **Workers**: Dedicated Web Workers under `src/workers` handle compression and crypto off the main thread.
- **Key Libraries**: `pdf-lib-plus-encrypt`, `jspdf`, `browser-image-compression`, `jszip`, `react-dropzone`, `@dnd-kit/core`, `lucide-react`.
- **Tooling**: TypeScript strict mode, ESLint flat config, and Next Font for deterministic typography.

## Architecture

The app keeps every document on-device by combining WASM-heavy libraries, App Router layouts, and background workers.

1. **App shell**: `src/app/layout.tsx` wires global fonts, nav, footer, and shared metadata for the pdfatelier.in domain.
2. **Feature routes**: Each tool (e.g., `/pdf-compress`, `/batch-processing`) lives inside `src/app/<tool>/page.tsx`, letting routes stream independently.
3. **UI components**: `Navbar`, `Footer`, and `Dropzone` share glassmorphism styling plus responsive layouts.
4. **Processing layer**: Utility helpers in `src/lib/utils.ts` coordinate `pdf-lib` and `browser-image-compression` before handing work to workers such as `pdfCompress.worker.ts`.
5. **Resilience**: Global `loading.tsx` and `error.tsx` surfaces keep the experience branded even during suspense or unexpected failures.

This structure keeps UX snappy, isolates heavy operations, and allows deploying to static or edge platforms without server state.

## Roadmap

- [ ] **Realtime batch presets** – sync watermark, rotate, and protection presets across workspaces.
- [ ] **Desktop bridge** – package the Next.js frontend via Tauri/Electron for offline desktop installs.
- [ ] **More converters** – add PDF ↔️ Excel plus AI-assisted redaction flows.
- [ ] **Accessibility pass** – expand keyboard traps, prefers-reduced-motion fallbacks, and narration hints.
- [ ] **Telemetry opt-in** – ship a privacy-preserving toggle so teams can visualize throughput without exposing docs.

## Contribution Guide

1. **Fork & clone**
   ```bash
   git clone https://github.com/<you>/pdf-converter.git
   cd pdf-converter
   ```
2. **Install & verify**
   ```bash
   npm install
   npm run lint && npm run dev
   ```
   Ensure all core flows (convert, compress, merge) run locally before submitting changes.
3. **Create a feature branch**
   ```bash
   git checkout -b feat/<short-description>
   ```
4. **Write focused commits** that include docs/tests where relevant. Keep UI updates accessible (ARIA labels, keyboard flows).
5. **Open a pull request** against `main`, describing:
   - Problem solved
   - Screenshots/video for UI work
   - Testing steps (`npm run lint`, manual flows)

Questions? Open a discussion or ping hello@pdfatelier.in.

## Security Posture

- Strict HTTP headers (CSP, HSTS, COOP, CORP, Permissions-Policy) are configured in `next.config.ts`.
- File uploads stay local—`Dropzone` validates MIME types, extensions, and 25&nbsp;MB limits before any processing.
- Workers and libraries run on-device, so no third-party servers ever receive document bytes.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Demo

Use this quick flow to showcase the polished landing page and each tool view.

1. **Install dependencies** (skip if already done):
   ```bash
   npm install
   ```

2. **Launch the dev server**:
   ```bash
   npm run dev
   ```

3. **Explore the toolkit** once [http://localhost:3000](http://localhost:3000) is live:
   - Hero and stat blocks highlight on-device processing.
   - Toolkit grid links directly to PDF <-> image converters, compressors, and merge tools.
   - Workflow timeline walks through drag, tune, and export.
   - Assurance panel explains local-first privacy and WebAssembly speed.

4. **Preview the production build** (optional):
   ```bash
   npm run build && npm start
   ```
   This compiles the Next.js app and serves the same optimized bundle you will deploy.

## Deployment

Deploy to any Next.js-friendly host (Vercel, Netlify, Render, or your own Node server). Make sure to set `NODE_ENV=production` and run `npm run build` before serving with `npm start`
