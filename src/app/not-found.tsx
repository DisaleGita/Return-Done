import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./status-page.module.css";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className={`container ${styles.page}`} aria-labelledby="nf-heading">
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 id="nf-heading" className={styles.title}>
        This page was returned to sender.
      </h1>
      <p className={styles.body}>
        We couldn&apos;t find what you were looking for. It may have moved, or the link might be
        mistyped.
      </p>
      <div className={styles.actions}>
        <Button href="/" iconRight={<ArrowRight />}>
          Back to home
        </Button>
        <Button href="/dashboard" variant="secondary">
          Your returns
        </Button>
      </div>
    </section>
  );
}
