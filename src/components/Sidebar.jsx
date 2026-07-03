import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "../styles/Sidebar.module.css";

const adminNav = [
  { to: "/admin", label: "Admin Dashboard", icon: "grid" },
  { to: "/admin/teachers", label: "Teachers", icon: "user" },
  { to: "/admin/students", label: "Students", icon: "users" },
  { to: "/admin/structure", label: "Structure", icon: "book" },
  { to: "/admin/classes", label: "Timetable", icon: "layers" },
  { to: "/admin/attendance", label: "Attendance", icon: "check" },
  { to: "/admin/exams", label: "Exams", icon: "exam" },
];

const teacherNav = [
  { to: "/teacher", label: "Overview", icon: "grid" },
  { to: "/teacher/classes", label: "My Classes", icon: "classes" },
  { to: "/teacher/profile", label: "Profile", icon: "user" },
  { to: "/teacher/students", label: "Students", icon: "users" },
  { to: "/teacher/attendance", label: "Attendance", icon: "check" },
  { to: "/teacher/marks", label: "Marks", icon: "pen" },
  { to: "/teacher/certificates", label: "Certificates", icon: "award" },
  { to: "/teacher/structure", label: "Structure", icon: "layers" },
];

const studentNav = [
  { to: "/student", label: "Overview", icon: "grid" },
  { to: "/student/profile", label: "Profile", icon: "user" },
  { to: "/student/attendance", label: "Attendance", icon: "check" },
  { to: "/student/performance", label: "Performance", icon: "trend" },
  { to: "/student/certificates", label: "Certificates", icon: "award" },
  { to: "/student/structure", label: "Structure", icon: "layers" },
];

const icons = {
  grid: (
    <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
  ),
  classes: <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />,
  users: <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.2c2.6.4 4.5 2.6 4.5 5.3" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.9 3.1-7 7-7s7 3.1 7 7" />,
  check: <path d="m5 13 4 4 10-10" />,
  pen: <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />,
  award: <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.5 14 7 21l5-2 5 2-1.5-7" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  trend: <path d="M4 17 10 11 14 15 20 7M14 7h6v6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  exam: <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1ZM6 6h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm2.5 6.5 2 2 4-4" />,
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />,
};

function Icon({ name }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const listRef = useRef(null);
  const indicatorRef = useRef(null);
  const logoRef = useRef(null);
  const sidebarRef = useRef(null);
  const tweenRef = useRef(null);

  const [expanded, setExpanded] = useState(false);

  const items = user?.role === "teacher" ? teacherNav : user?.role === "admin" ? adminNav : studentNav;

  useEffect(() => {
    gsap.fromTo(
      logoRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, []);

  // Re-align the sliding active-nav indicator whenever the route changes,
  // and also right after an expand/collapse tween finishes — the item's
  // vertical position can shift slightly as padding settles.
  function alignIndicator() {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    const activeEl = list.querySelector(`[data-active="true"]`);
    if (!activeEl) return;

    const listBox = list.getBoundingClientRect();
    const itemBox = activeEl.getBoundingClientRect();

    gsap.to(indicator, {
      y: itemBox.top - listBox.top,
      height: itemBox.height,
      duration: 0.5,
      ease: "power3.out",
    });
  }

  useEffect(() => {
    alignIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, items.length]);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    const labels = el.querySelectorAll("[data-sidebar-label]");

    if (tweenRef.current) tweenRef.current.kill();

    const tl = gsap.timeline({
      onUpdate: alignIndicator,
      onComplete: alignIndicator,
    });

    if (expanded) {
      tl.to(el, { width: 260, duration: 0.38, ease: "power3.out" }, 0);
      tl.to(labels, { opacity: 1, duration: 0.28, ease: "power2.out", stagger: 0.015 }, 0.1);
    } else {
      tl.to(labels, { opacity: 0, duration: 0.16, ease: "power2.in" }, 0);
      tl.to(el, { width: 84, duration: 0.34, ease: "power3.inOut" }, 0.04);
    }

    tweenRef.current = tl;
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const roleLabel = user?.role === "teacher" ? "Teacher" : user?.role === "admin" ? "Admin" : "Student";

  return (
    <aside
      className={`${styles.sidebar} ${expanded ? styles.sidebarExpanded : ""}`}
      ref={sidebarRef}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className={styles.logo} ref={logoRef}>
        <span className={styles.logoMark}>BP</span>
        <div className={styles.logoText} data-sidebar-label>
          <p className={styles.logoTitle}>Brightpath</p>
          <p className={styles.logoSub}>Student Management</p>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navList} ref={listRef}>
          <div className={styles.indicator} ref={indicatorRef} />
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/teacher" || item.to === "/student" || item.to === "/admin"}
              data-active={location.pathname === item.to ? "true" : undefined}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              title={item.label}
            >
              <span className={styles.navIcon}>
                <Icon name={item.icon} />
              </span>
              <span className={styles.navLabel} data-sidebar-label>
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={`${styles.avatar} ${user?.role === "admin" ? styles.avatarAdmin : ""}`}>
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div className={styles.userInfo} data-sidebar-label>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userRole}>
              {roleLabel}
              {user?.role === "teacher" && user?.department ? ` · ${user.department}` : ""}
              {user?.role === "admin" ? " · Full access" : ""}
            </p>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Sign out">
          <span className={styles.navIcon}>
            <Icon name="logout" />
          </span>
          <span className={styles.navLabel} data-sidebar-label>
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}