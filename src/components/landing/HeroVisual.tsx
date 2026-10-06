import { CalendarClock, Check, MapPin } from "lucide-react";
import styles from "./HeroVisual.module.css";

const STEPS = [
  { label: "Scheduled", state: "done" },
  { label: "Picked up", state: "done" },
  { label: "In transit", state: "current" },
  { label: "Refund", state: "upcoming" },
] as const;

/** A static product mock built in HTML/CSS: no screenshots to go stale. */
export function HeroVisual() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.glow} />

      <div className={styles.phone}>
        <div className={styles.phoneTop}>
          <span>Your Returns</span>
          <span className={styles.avatar}>A</span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.mono}>ZA</span>
            <div>
              <p className={styles.muted}>Zara</p>
              <p className={styles.strong}>Black blazer</p>
            </div>
            <span className={styles.badge}>In transit</span>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step.label} data-state={step.state}>
                <span className={styles.dot}>
                  {step.state === "done" && <Check strokeWidth={3.5} />}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={`${styles.mono} ${styles.monoBlue}`}>NI</span>
            <div>
              <p className={styles.muted}>Nike</p>
              <p className={styles.strong}>Air Max sneakers</p>
            </div>
            <span className={`${styles.badge} ${styles.badgeBrand}`}>Scheduled</span>
          </div>
          <p className={styles.pickupLine}>
            <CalendarClock /> Tomorrow · 10 AM – 12 PM
          </p>
          <p className={styles.pickupLine}>
            <MapPin /> At your door
          </p>
        </div>
      </div>

      <div className={`${styles.float} ${styles.refund}`}>
        <span className={styles.refundIcon}>
          <Check strokeWidth={3} />
        </span>
        <div>
          <p className={styles.muted}>Refund complete</p>
          <p className={styles.amount}>+$145.00</p>
        </div>
      </div>

      <div className={`${styles.float} ${styles.deadline}`}>
        <p className={styles.muted}>Return deadline</p>
        <p className={styles.strong}>Picked up 4 days early</p>
      </div>
    </div>
  );
}
