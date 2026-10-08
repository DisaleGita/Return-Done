/**
 * Return labels, QR codes and barcodes the customer attaches when booking.
 * They're attached to the confirmation email and never stored on the server.
 */

export const attachmentLimits = {
  maxFiles: 3,
  /** Vercel functions accept request bodies up to 4.5 MB; leave room for the form. */
  maxTotalBytes: 4 * 1024 * 1024,
  /** Photos are downscaled in the browser to this longest side before upload. */
  maxImageSide: 1800,
} as const;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type AttachmentType = (typeof ACCEPTED_TYPES)[number];

export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp,image/heic,application/pdf";

const EXTENSION: Record<AttachmentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Metadata kept with the return in the browser. `preview` is a small JPEG data URL. */
export interface AttachmentInfo {
  name: string;
  type: AttachmentType;
  size: number;
  preview?: string;
}

/**
 * Identifies a file from its first bytes rather than trusting its name or the
 * type the browser reports.
 */
export function sniffType(bytes: Uint8Array): AttachmentType | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf"; // %PDF-
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** A safe filename with an extension that matches the real type. */
export function safeFilename(name: string, type: AttachmentType, index: number): string {
  const base = name
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || `return-label-${index + 1}`}.${EXTENSION[type]}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ValidatedAttachment {
  filename: string;
  type: AttachmentType;
  content: Uint8Array;
}

export type AttachmentValidation =
  { ok: true; files: ValidatedAttachment[] } | { ok: false; message: string };

/** Server-side check of uploaded files: count, total size and real file type. */
export function validateAttachments(
  files: { name: string; bytes: Uint8Array }[],
): AttachmentValidation {
  if (files.length > attachmentLimits.maxFiles) {
    return { ok: false, message: `Attach up to ${attachmentLimits.maxFiles} files` };
  }
  const total = files.reduce((sum, f) => sum + f.bytes.byteLength, 0);
  if (total > attachmentLimits.maxTotalBytes) {
    return {
      ok: false,
      message: `Attachments must be under ${formatBytes(attachmentLimits.maxTotalBytes)} in total`,
    };
  }
  const validated: ValidatedAttachment[] = [];
  for (const [index, file] of files.entries()) {
    const type = sniffType(file.bytes);
    if (!type) {
      return {
        ok: false,
        message: `"${file.name.slice(0, 40)}" isn't a JPG, PNG, WebP or PDF file`,
      };
    }
    let filename = safeFilename(file.name, type, index);
    // Two uploads named "label.png" become label.png and label-2.png.
    for (let n = 2; validated.some((v) => v.filename === filename); n++) {
      filename = safeFilename(file.name, type, index).replace(/(\.[a-z]+)$/, `-${n}$1`);
    }
    validated.push({ filename, type, content: file.bytes });
  }
  return { ok: true, files: validated };
}
