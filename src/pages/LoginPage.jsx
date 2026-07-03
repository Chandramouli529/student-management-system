import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import styles from "../styles/LoginPage.module.css";

const DASHBOARD_PATH = {
  teacher: "/teacher",
  student: "/student",
  admin: "/admin",
};

export default function LoginPage() {
  const { login } = useAuth();
  const { branches, subjects, classes } = useDirectory();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(Boolean(location.state?.justSignedUp));

  const panelRef = useRef(null);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(heroRef.current, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });
    tl.fromTo(panelRef.current, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, "-=0.55");
    if (gridRef.current) {
      gsap.to(gridRef.current, { backgroundPosition: "60px 60px", duration: 18, repeat: -1, ease: "none" });
    }
    // Clear the router state so a refresh doesn't keep showing the banner.
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function shakePanel() {
    gsap.fromTo(panelRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Enter your email and password to continue.");
      shakePanel();
      return;
    }

    setJustSignedUp(false);
    setSubmitting(true);

    setTimeout(() => {
      const result = login({ email: cleanEmail, password });
      setSubmitting(false);

      if (!result.ok) {
        setError(result.error);
        shakePanel();
        return;
      }

      // Role comes from the account itself, not from anything the person
      // picked on this screen — there's nothing to pick.
      navigate(DASHBOARD_PATH[result.user.role] || "/login");
    }, 300);
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero} ref={heroRef}>
        <div className={styles.gridOverlay} ref={gridRef} />
        <div className={styles.heroContent}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>BP</span>
            <span className={styles.logoWord}>Brightpath</span>
          </div>
          <h1 className={styles.heroTitle}>
            One structured view of every
            <br /> branch, class and student.
          </h1>
          <p className={styles.heroBody}>
            Track attendance, enter marks, and issue certificates — all in one
            place, built for teachers and students alike.
          </p>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.panel} ref={panelRef}>
          <p className={styles.panelEyebrow}>Welcome back</p>
          <h2 className={styles.panelTitle}>Sign in to your account</h2>

          {justSignedUp && (
            <p className={styles.successBanner}>
              Account created. Sign in below with the email and password you just set.
            </p>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label className={styles.fieldLabel} htmlFor="li-email">Email</label>
            <input
              id="li-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <label className={styles.fieldLabel} htmlFor="li-password">Password</label>
            <PasswordInput
              id="li-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className={styles.switchLine}>
            New here? <Link to="/signup" className={styles.link}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}