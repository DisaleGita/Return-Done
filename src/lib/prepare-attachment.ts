"use client";

import { attachmentLimits, formatBytes, type AttachmentType } from "./attachments";

export interface PreparedAttachment {
  id: string;
  blob: Blob;
  name: string;
  type: AttachmentType;
  size: number;
  /** Small JPEG data URL shown in the form and saved with the return. */
  preview?: string;
}

const PREVIEW_SIDE = 480;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
      type,
      quality,
    ),
  );
}

function draw(bitmap: ImageBitmap, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff"; // transparent PNGs become white, not black, as JPEG
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Gets a chosen file ready to upload. PDFs pass through. Photos are
 * downscaled to keep uploads small while QR codes and barcodes stay readable.
 */
export async function prepareAttachment(
  file: File,
): Promise<PreparedAttachment | { error: string }> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  if (isPdf) {
    if (file.size > attachmentLimits.maxTotalBytes) {
      return {
        error: `"${file.name}" is larger than ${formatBytes(attachmentLimits.maxTotalBytes)}`,
      };
    }
    return { id, blob: file, name: file.name, type: "application/pdf", size: file.size };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: `We couldn't read "${file.name}". Try a JPG, PNG or PDF.` };
  }

  try {
    const fitsAlready =
      IMAGE_TYPES.has(file.type) &&
      file.size <= 1024 * 1024 &&
      Math.max(bitmap.width, bitmap.height) <= attachmentLimits.maxImageSide;
    const blob = fitsAlready
      ? file
      : await canvasBlob(draw(bitmap, attachmentLimits.maxImageSide), "image/jpeg", 0.88);
    const preview = draw(bitmap, PREVIEW_SIDE).toDataURL("image/jpeg", 0.75);
    const name = fitsAlready ? file.name : file.name.replace(/\.[^.]*$/, "") + ".jpg";
    return {
      id,
      blob,
      name,
      type: fitsAlready ? (file.type as AttachmentType) : "image/jpeg",
      size: blob.size,
      preview,
    };
  } finally {
    bitmap.close();
  }
}
