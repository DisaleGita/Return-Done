"use client";

import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import styles from "./Field.module.css";

export interface ControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  required?: boolean;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}

/**
 * Wires a label, hint and error message to a single control. The control is
 * rendered by the child function so any input can be used.
 */
export function Field({ label, hint, error, optional, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={[styles.field, className].filter(Boolean).join(" ")}
      data-invalid={error ? "" : undefined}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}>Optional</span>}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Input({
  className,
  prefix,
  ...props
}: ComponentPropsWithoutRef<"input"> & { prefix?: string }) {
  if (prefix) {
    return (
      <div className={styles.affix}>
        <span className={styles.prefix} aria-hidden="true">
          {prefix}
        </span>
        <input
          {...props}
          className={[styles.control, styles.withPrefix, className].filter(Boolean).join(" ")}
        />
      </div>
    );
  }
  return <input {...props} className={[styles.control, className].filter(Boolean).join(" ")} />;
}

export function Select({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      {...props}
      className={[styles.control, styles.select, className].filter(Boolean).join(" ")}
    />
  );
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      {...props}
      className={[styles.control, styles.textarea, className].filter(Boolean).join(" ")}
    />
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** Radio group styled as a segmented control. Clicking the active option clears it. */
export function Segmented<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  value: T | "";
  options: SegmentedOption<T>[];
  onChange: (value: T | "") => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <fieldset className={styles.fieldset} aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className={styles.label}>
        {label}
        <span className={styles.optional}>Optional</span>
      </legend>
      <div className={styles.segmented}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onClick={() => value === option.value && onChange("")}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </fieldset>
  );
}
