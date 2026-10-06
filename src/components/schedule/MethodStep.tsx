import type { RefObject } from "react";
import { Check, Home, PackageCheck, Radar, Wallet } from "lucide-react";
import { pricingConfig } from "@/lib/config";
import { formatMoney, quotePickup } from "@/lib/pricing";
import styles from "./steps.module.css";

const INCLUDED = [
  {
    icon: Home,
    title: "Pickup from home",
    body: "A two-hour window that suits you, at your door.",
  },
  {
    icon: PackageCheck,
    title: "Return handling",
    body: "We check the item, pack it, print the label and ship it.",
  },
  { icon: Radar, title: "Status tracking", body: "Follow each step from pickup to drop-off." },
  { icon: Wallet, title: "Refund monitoring", body: "We keep an eye on it until the money lands." },
];

export function MethodStep({
  headingRef,
  itemCount,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  itemCount: number;
}) {
  const quote = quotePickup(itemCount);

  return (
    <section aria-labelledby="method-heading">
      <h1 id="method-heading" ref={headingRef} tabIndex={-1} className={styles.heading}>
        How should it get back?
      </h1>
      <p className={styles.lede}>One simple option, with everything included.</p>

      <div className={styles.methodCard} aria-label="Selected method: Doorstep Pickup" role="group">
        <div className={styles.methodHeader}>
          <div>
            <p className={styles.methodName}>
              Doorstep Pickup
              <span className={styles.selectedPill}>
                <Check aria-hidden="true" /> Selected
              </span>
            </p>
            <p className={styles.methodTagline}>We pick it up. You move on.</p>
          </div>
          <div className={styles.methodPrice}>
            <span className="tabular">{formatMoney(quote.total)}</span>
            <span>{itemCount > 1 ? `for ${itemCount} items` : "per return"}</span>
          </div>
        </div>

        <ul className={styles.included}>
          {INCLUDED.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <span className={styles.includedIcon} aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{title}</strong>
                <span>{body}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className={styles.methodFoot}>
          {formatMoney(pricingConfig.singleItem)} for one item ·{" "}
          {formatMoney(pricingConfig.multiItem)} for two or more from the same retailer ·{" "}
          <strong>Save {formatMoney(pricingConfig.returnDay.discount)} on Saturdays</strong> (Return
          Day)
        </p>
      </div>
    </section>
  );
}
