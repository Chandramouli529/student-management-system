import { useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import MarksForm from "../components/MarksForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";

const assessments = ["Mid Exam 1", "Mid Exam 2", "Final Exam"];

export default function MarksPage() {
  const { user } = useAuth();
  const { students, subjects, classes, branches, marksRecords, upsertMarks } = useDirectory();

  // Same department-scoping rule used on Attendance, Students, and the
  // Teacher dashboard: explicit subjectIds if the teacher has them,
  // otherwise fall back to subjects within their own branch only — never
  // to every subject across every department.
  const teacherSubjects = useMemo(() => {
    if (user?.subjectIds?.length) {
      return subjects.filter((s) => user.subjectIds.includes(s.id));
    }
    return subjects.filter((s) => classes.find((c) => c.id === s.classId)?.branchId === user?.branchId);
  }, [subjects, classes, user?.subjectIds, user?.branchId]);

  const [subjectId, setSubjectId] = useState(teacherSubjects[0]?.id);
  const [assessment, setAssessment] = useState(assessments[0]);
  const [toast, setToast] = useState("");

  const subject = teacherSubjects.find((s) => s.id === subjectId);
  const roster = useMemo(
    () => students.filter((s) => s.classId === subject?.classId),
    [students, subject?.classId]
  );

  const departmentName = branches.find((b) => b.id === user?.branchId)?.name;

  function valueFor(studentId) {
    const rec = marksRecords.find((r) => r.studentId === studentId && r.subjectId === subjectId && r.assessment === assessment);
    return rec?.score;
  }

  function handleSave(studentId, score) {
    upsertMarks(studentId, subjectId, assessment, score);
    const student = students.find((s) => s.id === studentId);
    setToast(`Saved ${score}/100 for ${student?.name}`);
    setTimeout(() => setToast(""), 2200);
  }

  if (teacherSubjects.length === 0) {
    return (
      <div>
        <TopBar title="Marks" subtitle="Enter assessment scores for your subjects — saved as you go." />
        <div className={styles.container}>
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--color-muted)" }}>
            No subjects are assigned to your account yet{departmentName ? ` in ${departmentName}` : ""}. An admin
            needs to assign a subject before marks can be entered.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Marks"
        subtitle={departmentName ? `Enter scores for ${departmentName} subjects — saved as you go.` : "Enter assessment scores for your subjects — saved as you go."}
        actions={
          <div className={styles.toolbar}>
            <select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {teacherSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <div className={styles.container}>
        {toast && (
          <div className="card" style={{ padding: "12px 18px", borderColor: "var(--color-blue-100)", background: "var(--color-blue-50)", color: "var(--color-blue-900)", fontSize: "0.85rem", fontWeight: 600 }}>
            {toast}
          </div>
        )}
        <div className="card" style={{ padding: "24px" }}>
          {roster.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-muted)", padding: "24px" }}>
              No students are enrolled in this class yet.
            </p>
          ) : (
            <MarksForm
              students={roster}
              assessment={assessment}
              onAssessmentChange={setAssessment}
              assessments={assessments}
              valueFor={valueFor}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}