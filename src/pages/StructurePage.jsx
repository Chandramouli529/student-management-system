import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import TopBar from "../components/TopBar.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import pageStyles from "../styles/StructurePage.module.css";

export default function StructurePage() {
  const { branches, classes, subjects, teachers } = useDirectory();
  const containerRef = useRef(null);

  const userRole = "teacher"; // "teacher" | "student" | "admin"
  const userBranch = "Computer Science Engineering"; // get from auth/session
  const canEdit = userRole === "teacher" || userRole === "admin";

  const visibleBranches = useMemo(() => {
    return branches.filter((branch) => branch.name === userBranch);
  }, [branches, userBranch]);

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
          canEdit
            ? "View and manage your branch structure."
            : "Branches, classes and subjects — read-only reference."
        }
      />

      <div className={styles.container} ref={containerRef}>
        {visibleBranches.map((branch) => {
          const branchClasses = classes.filter((c) => c.branchId === branch.id);

          return (
            <div key={branch.id} className={pageStyles.branchCard}>
              <div className={pageStyles.branchHeader}>
                <div>
                  <span className={pageStyles.branchBadge}>Branch</span>
                  <h3>{branch.name}</h3>
                </div>

                {canEdit && (
                  <button type="button" className={pageStyles.editBtn}>
                    Edit Branch
                  </button>
                )}
              </div>

              <div className={pageStyles.classGrid}>
                {branchClasses.map((cls) => {
                  const clsSubjects = subjects.filter((s) => s.classId === cls.id);

                  return (
                    <div key={cls.id} className={pageStyles.classCard}>
                      <div className={pageStyles.classTopRow}>
                        <p className={pageStyles.className}>{cls.name}</p>

                        {canEdit && (
                          <button type="button" className={pageStyles.smallEditBtn}>
                            Edit Class
                          </button>
                        )}
                      </div>

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

                              {canEdit && (
                                <button type="button" className={pageStyles.subjectEditBtn}>
                                  Edit
                                </button>
                              )}
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