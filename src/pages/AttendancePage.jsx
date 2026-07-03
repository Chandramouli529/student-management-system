import { useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import AttendanceGrid from "../components/AttendanceGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import pageStyles from "../styles/AttendancePage.module.css";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  if (isTeacher) return <TeacherAttendance />;
  return <StudentAttendance />;
}

function TeacherAttendance() {
  const { user } = useAuth();
  const { students, subjects, classes, branches, attendanceRecords, getSubjectById, upsertAttendance } = useDirectory();

  // A teacher only ever sees subjects (and therefore students) from their
  // own department. If they have explicit subjectIds assigned, use exactly
  // those. Otherwise — e.g. a brand-new teacher account with nothing
  // assigned yet — fall back to their own branch's subjects only, never
  // to every subject across every department. That fallback used to be
  // "all subjects, any branch," which meant an unassigned teacher could
  // browse and mark attendance for students in departments they have
  // nothing to do with.
  const teacherSubjects = useMemo(() => {
    if (user?.subjectIds?.length) {
      return subjects.filter((s) => user.subjectIds.includes(s.id));
    }
    return subjects.filter((s) => classes.find((c) => c.id === s.classId)?.branchId === user?.branchId);
  }, [subjects, classes, user?.subjectIds, user?.branchId]);

  const [subjectId, setSubjectId] = useState(teacherSubjects[0]?.id);
  const [date, setDate] = useState(todayStr());

  const subject = getSubjectById(subjectId) || teacherSubjects.find((s) => s.id === subjectId);
  const roster = useMemo(
    () => students.filter((s) => s.classId === subject?.classId),
    [students, subject?.classId]
  );

  const departmentName = branches.find((b) => b.id === user?.branchId)?.name;

  function valueFor(studentId) {
    const existing = attendanceRecords.find((r) => r.studentId === studentId && r.subjectId === subjectId && r.date === date);
    return existing?.status ?? "Present";
  }

  function handleChange(studentId, status) {
    upsertAttendance(studentId, subjectId, date, status);
  }

  if (teacherSubjects.length === 0) {
    return (
      <div>
        <TopBar title="Attendance" subtitle="Mark today's attendance per subject — saved as you go." />
        <div className={styles.container}>
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--color-muted)" }}>
            No subjects are assigned to your account yet{departmentName ? ` in ${departmentName}` : ""}. An admin
            needs to assign a subject before attendance can be marked.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Attendance"
        subtitle={departmentName ? `Mark attendance for ${departmentName} students — saved as you go.` : "Mark today's attendance per subject — saved as you go."}
        actions={
          <div className={styles.toolbar}>
            <select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {teacherSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input type="date" className={styles.select} value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
          </div>
        }
      />
      <div className={styles.container}>
        <div className={pageStyles.legend}>
          <span><i className={`${pageStyles.dot} ${pageStyles.p}`} /> Present</span>
          <span><i className={`${pageStyles.dot} ${pageStyles.a}`} /> Absent</span>
          <span><i className={`${pageStyles.dot} ${pageStyles.l}`} /> Late</span>
          <span><i className={`${pageStyles.dot} ${pageStyles.e}`} /> Excused</span>
        </div>
        <AttendanceGrid
          students={roster}
          valueFor={valueFor}
          onChange={handleChange}
          emptyLabel="No students are enrolled in this class yet."
        />
      </div>
    </div>
  );
}

function StudentAttendance() {
  const { user } = useAuth();
  const { attendanceRecords, getSubjectsForClass } = useDirectory();
  const subjectsList = getSubjectsForClass(user?.classId);
  const [subjectId, setSubjectId] = useState(subjectsList[0]?.id);

  const records = useMemo(
    () => attendanceRecords.filter((r) => r.studentId === user?.id && r.subjectId === subjectId).slice(-30),
    [attendanceRecords, user?.id, subjectId]
  );

  const pct = useMemo(() => {
    if (records.length === 0) return 0;
    const present = records.filter((r) => r.status === "Present" || r.status === "Late").length;
    return Math.round((present / records.length) * 100);
  }, [records]);

  if (subjectsList.length === 0) {
    return (
      <div>
        <TopBar title="My Attendance" subtitle="Your day-by-day record, subject by subject." />
        <div className={styles.container}>
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--color-muted)" }}>
            No subjects are set up for your class yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="My Attendance"
        subtitle="Your day-by-day record, subject by subject."
        actions={
          <select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjectsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        }
      />
      <div className={styles.container}>
        <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div className={pageStyles.pctRing} style={{ "--pct": `${pct}%` }}>
            <span>{pct}%</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>Overall attendance</p>
            <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>
              Based on the last {records.length} recorded sessions. Certificates require 75% or higher.
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--color-muted)" }}>
            No attendance recorded yet for this subject.
          </div>
        ) : (
          <div className={pageStyles.dayGrid}>
            {records.map((r) => (
              <div key={r.id} className={`${pageStyles.dayCell} ${pageStyles[r.status.toLowerCase()]}`} title={`${r.date}: ${r.status}`}>
                <span className={pageStyles.dayDate}>{r.date.slice(8)}</span>
                <span className={pageStyles.dayStatus}>{r.status.charAt(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}