import styles from "../styles/Dashboard.module.css";

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CircularStat({ label, percentage = 0, index = 0, onClick }) {
  const pct = Math.max(0, Math.min(100, percentage));
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  const tone = pct >= 85 ? styles.ringGood : pct >= 60 ? styles.ringOkay : styles.ringLow;

  return (
    <div
      className={styles.circularStat}
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
      }}
    >
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={RADIUS} fill="none" stroke="var(--ring-track, #eef0f4)" strokeWidth="8" />
        <circle
          className={tone}
          cx="44"
          cy="44"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="48" textAnchor="middle" className={styles.circularStatValue}>
          {Math.round(pct)}%
        </text>
      </svg>
      <span className={styles.circularStatLabel}>{label}</span>
    </div>
  );
}