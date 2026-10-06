import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/lib/config";
import styles from "./SiteFooter.module.css";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/schedule", label: "Schedule a Return" },
      { href: "/dashboard", label: "Your returns" },
      { href: "/assistant", label: "Smart Return Assistant" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/about#lessons", label: "What we learned" },
      { href: siteConfig.repoUrl, label: "Source on GitHub", external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <Logo inverse />
          <p>
            Doorstep pickup and refund tracking for online returns. Started in{" "}
            {siteConfig.foundedIn}; rebuilt in 2026.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className={styles.column}>
            <h2>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  {"external" in link ? (
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>
          This is a product demo. Pickups, payments and tracking are simulated, and no real orders
          are placed. Retailer names are used for identification only and don&apos;t imply any
          partnership.
        </p>
        <p>© {new Date().getFullYear()} Return Done</p>
      </div>
    </footer>
  );
}
