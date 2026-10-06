import styles from "./RetailerAvatar.module.css";

const PALETTE = [
  ["#e6f6f4", "#0b625f"],
  ["#eef2ff", "#3b4bb3"],
  ["#fff4e5", "#9a4b07"],
  ["#fdecef", "#a8274a"],
  ["#eaf6ec", "#1d6b35"],
  ["#f3eefc", "#6237a6"],
  ["#edf3f8", "#2d5672"],
] as const;

function hash(value: string): number {
  let h = 0;
  for (const char of value) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/** A neutral monogram for a retailer. Deliberately not the retailer's logo. */
export function RetailerAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const [bg, fg] = PALETTE[hash(name) % PALETTE.length]!;
  const letters = name
    .replace(/[^A-Za-z0-9& ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * (name.length <= 4 && name.includes("&") ? 0.28 : 0.36),
      }}
      aria-hidden="true"
    >
      {name.includes("&") && name.length <= 4 ? name : letters || "?"}
    </span>
  );
}
