import Link from "next/link";
import { CalendarClock, Hourglass } from "lucide-react";
import { daysBetween, formatDate, parseISODate, relativeDayLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import {
  deadlineUrgency,
  isComplete,
  progressPercent,
  STATUS_META,
  type ReturnRecord,
} from "@/lib/returns";
import { windowLabel } from "@/lib/scheduling";
import { RetailerAvatar } from "./RetailerAvatar";
import { StatusBadge } from "./StatusBadge";
import styles from "./ReturnCard.module.css";

export function ReturnCard({ record, now }: { record: ReturnRecord; now: Date }) {
  const done = isComplete(record);
  const scheduled = record.status === "pickup_scheduled";
  // Once we have the item, the retailer's deadline is our problem, not yours.
  const urgency = scheduled ? deadlineUrgency(record.returnDeadline, now) : "none";
  const progress = progressPercent(record.status);
  const marginDays = record.returnDeadline
    ? daysBetween(parseISODate(record.pickup.date), parseISODate(record.returnDeadline))
    : null;

  return (
    <article className={styles.card} data-complete={done || undefined}>
      <div className={styles.top}>
        <RetailerAvatar name={record.retailerName} />
        <div className={styles.heading}>
          <div className={styles.retailerRow}>
            <p className={styles.retailer}>{record.retailerName}</p>
            <StatusBadge status={record.status} />
          </div>
          <h3 className={styles.item}>
            <Link href={`/returns/${record.id}`} className={styles.link}>
              {record.itemDescription}
              {record.itemCount > 1 && <span className={styles.count}> ×{record.itemCount}</span>}
            </Link>
          </h3>
        </div>
      </div>

      <div
        className={styles.progress}
        role="progressbar"
        aria-label={`${STATUS_META[record.status].label}, ${progress}% complete`}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${Math.max(progress, 4)}%` }} />
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>{done ? "Refunded" : "Expected refund"}</dt>
          <dd className="tabular">
            {record.refundAmount !== undefined ? formatMoney(record.refundAmount) : "—"}
          </dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>
            {formatDate(record.pickup.date, { weekday: "short", month: "short", day: "numeric" })}
            {scheduled && <span className={styles.sub}>{windowLabel(record.pickup.windowId)}</span>}
          </dd>
        </div>
        <div>
          <dt>Return by</dt>
          <dd>
            {record.returnDeadline ? formatDate(record.returnDeadline) : "Not set"}
            {scheduled && record.returnDeadline && urgency !== "passed" && (
              <span className={styles.sub}>{relativeDayLabel(record.returnDeadline, now)}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Tracking</dt>
          <dd className={styles.mono}>{record.id}</dd>
        </div>
      </dl>

      {scheduled && (
        <p className={styles.note} data-urgency={urgency}>
          {urgency === "urgent" || urgency === "soon" ? (
            <Hourglass aria-hidden="true" />
          ) : (
            <CalendarClock aria-hidden="true" />
          )}
          <span>
            Pickup {relativeDayLabel(record.pickup.date, now).toLowerCase()} ·{" "}
            {windowLabel(record.pickup.windowId)}
            {marginDays !== null && (urgency === "urgent" || urgency === "soon") && (
              <strong className={styles.inTime}>
                {marginDays === 0
                  ? "On deadline day"
                  : `${marginDays} ${marginDays === 1 ? "day" : "days"} before the deadline`}
              </strong>
            )}
          </span>
        </p>
      )}
    </article>
  );
}
