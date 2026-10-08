import { describe, expect, it } from "vitest";
import {
  attachmentLimits,
  formatBytes,
  safeFilename,
  sniffType,
  validateAttachments,
} from "./attachments";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const PDF = new TextEncoder().encode("%PDF-1.7\nlabel");
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
const EXE = new TextEncoder().encode("MZ\x90\0this is not an image");

describe("sniffType", () => {
  it("identifies files from their bytes", () => {
    expect(sniffType(PNG)).toBe("image/png");
    expect(sniffType(JPEG)).toBe("image/jpeg");
    expect(sniffType(PDF)).toBe("application/pdf");
    expect(sniffType(WEBP)).toBe("image/webp");
  });

  it("rejects everything else, whatever it's called", () => {
    expect(sniffType(EXE)).toBeNull();
    expect(sniffType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffType(new Uint8Array())).toBeNull();
  });
});

describe("safeFilename", () => {
  it("strips paths and odd characters and fixes the extension", () => {
    expect(safeFilename("../../etc/passwd.png", "image/png", 0)).toBe("etcpasswd.png");
    expect(safeFilename("UPS Return Label (1).PDF", "application/pdf", 0)).toBe(
      "UPS-Return-Label-1.pdf",
    );
    expect(safeFilename("photo.heic", "image/jpeg", 0)).toBe("photo.jpg");
    expect(safeFilename("<<>>.png", "image/png", 2)).toBe("return-label-3.png");
  });
});

describe("validateAttachments", () => {
  it("accepts up to three real images or PDFs and names them safely", () => {
    const result = validateAttachments([
      { name: "qr.png", bytes: PNG },
      { name: "label.pdf", bytes: PDF },
    ]);
    expect(result).toEqual({
      ok: true,
      files: [
        { filename: "qr.png", type: "image/png", content: PNG },
        { filename: "label.pdf", type: "application/pdf", content: PDF },
      ],
    });
  });

  it("gives repeated names a suffix", () => {
    const result = validateAttachments([
      { name: "label.png", bytes: PNG },
      { name: "label.png", bytes: PNG },
    ]);
    expect(result.ok && result.files.map((f) => f.filename)).toEqual(["label.png", "label-2.png"]);
  });

  it("rejects a disguised file", () => {
    expect(validateAttachments([{ name: "label.png", bytes: EXE }])).toEqual({
      ok: false,
      message: `"label.png" isn't a JPG, PNG, WebP or PDF file`,
    });
  });

  it("enforces the file count and total size", () => {
    const four = Array.from({ length: 4 }, (_, i) => ({ name: `${i}.png`, bytes: PNG }));
    expect(validateAttachments(four)).toMatchObject({ ok: false, message: "Attach up to 3 files" });

    const big = new Uint8Array(attachmentLimits.maxTotalBytes + 1);
    big.set(PNG);
    expect(validateAttachments([{ name: "big.png", bytes: big }])).toMatchObject({ ok: false });
  });

  it("allows no attachments at all", () => {
    expect(validateAttachments([])).toEqual({ ok: true, files: [] });
  });
});

describe("formatBytes", () => {
  it("is readable", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(4 * 1024 * 1024)).toBe("4.0 MB");
  });
});
