import styles from "./Logo.module.css";

/**
 * The Return Done mark: a parcel with motion lines and a check, redrawn as a
 * compact SVG from the original 2023 logo (a box with speed lines and a
 * thumbs-up seal).
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" fill="var(--logo-bg, #0a7b77)" />
      <g stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7">
        <path d="M7.5 15.5h5" />
        <path d="M5.5 20.5h6" />
        <path d="M7.5 25.5h5" />
      </g>
      <path d="M15.5 14.2 25 10l9.5 4.2L25 18.4z" fill="white" opacity="0.95" />
      <path d="M15.5 14.2 25 18.4v12.1l-9.5-4.3z" fill="white" opacity="0.72" />
      <path d="M25 18.4l9.5-4.2v12l-9.5 4.3z" fill="white" />
      <path
        d="m27.4 23.9 2 1.9 3.3-4.4"
        stroke="var(--logo-bg, #0a7b77)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ inverse }: { inverse?: boolean }) {
  return (
    <span className={`${styles.logo} ${inverse ? styles.inverse : ""}`}>
      <LogoMark />
      <span className={styles.wordmark}>
        Return<span className={styles.done}>Done</span>
      </span>
    </span>
  );
}
