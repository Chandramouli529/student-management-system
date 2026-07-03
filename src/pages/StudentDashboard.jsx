import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory, scoreToGrade } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const {
    marksRecords,
    attendanceRecords,
    certificates,
    exams,
    schedule,
    subjects,
    getStudentAttendancePct,
    getStudentAverage,
    getSubjectsForClass,
  } = useDirectory();

  const attendancePct = getStudentAttendancePct(user?.id);
  const avgScore = getStudentAverage(user?.id);
  const subjectsList = getSubjectsForClass(user?.classId);
  const myCerts = certificates.filter((c) => c.studentId === user?.id);

  const trend = useMemo(() => {
    const assessments = ["Unit Test 1", "Unit Test 2", "Mid Term", "Final Exam"];
    return assessments.map((a) => {
      const recs = marksRecords.filter((r) => r.studentId === user?.id && r.assessment === a);
      const avg = recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : 0;
      return { name: a, score: avg };
    });
  }, [marksRecords, user?.id]);

  const recentDays = useMemo(() => {
    return attendanceRecords
      .filter((r) => r.studentId === user?.id)
      .slice(-8)
      .reverse();
  }, [attendanceRecords, user?.id]);

  // Exams an admin has scheduled for this student's own branch, upcoming
  // ones only (today or later), soonest first.
  const upcomingExams = useMemo(() => {
    const today = todayStr();
    return exams
      .filter((e) => e.branchId === user?.branchId && e.date >= today)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .slice(0, 4);
  }, [exams, user?.branchId]);

  // This student's own weekly timetable, from the same schedule an admin
  // builds on the Classes page — filtered to their class, ordered by day.
  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const myTimetable = useMemo(() => {
    return schedule
      .filter((s) => s.classId === user?.classId)
      .map((s) => ({ ...s, subjectName: subjects.find((subj) => subj.id === s.subjectId)?.name || "—" }))
      .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || (a.startTime || "").localeCompare(b.startTime || ""));
  }, [schedule, subjects, user?.classId]);

  return (
    <div>
      <TopBar title={`Hi, ${user?.name?.split(" ")[0] || "Student"}`} subtitle="Here's a look at your academic progress." />

      <div className={styles.container}>
        <div className={styles.statGrid}>
          <StatCard label="Attendance" value={attendancePct} suffix="%" index={0} icon={<CheckIcon />} />
          <StatCard label="Average score" value={avgScore} suffix="%" index={1} tone="accent" icon={<TrendIcon />} />
          <StatCard label="Enrolled subjects" value={subjectsList.length} index={2} icon={<BookIcon />} />
          <StatCard label="Certificates" value={myCerts.length} index={3} icon={<AwardIcon />} />
        </div>

        <div className={styles.splitGrid}>
          <div className={`card ${styles.chartCard}`}>
            <p className={styles.cardTitle}>Performance trend</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid stroke="#e9eefa" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#1652f0" strokeWidth={3} dot={{ r: 4, fill: "#1652f0" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`card ${styles.listCard}`}>
            <p className={styles.cardTitle}>Recent attendance</p>
            {recentDays.length === 0 ? (
              <p className={styles.emptyChartNote}>No attendance recorded yet.</p>
            ) : (
              <ul className={styles.simpleList}>
                {recentDays.map((r) => (
                  <li key={r.id} className={styles.simpleListItem}>
                    <div>
                      <p className={styles.simpleListTitle}>{r.date}</p>
                      <p className={styles.simpleListSub}>{r.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.splitGrid}>
          <div className={`card ${styles.listCard}`}>
            <p className={styles.cardTitle}>Upcoming exams</p>
            {upcomingExams.length === 0 ? (
              <p className={styles.emptyChartNote}>No exams scheduled yet — check back once the admin publishes the exam calendar.</p>
            ) : (
              <ul className={styles.simpleList}>
                {upcomingExams.map((e) => (
                  <li key={e.id} className={styles.simpleListItem}>
                    <div>
                      <p className={styles.simpleListTitle}>{e.name}</p>
                      <p className={styles.simpleListSub}>
                        {e.date} · {e.startTime} – {e.endTime}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`card ${styles.listCard}`}>
            <p className={styles.cardTitle}>My class schedule</p>
            {myTimetable.length === 0 ? (
              <p className={styles.emptyChartNote}>No timetable set up for your class yet.</p>
            ) : (
              <ul className={styles.simpleList}>
                {myTimetable.map((s) => (
                  <li key={s.id} className={styles.simpleListItem}>
                    <div>
                      <p className={styles.simpleListTitle}>{s.subjectName}</p>
                      <p className={styles.simpleListSub}>
                        {s.day} · {s.startTime} – {s.endTime}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className={styles.cardTitle}>Subject-wise standing</p>
        <div className={styles.statGrid}>
          {subjectsList.length === 0 ? (
            <p className={styles.emptyChartNote}>No subjects assigned to your class yet.</p>
          ) : (
            subjectsList.map((subj, i) => {
              const recs = marksRecords.filter((r) => r.studentId === user?.id && r.subjectId === subj.id);
              const avg = recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : 0;
              return (
                <StatCard key={subj.id} label={subj.name} value={avg} suffix="%" index={i} icon={<span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{scoreToGrade(avg)}</span>} />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17 10 11 14 15 20 7M14 7h6v6" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
    </svg>
  );
}
function AwardIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.5 14 7 21l5-2 5 2-1.5-7" />
    </svg>
  );
}