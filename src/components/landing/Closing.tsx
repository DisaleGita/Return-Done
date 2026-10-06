import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pricingConfig } from "@/lib/config";
import { formatMoney } from "@/lib/pricing";
import styles from "./landing.module.css";

export function StorySnippet() {
  return (
    <section className={styles.section} aria-labelledby="story-heading">
      <div className={`container ${styles.story}`}>
        <div className={styles.storyStamp} aria-hidden="true">
          <MapPin />
          <span>Chicago</span>
          <strong>2023</strong>
        </div>
        <div>
          <p className="eyebrow">Our story</p>
          <h2 id="story-heading" className={styles.sectionTitle}>
            Started as two grad students, a poster and a pickup.
          </h2>
          <p className={styles.sectionLede}>
            Return Done began in Chicago in 2023. We built the product, put posters up around the
            Illinois Tech campus and ran real pickups for students. We learned a lot about how much
            work hides behind a simple “we&apos;ll pick it up.” This site is a modern rebuild of
            that product.
          </p>
          <Button
            href="/about"
            variant="secondary"
            iconRight={<ArrowRight />}
            className={styles.storyButton}
          >
            Read the full story
          </Button>
        </div>
      </div>
    </section>
  );
}

// Adapted from the FAQ on the original 2023 site.
const FAQ = [
  {
    q: "What can I return?",
    a: "Most things bought online or in store that are still within the retailer's return window and in returnable condition: clothing, shoes, electronics, home goods. Perishable, hazardous and personalized items usually can't be returned.",
  },
  {
    q: "Do I need to pack the item or print a label?",
    a: "No. In fact, leave it unpacked. Our driver checks the item at your door, then packs, labels and seals it. If the retailer sent a QR code or label, have it handy, but it isn't required to book.",
  },
  {
    q: "How much does it cost?",
    a: `${formatMoney(pricingConfig.singleItem)} for one item, or ${formatMoney(pricingConfig.multiItem)} for two or more from the same retailer. Saturday pickups are ${formatMoney(pricingConfig.returnDay.discount)} cheaper.`,
  },
  {
    q: "How do I know my refund came through?",
    a: "Every return has a tracking number and a timeline, from pickup through delivery to the retailer and the refund. Your dashboard shows what's pending and what's already back in your account.",
  },
  {
    q: "What if the retailer won't accept the return?",
    a: "We contact you right away to work out the next step, whether that's bringing the item back to you or trying another route.",
  },
  {
    q: "Can I reschedule a pickup?",
    a: "Yes, up to two hours before your window starts.",
  },
  {
    q: "Is this a live service?",
    a: "Not right now. Return Done ran pickups in Chicago in 2023. This site is a working product demo of the rebuilt platform: you can schedule and track returns, but no driver will show up and no payment is taken.",
  },
];

export function Faq() {
  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-heading">
      <div className={`container ${styles.faqLayout}`}>
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-heading" className={styles.sectionTitle}>
            Questions, answered.
          </h2>
        </div>
        <div className={styles.faqList}>
          {FAQ.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className={styles.finalCta} aria-labelledby="final-heading">
      <div className="container">
        <div className={styles.finalCard}>
          <h2 id="final-heading">Got something to send back?</h2>
          <p>Schedule a pickup in about two minutes, or poke around the demo account first.</p>
          <div className={styles.finalActions}>
            <Button href="/schedule" size="lg" variant="inverse" iconRight={<ArrowRight />}>
              Schedule a Return
            </Button>
            <Button href="/dashboard" size="lg" variant="ghost" className={styles.finalGhost}>
              Explore Demo Account
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
