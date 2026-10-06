import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  Home,
  LayoutList,
  ScanLine,
  Wallet,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pricingConfig } from "@/lib/config";
import { formatMoney } from "@/lib/pricing";
import { POPULAR_RETAILER_IDS, getRetailer } from "@/lib/retailers";
import styles from "./landing.module.css";

const BENEFITS = [
  {
    icon: Building2,
    title: "No post-office runs",
    body: "Your afternoon stays yours. We come to you.",
  },
  {
    icon: ScanLine,
    title: "No printer required",
    body: "No label? No box? We print, pack and tape it for you.",
  },
  {
    icon: LayoutList,
    title: "One place for every return",
    body: "Every retailer, every status, one dashboard.",
  },
  {
    icon: Home,
    title: "Doorstep pickup",
    body: "Two-hour windows, seven days a week, 8 AM to 8 PM.",
  },
  {
    icon: Wallet,
    title: "Refund tracking",
    body: "We follow it past drop-off until the money lands.",
  },
  {
    icon: Bell,
    title: "Return deadline reminders",
    body: "See what's due soon before the window quietly closes.",
  },
];

export function Benefits() {
  return (
    <section className={styles.section} aria-labelledby="benefits-heading">
      <div className="container">
        <div className={styles.sectionHead}>
          <p className="eyebrow">Why Return Done</p>
          <h2 id="benefits-heading" className={styles.sectionTitle}>
            All of the return, none of the errand.
          </h2>
        </div>
        <ul className={styles.benefits}>
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <li key={title} className={styles.benefit}>
              <span className={styles.benefitIcon} aria-hidden="true">
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AssistantTeaser() {
  return (
    <section
      className={`${styles.section} ${styles.sectionFlush}`}
      aria-labelledby="assistant-heading"
    >
      <div className="container">
        <div className={styles.teaser}>
          <div className={styles.teaserCopy}>
            <p className={styles.teaserEyebrow}>
              <Wand2 aria-hidden="true" /> New in the 2026 rebuild
            </p>
            <h2 id="assistant-heading" className={styles.teaserTitle}>
              Paste the return email. Get the plan.
            </h2>
            <p className={styles.teaserBody}>
              The Smart Return Assistant reads a confirmation email or policy and pulls out the
              deadline, the return method, whether you need a printer, and what to do next. It works
              in demo mode without any API key.
            </p>
            <Button href="/assistant" variant="inverse" iconRight={<ArrowRight />}>
              Try the assistant
            </Button>
          </div>
          <div className={styles.teaserDemo} aria-hidden="true">
            <p className={styles.teaserQuote}>
              “…eligible until October 18. No printer needed. Just show the QR code at any UPS
              Store…”
            </p>
            <div className={styles.teaserResult}>
              <p>
                Your Nike return is eligible until October 18. No printer is required. The return
                uses a UPS QR code.
              </p>
              <ul>
                <li>
                  <Check /> Deadline found
                </li>
                <li>
                  <Check /> QR code · UPS
                </li>
                <li>
                  <Check /> Next step ready
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const tiers = [
    { name: "One item", price: pricingConfig.singleItem, note: "per return" },
    { name: "Two or more", price: pricingConfig.multiItem, note: "same retailer, one pickup" },
  ];
  return (
    <section
      id="pricing"
      className={`${styles.section} ${styles.sectionTinted}`}
      aria-labelledby="pricing-heading"
    >
      <div className="container">
        <div className={styles.sectionHead}>
          <p className="eyebrow">Pricing</p>
          <h2 id="pricing-heading" className={styles.sectionTitle}>
            Simple, per-pickup pricing.
          </h2>
          <p className={styles.sectionLede}>
            Pickup, packing, labels, drop-off and refund tracking are all included.
          </p>
        </div>
        <div className={styles.pricing}>
          {tiers.map((tier) => (
            <div key={tier.name} className={styles.priceCard}>
              <p className={styles.priceName}>{tier.name}</p>
              <p className={styles.priceValue}>
                {formatMoney(tier.price)}
                <span>{tier.note}</span>
              </p>
            </div>
          ))}
          <div className={`${styles.priceCard} ${styles.priceAccent}`}>
            <p className={styles.priceName}>Return Day</p>
            <p className={styles.priceValue}>
              −{formatMoney(pricingConfig.returnDay.discount)}
              <span>on Saturday pickups</span>
            </p>
          </div>
        </div>
        <p className={styles.pricingNote}>
          Return Day dates back to 2023, when we batched Saturday routes and passed the savings on.
          Prices shown are for this demo.
        </p>
      </div>
    </section>
  );
}

export function Retailers() {
  const names = POPULAR_RETAILER_IDS.map((id) => getRetailer(id)!.name);
  return (
    <section className={styles.retailers} aria-labelledby="retailers-heading">
      <div className="container">
        <h2 id="retailers-heading" className={styles.retailersTitle}>
          Designed to work with returns from popular retailers
        </h2>
        <ul className={styles.wordmarks}>
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
          <li className={styles.andMore}>
            <Link href="/schedule">and more</Link>
          </li>
        </ul>
        <p className={styles.retailersNote}>
          Retailer names are shown for identification only. Return Done isn&apos;t affiliated with
          them.
        </p>
      </div>
    </section>
  );
}
