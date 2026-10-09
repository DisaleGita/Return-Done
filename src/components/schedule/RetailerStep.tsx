"use client";

import type { RefObject } from "react";
import { useState } from "react";
import { Search, Store } from "lucide-react";
import { Field, Input } from "@/components/ui/Field";
import { RetailerAvatar } from "@/components/returns/RetailerAvatar";
import {
  OTHER_RETAILER_ID,
  POPULAR_RETAILER_IDS,
  RETAILERS,
  getRetailer,
  searchRetailers,
} from "@/lib/retailers";
import { checkContactEmail, type ReturnDraft } from "@/lib/return-draft";
import type { FieldErrors } from "@/lib/schemas";
import type { UpdateDraft } from "./ScheduleWizard";
import styles from "./steps.module.css";

interface Props {
  draft: ReturnDraft;
  update: UpdateDraft;
  errors: FieldErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export function RetailerStep({ draft, update, errors, headingRef }: Props) {
  const [query, setQuery] = useState("");
  // Check the email once they've left the field (or tried to continue), then
  // keep the message in step with what they type.
  const [emailTouched, setEmailTouched] = useState(false);
  const emailProblem = checkContactEmail(draft.contactEmail);
  const showLive = emailTouched && draft.contactEmail.trim() !== "";
  const emailError = errors.contactEmail ?? (showLive ? emailProblem?.message : undefined);
  const searching = query.trim().length > 0;
  const popular = POPULAR_RETAILER_IDS.map((id) => getRetailer(id)!);

  let options = searching ? searchRetailers(query) : popular;
  // Keep the current choice visible even when it isn't in the list.
  const selected = getRetailer(draft.retailerId);
  if (selected && !options.some((r) => r.id === selected.id)) options = [selected, ...options];

  const chooseOther = () => {
    update("retailerId", OTHER_RETAILER_ID);
    // Carry the search over only when it didn't match a retailer we know.
    if (searching && options.length === 0 && !draft.customRetailerName) {
      update("customRetailerName", query.trim());
    }
  };

  return (
    <section aria-labelledby="retailer-heading">
      <h1 id="retailer-heading" ref={headingRef} tabIndex={-1} className={styles.heading}>
        Let&apos;s start your return
      </h1>
      <p className={styles.lede}>
        It takes about two minutes. First, where should we send your confirmation?
      </p>

      <div className={styles.emailField}>
        <Field
          label="Your email"
          required
          error={emailError}
          hint="We'll email your pickup details and tracking number. Only used for this confirmation."
        >
          {(control) => (
            <Input
              {...control}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={draft.contactEmail}
              onChange={(event) => update("contactEmail", event.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
            />
          )}
        </Field>
        {emailError && emailProblem?.suggestion && (
          <button
            type="button"
            className={styles.suggestion}
            onClick={() => update("contactEmail", emailProblem.suggestion!)}
          >
            Use {emailProblem.suggestion}
          </button>
        )}
      </div>

      <h2 className={styles.subheading}>Where did you buy it?</h2>
      <p className={styles.lede}>
        Pick the retailer you&apos;re returning to. One retailer per pickup keeps things simple.
      </p>

      <div className={styles.search}>
        <Search aria-hidden="true" className={styles.searchIcon} />
        <label htmlFor="retailer-search" className="visually-hidden">
          Search retailers
        </label>
        <input
          id="retailer-search"
          type="search"
          className={styles.searchInput}
          placeholder={`Search ${RETAILERS.length}+ retailers`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
      </div>

      <fieldset
        className={styles.fieldset}
        aria-describedby={errors.retailerId ? "retailer-error" : undefined}
      >
        <legend className="visually-hidden">Retailer</legend>
        <p className={styles.groupLabel} aria-live="polite">
          {searching
            ? options.length > 0
              ? `${options.length} ${options.length === 1 ? "match" : "matches"}`
              : "No matches. Choose “Other retailer” below."
            : "Popular"}
        </p>
        <div className={styles.retailerGrid}>
          {options.map((retailer) => (
            <label key={retailer.id} className={styles.tile}>
              <input
                type="radio"
                name="retailer"
                value={retailer.id}
                checked={draft.retailerId === retailer.id}
                onChange={() => update("retailerId", retailer.id)}
              />
              <span className={styles.tileInner}>
                <RetailerAvatar name={retailer.name} size={36} />
                <span>
                  <span className={styles.tileTitle}>{retailer.name}</span>
                  <span className={styles.tileMeta}>{retailer.category}</span>
                </span>
              </span>
            </label>
          ))}
          <label className={styles.tile}>
            <input
              type="radio"
              name="retailer"
              value={OTHER_RETAILER_ID}
              checked={draft.retailerId === OTHER_RETAILER_ID}
              onChange={chooseOther}
            />
            <span className={styles.tileInner}>
              <span className={styles.otherIcon} aria-hidden="true">
                <Store />
              </span>
              <span>
                <span className={styles.tileTitle}>Other retailer</span>
                <span className={styles.tileMeta}>Anywhere else</span>
              </span>
            </span>
          </label>
        </div>
        {errors.retailerId && (
          <p id="retailer-error" className={styles.groupError} role="alert">
            {errors.retailerId}
          </p>
        )}
      </fieldset>

      {draft.retailerId === OTHER_RETAILER_ID && (
        <div className={styles.reveal}>
          <Field label="Retailer name" error={errors.customRetailerName} required>
            {(control) => (
              <Input
                {...control}
                value={draft.customRetailerName}
                onChange={(event) => update("customRetailerName", event.target.value)}
                placeholder="e.g. Everlane"
                maxLength={60}
                autoComplete="organization"
              />
            )}
          </Field>
        </div>
      )}

      <p className={styles.disclaimer}>
        Return Done works with returns from popular retailers. It isn&apos;t affiliated with or
        endorsed by them.
      </p>
    </section>
  );
}
