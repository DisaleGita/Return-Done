import {
  CalendarClock,
  Car,
  Clock3,
  PackageSearch,
  Printer,
  ScrollText,
  Search,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import styles from "./landing.module.css";

const OLD_WAY = [
  { icon: ScrollText, label: "Find the label" },
  { icon: PackageSearch, label: "Find a box" },
  { icon: Printer, label: "Print and pack it" },
  { icon: Car, label: "Drive somewhere" },
  { icon: Clock3, label: "Wait in line" },
  { icon: Search, label: "Chase the refund" },
];

const NEW_WAY = [
  { icon: CalendarClock, label: "Schedule" },
  { icon: Truck, label: "We pick it up" },
  { icon: Wallet, label: "Track your refund" },
];

export function Problem() {
  return (
    <section className={styles.section} aria-labelledby="problem-heading">
      <div className="container">
        <div className={styles.sectionHead}>
          <p className="eyebrow">The problem</p>
          <h2 id="problem-heading" className={styles.sectionTitle}>
            Returning something shouldn&apos;t take an afternoon.
          </h2>
          <p className={styles.sectionLede}>
            Buying online takes a minute. Sending something back still means labels, boxes, a drive
            and a line, then weeks of wondering whether the refund went through.
          </p>
        </div>

        <div className={styles.compare}>
          <div className={styles.compareOld}>
            <p className={styles.compareLabel}>The usual way</p>
            <ol className={styles.flow}>
              {OLD_WAY.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ol>
          </div>
          <div className={styles.compareNew}>
            <p className={styles.compareLabel}>
              <Sparkles aria-hidden="true" /> With Return Done
            </p>
            <ol className={`${styles.flow} ${styles.flowNew}`}>
              {NEW_WAY.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Tell us what you're returning",
    body: "Add your retailer and return details. A label or QR code helps, but you don't need one.",
  },
  {
    title: "Pick a pickup time",
    body: "Choose a two-hour doorstep window that suits you, from 8 AM to 8 PM.",
  },
  {
    title: "Consider it done",
    body: "We collect it, pack it and send it back. Then track the return and refund from one place.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className={`${styles.section} ${styles.sectionTinted}`}
      aria-labelledby="how-heading"
    >
      <div className="container">
        <div className={styles.sectionHead}>
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className={styles.sectionTitle}>
            Three steps. About two minutes.
          </h2>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.stepCard}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
