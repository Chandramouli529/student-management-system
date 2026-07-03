import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import DataTable from "../components/DataTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory, scoreToGrade } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";

const SUBJECT_COLORS = ["#1652f0", "#38bdf8", "#0b2f91", "#7fb0fb", "#16a34a", "#d97706", "#7c3aed"];
const GRADE_ORDER = ["A+", "A", "B+", "B", "C", "D"];
const GRADE_COLORS = {
  "A+": "#16a34a",
  A: "#38bdf8",
  "B+": "#1652f0",
  B: "#7c3aed",
  C: "#d97706",
  D: "#dc2626",
};

export default function PerformancePage() {
  const { user } = useAuth();
  const { marksRecords, getSubjectsForClass } = useDirectory();
  const subjectsList = getSubjectsForClass(user?.classId);
  const [subjectId, setSubjectId] = useState("all");

  const relevantRecords = useMemo(() => {
    return marksRecords.filter((r) => r.studentId === user?.id && (subjectId === "all" || r.subjectId === subjectId));
  }, [marksRecords, user?.id, subjectId]);

  const trendData = useMemo(() => {
    const assessments = ["Unit Test 1", "Unit Test 2", "Mid Term", "Final Exam"];
    return assessments.map((a) => {
      const point = { name: a };
      subjectsList.forEach((subj) => {
        const rec = marksRecords.find((r) => r.studentId === user?.id && r.subjectId === subj.id && r.assessment === a);
        point[subj.name] = rec?.score ?? null;
      });
      return point;
    });
  }, [marksRecords, subjectsList, user?.id]);

  // Average score per subject — a quick "where do I stand in each subject"
  // bar chart, independent of the subject filter above (always shows all
  // of them, so switching the filter for the table/trend doesn't hide the
  // overall comparison).
  const subjectAverages = useMemo(() => {
    return subjectsList.map((subj) => {
      const recs = marksRecords.filter((r) => r.studentId === user?.id && r.subjectId === subj.id);
      const avg = recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : 0;
      return { name: subj.name, average: avg };
    });
  }, [marksRecords, subjectsList, user?.id]);

  // How many of the currently-filtered assessment records fall into each
  // letter grade — reacts to the subject filter, unlike the chart above.
  const gradeDistribution = useMemo(() => {
    const counts = {};
    relevantRecords.forEach((r) => {
      const grade = scoreToGrade(r.score);
      counts[grade] = (counts[grade] || 0) + 1;
    });
    return GRADE_ORDER.filter((g) => counts[g]).map((g) => ({ name: g, count: counts[g] }));
  }, [relevantRecords]);

  const overallAverage = useMemo(() => {
    if (relevantRecords.length === 0) return 0;
    return Math.round(relevantRecords.reduce((sum, r) => sum + r.score, 0) / relevantRecords.length);
  }, [relevantRecords]);

  const highestScore = useMemo(() => {
    if (relevantRecords.length === 0) return 0;
    return Math.max(...relevantRecords.map((r) => r.score));
  }, [relevantRecords]);

  return (
    <div>
      <TopBar
        title="Performance"
        subtitle="Subject-wise marks and your progress over time."
        actions={
          <select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="all">All subjects</option>
            {subjectsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        }
      />
      <div className={styles.container}>
        <div className={styles.statGrid}>
          <StatCard label="Average score" value={overallAverage} suffix="%" index={0} tone="accent" />
          <StatCard label="Highest score" value={highestScore} suffix="%" index={1} />
          <StatCard label="Assessments recorded" value={relevantRecords.length} index={2} />
          <StatCard label="Overall grade" value={relevantRecords.length ? scoreToGrade(overallAverage) : "—"} index={3} />
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <p className={styles.cardTitle}>Trend across assessments</p>
          {subjectsList.length === 0 ? (
            <p className={styles.emptyChartNote}>No subjects assigned to your class yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid stroke="#e9eefa" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {subjectsList.map((subj, i) => (
                  <Line
                    key={subj.id}
                    type="monotone"
                    dataKey={subj.name}
                    stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.splitGrid}>
          <div className="card" style={{ padding: "24px" }}>
            <p className={styles.cardTitle}>Average score by subject</p>
            {subjectAverages.length === 0 ? (
              <p className={styles.emptyChartNote}>No marks recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subjectAverages} barCategoryGap={18}>
                  <CartesianGrid stroke="#e9eefa" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7c93" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip formatter={(v) => [`${v}%`, "Average"]} contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }} cursor={{ fill: "#eef4ff" }} />
                  <Bar dataKey="average" name="Average" fill="#1652f0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <p className={styles.cardTitle}>Grade distribution</p>
            {gradeDistribution.length === 0 ? (
              <p className={styles.emptyChartNote}>No assessments recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={gradeDistribution} barCategoryGap={18}>
                  <CartesianGrid stroke="#e9eefa" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7c93" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7c93" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip formatter={(v) => [v, "Assessments"]} contentStyle={{ borderRadius: 12, border: "1px solid #dfe7f3", fontSize: 12 }} cursor={{ fill: "#eef4ff" }} />
                  <Bar dataKey="count" name="Assessments" radius={[6, 6, 0, 0]}>
                    {gradeDistribution.map((entry) => (
                      <Cell key={entry.name} fill={GRADE_COLORS[entry.name] || "#1652f0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <p className={styles.cardTitle}>Assessment records</p>
        <DataTable
          columns={[
            { key: "assessment", label: "Assessment" },
            { key: "subject", label: "Subject", render: (r) => subjectsList.find((s) => s.id === r.subjectId)?.name },
            { key: "score", label: "Score", render: (r) => `${r.score} / ${r.maxScore}` },
            { key: "grade", label: "Grade", render: (r) => scoreToGrade(r.score) },
          ]}
          rows={relevantRecords}
          emptyLabel="No assessment records yet."
        />
      </div>
    </div>
  );
}