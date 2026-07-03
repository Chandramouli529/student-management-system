import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { useCombinedRoster, useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import pageStyles from "../styles/AdminStudentAttendance.module.css";

const STATUS_OPTIONS = ["All", "Present", "Absent", "Late", "Excused"];
const EDITABLE_STATUSES = ["Present", "Absent", "Late", "Excused"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminStudentAttendancePage() {
  const { allStudents, allAttendance } = useCombinedRoster();
  const { branches, classes, subjects, upsertAttendance } = useDirectory();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState("Present");

  // The input itself updates instantly for responsiveness, but the actual
  // filtering (which re-renders potentially hundreds of table rows) waits
  // for a brief pause in typing instead of running on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timeout);
  }, [search]);

  // O(1) lookups instead of calling .find() on the full array for every
  // single attendance record — with students/subjects/classes/branches all
  // being searched per row, that was O(records × roster size) on every
  // render and was the main source of the slowdown.
  const studentsById = useMemo(() => new Map(allStudents.map((s) => [s.id, s])), [allStudents]);
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classesById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const branchesById = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  // Join each raw attendance record up to the student/subject it belongs
  // to, since attendanceRecords itself only stores ids. Records whose
  // student or subject no longer exists (e.g. removed from the roster
  // after being marked) are dropped rather than shown with blank fields.
  const enrichedRecords = useMemo(() => {
    return allAttendance
      .map((r) => {
        const student = studentsById.get(r.studentId);
        const subject = subjectsById.get(r.subjectId);
        if (!student || !subject) return null;
        const studentClass = classesById.get(student.classId);
        const branch = branchesById.get(student.branchId);
        return {
          ...r,
          studentName: student.name,
          rollNo: student.rollNo || "—",
          branchId: student.branchId,
          branchName: branch?.name || "—",
          className: studentClass?.name || "—",
          subjectName: subject.name,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allAttendance, studentsById, subjectsById, classesById, branchesById]);

  const filteredRecords = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return enrichedRecords.filter((r) => {
      const matchesSearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.rollNo.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q);

      const matchesBranch = branchFilter === "all" || r.branchId === branchFilter;
      const matchesDate = !dateFilter || r.date === dateFilter;
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;

      return matchesSearch && matchesBranch && matchesDate && matchesStatus;
    });
  }, [enrichedRecords, debouncedSearch, branchFilter, dateFilter, statusFilter]);

  const counts = useMemo(() => {
    const base = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    filteredRecords.forEach((r) => {
      if (base[r.status] !== undefined) base[r.status] += 1;
    });
    return base;
  }, [filteredRecords]);

  function openEdit(record) {
    setEditingRecord(record);
    setEditStatus(record.status);
  }

  function closeEdit() {
    setEditingRecord(null);
  }

  function saveEdit(e) {
    e.preventDefault();
    if (!editingRecord) return;
    upsertAttendance(editingRecord.studentId, editingRecord.subjectId, editingRecord.date, editStatus);
    closeEdit();
  }

  return (
    <div>
      <TopBar
        title="Student Attendance"
        subtitle="Every attendance record marked by teachers, across every branch."
        actions={
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder="Search name, roll no, branch, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className={styles.select} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={styles.select}
              value={dateFilter}
              max={todayStr()}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button type="button" className="btn btn-outline" onClick={() => setDateFilter("")}>
                Clear date
              </button>
            )}
          </div>
        }
      />

      <div className={styles.container}>
        <div className={styles.statGrid}>
          <StatCard label="Records shown" value={filteredRecords.length} index={0} />
          <StatCard label="Present" value={counts.Present} index={1} />
          <StatCard label="Absent" value={counts.Absent} index={2} />
          <StatCard label="Late" value={counts.Late} index={3} />
        </div>

        <DataTable
          columns={[
            { key: "rollNo", label: "Roll No." },
            { key: "studentName", label: "Name" },
            { key: "branchName", label: "Branch" },
            { key: "className", label: "Class" },
            { key: "subjectName", label: "Subject" },
            { key: "date", label: "Date" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusPill status={r.status} />,
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                  onClick={() => openEdit(r)}
                >
                  Edit
                </button>
              ),
            },
          ]}
          rows={filteredRecords}
          emptyLabel={
            allAttendance.length === 0
              ? "No attendance has been recorded yet — records will appear here once teachers start marking attendance."
              : "No records match these filters."
          }
        />
      </div>

      <Modal open={!!editingRecord} onClose={closeEdit} title="Edit attendance record" width={420}>
        {editingRecord && (
          <form onSubmit={saveEdit} className={pageStyles.editForm}>
            <div className={pageStyles.editSummary}>
              <p className={pageStyles.editSummaryName}>{editingRecord.studentName}</p>
              <p className={pageStyles.editSummaryMeta}>
                {editingRecord.subjectName} · {editingRecord.date}
              </p>
            </div>

            <label className={pageStyles.editLabel} htmlFor="edit-status">Status</label>
            <div className={pageStyles.statusOptions}>
              {EDITABLE_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${pageStyles.statusOption} ${editStatus === s ? pageStyles.statusOptionActive : ""}`}
                  onClick={() => setEditStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className={pageStyles.editActions}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save changes
              </button>
              <button type="button" className="btn btn-outline" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function StatusPill({ status }) {
  const toneClass =
    {
      Present: pageStyles.pillPresent,
      Absent: pageStyles.pillAbsent,
      Late: pageStyles.pillLate,
      Excused: pageStyles.pillExcused,
    }[status] || "";
  return <span className={`${pageStyles.pill} ${toneClass}`}>{status}</span>;
}