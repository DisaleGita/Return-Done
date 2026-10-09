"use client";

import { useMemo, useState } from "react";
import { CalendarClock, PackageOpen, Plus, RotateCcw, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge, EmptyState, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDate, relativeDayLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { isComplete, sortReturns, summarizeReturns } from "@/lib/returns";
import { returnsStore, useReturns } from "@/lib/returns-store";
import { windowLabel } from "@/lib/scheduling";
import { ReturnCard } from "./ReturnCard";
import styles from "./DashboardView.module.css";

type Filter = "active" | "completed" | "all";

export function DashboardView() {
  const records = useReturns();
  const [filter, setFilter] = useState<Filter>("active");
  const [confirmReset, setConfirmReset] = useState(false);
  const { toast } = useToast();
  const now = useMemo(() => new Date(), []);

  const sorted = useMemo(() => (records ? sortReturns(records) : []), [records]);
  const summary = useMemo(() => summarizeReturns(sorted), [sorted]);
  const visible = sorted.filter((r) =>
    filter === "all" ? true : filter === "completed" ? isComplete(r) : !isComplete(r),
  );

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "active", label: "Active", count: summary.active },
    { id: "completed", label: "Completed", count: summary.completed },
    { id: "all", label: "All", count: sorted.length },
  ];

  return (
    <div className={`container ${styles.page} page-enter`}>
      <div className={styles.demoBar} role="note">
        <Sparkles aria-hidden="true" />
        <p>
          <strong>You&apos;re exploring a demo account.</strong> Returns are saved in this browser
          only, and status updates are simulated.
        </p>
        <button type="button" className={styles.resetLink} onClick={() => setConfirmReset(true)}>
          <RotateCcw aria-hidden="true" /> Reset demo
        </button>
      </div>

      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>
            Welcome back <Badge tone="neutral">Demo account</Badge>
          </p>
          <h1 className={styles.title}>Your Returns</h1>
        </div>
        <Button href="/schedule" icon={<Plus />}>
          Schedule a Return
        </Button>
      </header>

      <section aria-label="Overview" className={styles.stats}>
        {records === null ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={styles.stat}>
              <Skeleton width={90} height={12} />
              <Skeleton width={120} height={28} />
            </div>
          ))
        ) : (
          <>
            <div className={styles.stat}>
              <span className={styles.statIcon} aria-hidden="true">
                <Wallet />
              </span>
              <p className={styles.statLabel}>Refunds on the way</p>
              <p className={`${styles.statValue} tabular`}>{formatMoney(summary.refundsPending)}</p>
              <p className={styles.statMeta}>
                across {summary.active} active {summary.active === 1 ? "return" : "returns"}
              </p>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIcon} aria-hidden="true">
                <CalendarClock />
              </span>
              <p className={styles.statLabel}>Next pickup</p>
              {summary.nextPickup ? (
                <>
                  <p className={styles.statValue}>
                    {relativeDayLabel(summary.nextPickup.pickup.date, now).replace(/^in /, "In ")}
                  </p>
                  <p className={styles.statMeta}>
                    {formatDate(summary.nextPickup.pickup.date, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {windowLabel(summary.nextPickup.pickup.windowId)}
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.statValue}>None</p>
                  <p className={styles.statMeta}>Nothing to hand over</p>
                </>
              )}
            </div>
            <div className={styles.stat}>
              <span className={styles.statIcon} aria-hidden="true">
                <PackageOpen />
              </span>
              <p className={styles.statLabel}>Refunded so far</p>
              <p className={`${styles.statValue} tabular`}>{formatMoney(summary.refundedTotal)}</p>
              <p className={styles.statMeta}>
                from {summary.completed} completed {summary.completed === 1 ? "return" : "returns"}
              </p>
            </div>
          </>
        )}
      </section>

      <div className={styles.filters} role="group" aria-label="Filter returns">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={styles.filter}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            <span className={styles.filterCount}>{records === null ? "–" : f.count}</span>
          </button>
        ))}
      </div>

      {records === null ? (
        <div className={styles.grid} aria-busy="true" aria-label="Loading returns">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonRow}>
                <Skeleton width={44} height={44} radius={12} />
                <div style={{ flex: 1, display: "grid", gap: 8 }}>
                  <Skeleton width="40%" height={12} />
                  <Skeleton width="75%" height={16} />
                </div>
              </div>
              <Skeleton height={4} />
              <Skeleton width="90%" height={36} />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<PackageOpen />}
          title={
            filter === "completed"
              ? "No completed returns yet"
              : "No returns yet. Hopefully that's a good thing. 🙂"
          }
          action={
            filter !== "completed" && (
              <Button href="/schedule" icon={<Plus />}>
                Schedule a Return
              </Button>
            )
          }
        >
          {filter === "completed"
            ? "Once a refund lands, the return moves here."
            : "When something doesn't work out, schedule a pickup and track it here."}
        </EmptyState>
      ) : (
        <ul className={styles.grid}>
          {visible.map((record) => (
            <li key={record.id}>
              <ReturnCard record={record} now={now} />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the demo account?"
        description="This restores the sample returns and removes any returns you scheduled in this browser."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                returnsStore.reset();
                setConfirmReset(false);
                setFilter("active");
                toast({ tone: "success", title: "Demo account reset" });
              }}
            >
              Reset demo
            </Button>
          </>
        }
      />
    </div>
  );
}
