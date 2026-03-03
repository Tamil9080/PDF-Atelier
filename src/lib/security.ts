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

  if (file.size > maxSizeBytes) {
    return `${file.name} exceeds the ${formatBytes(maxSizeBytes)} limit.`;
  }

  const mimeType = file.type?.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase();
  const normalizedExtensions = allowedExtensions.map((ext) => ext.replace(/^(\.)?/, "."));

  const mimeAllowed = mimeType ? allowedMimeTypes.includes(mimeType) : false;
  const extensionAllowed = extension ? normalizedExtensions.includes(`.${extension}`) : false;

  if (!mimeAllowed && !extensionAllowed) {
    return `${file.name} is not an accepted file type.`;
  }

  return null;
}
