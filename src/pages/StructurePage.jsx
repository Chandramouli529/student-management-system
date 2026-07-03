import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import pageStyles from "../styles/StructurePage.module.css";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function StructurePage() {
  const { user } = useAuth();
  const { branches, classes, subjects, teachers, schedule } = useDirectory();
  const containerRef = useRef(null);

  // Admin sees every branch; a teacher or student only ever sees their own
  // — same department-scoping rule used everywhere else in the app.
  const visibleBranches = useMemo(() => {
    if (user?.role === "admin") return branches;
    return branches.filter((branch) => branch.id === user?.branchId);
  }, [branches, user?.role, user?.branchId]);

  // A student's own weekly timetable — reads the same schedule an admin
  // builds on the Classes page, filtered to this student's class.
  const myTimetable = useMemo(() => {
    if (user?.role !== "student") return [];
    return schedule
      .filter((entry) => entry.classId === user?.classId)
      .map((entry) => ({
        ...entry,
        subjectName: subjects.find((s) => s.id === entry.subjectId)?.name || "Unknown subject",
        teacherName: teachers.find((t) => t.id === entry.teacherId)?.name || "Unassigned",
      }))
      .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || (a.startTime || "").localeCompare(b.startTime || ""));
  }, [schedule, subjects, teachers, user?.role, user?.classId]);

  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll(`.${pageStyles.branchCard}`);
    if (cards?.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [visibleBranches]);

  return (
    <div>
      <TopBar
        title="Structure"
        subtitle={
          user?.role === "student"
            ? "Your branch, class, and weekly timetable."
            : "Branches, classes and subjects — read-only reference."
        }
      />

      <div className={styles.container} ref={containerRef}>
        {user?.role === "student" && (
          <div className={`card ${pageStyles.timetableCard}`}>
            <p className={styles.cardTitle}>My timetable</p>
            {myTimetable.length === 0 ? (
              <p className={pageStyles.noSubjects}>No timetable has been set up for your class yet.</p>
            ) : (
              <div className={pageStyles.timetableGrid}>
                {DAY_ORDER.map((day) => {
                  const sessions = myTimetable.filter((s) => s.day === day);
                  if (sessions.length === 0) return null;
                  return (
                    <div key={day} className={pageStyles.timetableDay}>
                      <p className={pageStyles.timetableDayLabel}>{day}</p>
                      {sessions.map((s) => (
                        <div key={s.id} className={pageStyles.timetableSession}>
                          <span className={pageStyles.timetableTime}>{s.startTime} – {s.endTime}</span>
                          <span className={pageStyles.timetableSubject}>{s.subjectName}</span>
                          <span className={pageStyles.timetableTeacher}>{s.teacherName}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {visibleBranches.map((branch) => {
          const branchClasses = classes.filter((c) => c.branchId === branch.id);

          return (
            <div key={branch.id} className={pageStyles.branchCard}>
              <div className={pageStyles.branchHeader}>
                <span className={pageStyles.branchBadge}>Branch</span>
                <h3>{branch.name}</h3>
              </div>

              <div className={pageStyles.classGrid}>
                {branchClasses.map((cls) => {
                  const clsSubjects = subjects.filter((s) => s.classId === cls.id);

                  return (
                    <div key={cls.id} className={pageStyles.classCard}>
                      <p className={pageStyles.className}>{cls.name}</p>

                      <div className={pageStyles.subjectList}>
                        {clsSubjects.length === 0 && (
                          <p className={pageStyles.noSubjects}>No subjects added yet.</p>
                        )}

                        {clsSubjects.map((subj) => {
                          const teacher = teachers.find((t) => t.id === subj.teacherId);

                          return (
                            <div key={subj.id} className={pageStyles.subjectRow}>
                              <span className={pageStyles.subjectName}>{subj.name}</span>
                              <span className={pageStyles.subjectTeacher}>
                                {teacher?.name || "Unassigned"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {visibleBranches.length === 0 && (
          <div className={pageStyles.emptyState}>
            No structure found for your branch.
          </div>
        )}
      </div>
    </div>
  );
}