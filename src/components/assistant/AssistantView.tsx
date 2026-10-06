"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Info, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, Callout, Skeleton } from "@/components/ui/primitives";
import { assistantConfig } from "@/lib/config";
import type { AssistantEngine, AssistantResult } from "@/lib/assistant/types";
import { buildSamples } from "@/lib/assistant/samples";
import { useNow } from "@/lib/use-now";
import { ExtractionResult } from "./ExtractionResult";
import styles from "./AssistantView.module.css";

const ENGINE_LABEL: Record<AssistantEngine, string> = {
  rules: "Demo mode · rule-based",
  claude: "AI · Claude",
};

export function AssistantView() {
  const now = useNow();
  const samples = useMemo(() => (now ? buildSamples(now) : []), [now]);
  const [text, setText] = useState("");
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState<AssistantEngine | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/assistant", { signal: controller.signal })
      .then((response) => response.json())
      .then((body: { engine: AssistantEngine }) => setEngine(body.engine))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  async function analyze(input: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(body.error ?? "We couldn't read that text. Try again in a moment.");
      setResult(body as AssistantResult);
      setEngine((body as AssistantResult).engine);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const tooShort = text.trim().length < 20;

  return (
    <div className={`container ${styles.page} page-enter`}>
      <header className={styles.header}>
        <span className={styles.eyebrowIcon} aria-hidden="true">
          <Sparkles />
        </span>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Smart Return Assistant</h1>
            {engine && (
              <Badge tone={engine === "claude" ? "brand" : "warning"}>{ENGINE_LABEL[engine]}</Badge>
            )}
          </div>
          <p className={styles.lede}>
            Paste a return confirmation, a retailer&apos;s instructions or a return policy.
            We&apos;ll pull out the deadline, how the return works, and what to do next.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.inputCard} aria-labelledby="input-heading">
          <h2 id="input-heading" className="visually-hidden">
            Return text
          </h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!tooShort) void analyze(text);
            }}
          >
            <label htmlFor="return-text" className={styles.label}>
              Return text
            </label>
            <textarea
              id="return-text"
              className={styles.textarea}
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={assistantConfig.maxInputChars}
              placeholder="Paste an email or policy here…"
              aria-describedby="return-text-help"
              rows={12}
            />
            <div className={styles.inputFoot}>
              <p id="return-text-help" className={styles.help}>
                {text.length.toLocaleString()} / {assistantConfig.maxInputChars.toLocaleString()}{" "}
                characters. Don&apos;t paste payment details.
              </p>
              <Button type="submit" icon={<Wand2 />} loading={loading} disabled={tooShort}>
                Analyze
              </Button>
            </div>
          </form>

          <div className={styles.samples}>
            <p className={styles.samplesLabel}>
              <FileText aria-hidden="true" /> Try an example
            </p>
            <div className={styles.sampleButtons}>
              {samples.length === 0
                ? Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} width={150} height={36} radius={999} />
                  ))
                : samples.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      className={styles.sample}
                      onClick={() => {
                        setText(sample.text);
                        void analyze(sample.text);
                      }}
                    >
                      {sample.label}
                    </button>
                  ))}
            </div>
            <p className={styles.samplesNote}>
              Examples are made-up texts in the style of common retailer emails.
            </p>
          </div>
        </section>

        <section className={styles.output} aria-labelledby="output-heading" aria-busy={loading}>
          <h2 id="output-heading" className="visually-hidden">
            Results
          </h2>
          {error && (
            <Callout tone="danger" title="That didn't work">
              {error}
            </Callout>
          )}
          {loading && (
            <div className={styles.loadingCard} role="status">
              <span className="visually-hidden">Reading your text…</span>
              <Skeleton width="85%" height={22} />
              <Skeleton width="60%" height={22} />
              <div className={styles.loadingGrid}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} style={{ display: "grid", gap: 8 }}>
                    <Skeleton width={70} height={10} />
                    <Skeleton width="80%" height={14} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {!loading && !error && !result && (
            <div className={styles.idle}>
              <Info aria-hidden="true" />
              <p>
                Results show up here. Try one of the examples if you don&apos;t have an email handy.
              </p>
            </div>
          )}
          {result && !loading && (
            <div ref={resultRef} tabIndex={-1} className={styles.resultWrap}>
              <ExtractionResult result={result} />
            </div>
          )}
        </section>
      </div>

      <aside className={styles.howItWorks} aria-labelledby="how-heading">
        <h2 id="how-heading">How this works</h2>
        <p>
          Without an API key, the assistant uses a built-in parser that recognizes the phrasing in
          typical retailer emails: dates, carriers, QR codes, label and packaging rules. It runs on
          the server, makes no network calls and costs nothing. With <code>ANTHROPIC_API_KEY</code>{" "}
          set, the same request goes to Claude for structured extraction, and falls back to the
          parser if that fails. Both produce the same result shape, so the UI doesn&apos;t care
          which one answered.
        </p>
      </aside>
    </div>
  );
}
