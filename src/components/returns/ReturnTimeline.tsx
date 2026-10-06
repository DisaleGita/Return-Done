import { Check } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import { buildTimeline, type ReturnRecord } from "@/lib/returns";
import styles from "./ReturnTimeline.module.css";

interface ReturnTimelineProps {
  record: Pick<ReturnRecord, "status" | "history">;
  /** Hide timestamps and descriptions for a compact version. */
  compact?: boolean;
}

export function ReturnTimeline({ record, compact }: ReturnTimelineProps) {
  const steps = buildTimeline(record);
  return (
    <ol
      className={`${styles.timeline} ${compact ? styles.compact : ""}`}
      aria-label="Return progress"
    >
      {steps.map((step) => (
        <li
          key={step.status}
          className={styles.step}
          data-state={step.state}
          aria-current={step.state === "current" ? "step" : undefined}
        >
          <span className={styles.marker} aria-hidden="true">
            {step.state === "complete" && <Check strokeWidth={3} />}
          </span>
          <div className={styles.content}>
            <p className={styles.label}>
              {step.label}
              <span className="visually-hidden">
                {step.state === "complete"
                  ? " (done)"
                  : step.state === "current"
                    ? " (current step)"
                    : " (upcoming)"}
              </span>
            </p>
            {!compact && (
              <>
                {step.at && step.state !== "upcoming" && (
                  <p className={styles.time}>
                    <time dateTime={step.at}>{formatDateTime(step.at)}</time>
                  </p>
                )}
                {step.state === "current" && (
                  <p className={styles.description}>{step.description}</p>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
