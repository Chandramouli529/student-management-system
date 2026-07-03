import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import { useCombinedRoster, useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";

const STATUS_COLORS = {
  Present: "#16a34a",
  Late: "#7c3aed",
  Absent: "#dc2626",
  Excused: "#d97706",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { allStudents, allTeachers, allAttendance } = useCombinedRoster();
  const { branches, classes, schedule, getStudentAttendancePct } = useDirectory();

  const avgAttendance = useMemo(() => {
    if (allStudents.length === 0) return 0;
    const total = allStudents.reduce((sum, s) => sum + getStudentAttendancePct(s.id), 0);
    return Math.round(total / allStudents.length);
  }, [allStudents, getStudentAttendancePct]);

  // Average attendance % per branch, for the bar chart below.
  const branchAttendance = useMemo(() => {
    return branches.map((b) => {
      const branchStudents = allStudents.filter((s) => s.branchId === b.id);
      const avg =
        branchStudents.length === 0
          ? 0
          : Math.round(branchStudents.reduce((sum, s) => sum + getStudentAttendancePct(s.id), 0) / branchStudents.length);
      return { name: b.code || b.name, average: avg };
    });
  }, [branches, allStudents, getStudentAttendancePct]);

  // Present/Absent/Late/Excused split across every attendance record, for
  // the donut chart — the overall shape of attendance, not per-person.
  const statusBreakdown = useMemo(() => {
    const counts = { Present: 0, Late: 0, Absent: 0, Excused: 0 };
    allAttendance.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({ name: status, value: count }))
      .filter((d) => d.value > 0);
  }, [allAttendance]);

  const hasAttendanceData = allAttendance.length > 0;

  return (
    <div>
      <TopBar title="Admin Overview" subtitle="Manage students, teachers, and class schedules." />
      <div className={styles.container}>
        <div className={styles.statGrid}>
          <StatCard label="Total students" value={allStudents.length} index={0} icon={<PeopleIcon />} />
          <StatCard label="Total teachers" value={allTeachers.length} index={1} icon={<TeacherIcon />} />
          <StatCard label="Branches" value={branches.length} index={2} icon={<LayersIcon />} />
          <StatCard label="Classes" value={classes.length} index={3} icon={<BookIcon />} />
          <StatCard label="Scheduled sessions" value={schedule.length} index={4} icon={<CalendarIcon />} />
          <StatCard label="Avg. student attendance" value={avgAttendance} suffix="%" index={5} tone="accent" icon={<CheckIcon />} />
        </div>

        {hasAttendanceData ? (
          <div className={styles.splitGrid}>
            <div className="card" style={{ padding: "24px" }}>
              <p className={styles.cardTitle}>Average attendance by branch</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={branchAttendance} barCategoryGap={18}>
                  <CartesianGrid stroke="#e9eefa" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Avg. attendance"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }}
                    cursor={{ fill: "#eef4ff" }}
                  />
                  <Bar dataKey="average" name="Avg. attendance" fill="#1652f0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <p className={styles.cardTitle}>Attendance status breakdown</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {statusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--color-muted)", marginBottom: "24px" }}>
            No attendance has been recorded yet — charts will appear here once teachers start marking attendance.
          </div>
        )}

        <div className={styles.toolbar} style={{ marginBottom: "20px" }}>
          <button className="btn btn-primary" onClick={() => navigate("/admin/students")}>
            Manage students
          </button>
          <button className="btn btn-outline" onClick={() => navigate("/admin/teachers")}>
            Manage teachers
          </button>
          <button className="btn btn-outline" onClick={() => navigate("/admin/classes")}>
            Manage classes
          </button>
        </div>
      </div>
    </div>
  );
}

function PeopleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.2c2.6.4 4.5 2.6 4.5 5.3" />
    </svg>
  );
}
function TeacherIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
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
function CalendarIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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