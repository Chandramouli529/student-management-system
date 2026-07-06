import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../context/AuthContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import styles from "../styles/LoginPage.module.css";
import formStyles from "../styles/SignupPage.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lightweight, dependency-free strength heuristic: length + character
// variety. Good enough for client-side UX guidance, not real entropy math.
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", percent: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Very weak", percent: 15 },
    { label: "Weak", percent: 35 },
    { label: "Fair", percent: 55 },
    { label: "Good", percent: 75 },
    { label: "Strong", percent: 100 },
  ];
  const clamped = Math.min(score, levels.length - 1);
  return { score: clamped, ...levels[clamped] };
}

// Input is sanitized to digits-only as you type (see handlePhoneChange), so
// this is just the final safety check: exactly 10 digits, nothing else.
function isValidPhone(phone) {
  return /^\d{10}$/.test(phone);
}

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const heroRef = useRef(null);
  const strengthBarRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(heroRef.current, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });
    tl.fromTo(panelRef.current, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, "-=0.55");
  }, []);

  useEffect(() => {
    if (!strengthBarRef.current) return;
    gsap.to(strengthBarRef.current, {
      width: `${strength.percent}%`,
      duration: 0.35,
      ease: "power2.out",
    });
  }, [strength.percent]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  }

  // Strips anything that isn't a digit and caps at 10 characters as you
  // type — so the field itself can never end up holding letters,
  // symbols, or more than 10 digits, rather than only catching it at
  // submit time.
  function handlePhoneChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    update("phone", digitsOnly);
  }

  function shakePanel() {
    gsap.fromTo(
      panelRef.current,
      { x: -8 },
      { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" }
    );
  }

  function validate() {
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) return "Name and email are required.";
    if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
    if (form.phone && !isValidPhone(form.phone.trim())) {
      return "Enter a valid 10-digit contact number.";
    }
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) {
      return "Password must include at least one letter and one number.";
    }
    if (form.password !== form.confirmPassword) return "Passwords do not match.";

    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      shakePanel();
      return;
    }

    setSubmitting(true);

    const payload = {
      role: "admin",
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    };

    // Small delay so the loading state is visible — mirrors a real network call.
    setTimeout(() => {
      const result = signup(payload);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error);
        shakePanel();
        return;
      }
      navigate("/login", { state: { justSignedUp: true, email: result.email } });
    }, 350);
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero} ref={heroRef}>
        <div className={styles.gridOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>BP</span>
            <span className={styles.logoWord}>Brightpath</span>
          </div>
          <h1 className={styles.heroTitle}>Create your account.</h1>
          <p className={styles.heroBody}>
            Set your email and password here, then sign in with them on the
            next screen.
          </p>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={`${styles.panel} ${formStyles.wide}`} ref={panelRef}>
          <p className={styles.panelEyebrow}>Get started</p>
          <h2 className={styles.panelTitle}>Create your account</h2>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label className={styles.fieldLabel} htmlFor="su-name">Full name</label>
            <input
              id="su-name"
              className={styles.input}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />

            <label className={styles.fieldLabel} htmlFor="su-email">Email</label>
            <input
              id="su-email"
              className={styles.input}
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@brightpath.edu"
              autoComplete="email"
            />

            <label className={styles.fieldLabel} htmlFor="su-phone">Phone</label>
            <input
              id="su-phone"
              className={styles.input}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="9000012345"
              autoComplete="tel"
            />

            <label className={styles.fieldLabel} htmlFor="su-password">Password</label>
            <PasswordInput
              id="su-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            {form.password && (
              <div className={formStyles.strengthWrap}>
                <div className={formStyles.strengthTrack}>
                  <div
                    ref={strengthBarRef}
                    className={`${formStyles.strengthBar} ${formStyles["strength" + strength.score]}`}
                  />
                </div>
                <span className={formStyles.strengthLabel}>{strength.label}</span>
              </div>
            )}

            <label className={styles.fieldLabel} htmlFor="su-confirm">Confirm password</label>
            <PasswordInput
              id="su-confirm"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            {form.confirmPassword && form.confirmPassword !== form.password && (
              <p className={formStyles.mismatch}>Passwords don't match yet.</p>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className={styles.switchLine}>
            Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}