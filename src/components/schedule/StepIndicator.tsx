import { Check } from "lucide-react";
import styles from "./StepIndicator.module.css";

interface StepIndicatorProps {
  steps: readonly { id: string; title: string }[];
  current: number;
  /** Lets people jump back to completed steps. */
  onSelect: (index: number) => void;
}

export function StepIndicator({ steps, current, onSelect }: StepIndicatorProps) {
  const percent = ((current + 1) / steps.length) * 100;
  return (
    <nav aria-label="Scheduling steps" className={styles.wrapper}>
      <p className={styles.mobileLabel}>
        Step {current + 1} of {steps.length}
        <span aria-hidden="true"> · </span>
        <strong>{steps[current]?.title}</strong>
      </p>
      <div className={styles.mobileBar} aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>

      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const state = index < current ? "complete" : index === current ? "current" : "upcoming";
          return (
            <li key={step.id} className={styles.step} data-state={state}>
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => onSelect(index)}
                disabled={state !== "complete"}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className={styles.number} aria-hidden="true">
                  {state === "complete" ? <Check strokeWidth={3} /> : index + 1}
                </span>
                <span className={styles.title}>
                  {step.title}
                  {state === "complete" && (
                    <span className="visually-hidden"> (completed, select to edit)</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
