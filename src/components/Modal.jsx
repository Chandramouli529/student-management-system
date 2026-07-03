import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import styles from "../styles/Modal.module.css";

export default function Modal({ open, onClose, title, children, width = 480 }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    gsap.set(overlayRef.current, { opacity: 0 });
    gsap.set(panelRef.current, { opacity: 0, scale: 0.92, y: 16 });

    const tl = gsap.timeline();
    tl.to(overlayRef.current, { opacity: 1, duration: 0.25, ease: "power2.out" });
    tl.to(panelRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }, "-=0.15");

    return () => tl.kill();
  }, [open]);

  function handleClose() {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current, { opacity: 0, scale: 0.94, y: 10, duration: 0.2, ease: "power2.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: "power2.in" }, "-=0.1");
  }

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} ref={overlayRef} onClick={handleClose}>
      <div
        className={styles.panel}
        style={{ maxWidth: width }}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}