import { useRef } from "react";
import gsap from "gsap";
import styles from "../styles/AttendanceGrid.module.css";

const statuses = [
  { key: "Present", short: "P" },
  { key: "Absent", short: "A" },
  { key: "Late", short: "L" },
  { key: "Excused", short: "E" },
];

export default function AttendanceGrid({ students, valueFor, onChange, emptyLabel = "No students in this class yet." }) {
  const btnRefs = useRef({});

  function handleSelect(studentId, status) {
    onChange(studentId, status);
    const el = btnRefs.current[`${studentId}-${status}`];
    if (el) {
      gsap.fromTo(el, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
    }
  }

  if (students.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  return (
    <div className={styles.grid}>
      {students.map((student) => {
        const current = valueFor(student.id);
        return (
          <div className={styles.row} key={student.id}>
            <div className={styles.studentInfo}>
              <div className={styles.avatar}>{student.name.charAt(0)}</div>
              <div>
                <p className={styles.name}>{student.name}</p>
                <p className={styles.roll}>{student.rollNo}</p>
              </div>
            </div>
            <div className={styles.statusRow}>
              {statuses.map((s) => (
                <button
                  key={s.key}
                  ref={(el) => (btnRefs.current[`${student.id}-${s.key}`] = el)}
                  className={`${styles.statusBtn} ${styles[s.key.toLowerCase()]} ${current === s.key ? styles.active : ""}`}
                  onClick={() => handleSelect(student.id, s.key)}
                  type="button"
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}