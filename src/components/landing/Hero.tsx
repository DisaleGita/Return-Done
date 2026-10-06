import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroVisual } from "./HeroVisual";
import styles from "./landing.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>
            <span className={styles.pulseDot} aria-hidden="true" />
            Doorstep return pickup
          </p>
          <h1 id="hero-heading" className={styles.heroTitle}>
            Returns without the <span className={styles.highlight}>runaround.</span>
          </h1>
          <p className={styles.heroLede}>
            Schedule a doorstep pickup and let Return Done handle the annoying part of online
            returns.
          </p>
          <div className={styles.heroActions}>
            <Button href="/schedule" size="lg" iconRight={<ArrowRight />}>
              Schedule a Return
            </Button>
            <Button href="#how-it-works" size="lg" variant="secondary">
              See How It Works
            </Button>
          </div>
          <ul className={styles.heroChecks}>
            {["No printer", "No box", "No post-office line"].map((item) => (
              <li key={item}>
                <Check aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className={styles.demoLink}>
            Just looking? <Link href="/dashboard">Explore Demo Account</Link>
          </p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
