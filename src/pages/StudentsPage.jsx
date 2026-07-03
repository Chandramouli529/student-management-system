import { useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory, scoreToGrade } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";

export default function StudentsPage() {
  const { user } = useAuth();
  const { students, classes, branches, getStudentAttendancePct, getStudentAverage } = useDirectory();
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  // A teacher only ever sees students in their own department — never the
  // whole school's roster. Same scoping rule as the Attendance page.
  const departmentStudents = useMemo(
    () => students.filter((s) => s.branchId === user?.branchId),
    [students, user?.branchId]
  );
  const departmentClasses = useMemo(
    () => classes.filter((c) => c.branchId === user?.branchId),
    [classes, user?.branchId]
  );
  const departmentName = branches.find((b) => b.id === user?.branchId)?.name;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return departmentStudents.filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || (s.rollNo || "").toLowerCase().includes(q);
      const matchesClass = classFilter === "all" || s.classId === classFilter;
      return matchesQuery && matchesClass;
    });
  }, [departmentStudents, query, classFilter]);

  return (
    <div>
      <TopBar
        title="Students"
        subtitle={departmentName ? `Your roster in ${departmentName}.` : "Your full roster across assigned classes."}
        actions={
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder="Search by name or roll no."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select className={styles.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">All classes</option>
              {departmentClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className={styles.container}>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "rollNo", label: "Roll No." },
            { key: "class", label: "Class", render: (r) => departmentClasses.find((c) => c.id === r.classId)?.name },
            { key: "attendance", label: "Attendance", render: (r) => `${getStudentAttendancePct(r.id)}%` },
            { key: "avg", label: "Avg. score", render: (r) => `${getStudentAverage(r.id)}% (${scoreToGrade(getStudentAverage(r.id))})` },
            {
              key: "view",
              label: "",
              render: (r) => (
                <button className="btn btn-ghost" onClick={() => setSelected(r)} style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                  View
                </button>
              ),
            },
          ]}
          rows={filtered}
          emptyLabel={
            departmentStudents.length === 0
              ? `No students are enrolled in ${departmentName || "your department"} yet.`
              : "No students match these filters."
          }
        />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} width={520}>
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Detail label="Roll No." value={selected.rollNo} />
            <Detail label="Class" value={departmentClasses.find((c) => c.id === selected.classId)?.name} />
            <Detail label="Email" value={selected.email} />
            <Detail label="Phone" value={selected.phone} />
            <Detail label="Attendance" value={`${getStudentAttendancePct(selected.id)}%`} />
            <Detail label="Average score" value={`${getStudentAverage(selected.id)}%`} />
            <div style={{ borderTop: "1px dashed var(--color-border-strong)", paddingTop: "12px", marginTop: "4px" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-blue-700)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>
                Parent / Guardian (read only)
              </p>
              <Detail label="Name" value={selected.parent?.name} />
              <Detail label="Relation" value={selected.parent?.relation} />
              <Detail label="Phone" value={selected.parent?.phone} />
              <Detail label="Email" value={selected.parent?.email} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.87rem" }}>
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>{value || "—"}</span>
    </div>
  );
}