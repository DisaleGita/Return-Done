"use client";

import { useId, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, QrCode, X } from "lucide-react";
import { ACCEPT_ATTRIBUTE, attachmentLimits, formatBytes } from "@/lib/attachments";
import { prepareAttachment, type PreparedAttachment } from "@/lib/prepare-attachment";
import styles from "./AttachmentPicker.module.css";

interface Props {
  files: PreparedAttachment[];
  onChange: (files: PreparedAttachment[]) => void;
  /** Error from the server, e.g. a file that turned out not to be an image or PDF. */
  error?: string;
}

/** Lets the customer attach return labels, QR codes or barcodes (photos or PDFs). */
export function AttachmentPicker({ files, onChange, error }: Props) {
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const shown = message ?? error ?? null;
  const total = files.reduce((sum, f) => sum + f.size, 0);
  const full = files.length >= attachmentLimits.maxFiles;

  async function add(list: FileList | File[]) {
    setMessage(null);
    const chosen = [...list];
    if (!chosen.length) return;
    const room = attachmentLimits.maxFiles - files.length;
    if (chosen.length > room) {
      setMessage(`You can attach up to ${attachmentLimits.maxFiles} files.`);
      chosen.length = Math.max(0, room);
    }
    setBusy(true);
    const next = [...files];
    let size = total;
    for (const file of chosen) {
      const prepared = await prepareAttachment(file);
      if ("error" in prepared) {
        setMessage(prepared.error);
        continue;
      }
      if (size + prepared.size > attachmentLimits.maxTotalBytes) {
        setMessage(
          `Attachments must be under ${formatBytes(attachmentLimits.maxTotalBytes)} in total.`,
        );
        continue;
      }
      size += prepared.size;
      next.push(prepared);
    }
    setBusy(false);
    onChange(next);
    if (input.current) input.current.value = "";
  }

  return (
    <div className={styles.picker}>
      <div className={styles.labelRow}>
        <label htmlFor={inputId} className={styles.label}>
          Return label, QR code or barcode
        </label>
        <span className={styles.optional}>Optional</span>
      </div>
      <p id={hintId} className={styles.hint}>
        A screenshot, photo or PDF from the retailer. Up to {attachmentLimits.maxFiles} files. We
        attach them to your confirmation email and never store them.
      </p>

      {!full && (
        <label
          htmlFor={inputId}
          className={styles.drop}
          data-dragging={dragging || undefined}
          data-invalid={shown ? "" : undefined}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void add(event.dataTransfer.files);
          }}
        >
          {busy ? (
            <Loader2 className={styles.spin} aria-hidden="true" />
          ) : (
            <QrCode aria-hidden="true" />
          )}
          <span>
            <strong>{busy ? "Preparing…" : "Choose files"}</strong>
            <span className={styles.dropMeta}> or drag them here · JPG, PNG, WebP or PDF</span>
          </span>
        </label>
      )}
      <input
        ref={input}
        id={inputId}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="visually-hidden"
        aria-describedby={hintId}
        disabled={busy || full}
        onChange={(event) => event.target.files && void add(event.target.files)}
      />

      <p className={styles.error} role="alert" aria-live="assertive">
        {shown}
      </p>

      {files.length > 0 && (
        <ul className={styles.list} aria-label="Attached files">
          {files.map((file) => (
            <li key={file.id} className={styles.item}>
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
                <img src={file.preview} alt="" className={styles.thumb} />
              ) : (
                <span className={styles.pdf} aria-hidden="true">
                  <FileText />
                </span>
              )}
              <span className={styles.meta}>
                <span className={styles.name}>{file.name}</span>
                <span className={styles.size}>
                  {file.type === "application/pdf" ? "PDF" : "Image"} · {formatBytes(file.size)}
                </span>
              </span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(files.filter((f) => f.id !== file.id))}
                aria-label={`Remove ${file.name}`}
              >
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <p className={styles.total}>
          <Paperclip aria-hidden="true" /> {files.length} of {attachmentLimits.maxFiles} files ·{" "}
          {formatBytes(total)} of {formatBytes(attachmentLimits.maxTotalBytes)}
        </p>
      )}
    </div>
  );
}
