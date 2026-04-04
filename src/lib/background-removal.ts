import * as ort from "onnxruntime-web";

export const MAX_INPUT_SIZE = 512;
export const MODEL_URL = "/models/u2netp.onnx";
export const MODEL_INPUT_SIZE = 320;

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let ortConfigured = false;

function configureOrtRuntime() {
  if (ortConfigured) {
    return;
  }

  ort.env.wasm.simd = true;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.initTimeout = 0;
  ort.env.wasm.wasmPaths = {
    mjs: "/ort/ort-wasm-simd-threaded.jsep.mjs",
    wasm: "/ort/ort-wasm-simd-threaded.jsep.wasm",
  };

  ortConfigured = true;
}

export async function getBackgroundRemovalSession() {
  configureOrtRuntime();

  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
  }

  return sessionPromise;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const GLYPH_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*+-=<>?";

function pickGlyph(seed: number) {
  const index = Math.abs(Math.floor(seed)) % GLYPH_POOL.length;
  return GLYPH_POOL[index] ?? ".";
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImageFromBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image."));
    };

    image.src = objectUrl;
  });
}

function getResizeDimensions(width: number, height: number, maxSize: number) {
  const largestSide = Math.max(width, height);
  if (largestSide <= maxSize) {
    return { width, height };
  }

  const scale = maxSize / largestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function imageToTensor(file: File, maxSize = MAX_INPUT_SIZE) {
  const image = await loadImageFromBlob(file);
  const resized = getResizeDimensions(image.naturalWidth || image.width, image.naturalHeight || image.height, maxSize);
  const canvas = createCanvas(resized.width, resized.height);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, resized.width, resized.height);

  const modelCanvas = createCanvas(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const modelContext = modelCanvas.getContext("2d");

  if (!modelContext) {
    throw new Error("Model canvas context is not available.");
  }

  modelContext.imageSmoothingEnabled = true;
  modelContext.imageSmoothingQuality = "high";
  modelContext.drawImage(canvas, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

  const imageData = modelContext.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const { data } = imageData;
  const area = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const tensorData = new Float32Array(area * 3);

  // U2Net expects CHW layout: [1, 3, 320, 320].
  for (let index = 0; index < area; index += 1) {
    const pixelOffset = index * 4;
    tensorData[index] = data[pixelOffset] / 255;
    tensorData[area + index] = data[pixelOffset + 1] / 255;
    tensorData[area * 2 + index] = data[pixelOffset + 2] / 255;
  }

  const tensor = new ort.Tensor("float32", tensorData, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

  return {
    tensor,
    canvas,
    width: resized.width,
    height: resized.height,
    originalWidth: image.naturalWidth || image.width,
    originalHeight: image.naturalHeight || image.height,
  };
}

export function tensorToMask(tensor: ort.Tensor) {
  const shape = tensor.dims.slice(-4);
  const height = Math.max(1, Number(shape[shape.length - 2] ?? tensor.dims[tensor.dims.length - 2] ?? 1));
  const width = Math.max(1, Number(shape[shape.length - 1] ?? tensor.dims[tensor.dims.length - 1] ?? 1));

  const source = tensor.data as Float32Array | number[];
  const maskWidth = Math.max(1, width);
  const maskHeight = Math.max(1, height);
  const canvas = createCanvas(maskWidth, maskHeight);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  const values = new Float32Array(maskWidth * maskHeight);
  const usefulValues = source.length >= values.length ? source : new Float32Array(values.length).fill(0);

  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < usefulValues.length; index += 1) {
    const value = usefulValues[index];
    if (value < minValue) minValue = value;
    if (value > maxValue) maxValue = value;
  }

  const range = maxValue - minValue;
  const useNormalization = Number.isFinite(minValue) && Number.isFinite(maxValue) && range > 0.0001;

  for (let index = 0; index < values.length; index += 1) {
    const rawValue = usefulValues[index] ?? 0;
    const normalized = useNormalization ? (rawValue - minValue) / range : rawValue;
    values[index] = clamp(normalized, 0, 1);
  }

  const imageData = context.createImageData(maskWidth, maskHeight);
  for (let index = 0; index < values.length; index += 1) {
    const alpha = Math.round(values[index] * 255);
    const offset = index * 4;
    imageData.data[offset] = 255;
    imageData.data[offset + 1] = 255;
    imageData.data[offset + 2] = 255;
    imageData.data[offset + 3] = alpha;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

export function applyMaskToCanvas(sourceCanvas: HTMLCanvasElement, maskCanvas: HTMLCanvasElement) {
  const outputCanvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const context = outputCanvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceCanvas, 0, 0);
  context.globalCompositeOperation = "destination-in";
  context.drawImage(maskCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
  context.globalCompositeOperation = "source-over";

  return outputCanvas;
}

export async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to export image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export function createStylizedCanvas(sourceCanvas: HTMLCanvasElement) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = createCanvas(width, height);
  const context = outputCanvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  const sourceContext = sourceCanvas.getContext("2d");
  if (!sourceContext) {
    throw new Error("Source canvas context is not available.");
  }

  const sourceData = sourceContext.getImageData(0, 0, width, height).data;
  const gridSize = Math.max(4, Math.round(Math.min(width, height) / 56));
  const glyphSize = Math.max(8, Math.round(gridSize * 0.95));

  context.fillStyle = "#050505";
  context.fillRect(0, 0, width, height);
  context.font = `700 ${glyphSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      let luminanceSum = 0;
      let sampleCount = 0;

      for (let offsetY = 0; offsetY < gridSize; offsetY += 1) {
        for (let offsetX = 0; offsetX < gridSize; offsetX += 1) {
          const pixelX = x + offsetX;
          const pixelY = y + offsetY;
          if (pixelX >= width || pixelY >= height) {
            continue;
          }

          const index = (pixelY * width + pixelX) * 4;
          const red = sourceData[index];
          const green = sourceData[index + 1];
          const blue = sourceData[index + 2];
          const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
          luminanceSum += luminance;
          sampleCount += 1;
        }
      }

      const averageLuminance = sampleCount > 0 ? luminanceSum / sampleCount : 0;
      const brightness = clamp((averageLuminance - 35) * 1.6, 0, 255);
      const radius = Math.max(0.8, (brightness / 255) * (gridSize * 0.42));

      const centerX = x + gridSize / 2;
      const centerY = y + gridSize / 2;

      if (centerX + radius < 0 || centerY + radius < 0 || centerX - radius > width || centerY - radius > height) {
        continue;
      }

      const sampleX = clamp(Math.round(centerX), 0, width - 1);
      const sampleY = clamp(Math.round(centerY), 0, height - 1);
      const leftIndex = (sampleY * width + clamp(sampleX - 1, 0, width - 1)) * 4;
      const rightIndex = (sampleY * width + clamp(sampleX + 1, 0, width - 1)) * 4;
      const topIndex = (clamp(sampleY - 1, 0, height - 1) * width + sampleX) * 4;
      const bottomIndex = (clamp(sampleY + 1, 0, height - 1) * width + sampleX) * 4;

      const leftLuma = sourceData[leftIndex] * 0.299 + sourceData[leftIndex + 1] * 0.587 + sourceData[leftIndex + 2] * 0.114;
      const rightLuma = sourceData[rightIndex] * 0.299 + sourceData[rightIndex + 1] * 0.587 + sourceData[rightIndex + 2] * 0.114;
      const topLuma = sourceData[topIndex] * 0.299 + sourceData[topIndex + 1] * 0.587 + sourceData[topIndex + 2] * 0.114;
      const bottomLuma = sourceData[bottomIndex] * 0.299 + sourceData[bottomIndex + 1] * 0.587 + sourceData[bottomIndex + 2] * 0.114;
      const edgeStrength = Math.abs(leftLuma - rightLuma) + Math.abs(topLuma - bottomLuma);
      const glyphSeed = centerX * 131 + centerY * 17 + brightness * 19 + edgeStrength * 23;
      const glyph = pickGlyph(glyphSeed);
      const glyphAlpha = clamp(0.35 + brightness / 255, 0.35, 1);

      context.save();
      context.shadowBlur = 0;
      context.fillStyle = `rgba(${Math.round(brightness)}, ${Math.round(brightness)}, ${Math.round(brightness)}, ${glyphAlpha})`;
      context.fillText(glyph, centerX, centerY);
      context.restore();

      if (edgeStrength > 70) {
        context.save();
        context.globalCompositeOperation = "screen";
        context.shadowBlur = 14;
        context.shadowColor = "rgba(90, 224, 255, 0.35)";
        context.fillStyle = "rgba(90, 224, 255, 0.2)";
        context.fillText(glyph, centerX, centerY);
        context.restore();
      }
    }
  }

  // Add trademark watermark
  context.save();
  context.font = "bold 20px system-ui, -apple-system";
  context.fillStyle = "rgba(90, 224, 255, 0.25)";
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.fillText("∞ Nothing™", width - 16, height - 12);
  context.restore();

  return outputCanvas;
}