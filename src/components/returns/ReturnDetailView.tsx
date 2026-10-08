"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, FastForward, FileText, MapPin, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatLongDate, relativeDayLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { STATUS_META, nextStatus } from "@/lib/returns";
import { returnsStore, useReturns } from "@/lib/returns-store";
import { windowLabel } from "@/lib/scheduling";
import { RetailerAvatar } from "./RetailerAvatar";
import { ReturnTimeline } from "./ReturnTimeline";
import { StatusBadge } from "./StatusBadge";
import styles from "./ReturnDetailView.module.css";

const yesNo = (value?: boolean) => (value === undefined ? "Not sure" : value ? "Yes" : "No");

export function ReturnDetailView({ id }: { id: string }) {
  const records = useReturns();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const now = useMemo(() => new Date(), []);

  if (records === null) {
    return (
      <div className={`container ${styles.page}`} aria-busy="true">
        <Skeleton width={140} height={14} />
        <div style={{ marginTop: 32, display: "grid", gap: 12 }}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="60%" height={36} />
        </div>
        <div className={styles.layout} style={{ marginTop: 32 }}>
          <Skeleton height={380} radius={16} />
          <Skeleton height={380} radius={16} />
        </div>
      </div>
    );
  }

  const record = records.find((r) => r.id.toLowerCase() === id.toLowerCase());

  if (!record) {
    return (
      <div className={`container ${styles.page} page-enter`}>
        <EmptyState
          icon={<SearchX />}
          title="That return couldn't be found."
          action={<Button href="/dashboard">Back to your returns</Button>}
        >
          Check the tracking number. It looks like <code>RD-2026-1847</code>. Demo returns are
          stored in this browser, so returns scheduled on another device won&apos;t show up here.
        </EmptyState>
      </div>
    );
  }

  const upcoming = nextStatus(record.status);
  const { address } = record.pickup;

  async function copyTrackingNumber() {
    try {
      await navigator.clipboard.writeText(record!.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({
        tone: "error",
        title: "Couldn't copy",
        description: "Select the tracking number and copy it manually.",
      });
    }
  }

  function simulateNextUpdate() {
    const updated = returnsStore.advance(record!.id);
    if (updated) {
      toast({
        tone: "success",
        title: STATUS_META[updated.status].label,
        description: STATUS_META[updated.status].description,
      });
    }
  }

  return (
    <div className={`container ${styles.page} page-enter`}>
      <Link href="/dashboard" className={styles.back}>
        <ArrowLeft aria-hidden="true" /> Your returns
      </Link>

      <header className={styles.header}>
        <RetailerAvatar name={record.retailerName} size={56} />
        <div className={styles.headerText}>
          <p className={styles.retailer}>{record.retailerName}</p>
          <h1 className={styles.title}>
            {record.itemDescription}
            {record.itemCount > 1 && <span className={styles.count}> ×{record.itemCount}</span>}
          </h1>
          <div className={styles.meta}>
            <StatusBadge status={record.status} />
            <button type="button" className={styles.tracking} onClick={copyTrackingNumber}>
              <span className="visually-hidden">Copy tracking number </span>
              {record.id}
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            </button>
            <span className="visually-hidden" aria-live="polite">
              {copied ? "Tracking number copied" : ""}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Card as="section" aria-labelledby="progress-heading">
            <h2 id="progress-heading" className={styles.cardTitle}>
              Progress
            </h2>
            <div className={styles.timeline}>
              <ReturnTimeline record={record} />
            </div>
          </Card>

          {record.attachments && record.attachments.length > 0 && (
            <Card as="section" aria-labelledby="label-heading">
              <h2 id="label-heading" className={styles.cardTitle}>
                Your label &amp; QR code
              </h2>
              <p className={styles.muted}>
                Our driver uses these at pickup. A copy was attached to your confirmation email.
              </p>
              <ul className={styles.labels}>
                {record.attachments.map((file) => (
                  <li key={file.name}>
                    {file.preview ? (
                      <figure>
                        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                        <img src={file.preview} alt={`Uploaded return label: ${file.name}`} />
                        <figcaption>{file.name}</figcaption>
                      </figure>
                    ) : (
                      <p className={styles.pdfFile}>
                        <FileText aria-hidden="true" />
                        <span>
                          {file.name}
                          <span className={styles.sub}>PDF · in your confirmation email</span>
                        </span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card as="section" className={styles.demoCard} aria-labelledby="demo-heading">
            <div>
              <h2 id="demo-heading" className={styles.cardTitle}>
                Demo controls
              </h2>
              <p className={styles.muted}>
                In production, status updates come from drivers and carrier tracking. Here you can
                step through them yourself.
              </p>
            </div>
            <Button
              variant="secondary"
              icon={<FastForward />}
              onClick={simulateNextUpdate}
              disabled={!upcoming}
            >
              {upcoming ? `Simulate: ${STATUS_META[upcoming].label}` : "Return complete"}
            </Button>
          </Card>
        </div>

        <aside className={styles.side}>
          <Card as="section" aria-labelledby="pickup-heading">
            <h2 id="pickup-heading" className={styles.cardTitle}>
              Pickup
            </h2>
            <dl className={styles.list}>
              <div>
                <dt>When</dt>
                <dd>
                  {formatLongDate(record.pickup.date)}
                  <span className={styles.sub}>{windowLabel(record.pickup.windowId)}</span>
                </dd>
              </div>
              <div>
                <dt>Where</dt>
                <dd className={styles.address}>
                  <MapPin aria-hidden="true" />
                  <span>
                    {address.line1}
                    {address.line2 && `, ${address.line2}`}
                    <br />
                    {address.city}, {address.state} {address.zip}
                  </span>
                </dd>
              </div>
              {record.pickup.instructions && (
                <div>
                  <dt>Instructions</dt>
                  <dd className={styles.quote}>{record.pickup.instructions}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card as="section" aria-labelledby="details-heading">
            <h2 id="details-heading" className={styles.cardTitle}>
              Return details
            </h2>
            <dl className={`${styles.list} ${styles.grid}`}>
              <div>
                <dt>Expected refund</dt>
                <dd className="tabular">
                  {record.refundAmount !== undefined ? formatMoney(record.refundAmount) : "—"}
                </dd>
              </div>
              <div>
                <dt>Return by</dt>
                <dd>
                  {record.returnDeadline
                    ? formatDate(record.returnDeadline, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not set"}
                  {record.returnDeadline && record.status === "pickup_scheduled" && (
                    <span className={styles.sub}>
                      {relativeDayLabel(record.returnDeadline, now)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Order number</dt>
                <dd className={styles.mono}>{record.orderNumber ?? "—"}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{record.reason ?? "—"}</dd>
              </div>
              <div>
                <dt>Original packaging</dt>
                <dd>{yesNo(record.hasOriginalPackaging)}</dd>
              </div>
              <div>
                <dt>Label / QR code</dt>
                <dd>
                  {record.attachments?.length
                    ? "Uploaded"
                    : record.hasQrCode
                      ? "QR code"
                      : record.hasReturnLabel
                        ? "Label"
                        : "We'll sort it"}
                </dd>
              </div>
              <div>
                <dt>Carrier</dt>
                <dd>{record.carrier ?? "We'll choose"}</dd>
              </div>
            </dl>
          </Card>

          <Card as="section" aria-labelledby="price-heading">
            <h2 id="price-heading" className={styles.cardTitle}>
              Payment
            </h2>
            <ul className={styles.priceLines}>
              {record.price.lines.map((line) => (
                <li key={line.label}>
                  <span>{line.label}</span>
                  <span className="tabular">{formatMoney(line.amount)}</span>
                </li>
              ))}
              <li className={styles.total}>
                <span>Total</span>
                <span className="tabular">{formatMoney(record.price.total)}</span>
              </li>
            </ul>
            <p className={styles.muted}>Demo. No payment was taken.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
