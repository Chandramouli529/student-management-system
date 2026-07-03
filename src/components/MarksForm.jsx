import { useState } from "react";
import styles from "../styles/MarksForm.module.css";

export default function MarksForm({ students, assessment, onAssessmentChange, assessments, valueFor, onSave }) {
  const [drafts, setDrafts] = useState({});

  function handleChange(studentId, value) {
    setDrafts((prev) => ({ ...prev, [studentId]: value }));
  }

  function handleSave(studentId) {
    const raw = drafts[studentId];
    if (raw === undefined || raw === "") return;
    const score = Math.min(100, Math.max(0, Number(raw)));
    onSave(studentId, score);
    setDrafts((prev) => ({ ...prev, [studentId]: undefined }));
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <label className={styles.label}>Assessment</label>
        <select className={styles.select} value={assessment} onChange={(e) => onAssessmentChange(e.target.value)}>
          {assessments.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.list}>
        {students.map((student) => {
          const existing = valueFor(student.id);
          return (
            <div className={styles.row} key={student.id}>
              <div className={styles.info}>
                <p className={styles.name}>{student.name}</p>
                <p className={styles.roll}>{student.rollNo}</p>
              </div>
              <div className={styles.entry}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder={existing !== undefined ? String(existing) : "--"}
                  value={drafts[student.id] ?? ""}
                  onChange={(e) => handleChange(student.id, e.target.value)}
                  className={styles.input}
                />
                <span className={styles.outOf}>/ 100</span>
                <button className={styles.saveBtn} onClick={() => handleSave(student.id)} type="button">
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}