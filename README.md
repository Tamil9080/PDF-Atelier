# PDF Converter & Image Tools

A secure, client-side web application for PDF and image manipulation. All processing happens in your browser—files are never uploaded to a server, ensuring your privacy.

## Features

- **PDF to Image**: Convert PDF pages to high-quality images (JPG).
- **Image to PDF**: Combine multiple images into a single PDF document.
- **Compress PDF**: Optimize PDF file structure.
- **Compress Image**: Reduce image file size while maintaining quality.
- **Merge PDF**: Combine multiple PDF files into one.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Libraries**:
  - `pdf-lib`: PDF manipulation
  - `pdfjs-dist`: PDF rendering
  - `jspdf`: Image to PDF conversion
  - `browser-image-compression`: Image optimization
  - `react-dropzone`: Drag and drop file handling
  - `lucide-react`: Icons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

This is a static-compatible Next.js application. You can deploy it to Vercel, Netlify, or any static hosting provider.
