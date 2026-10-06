import { ShieldCheck } from "lucide-react";
import { RetailerAvatar } from "@/components/returns/RetailerAvatar";
import { formatDate } from "@/lib/dates";
import { formatMoney, type PriceQuote } from "@/lib/pricing";
import { retailerNameFor, type ReturnDraft } from "@/lib/return-draft";
import { windowLabel } from "@/lib/scheduling";
import styles from "./OrderSummary.module.css";

export function OrderSummary({
  draft,
  quote,
  step,
}: {
  draft: ReturnDraft;
  quote: PriceQuote;
  step: number;
}) {
  const retailer = retailerNameFor(draft);
  const count = Math.max(1, Number(draft.itemCount) || 1);

  return (
    <aside className={styles.summary} aria-label="Return summary">
      <h2 className={styles.title}>Your return</h2>

      <div className={styles.row}>
        {retailer ? (
          <>
            <RetailerAvatar name={retailer} size={40} />
            <div className={styles.rowText}>
              <p className={styles.primary}>{retailer}</p>
              <p className={styles.secondary}>
                {draft.itemDescription.trim() ||
                  (step >= 1 ? "Add an item description" : "Item details next")}
                {count > 1 && ` · ${count} items`}
              </p>
            </div>
          </>
        ) : (
          <p className={styles.empty}>Choose a retailer to get started.</p>
        )}
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Method</dt>
          <dd>Doorstep Pickup</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>
            {draft.pickupDate
              ? `${formatDate(draft.pickupDate, { weekday: "short", month: "short", day: "numeric" })}${
                  draft.windowId ? ` · ${windowLabel(draft.windowId)}` : ""
                }`
              : "Not chosen yet"}
          </dd>
        </div>
        {draft.returnDeadline && (
          <div>
            <dt>Return by</dt>
            <dd>
              {formatDate(draft.returnDeadline, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        )}
      </dl>

      <ul className={styles.lines}>
        {quote.lines.map((line) => (
          <li key={line.label} data-discount={line.amount < 0 || undefined}>
            <span>{line.label}</span>
            <span className="tabular">{formatMoney(line.amount)}</span>
          </li>
        ))}
        <li className={styles.total}>
          <span>Total</span>
          <span className="tabular">{formatMoney(quote.total)}</span>
        </li>
      </ul>

      <p className={styles.note}>
        <ShieldCheck aria-hidden="true" />
        Demo checkout. No payment is taken.
      </p>
    </aside>
  );
}
