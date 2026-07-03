import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import DataTable from "../components/DataTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";

const STATUS_COLORS = {
  Present: "#16a34a",
  Late: "#7c3aed",
  Absent: "#dc2626",
  Excused: "#d97706",
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { students, subjects, classes, branches, attendanceRecords, certificates, getStudentAttendancePct, getStudentAverage, getSubjectById } = useDirectory();

  // Same scoping rule as Attendance/Students: if this teacher has explicit
  // subjectIds, use exactly those. Otherwise — e.g. a brand-new teacher
  // account with nothing assigned yet — fall back to subjects within their
  // own department only, never every subject across every branch.
  const teacherSubjects = useMemo(() => {
    if (user?.subjectIds?.length) {
      return subjects.filter((s) => user.subjectIds.includes(s.id));
    }
    return subjects.filter((s) => classes.find((c) => c.id === s.classId)?.branchId === user?.branchId);
  }, [subjects, classes, user?.subjectIds, user?.branchId]);

  const teacherClassIds = useMemo(
    () => [...new Set(teacherSubjects.map((s) => s.classId))],
    [teacherSubjects]
  );

  const roster = useMemo(
    () => students.filter((s) => teacherClassIds.includes(s.classId)),
    [students, teacherClassIds]
  );
  const rosterIds = useMemo(() => new Set(roster.map((s) => s.id)), [roster]);

  const departmentName = branches.find((b) => b.id === user?.branchId)?.name;

  const avgAttendance = useMemo(() => {
    if (roster.length === 0) return 0;
    const total = roster.reduce((sum, s) => sum + getStudentAttendancePct(s.id), 0);
    return Math.round(total / roster.length);
  }, [roster, getStudentAttendancePct]);

  const avgScore = useMemo(() => {
    if (roster.length === 0) return 0;
    const total = roster.reduce((sum, s) => sum + getStudentAverage(s.id), 0);
    return Math.round(total / roster.length);
  }, [roster, getStudentAverage]);

  const chartData = useMemo(
    () =>
      roster.map((s) => ({
        name: s.name.split(" ")[0],
        average: getStudentAverage(s.id),
        attendance: getStudentAttendancePct(s.id),
      })),
    [roster, getStudentAverage, getStudentAttendancePct]
  );

  // Every attendance record for students in this teacher's own classes —
  // used for both the recent-activity table and the status breakdown chart.
  const departmentAttendance = useMemo(
    () => attendanceRecords.filter((r) => rosterIds.has(r.studentId)),
    [attendanceRecords, rosterIds]
  );

  const recentAttendance = useMemo(
    () => [...departmentAttendance].slice(-6).reverse(),
    [departmentAttendance]
  );

  const attendanceBreakdown = useMemo(() => {
    const counts = { Present: 0, Late: 0, Absent: 0, Excused: 0 };
    departmentAttendance.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({ name: status, value: count }))
      .filter((d) => d.value > 0);
  }, [departmentAttendance]);

  // Certificates only for students in this teacher's own department — a
  // CSE teacher shouldn't see certificates issued to Mechanical students.
  const departmentCertificates = useMemo(
    () => certificates.filter((c) => rosterIds.has(c.studentId)).slice(0, 4),
    [certificates, rosterIds]
  );

  return (
    <div>
      <TopBar
        title={`Welcome back, ${user?.name?.split(" ")[0] || "Teacher"}`}
        subtitle={departmentName ? `Here's what's happening in ${departmentName} today.` : "Here's what's happening across your classes today."}
      />

      <div className={styles.container}>
        <div className={styles.statGrid}>
          <StatCard label="Students in your classes" value={roster.length} index={0} icon={<PeopleIcon />} />
          <StatCard label="Subjects taught" value={teacherSubjects.length} index={1} icon={<BookIcon />} />
          <StatCard label="Avg. attendance" value={avgAttendance} suffix="%" index={2} icon={<CheckIcon />} />
          <StatCard label="Avg. score" value={avgScore} suffix="%" index={3} tone="accent" icon={<TrendIcon />} />
        </div>

        <div className={styles.splitGrid}>
          <div className={`card ${styles.chartCard}`}>
            <p className={styles.cardTitle}>Class performance snapshot</p>
            {chartData.length === 0 ? (
              <p className={styles.emptyChartNote}>No students in your classes yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barCategoryGap={18}>
                  <CartesianGrid stroke="#e9eefa" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }}
                    cursor={{ fill: "#eef4ff" }}
                  />
                  <Bar dataKey="average" name="Avg score" fill="#1652f0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="attendance" name="Attendance %" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`card ${styles.chartCard}`}>
            <p className={styles.cardTitle}>Attendance breakdown</p>
            {attendanceBreakdown.length === 0 ? (
              <p className={styles.emptyChartNote}>No attendance recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={attendanceBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {attendanceBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={`card ${styles.listCard}`} style={{ marginBottom: "24px" }}>
          <p className={styles.cardTitle}>Certificates issued</p>
          {departmentCertificates.length === 0 ? (
            <p className={styles.emptyChartNote}>No certificates issued in your department yet.</p>
          ) : (
            <ul className={styles.simpleList}>
              {departmentCertificates.map((c) => {
                const student = roster.find((s) => s.id === c.studentId);
                return (
                  <li key={c.id} className={styles.simpleListItem}>
                    <div>
                      <p className={styles.simpleListTitle}>{student?.name}</p>
                      <p className={styles.simpleListSub}>{c.type} · {c.issuedOn}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className={styles.cardTitle} style={{ marginBottom: "12px" }}>Recent attendance activity</p>
        <DataTable
          columns={[
            { key: "student", label: "Student", render: (r) => roster.find((s) => s.id === r.studentId)?.name },
            { key: "subject", label: "Subject", render: (r) => getSubjectById(r.subjectId)?.name },
            { key: "date", label: "Date" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusPill status={r.status} />,
            },
          ]}
          rows={recentAttendance}
          emptyLabel="No attendance recorded in your department yet."
        />
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Present: styles.pillPresent,
    Absent: styles.pillAbsent,
    Late: styles.pillLate,
    Excused: styles.pillExcused,
  };
  return <span className={`${styles.pill} ${map[status]}`}>{status}</span>;
}

function PeopleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.2c2.6.4 4.5 2.6 4.5 5.3" />
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