import { useMemo } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/MyClasses.module.css";

export default function MyClasses() {
  const { user } = useAuth();
  const { schedule, classes, subjects, students, branches } = useDirectory();
  const gridRef = useRef(null);

  // Every session an admin has scheduled for this teacher, via the Admin
  // Classes page — this page has no data of its own, it's a read-only view
  // of that same schedule, filtered to "mine."
  const myClasses = useMemo(() => {
    return schedule
      .filter((entry) => entry.teacherId === user?.id)
      .map((entry) => {
        const cls = classes.find((c) => c.id === entry.classId);
        const subject = subjects.find((s) => s.id === entry.subjectId);
        const branch = branches.find((b) => b.id === cls?.branchId);
        const studentCount = students.filter((s) => s.classId === entry.classId).length;
        return {
          ...entry,
          className: cls?.name || "Unknown class",
          branchName: branch?.name || "",
          subjectName: subject?.name || "Unknown subject",
          studentCount,
        };
      })
      .sort((a, b) => (a.day || "").localeCompare(b.day || "") || (a.startTime || "").localeCompare(b.startTime || ""));
  }, [schedule, classes, subjects, students, branches, user?.id]);

  useEffect(() => {
    if (myClasses.length === 0) return;
    gsap.fromTo(
      `.${styles.card}`,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.06 }
    );
  }, [myClasses.length]);

  return (
    <div className={styles.page} ref={gridRef}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Teaching</p>
          <h1 className={styles.title}>My classes</h1>
        </div>
      </div>

      {myClasses.length === 0 ? (
        <div className={styles.stateBox}>
          <p className={styles.emptyTitle}>No classes assigned yet</p>
          <p className={styles.emptyBody}>
            An admin schedules which classes you teach from the Classes page — once something's
            assigned to you, it'll show up here.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {myClasses.map((cls) => (
            <div key={cls.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.classCode}>{cls.day}</span>
                <span className={styles.studentCount}>{cls.studentCount} students</span>
              </div>
              <h3 className={styles.className}>{cls.className}</h3>
              <p className={styles.classSubject}>{cls.subjectName}</p>
              {cls.branchName && <p className={styles.classBranch}>{cls.branchName}</p>}
              <div className={styles.cardFooter}>
                <span className={styles.schedule}>
                  {cls.startTime} – {cls.endTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}