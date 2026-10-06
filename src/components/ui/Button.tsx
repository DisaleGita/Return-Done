import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Leading icon */
  icon?: ReactNode;
  /** Trailing icon */
  iconRight?: ReactNode;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & {
    href?: undefined;
    loading?: boolean;
  };

type LinkProps = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps> & {
    href: string;
  };

function classNames({ variant = "primary", size = "md", block, className }: CommonProps) {
  return [styles.button, styles[variant], styles[size], block && styles.block, className]
    .filter(Boolean)
    .join(" ");
}

function Content({
  icon,
  iconRight,
  children,
}: Pick<CommonProps, "icon" | "iconRight" | "children">) {
  return (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {iconRight && (
        <span className={`${styles.icon} ${styles.iconRight}`} aria-hidden="true">
          {iconRight}
        </span>
      )}
    </>
  );
}

/** Renders a `<button>`, or a Next.js `<Link>` when `href` is given. */
export function Button(props: ButtonProps | LinkProps) {
  if (props.href !== undefined) {
    const { variant, size, icon, iconRight, block, className, children, ...linkProps } = props;
    return (
      <Link {...linkProps} className={classNames({ variant, size, block, className, children })}>
        <Content icon={icon} iconRight={iconRight}>
          {children}
        </Content>
      </Link>
    );
  }

  const {
    variant,
    size,
    icon,
    iconRight,
    block,
    className,
    children,
    loading,
    disabled,
    type,
    ...buttonProps
  } = props;
  return (
    <button
      {...buttonProps}
      type={type ?? "button"}
      className={classNames({ variant, size, block, className, children })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <Content icon={icon} iconRight={iconRight}>
        {children}
      </Content>
    </button>
  );
}
