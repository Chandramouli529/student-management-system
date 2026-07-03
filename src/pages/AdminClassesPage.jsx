import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import Modal from "../components/Modal.jsx";
import DataTable from "../components/DataTable.jsx";
import { useCombinedRoster, useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import formStyles from "../styles/AdminClassesPage.module.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(classes, subjects, allTeachers) {
  const firstClass = classes[0];
  const firstSubject = subjects.find((s) => s.classId === firstClass?.id) || subjects[0];
  return {
    classId: firstClass?.id || "",
    subjectId: firstSubject?.id || "",
    teacherId: allTeachers[0]?.id || "",
    day: DAYS[0],
    date: todayStr(),
    startTime: "09:00",
    endTime: "10:00",
  };
}

export default function AdminClassesPage() {
  const { allTeachers } = useCombinedRoster();
  const { branches, classes, subjects, schedule, assignSchedule, updateSchedule, removeSchedule } = useDirectory();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null); // null = adding, otherwise the schedule row's id

  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");

  const [form, setForm] = useState(() => emptyForm(classes, subjects, allTeachers));

  const isEditing = editingId !== null;

  function branchOfClass(classId) {
    return classes.find((c) => c.id === classId)?.branchId;
  }

  // Classes that belong to the selected branch (or all classes, if no
  // branch is selected). The "years" filter and the modal's class dropdown
  // both draw from this.
  const classOptions = useMemo(() => {
    if (branchFilter === "all") return classes;
    return classes.filter((c) => c.branchId === branchFilter);
  }, [classes, branchFilter]);

  // Subjects taught in any of those classes — this is what makes the
  // subject filter narrow down to "CSE only" once a branch is picked.
  const subjectOptions = useMemo(() => {
    if (branchFilter === "all") return subjects;
    const classIds = new Set(classOptions.map((c) => c.id));
    return subjects.filter((s) => classIds.has(s.classId));
  }, [subjects, branchFilter, classOptions]);

  // If the branch filter changes and the currently-selected year/subject no
  // longer belongs to it, fall back to "all" instead of silently showing an
  // empty table.
  useEffect(() => {
    if (yearFilter !== "all" && !classOptions.some((c) => c.id === yearFilter)) {
      setYearFilter("all");
    }
    if (subjectFilter !== "all" && !subjectOptions.some((s) => s.id === subjectFilter)) {
      setSubjectFilter("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Changing the class in the modal should re-narrow the subject
      // dropdown to that class's subjects — reset subjectId if the current
      // one doesn't belong to the newly-selected class.
      if (field === "classId") {
        const stillValid = subjects.some((s) => s.classId === value && s.id === f.subjectId);
        if (!stillValid) {
          next.subjectId = subjects.find((s) => s.classId === value)?.id || "";
        }
      }
      return next;
    });
    if (error) setError("");
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm(classes, subjects, allTeachers));
    setError("");
    setOpen(true);
  }

  function openEdit(entry) {
    setEditingId(entry.id);
    setForm({
      classId: entry.classId,
      subjectId: entry.subjectId,
      teacherId: entry.teacherId,
      day: entry.day,
      date: entry.date || todayStr(),
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setError("");
    setForm(emptyForm(classes, subjects, allTeachers));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.teacherId) {
      setError("Select a teacher.");
      return;
    }
    if (form.startTime >= form.endTime) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        updateSchedule({ ...form, id: editingId });
      } else {
        assignSchedule(form);
      }
      closeModal();
    } catch {
      setError(`Couldn't ${isEditing ? "save" : "add"} the schedule entry. Try again.`);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return schedule.filter((r) => {
      const matchesBranch = branchFilter === "all" || branchOfClass(r.classId) === branchFilter;
      const matchesYear = yearFilter === "all" || r.classId === yearFilter;
      const matchesSubject = subjectFilter === "all" || r.subjectId === subjectFilter;
      const matchesDay = dayFilter === "all" || r.day === dayFilter;
      return matchesBranch && matchesYear && matchesSubject && matchesDay;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, classes, branchFilter, yearFilter, subjectFilter, dayFilter]);

  // Subjects available in the modal's dropdown, scoped to the selected class.
  const modalSubjectOptions = useMemo(
    () => subjects.filter((s) => s.classId === form.classId),
    [subjects, form.classId]
  );

  return (
    <div>
      <TopBar
        title="Timetable"
        subtitle="Which class meets when, and which teacher takes it."
        actions={
          <div className={styles.toolbar}>
            <select className={styles.select} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select className={styles.select} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="all">All years</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select className={styles.select} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="all">All subjects</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select className={styles.select} value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
              <option value="all">All days</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Schedule</button>
          </div>
        }
      />
      <div style={{ padding: "0 40px 40px" }}>
        <DataTable
          columns={[
            { key: "class", label: "Class", render: (r) => classes.find((c) => c.id === r.classId)?.name || "—" },
            { key: "subject", label: "Subject", render: (r) => subjects.find((s) => s.id === r.subjectId)?.name || "—" },
            { key: "teacher", label: "Teacher", render: (r) => allTeachers.find((t) => t.id === r.teacherId)?.name || "—" },
            { key: "day", label: "Day", render: (r) => <span className={formStyles.dayBadge}>{r.day}</span> },
            { key: "date", label: "Date", render: (r) => <span className={formStyles.timeBadge}>{r.date || "—"}</span> },
            { key: "time", label: "Time", render: (r) => <span className={formStyles.timeBadge}>{r.startTime} – {r.endTime}</span> },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className={formStyles.rowActions}>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => openEdit(r)}>
                    Edit
                  </button>
                  <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => removeSchedule(r.id)}>
                    Remove
                  </button>
                </div>
              ),
            },
          ]}
          rows={filtered}
          emptyLabel={schedule.length === 0 ? "No classes scheduled yet." : "No schedule entries match these filters."}
        />
      </div>

      <Modal open={open} onClose={closeModal} title={isEditing ? "Edit Class Schedule" : "Add Class Schedule"}>
        <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
          <div className={formStyles.row2}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="cs-classId">Class / Year</label>
              <select id="cs-classId" className={formStyles.select} value={form.classId} onChange={(e) => update("classId", e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="cs-subjectId">Subject</label>
              <select id="cs-subjectId" className={formStyles.select} value={form.subjectId} onChange={(e) => update("subjectId", e.target.value)}>
                {modalSubjectOptions.length === 0 && <option value="">No subjects for this class</option>}
                {modalSubjectOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="cs-teacherId">Teacher</label>
            <select id="cs-teacherId" className={formStyles.select} value={form.teacherId} onChange={(e) => update("teacherId", e.target.value)}>
              <option value="" disabled>Select teacher</option>
              {allTeachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className={formStyles.row2}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="cs-day">Day</label>
              <select id="cs-day" className={formStyles.select} value={form.day} onChange={(e) => update("day", e.target.value)}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="cs-date">Date</label>
              <input
                id="cs-date"
                type="date"
                className={formStyles.input}
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
          </div>

          <div className={formStyles.row2}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="cs-startTime">Start time</label>
              <input
                id="cs-startTime"
                type="time"
                className={formStyles.input}
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="cs-endTime">End time</label>
              <input
                id="cs-endTime"
                type="time"
                className={formStyles.input}
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
              />
            </div>
          </div>

          {error && <p className={formStyles.error}>{error}</p>}

          <div className={formStyles.formActions}>
            <button type="button" className="btn btn-outline" onClick={closeModal} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? (isEditing ? "Saving…" : "Adding…") : isEditing ? "Save changes" : "Add Schedule"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}