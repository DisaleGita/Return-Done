"use client";

import type { RefObject } from "react";
import { Field, Input, Segmented, Select } from "@/components/ui/Field";
import type { PreparedAttachment } from "@/lib/prepare-attachment";
import { AttachmentPicker } from "./AttachmentPicker";
import { pricingConfig } from "@/lib/config";
import { toISODate } from "@/lib/dates";
import { getRetailer } from "@/lib/retailers";
import { retailerNameFor, type ReturnDraft, type YesNo } from "@/lib/return-draft";
import { CARRIERS, RETURN_REASONS } from "@/lib/returns";
import type { FieldErrors } from "@/lib/schemas";
import type { UpdateDraft } from "./ScheduleWizard";
import styles from "./steps.module.css";

interface Props {
  draft: ReturnDraft;
  update: UpdateDraft;
  errors: FieldErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
  now: Date | null;
  attachments: PreparedAttachment[];
  onAttachmentsChange: (files: PreparedAttachment[]) => void;
}

const YES_NO = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
];

export function DetailsStep({
  draft,
  update,
  errors,
  headingRef,
  now,
  attachments,
  onAttachmentsChange,
}: Props) {
  const retailer = getRetailer(draft.retailerId);
  const retailerName = retailerNameFor(draft) || "the retailer";

  return (
    <section aria-labelledby="details-heading">
      <h1 id="details-heading" ref={headingRef} tabIndex={-1} className={styles.heading}>
        What are you returning?
      </h1>
      <p className={styles.lede}>
        Only the item description is required. Anything else you add helps us return it faster.
      </p>

      <div className={styles.formGrid}>
        <Field
          label="Item"
          error={errors.itemDescription}
          required
          hint="What our driver should expect at the door"
          className={styles.span2}
        >
          {(control) => (
            <Input
              {...control}
              value={draft.itemDescription}
              onChange={(event) => update("itemDescription", event.target.value)}
              placeholder="e.g. Black blazer, size M"
              maxLength={120}
            />
          )}
        </Field>

        <Field label="Number of items" error={errors.itemCount} required>
          {(control) => (
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              max={pricingConfig.maxItemsPerPickup}
              value={draft.itemCount}
              onChange={(event) => update("itemCount", event.target.value)}
            />
          )}
        </Field>

        <Field label="Order number" optional error={errors.orderNumber}>
          {(control) => (
            <Input
              {...control}
              value={draft.orderNumber}
              onChange={(event) => update("orderNumber", event.target.value)}
              placeholder="From your confirmation email"
              maxLength={40}
              autoComplete="off"
            />
          )}
        </Field>

        <Field label="Reason for return" optional>
          {(control) => (
            <Select
              {...control}
              value={draft.reason}
              onChange={(event) => update("reason", event.target.value)}
            >
              <option value="">Choose a reason</option>
              {RETURN_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="Refund amount"
          optional
          error={errors.refundAmount}
          hint="So we can track your refund"
        >
          {(control) => (
            <Input
              {...control}
              prefix="$"
              inputMode="decimal"
              value={draft.refundAmount}
              onChange={(event) => update("refundAmount", event.target.value)}
              placeholder="0.00"
            />
          )}
        </Field>

        <Field
          label="Return deadline"
          optional
          error={errors.returnDeadline}
          hint={
            retailer?.typicalWindowDays
              ? `${retailer.name} usually allows ${retailer.typicalWindowDays} days. Check your order for the exact date.`
              : "We'll remind you before it closes"
          }
        >
          {(control) => (
            <Input
              {...control}
              type="date"
              min={now ? toISODate(now) : undefined}
              value={draft.returnDeadline}
              onChange={(event) => update("returnDeadline", event.target.value)}
            />
          )}
        </Field>

        <Field label="Carrier" optional hint={`If ${retailerName} told you which one`}>
          {(control) => (
            <Select
              {...control}
              value={draft.carrier}
              onChange={(event) => update("carrier", event.target.value)}
            >
              <option value="">Not sure, you choose</option>
              {CARRIERS.map((carrier) => (
                <option key={carrier} value={carrier}>
                  {carrier}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className={styles.toggles}>
        <Segmented<"yes" | "no">
          label="Original packaging?"
          name="hasOriginalPackaging"
          value={draft.hasOriginalPackaging}
          options={YES_NO}
          onChange={(value: YesNo) => update("hasOriginalPackaging", value)}
          hint="No box? No problem. We pack it."
        />
        <Segmented<"yes" | "no">
          label="Return label?"
          name="hasReturnLabel"
          value={draft.hasReturnLabel}
          options={YES_NO}
          onChange={(value: YesNo) => update("hasReturnLabel", value)}
          hint="We print it for you."
        />
        <Segmented<"yes" | "no">
          label="QR code?"
          name="hasQrCode"
          value={draft.hasQrCode}
          options={YES_NO}
          onChange={(value: YesNo) => update("hasQrCode", value)}
          hint="Some retailers send one instead of a label."
        />
      </div>

      <AttachmentPicker
        files={attachments}
        onChange={onAttachmentsChange}
        error={errors.attachments}
      />
    </section>
  );
}
