import { ArrowRight, Bot, CircleAlert, Clock, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Callout, type Tone } from "@/components/ui/primitives";
import type { AssistantResult, Requirement, ReturnMethod } from "@/lib/assistant/types";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import styles from "./ExtractionResult.module.css";

const METHOD_LABEL: Record<ReturnMethod, string> = {
  qr_code: "QR code at drop-off",
  printed_label: "Prepaid printed label",
  drop_off: "Drop-off",
  carrier_pickup: "Carrier pickup",
  in_store: "In store",
  unknown: "Not stated",
};

const LABEL_TEXT: Record<Requirement, string> = {
  required: "Printer needed",
  not_required: "No printer needed",
  unknown: "Not stated",
};

const PACKAGING_TEXT: Record<Requirement, string> = {
  required: "Needs packaging",
  not_required: "No box needed",
  unknown: "Not stated",
};

const URGENCY_TONE: Record<AssistantResult["nextAction"]["urgency"], Tone> = {
  normal: "brand",
  soon: "warning",
  urgent: "warning",
  passed: "danger",
  unknown: "info",
};

/** Builds the /schedule URL that pre-fills the wizard with what was found. */
export function scheduleHref({ extraction }: AssistantResult): string {
  const params = new URLSearchParams();
  if (extraction.retailerId) params.set("retailer", extraction.retailerId);
  else if (extraction.retailer) params.set("retailer", extraction.retailer);
  if (extraction.deadline) params.set("deadline", extraction.deadline);
  if (extraction.orderNumber) params.set("order", extraction.orderNumber);
  if (extraction.itemDescription) params.set("item", extraction.itemDescription);
  if (extraction.refundAmount !== null) params.set("amount", String(extraction.refundAmount));
  if (extraction.carrier) params.set("carrier", extraction.carrier);
  if (extraction.method === "qr_code") params.set("qr", "yes");
  if (extraction.labelRequirement === "required") params.set("label", "yes");
  const query = params.toString();
  return query ? `/schedule?${query}` : "/schedule";
}

export function ExtractionResult({ result }: { result: AssistantResult }) {
  const { extraction, nextAction } = result;
  const facts: { label: string; value: string; detail?: string | null }[] = [
    { label: "Retailer", value: extraction.retailer ?? "Not found" },
    {
      label: "Return deadline",
      value: extraction.deadline
        ? formatDate(extraction.deadline, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : extraction.windowDays
          ? `${extraction.windowDays}-day window`
          : "Not found",
      detail: extraction.deadlineEvidence,
    },
    { label: "Return method", value: METHOD_LABEL[extraction.method] },
    { label: "Carrier", value: extraction.carrier ?? "Not stated" },
    { label: "Label", value: LABEL_TEXT[extraction.labelRequirement] },
    { label: "Packaging", value: PACKAGING_TEXT[extraction.packagingRequirement] },
    { label: "Order number", value: extraction.orderNumber ?? "Not found" },
    {
      label: "Refund",
      value: extraction.refundAmount !== null ? formatMoney(extraction.refundAmount) : "Not found",
    },
  ];

  return (
    <article className={styles.card} aria-label="Extracted return details">
      <p className={styles.summary}>{result.summary}</p>

      {result.notice && (
        <Callout tone="warning" icon={<CircleAlert />} className={styles.notice}>
          {result.notice}
        </Callout>
      )}

      <Callout
        tone={URGENCY_TONE[nextAction.urgency]}
        icon={<Clock />}
        title={nextAction.title}
        className={styles.action}
      >
        {nextAction.detail}
      </Callout>

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div
            key={fact.label}
            data-missing={fact.value === "Not found" || fact.value === "Not stated" || undefined}
          >
            <dt>{fact.label}</dt>
            <dd>
              {fact.value}
              {fact.detail && <q className={styles.evidence}>{fact.detail}</q>}
            </dd>
          </div>
        ))}
      </dl>

      {extraction.conditions.length > 0 && (
        <div className={styles.conditions}>
          <p>Conditions</p>
          <ul>
            {extraction.conditions.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.engine}>
          {result.engine === "claude" ? <Bot aria-hidden="true" /> : <Cpu aria-hidden="true" />}
          {result.engine === "claude"
            ? "Extracted with Claude. Double-check dates against the original email."
            : "Extracted by the built-in rule-based demo parser. No AI service was called."}
        </p>
        {nextAction.urgency !== "passed" && (
          <Button href={scheduleHref(result)} iconRight={<ArrowRight />}>
            Schedule this return
          </Button>
        )}
      </div>
    </article>
  );
}
