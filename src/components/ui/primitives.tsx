import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./primitives.module.css";

export type Tone = "neutral" | "brand" | "info" | "warning" | "success" | "danger";

export function Badge({
  tone = "neutral",
  dot,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={[styles.badge, styles[`tone-${tone}`], className].filter(Boolean).join(" ")}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Card({
  as: Tag = "div",
  interactive,
  padded = true,
  className,
  ...rest
}: ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "section" | "article";
  interactive?: boolean;
  padded?: boolean;
}) {
  return (
    <Tag
      {...rest}
      className={[
        styles.card,
        interactive && styles.interactive,
        padded && styles.padded,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function Skeleton({
  width,
  height = 16,
  radius,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
}) {
  return (
    <span
      className={styles.skeleton}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      {icon && (
        <div className={styles.emptyIcon} aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 className={styles.emptyTitle}>{title}</h2>
      {children && <p className={styles.emptyBody}>{children}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

export function Callout({
  tone = "info",
  icon,
  title,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={[styles.callout, styles[`tone-${tone}`], className].filter(Boolean).join(" ")}>
      {icon && (
        <span className={styles.calloutIcon} aria-hidden="true">
          {icon}
        </span>
      )}
      <div>
        {title && <p className={styles.calloutTitle}>{title}</p>}
        {children && <div className={styles.calloutBody}>{children}</div>}
      </div>
    </div>
  );
}
