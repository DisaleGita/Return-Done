"use client";

import type { RefObject } from "react";
import { MapPin } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/primitives";
import { pricingConfig } from "@/lib/config";
import { formatDate, parseISODate } from "@/lib/dates";
import { DEMO_ADDRESS } from "@/lib/demo-data";
import { isReturnDay } from "@/lib/pricing";
import type { ReturnDraft } from "@/lib/return-draft";
import { getPickupDays, getPickupWindows } from "@/lib/scheduling";
import type { FieldErrors } from "@/lib/schemas";
import type { UpdateDraft } from "./ScheduleWizard";
import styles from "./steps.module.css";

interface Props {
  draft: ReturnDraft;
  update: UpdateDraft;
  errors: FieldErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
  now: Date | null;
}

export function PickupStep({ draft, update, errors, headingRef, now }: Props) {
  const days = now ? getPickupDays(now) : [];
  const windows = now && draft.pickupDate ? getPickupWindows(draft.pickupDate, now) : [];

  const selectDay = (date: string) => {
    update("pickupDate", date);
    // Clear a window that isn't available on the newly chosen day.
    if (
      draft.windowId &&
      now &&
      !getPickupWindows(date, now).some((w) => w.id === draft.windowId && w.available)
    ) {
      update("windowId", "");
    }
  };

  const useDemoAddress = () => {
    update("line1", DEMO_ADDRESS.line1);
    update("line2", "");
    update("city", DEMO_ADDRESS.city);
    update("state", DEMO_ADDRESS.state);
    update("zip", DEMO_ADDRESS.zip);
  };

  return (
    <section aria-labelledby="pickup-heading">
      <h1 id="pickup-heading" ref={headingRef} tabIndex={-1} className={styles.heading}>
        When should we come by?
      </h1>
      <p className={styles.lede}>
        Pick a day and a two-hour window. Have the item ready; no box or tape needed.
      </p>

      <fieldset
        className={styles.fieldset}
        aria-describedby={errors.pickupDate ? "day-error" : undefined}
      >
        <legend className={styles.groupLegend}>Pickup day</legend>
        {now ? (
          <div className={styles.dayScroller}>
            {days.map((day, index) => {
              const date = parseISODate(day.date);
              const saturday = isReturnDay(day.date);
              return (
                <label
                  key={day.date}
                  className={styles.day}
                  data-disabled={!day.available || undefined}
                >
                  <input
                    type="radio"
                    name="pickupDate"
                    value={day.date}
                    checked={draft.pickupDate === day.date}
                    disabled={!day.available}
                    onChange={() => selectDay(day.date)}
                    aria-invalid={errors.pickupDate && index === 0 ? true : undefined}
                  />
                  <span className={styles.dayInner}>
                    <span className={styles.dayName}>
                      {index === 0
                        ? "Today"
                        : date.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className={styles.dayNumber}>{date.getDate()}</span>
                    <span className={styles.dayMonth}>
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    {saturday && day.available && (
                      <span className={styles.dayTag}>
                        Save ${pricingConfig.returnDay.discount}
                      </span>
                    )}
                  </span>
                  <span className="visually-hidden">
                    {formatDate(day.date, { weekday: "long", month: "long", day: "numeric" })}
                    {!day.available ? ", fully booked" : saturday ? ", Return Day discount" : ""}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className={styles.dayScroller} aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} width={72} height={88} radius={12} />
            ))}
          </div>
        )}
        {errors.pickupDate && (
          <p id="day-error" className={styles.groupError} role="alert">
            {errors.pickupDate}
          </p>
        )}
      </fieldset>

      <fieldset
        className={styles.fieldset}
        aria-describedby={errors.windowId ? "window-error" : undefined}
        disabled={!draft.pickupDate}
      >
        <legend className={styles.groupLegend}>Pickup window</legend>
        {!draft.pickupDate ? (
          <p className={styles.placeholder}>Choose a day to see open windows.</p>
        ) : (
          <div className={styles.windowGrid}>
            {windows.map((window, index) => (
              <label
                key={window.id}
                className={styles.window}
                data-disabled={!window.available || undefined}
              >
                <input
                  type="radio"
                  name="windowId"
                  value={window.id}
                  checked={draft.windowId === window.id}
                  disabled={!window.available}
                  onChange={() => update("windowId", window.id)}
                  aria-invalid={errors.windowId && index === 0 ? true : undefined}
                />
                <span className={styles.windowInner}>
                  {window.label}
                  {!window.available && <span className={styles.windowNote}>Unavailable</span>}
                </span>
              </label>
            ))}
          </div>
        )}
        {errors.windowId && (
          <p id="window-error" className={styles.groupError} role="alert">
            {errors.windowId}
          </p>
        )}
      </fieldset>

      <fieldset className={`${styles.fieldset} ${styles.addressFieldset}`}>
        <legend className={styles.groupLegend}>Pickup address</legend>
        <button type="button" className={styles.textButton} onClick={useDemoAddress}>
          <MapPin aria-hidden="true" /> Use demo address
        </button>
        <div className={styles.formGrid}>
          <Field label="Street address" error={errors.line1} required className={styles.span2}>
            {(control) => (
              <Input
                {...control}
                value={draft.line1}
                onChange={(event) => update("line1", event.target.value)}
                autoComplete="address-line1"
              />
            )}
          </Field>
          <Field label="Apt, suite, unit" optional className={styles.span2}>
            {(control) => (
              <Input
                {...control}
                value={draft.line2}
                onChange={(event) => update("line2", event.target.value)}
                autoComplete="address-line2"
              />
            )}
          </Field>
          <Field label="City" error={errors.city} required>
            {(control) => (
              <Input
                {...control}
                value={draft.city}
                onChange={(event) => update("city", event.target.value)}
                autoComplete="address-level2"
              />
            )}
          </Field>
          <div className={styles.pair}>
            <Field label="State" error={errors.state} required>
              {(control) => (
                <Input
                  {...control}
                  value={draft.state}
                  onChange={(event) => update("state", event.target.value.toUpperCase())}
                  autoComplete="address-level1"
                  maxLength={2}
                  placeholder="IL"
                />
              )}
            </Field>
            <Field label="ZIP" error={errors.zip} required>
              {(control) => (
                <Input
                  {...control}
                  value={draft.zip}
                  onChange={(event) => update("zip", event.target.value)}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="60616"
                />
              )}
            </Field>
          </div>
          <Field
            label="Special instructions"
            optional
            error={errors.instructions}
            hint="Gate codes, buzzer numbers, or where to meet you"
            className={styles.span2}
          >
            {(control) => (
              <Textarea
                {...control}
                rows={3}
                maxLength={300}
                value={draft.instructions}
                onChange={(event) => update("instructions", event.target.value)}
              />
            )}
          </Field>
        </div>
      </fieldset>
    </section>
  );
}
