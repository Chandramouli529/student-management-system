import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import styles from "../styles/TopBar.module.css";

export default function TopBar({ title, subtitle, actions }) {
  const { user } = useAuth();
  const ref = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      accountRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, [title]);

  const firstName = user?.name?.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const roleLabel = user?.role === "teacher" ? "Teacher" : user?.role === "admin" ? "Admin" : "Student";
  const roleClass =
    user?.role === "teacher" ? styles.roleTeacher : user?.role === "admin" ? styles.roleAdmin : styles.roleStudent;

  return (
    <header>
      <div className={styles.accountBar} ref={accountRef}>
        <div className={styles.accountInfo}>
          <span className={styles.accountAvatar}>{user?.name?.charAt(0) ?? "?"}</span>
          <div>
            <p className={styles.accountGreeting}>
              {greeting}, <strong>{user?.role === "admin" ? user?.name : firstName}</strong>
            </p>
            <span className={`${styles.roleBadge} ${roleClass}`}>{roleLabel}</span>
          </div>
        </div>
        <NotificationBell />
      </div>

      <div className={styles.topbar} ref={ref}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}