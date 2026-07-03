import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import Modal from "../components/Modal.jsx";
import DataTable from "../components/DataTable.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import formStyles from "../styles/AdminExamsPage.module.css";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminExamsPage() {
  const { branches, classes, subjects, exams, addExam, updateExam, removeExam } = useDirectory();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ subjectId: "", branchId: "", date: "", startTime: "09:00", endTime: "11:00" });

  const isEditing = editingId !== null;

  // A subject belongs to a class, and a class belongs to a branch — so to
  // filter subjects "branch wise" we go through that chain rather than
  // needing subjects to carry their own branchId.
  function branchOfSubject(subject) {
    return classes.find((c) => c.id === subject.classId)?.branchId;
  }

  const subjectOptions = useMemo(() => {
    if (!form.branchId) return [];
    return subjects.filter((s) => branchOfSubject(s) === form.branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, classes, form.branchId]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "branchId") {
        // Changing the branch invalidates the current subject unless it
        // still belongs to the new branch — reset it to the first match.
        const stillValid = subjects.some((s) => s.id === f.subjectId && branchOfSubject(s) === value);
        if (!stillValid) {
          next.subjectId = subjects.find((s) => branchOfSubject(s) === value)?.id || "";
        }
      }
      return next;
    });
    if (error) setError("");
  }

  function openAddModal() {
    setEditingId(null);
    const firstBranch = branches[0]?.id || "";
    const firstSubject = subjects.find((s) => branchOfSubject(s) === firstBranch)?.id || "";
    setForm({ subjectId: firstSubject, branchId: firstBranch, date: todayStr(), startTime: "09:00", endTime: "11:00" });
    setError("");
    setOpen(true);
  }

  function openEditModal(exam) {
    setEditingId(exam.id);
    setForm({
      subjectId: exam.subjectId || "",
      branchId: exam.branchId || branches[0]?.id || "",
      date: exam.date || todayStr(),
      startTime: exam.startTime || "09:00",
      endTime: exam.endTime || "11:00",
    });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setError("");
    setEditingId(null);
    setOpen(false);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.branchId) {
      setError("Select a branch.");
      return;
    }
    if (!form.subjectId) {
      setError("Select a subject.");
      return;
    }
    if (!form.date) {
      setError("Select a date.");
      return;
    }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      setError("End time must be after start time.");
      return;
    }

    const subject = subjects.find((s) => s.id === form.subjectId);

    const payload = {
      name: subject?.name || "Exam",
      subjectId: form.subjectId,
      branchId: form.branchId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    if (isEditing) {
      updateExam(editingId, payload);
    } else {
      addExam(payload);
    }
    closeModal();
  }

  function handleRemove(exam) {
    if (window.confirm(`Remove "${exam.name}"? This can't be undone.`)) {
      removeExam(exam.id);
    }
  }

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [exams]);

  const filtered = useMemo(() => {
    return sortedExams.filter((e) => branchFilter === "all" || e.branchId === branchFilter);
  }, [sortedExams, branchFilter]);

  return (
    <div>
      <TopBar
        title="Exams"
        subtitle="Scheduled exams, by subject, date, time, and branch."
        actions={
          <div className={styles.toolbar}>
            <select className={styles.select} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={openAddModal}>+ Add Exam</button>
          </div>
        }
      />
      <div style={{ padding: "0 40px 40px" }}>
        <DataTable
          columns={[
            { key: "name", label: "Subject" },
            { key: "branch", label: "Branch", render: (r) => branches.find((b) => b.id === r.branchId)?.name || "—" },
            { key: "date", label: "Date", render: (r) => <span className={formStyles.dateBadge}>{r.date || "—"}</span> },
            {
              key: "time",
              label: "Time",
              render: (r) => <span className={formStyles.timeBadge}>{r.startTime} – {r.endTime}</span>,
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className={formStyles.rowActions}>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => openEditModal(r)}>
                    Edit
                  </button>
                  <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => handleRemove(r)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          rows={filtered}
          emptyLabel="No exams scheduled yet."
        />
      </div>

      <Modal open={open} onClose={closeModal} title={isEditing ? "Edit Exam" : "Add Exam"}>
        <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="ex-branch">Branch</label>
            <select id="ex-branch" className={formStyles.select} value={form.branchId} onChange={(e) => update("branchId", e.target.value)}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="ex-subject">Subject</label>
            <select id="ex-subject" className={formStyles.select} value={form.subjectId} onChange={(e) => update("subjectId", e.target.value)}>
              {subjectOptions.length === 0 && <option value="">No subjects in this branch</option>}
              {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="ex-date">Date</label>
            <input
              id="ex-date"
              type="date"
              className={formStyles.input}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </div>

          <div className={formStyles.row2}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ex-start">Start time</label>
              <input
                id="ex-start"
                type="time"
                className={formStyles.input}
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ex-end">End time</label>
              <input
                id="ex-end"
                type="time"
                className={formStyles.input}
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
              />
            </div>
          </div>

          {error && <p className={formStyles.error}>{error}</p>}

          <div className={formStyles.formActions}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEditing ? "Save changes" : "Add Exam"}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-outline" onClick={closeModal}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}