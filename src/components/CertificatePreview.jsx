import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "../styles/CertificatePreview.module.css";

export default function CertificatePreview({ certificate, student, className: cls }) {
  const ref = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
    );
  }, [certificate?.id]);

  if (!certificate) return null;

  return (
    <div className={`${styles.certificate} ${cls || ""}`} ref={ref}>
      <div className={styles.border}>
        <p className={styles.eyebrow}>Brightpath Institute</p>
        <h2 className={styles.type}>{certificate.type} Certificate</h2>
        <div className={styles.seal}>BP</div>
        <p className={styles.body}>This is to certify that</p>
        <p className={styles.studentName}>{student?.name}</p>
        <p className={styles.body}>
          Roll No. {student?.rollNo}, is a bona fide member of Brightpath Institute.
          {certificate.remarks ? ` ${certificate.remarks}` : ""}
        </p>
        <div className={styles.footerRow}>
          <div>
            <p className={styles.footerLabel}>Issued on</p>
            <p className={styles.footerValue}>{certificate.issuedOn}</p>
          </div>
          <div className={styles.signature}>
            <p className={styles.signName}>Registrar</p>
            <p className={styles.footerLabel}>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}