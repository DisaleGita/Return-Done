"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./status-page.module.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={`container ${styles.page}`} aria-labelledby="error-heading" role="alert">
      <p className={styles.code} aria-hidden="true">
        Oops
      </p>
      <h1 id="error-heading" className={styles.title}>
        Something went wrong on our end.
      </h1>
      <p className={styles.body}>
        Your returns are safe. Try again, and if it keeps happening, reload the page.
        {error.digest && <span className={styles.digest}>Reference: {error.digest}</span>}
      </p>
      <div className={styles.actions}>
        <Button onClick={reset} icon={<RotateCcw />}>
          Try again
        </Button>
        <Button href="/" variant="secondary">
          Back to home
        </Button>
      </div>
    </section>
  );
}
