import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Return Done started in Chicago in 2023 as a doorstep returns service tested with students around Illinois Tech. This is the 2026 rebuild.",
};

const JOURNEY = [
  {
    label: "The itch",
    body: "Four graduate students in Chicago noticed how much effort a simple return took: labels, boxes, a trip across town, a line, and then weeks of checking for the refund.",
  },
  {
    label: "Building it",
    body: "We designed and built the first version ourselves: a return request form, pickup scheduling with two-hour windows, online payment, confirmation emails and an operations inbox for every request.",
  },
  {
    label: "Going to campus",
    body: "We put up posters around the Illinois Tech campus and signed up our first customers: students juggling classes, assignments and return deadlines.",
  },
  {
    label: "Real pickups",
    body: "We scheduled real doorstep pickups, checked items at the door, packed and labeled them, and took them back to the retailer.",
  },
  {
    label: "Pausing",
    body: "The software held up. The operations were the hard part. We chose not to keep scaling it with a team of four.",
  },
  {
    label: "2026 rebuild",
    body: "A modern rebuild of the original product, exploring what Return Done could look like with today's tools.",
  },
];

const LESSONS = [
  {
    title: "Building software is different from building operations",
    body: "The booking flow was the part we knew how to build. Getting the right item, from the right door, to the right counter, every time, was the real work.",
  },
  {
    title: "Logistics runs on physical-world constraints",
    body: "Traffic, buzzers, store hours, carrier cut-offs and people who aren't home. None of it shows up in a database schema.",
  },
  {
    title: "Early customer validation matters",
    body: "A poster and a simple form taught us more than any planning document. The interest was real. The open question was what it cost to serve it.",
  },
  {
    title: "Product simplicity often hides operational complexity",
    body: "“We'll pick it up” is three words for the customer and a routing, timing and verification problem for the team behind it.",
  },
];

const THEN_AND_NOW = [
  [
    "Frontend",
    "Create React App, Bootstrap, jQuery",
    "Next.js App Router, React 19, strict TypeScript",
  ],
  ["Design", "Ad-hoc SCSS per component", "Token-based design system with CSS Modules"],
  [
    "Backend",
    "ASP.NET Core 6 email API on Azure",
    "Typed route handlers with shared zod validation",
  ],
  [
    "Return data",
    "Form data emailed to an ops inbox",
    "Typed return records with a status lifecycle",
  ],
  ["Tracking", "Email updates", "Live timeline and a returns dashboard"],
  ["New", "None", "Smart Return Assistant with an optional LLM and a deterministic fallback"],
] as const;

export default function AboutPage() {
  const { founder } = siteConfig;
  return (
    <div className="page-enter">
      <section className={styles.hero}>
        <div className="container">
          <p className="eyebrow">Our story</p>
          <h1 className={styles.title}>We tried to fix returns. Here&apos;s what happened.</h1>
        </div>
      </section>

      <section className="container" aria-label="The story">
        <div className={styles.prose}>
          <p className={styles.lead}>
            Return Done started in Chicago in 2023, after we noticed how complicated everyday retail
            returns had become.
          </p>
          <p>
            What began as an idea between four graduate students turned into a working product that
            we tested with customers around the Illinois Tech community. We built the platform, put
            up posters around campus, scheduled real pickups, and learned firsthand that solving the
            software problem was only one part of building a logistics company.
          </p>
          <p>
            The original experiment ended once we saw how operationally intensive last-mile returns
            could be. The problem itself never went away. Returns are still fragmented, still slow,
            and still an errand nobody wants.
          </p>
          <p>
            This site is a modern rebuild of that original product, and an exploration of what
            Return Done could look like today.
          </p>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="journey-heading">
        <h2 id="journey-heading" className={styles.sectionTitle}>
          The journey
        </h2>
        <ol className={styles.journey}>
          {JOURNEY.map((item, index) => (
            <li key={item.label}>
              <span className={styles.journeyIndex} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{item.label}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="lessons"
        className={`container ${styles.section}`}
        aria-labelledby="lessons-heading"
      >
        <h2 id="lessons-heading" className={styles.sectionTitle}>
          What we learned
        </h2>
        <div className={styles.lessons}>
          {LESSONS.map((lesson) => (
            <article key={lesson.title} className={styles.lesson}>
              <h3>{lesson.title}</h3>
              <p>{lesson.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="built-heading">
        <div className={styles.built}>
          <div>
            <h2 id="built-heading" className={styles.sectionTitle}>
              Built from zero
            </h2>
            <p className={styles.builtBody}>
              Return Done was designed and engineered from the ground up, spanning the customer
              experience, return workflows, scheduling, product architecture and early operational
              experiments. The 2026 rebuild keeps the original business rules, like two-hour pickup
              windows and Saturday Return Day pricing, and rebuilds everything around them.
            </p>
            <Button
              href={siteConfig.repoUrl}
              variant="secondary"
              iconRight={<ArrowUpRight />}
              target="_blank"
              rel="noreferrer"
            >
              View the source
            </Button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="visually-hidden">How the stack changed from 2023 to 2026</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Area</span>
                  </th>
                  <th scope="col">2023</th>
                  <th scope="col">2026</th>
                </tr>
              </thead>
              <tbody>
                {THEN_AND_NOW.map(([area, then, now]) => (
                  <tr key={area}>
                    <th scope="row">{area}</th>
                    <td>{then}</td>
                    <td>{now}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="team-heading">
        <h2 id="team-heading" className={styles.sectionTitle}>
          The team
        </h2>
        <div className={styles.founder}>
          <span className={styles.founderMark} aria-hidden="true">
            {founder.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <div>
            <p className={styles.founderName}>{founder.name}</p>
            <p className={styles.founderRole}>{founder.role}</p>
            <p className={styles.founderBody}>
              Co-founded Return Done and led the technology: built the original product and helped
              define how pickups and returns actually ran. Return Done was a four-person founding
              team.
            </p>
            <p className={styles.founderLinks}>
              <a href={founder.portfolioUrl} target="_blank" rel="noreferrer">
                Portfolio <ArrowUpRight aria-hidden="true" />
              </a>
              {founder.linkedInUrl && (
                <a href={founder.linkedInUrl} target="_blank" rel="noreferrer">
                  LinkedIn <ArrowUpRight aria-hidden="true" />
                </a>
              )}
              <a href={founder.githubUrl} target="_blank" rel="noreferrer">
                GitHub <ArrowUpRight aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="container" aria-label="Try it">
        <div className={styles.cta}>
          <p>See what the rebuilt product feels like.</p>
          <div>
            <Button href="/schedule" iconRight={<ArrowRight />}>
              Schedule a Return
            </Button>
            <Button href="/dashboard" variant="secondary">
              Explore Demo Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
