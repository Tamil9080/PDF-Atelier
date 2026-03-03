# PDF Converter & Image Tools

PDF Atelier is a secure, client-side workspace for PDF and image manipulation. Every conversion, compression, and merge runs entirely in the browser, so your files never touch a server.

## Features

- **PDF to Image**: Convert PDF pages to high-quality JPG or PNG exports.
- **Image to PDF**: Combine multiple images into a single PDF document.
- **Compress PDF**: Optimize structure and reduce size while keeping legibility.
- **Compress Image**: Shrink images for the web without hurting sharpness.
- **Merge PDF**: Drag multiple PDFs into one cohesive document.
- **PDF to Word**: Capture text from PDFs into editable DOCX files fully offline.
- **PDF to PowerPoint**: Storyboard PDF content into widescreen PPTX slides.
- **Word to PDF**: Flatten DOCX briefs into review-ready PDFs.
- **PowerPoint to PDF**: Export PPTX decks as lightweight PDFs.
- **Split PDF**: Define page ranges and download each slice inside a ZIP.
- **Rotate PDF**: Fix sideways scans or rotate every page in a stack instantly.
- **Add Watermark**: Stamp diagonal text marks with custom opacity and size.
- **Protect PDF**: Encrypt PDFs with viewer/owner passwords and permissions.
- **Remove Password**: Decrypt PDFs (with the correct password) for sharing.
- **OCR Workspace**: Use Tesseract.js to extract text from scans and photos.
- **Batch Processing**: Apply rotate, watermark, or protect actions to many PDFs at once.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) using the App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Key Libraries**: `pdf-lib-plus-encrypt`, `jspdf`, `browser-image-compression`, `docx`, `pptxgenjs`, `jszip`, `tesseract.js`, `react-dropzone`, `@dnd-kit/core`, `lucide-react`

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

Deploy to any Next.js-friendly host (Vercel, Netlify, Render, or your own Node server). Make sure to set `NODE_ENV=production` and run `npm run build` before serving with `npm start`.
