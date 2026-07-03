import { useState } from "react";
import styles from "../styles/PasswordInput.module.css";

export default function PasswordInput({ value, onChange, placeholder, autoComplete, id, className }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`${styles.wrapper} ${className || ""}`}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={styles.input}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a13.2 13.2 0 0 1-3.1 3.9M6.6 6.6C4 8.3 2 12 2 12s3.6 7 10 7a9.9 9.9 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}