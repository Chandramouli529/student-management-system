import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/NotificationBell.module.css";

const kindIcons = {
  attendance: (
    <path d="m5 13 4 4 10-10" />
  ),
  marks: (
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
  ),
  certificate: (
    <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.5 14 7 21l5-2 5 2-1.5-7" />
  ),
  system: (
    <path d="M12 8v4l3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
  ),
};

function KindIcon({ kind }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {kindIcons[kind] || kindIcons.system}
    </svg>
  );
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications: notificationFeed } = useDirectory();
  const [items, setItems] = useState(() => notificationFeed[user?.role] || []);
  // `mounted` keeps the portal in the DOM long enough to play the exit
  // animation; `open` is the target state the animation plays toward.
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const overlayRef = useRef(null);

  const unreadCount = items.filter((n) => n.unread).length;

  useEffect(() => {
    setItems(notificationFeed[user?.role] || []);
  }, [user?.role]);

  const positionPanel = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 10,
      right: Math.max(16, window.innerWidth - rect.right),
    });
  }, []);

  function openPanel() {
    positionPanel();
    setMounted(true);
    setOpen(true);
    gsap.fromTo(bellRef.current, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
  }

  function closePanel() {
    setOpen(false);
  }

  function toggle() {
    if (open) closePanel();
    else openPanel();
  }

  // Play the entrance / exit tween whenever `open` flips, and only remove
  // the portal from the DOM once the exit tween has actually finished —
  // this is what makes closing feel like a real animation instead of a
  // hard cut.
  useEffect(() => {
    if (!mounted || !panelRef.current) return;

    if (open) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.18, ease: "power1.out" });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, ease: "power1.in" });
      gsap.to(panelRef.current, {
        opacity: 0,
        y: -8,
        scale: 0.96,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => setMounted(false),
      });
    }
  }, [open, mounted]);

  // Reposition on resize, and close on scroll — a stale fixed-position
  // dropdown after the page scrolls under it feels broken, so we just
  // close it like most native dropdowns do.
  useEffect(() => {
    if (!open) return;
    function handleResize() {
      positionPanel();
    }
    function handleScroll() {
      closePanel();
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") closePanel();
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, positionPanel]);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <>
      <button
        type="button"
        className={styles.bell}
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        ref={bellRef}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {mounted &&
        createPortal(
          <>
            <div className={styles.overlay} ref={overlayRef} onClick={closePanel} />
            <div
              className={styles.panel}
              ref={panelRef}
              style={{ top: coords.top, right: coords.right }}
            >
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.panelTitle}>Notifications</p>
                  <p className={styles.panelSubtitle}>
                    For {user?.role === "teacher" ? "teacher" : user?.role === "admin" ? "admin" : "student"} · {user?.name?.split(" ")[0]}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button type="button" className={styles.markRead} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className={styles.list}>
                {items.length === 0 && <p className={styles.empty}>You're all caught up.</p>}
                {items.map((n) => (
                  <div key={n.id} className={`${styles.item} ${n.unread ? styles.unread : ""}`}>
                    <span className={`${styles.iconWrap} ${styles[n.kind] || ""}`}>
                      <KindIcon kind={n.kind} />
                    </span>
                    <div className={styles.itemBody}>
                      <p className={styles.itemTitle}>{n.title}</p>
                      <p className={styles.itemText}>{n.body}</p>
                      <p className={styles.itemTime}>{n.time}</p>
                    </div>
                    {n.unread && <span className={styles.dot} />}
                  </div>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}