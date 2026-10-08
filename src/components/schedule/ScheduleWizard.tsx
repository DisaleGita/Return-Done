"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatMoney, quotePickup } from "@/lib/pricing";
import {
  EMPTY_DRAFT,
  WIZARD_STEPS,
  draftFromParams,
  draftToInput,
  validateStep,
  type ReturnDraft,
} from "@/lib/return-draft";
import type { EmailResult } from "@/lib/email/types";
import type { PreparedAttachment } from "@/lib/prepare-attachment";
import type { ReturnRecord } from "@/lib/returns";
import { returnsStore } from "@/lib/returns-store";
import type { FieldErrors } from "@/lib/schemas";
import { useNow } from "@/lib/use-now";
import { Confirmation } from "./Confirmation";
import { DetailsStep } from "./DetailsStep";
import { MethodStep } from "./MethodStep";
import { OrderSummary } from "./OrderSummary";
import { PickupStep } from "./PickupStep";
import { RetailerStep } from "./RetailerStep";
import { StepIndicator } from "./StepIndicator";
import styles from "./ScheduleWizard.module.css";

/** Maps API error paths ("pickup.address.zip") back to draft field names ("zip"). */
function toDraftErrors(apiErrors: FieldErrors): FieldErrors {
  const errors: FieldErrors = {};
  for (const [path, message] of Object.entries(apiErrors)) {
    const key =
      path === "pickup.date"
        ? "pickupDate"
        : path === "pickup.windowId"
          ? "windowId"
          : path.split(".").pop()!;
    errors[key] = message;
  }
  return errors;
}

const STEP_FOR_FIELD: Record<string, number> = {
  contactEmail: 0,
  retailerId: 0,
  customRetailerName: 0,
  retailerName: 0,
  itemDescription: 1,
  itemCount: 1,
  orderNumber: 1,
  refundAmount: 1,
  returnDeadline: 1,
  attachments: 1,
};

export type UpdateDraft = <K extends keyof ReturnDraft>(field: K, value: ReturnDraft[K]) => void;

export function ScheduleWizard() {
  const searchParams = useSearchParams();
  const now = useNow();
  const { toast } = useToast();

  const [draft, setDraft] = useState<ReturnDraft>(() => ({
    ...EMPTY_DRAFT,
    ...draftFromParams(searchParams),
  }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<ReturnRecord | null>(null);
  const [email, setEmail] = useState<{ to: string; result: EmailResult } | null>(null);
  const [attachments, setAttachments] = useState<PreparedAttachment[]>([]);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const focusTarget = useRef<"heading" | "error" | null>(null);
  const prefilled = searchParams.size > 0;

  // Move focus after a step change or a failed validation, for keyboard and
  // screen reader users.
  useEffect(() => {
    if (focusTarget.current === "heading") headingRef.current?.focus();
    if (focusTarget.current === "error") {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid] input')
        ?.focus();
    }
    focusTarget.current = null;
  }, [step, errors, created]);

  const update: UpdateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const goTo = (index: number) => {
    setErrors({});
    setSubmitError(null);
    setStep(index);
    focusTarget.current = "heading";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Booking details as JSON plus any labels/QR codes as files.
      const form = new FormData();
      form.append("payload", JSON.stringify(draftToInput(draft)));
      for (const file of attachments) form.append("attachments", file.blob, file.name);
      const response = await fetch("/api/returns", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));

      if (response.status === 422 && body.fieldErrors) {
        const fieldErrors = toDraftErrors(body.fieldErrors);
        const firstStep = Math.min(
          ...Object.keys(fieldErrors).map((key) => STEP_FOR_FIELD[key] ?? 3),
        );
        setStep(firstStep);
        setErrors(fieldErrors);
        focusTarget.current = "error";
        return;
      }
      if (!response.ok || !body.return) throw new Error(body.error ?? `HTTP ${response.status}`);

      // The server returns safe file names; previews never leave the browser.
      const record = body.return as ReturnRecord;
      record.attachments = record.attachments?.map((info, index) => ({
        ...info,
        preview: attachments[index]?.preview,
      }));
      const saved = returnsStore.add(record);
      setCreated(saved);
      setEmail(body.email ? { to: draft.contactEmail.trim(), result: body.email } : null);
      focusTarget.current = "heading";
      window.scrollTo({ top: 0 });
      toast({
        tone: "success",
        title: "Pickup scheduled",
        description: `Tracking number ${saved.id}`,
      });
    } catch {
      setSubmitError("Something went wrong while scheduling your pickup.");
      toast({
        tone: "error",
        title: "Something went wrong while scheduling your pickup.",
        description: "Nothing was booked. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    if (!now) return;
    const stepId = WIZARD_STEPS[step]!.id;
    const stepErrors = validateStep(stepId, draft, now);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      focusTarget.current = "error";
      return;
    }
    if (step < WIZARD_STEPS.length - 1) goTo(step + 1);
    else void submit();
  }

  if (created) {
    return (
      <Confirmation
        record={created}
        email={email}
        headingRef={headingRef}
        onScheduleAnother={() => {
          setCreated(null);
          setDraft(EMPTY_DRAFT);
          setAttachments([]);
          goTo(0);
        }}
      />
    );
  }

  const itemCount = Math.max(1, Number(draft.itemCount) || 1);
  const quote = quotePickup(itemCount, draft.pickupDate || undefined);
  const isLast = step === WIZARD_STEPS.length - 1;
  const stepProps = { draft, update, errors };

  return (
    <div className={styles.wizard}>
      <StepIndicator
        steps={WIZARD_STEPS}
        current={step}
        onSelect={(index) => index < step && goTo(index)}
      />

      <div className={styles.layout}>
        <form ref={formRef} className={styles.form} onSubmit={handleContinue} noValidate>
          <div key={step} className={styles.stepBody}>
            {prefilled && step === 0 && (
              <Callout
                tone="brand"
                className={styles.prefillNote}
                title="We filled in what the assistant found"
              >
                Check the details as you go. Everything can be edited.
              </Callout>
            )}

            {step === 0 && <RetailerStep {...stepProps} headingRef={headingRef} />}
            {step === 1 && (
              <DetailsStep
                {...stepProps}
                headingRef={headingRef}
                now={now}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            )}
            {step === 2 && <MethodStep headingRef={headingRef} itemCount={itemCount} />}
            {step === 3 && <PickupStep {...stepProps} headingRef={headingRef} now={now} />}
          </div>

          {submitError && (
            <Callout tone="danger" title={submitError} className={styles.submitError}>
              Nothing was booked. Check your connection and try again.
            </Callout>
          )}

          <div className={styles.actions}>
            {step > 0 ? (
              <Button
                variant="ghost"
                icon={<ArrowLeft />}
                onClick={() => goTo(step - 1)}
                disabled={submitting}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            <div className={styles.actionsRight}>
              {!isLast && (
                <span className={styles.mobileTotal} aria-hidden="true">
                  {formatMoney(quote.total)}
                </span>
              )}
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                iconRight={isLast ? undefined : <ArrowRight />}
              >
                {isLast ? `Schedule pickup · ${formatMoney(quote.total)}` : "Continue"}
              </Button>
            </div>
          </div>
        </form>

        <OrderSummary
          draft={draft}
          quote={quote}
          step={step}
          attachmentCount={attachments.length}
        />
      </div>
    </div>
  );
}
