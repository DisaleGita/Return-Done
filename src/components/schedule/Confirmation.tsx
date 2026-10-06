"use client";

import type { RefObject } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Mail,
  MailWarning,
  MapPin,
  PackageOpen,
  Plus,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ReturnTimeline } from "@/components/returns/ReturnTimeline";
import { formatLongDate } from "@/lib/dates";
import type { EmailResult } from "@/lib/email/types";
import { formatMoney } from "@/lib/pricing";
import type { ReturnRecord } from "@/lib/returns";
import { windowLabel } from "@/lib/scheduling";
import styles from "./Confirmation.module.css";

// Adapted from the tips on the original 2023 confirmation page.
const TIPS = [
  {
    icon: PackageOpen,
    title: "Skip the packing",
    body: "Leave the item unpacked. Our driver checks its condition at the door, then boxes, tapes and labels it.",
  },
  {
    icon: ScanLine,
    title: "Got a label or QR code?",
    body: "Have it on your phone. If not, that's fine. We'll sort out the label with the retailer.",
  },
  {
    icon: CalendarCheck,
    title: "Need to change plans?",
    body: "You can reschedule up to two hours before your window starts.",
  },
];

function EmailNotice({ to, result }: { to: string; result: EmailResult }) {
  if (result.status === "sent" && result.mode === "test") {
    return (
      <p className={styles.email} role="status">
        <Mail aria-hidden="true" />
        <span>
          Test email for <strong>{to}</strong> was captured by Ethereal, not delivered.{" "}
          <a href={result.previewUrl} target="_blank" rel="noreferrer">
            View the test email <ArrowUpRight aria-hidden="true" />
          </a>
        </span>
      </p>
    );
  }
  if (result.status === "sent") {
    return (
      <p className={styles.email} role="status">
        <Mail aria-hidden="true" />
        <span>
          Confirmation sent to <strong>{to}</strong>.
        </span>
      </p>
    );
  }
  return (
    <p className={`${styles.email} ${styles.emailMuted}`} role="status">
      <MailWarning aria-hidden="true" />
      <span>
        {result.status === "failed"
          ? "We couldn't send the confirmation email, but your pickup is booked."
          : `${result.reason}, so nothing was sent to ${to}.`}
      </span>
    </p>
  );
}

interface ConfirmationProps {
  record: ReturnRecord;
  email: { to: string; result: EmailResult } | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onScheduleAnother: () => void;
}

export function Confirmation({ record, email, headingRef, onScheduleAnother }: ConfirmationProps) {
  const { address } = record.pickup;
  return (
    <div className={`${styles.wrapper} page-enter`}>
      <div className={styles.hero}>
        <svg className={styles.check} viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d="M15 27l7 7 15-16" />
        </svg>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          Your return is scheduled <span aria-hidden="true">🎉</span>
        </h1>
        <p className={styles.lede}>
          We&apos;ll see you {formatLongDate(record.pickup.date)},{" "}
          {windowLabel(record.pickup.windowId)}.
        </p>
        <div className={styles.tracking}>
          <span>Tracking number</span>
          <strong>{record.id}</strong>
        </div>
        {email && <EmailNotice to={email.to} result={email.result} />}
      </div>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="pickup-summary">
          <h2 id="pickup-summary" className={styles.cardTitle}>
            Pickup details
          </h2>
          <dl className={styles.facts}>
            <div>
              <dt>Returning</dt>
              <dd>
                {record.itemDescription}
                {record.itemCount > 1 && ` ×${record.itemCount}`}
                <span>to {record.retailerName}</span>
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd className={styles.address}>
                <MapPin aria-hidden="true" />
                <span>
                  {address.line1}
                  {address.line2 && `, ${address.line2}`}, {address.city}, {address.state}{" "}
                  {address.zip}
                </span>
              </dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className="tabular">
                {formatMoney(record.price.total)} <span>Demo. No payment taken</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.card} aria-labelledby="next-steps">
          <h2 id="next-steps" className={styles.cardTitle}>
            What happens next
          </h2>
          <div className={styles.timeline}>
            <ReturnTimeline record={record} compact />
          </div>
        </section>
      </div>

      <ul className={styles.tips}>
        {TIPS.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <span className={styles.tipIcon} aria-hidden="true">
              <Icon />
            </span>
            <p>
              <strong>{title}</strong>
              {body}
            </p>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <Button href={`/returns/${record.id}`} size="lg" iconRight={<ArrowRight />}>
          Track this return
        </Button>
        <Button href="/dashboard" variant="secondary" size="lg">
          Go to your returns
        </Button>
        <Button variant="ghost" size="lg" icon={<Plus />} onClick={onScheduleAnother}>
          Schedule another
        </Button>
      </div>
    </div>
  );
}
