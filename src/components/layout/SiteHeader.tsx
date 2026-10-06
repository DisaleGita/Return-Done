"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/assistant", label: "Return Assistant" },
  { href: "/about", label: "Our story" },
  { href: "/dashboard", label: "Your returns" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu on navigation.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => !href.startsWith("/#") && pathname.startsWith(href);

  return (
    <header className={styles.header} data-scrolled={scrolled || open || undefined}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Return Done home">
          <Logo />
        </Link>

        <nav aria-label="Main" className={styles.desktopNav}>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navLink}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <Button href="/schedule" size="sm" className={styles.cta}>
            Schedule a Return
          </Button>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav id="mobile-nav" aria-label="Mobile" className={styles.mobileNav} hidden={!open}>
        <ul className="container">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.mobileLink}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className={styles.mobileCta}>
            <Button href="/schedule" block onClick={() => setOpen(false)}>
              Schedule a Return
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
