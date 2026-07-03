import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "../styles/StatCard.module.css";

export default function StatCard({ label, value, suffix = "", icon, tone = "primary", index = 0 }) {
  const cardRef = useRef(null);
  const valueRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", delay: index * 0.08 }
      );

      const numeric = typeof value === "number" ? value : parseFloat(value);
      if (!Number.isNaN(numeric)) {
        const counter = { n: 0 };
        gsap.to(counter, {
          n: numeric,
          duration: 1,
          delay: index * 0.08 + 0.15,
          ease: "power2.out",
          onUpdate: () => {
            if (valueRef.current) {
              valueRef.current.textContent = `${Math.round(counter.n)}${suffix}`;
            }
          },
        });
      }
    }, cardRef);
    return () => ctx.revert();
  }, [value, index, suffix]);

  const isNumeric = typeof value === "number" || !Number.isNaN(parseFloat(value));

  return (
    <div className={`${styles.card} ${styles[tone]}`} ref={cardRef}>
      <div className={styles.iconWrap}>{icon}</div>
      <p className={styles.label}>{label}</p>
      <p className={styles.value} ref={valueRef}>
        {isNumeric ? `0${suffix}` : value}
      </p>
    </div>
  );
}