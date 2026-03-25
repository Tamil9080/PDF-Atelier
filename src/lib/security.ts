export const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB ceiling keeps processing performant.
export const DEFAULT_ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
export const DEFAULT_ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

export type FileValidationOptions = {
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  maxSizeBytes?: number;
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const decimals = value < 10 && index > 0 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[index]}`;
}

export function validateFileSecurity(file: File, options: FileValidationOptions = {}): string | null {
  const {
    allowedMimeTypes = DEFAULT_ALLOWED_MIME,
    allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
    maxSizeBytes = DEFAULT_MAX_FILE_SIZE,
  } = options;

  if (!file || typeof file !== "object") {
    return "Invalid file payload.";
  }

  if (file.size > maxSizeBytes) {
    return `${file.name} exceeds the ${formatBytes(maxSizeBytes)} limit.`;
  }

  const mimeType = typeof file.type === "string" ? file.type.toLowerCase() : "";
  const fileName = typeof file.name === "string" ? file.name : "";
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : undefined;
  const normalizedAllowedMime = Array.isArray(allowedMimeTypes)
    ? allowedMimeTypes.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase())
    : DEFAULT_ALLOWED_MIME;
  const normalizedExtensions = Array.isArray(allowedExtensions)
    ? allowedExtensions
        .filter((ext): ext is string => typeof ext === "string" && ext.length > 0)
        .map((ext) => ext.replace(/^(\.)?/, ".").toLowerCase())
    : DEFAULT_ALLOWED_EXTENSIONS;

  const mimeAllowed = mimeType ? normalizedAllowedMime.includes(mimeType) : false;
  const extensionAllowed = extension ? normalizedExtensions.includes(`.${extension}`) : false;

  if (!mimeAllowed && !extensionAllowed) {
    const fallbackName = fileName || "This file";
    return `${fallbackName} is not an accepted file type.`;
  }

  return null;
}
