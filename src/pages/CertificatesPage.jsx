import { useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import Modal from "../components/Modal.jsx";
import CertificatePreview from "../components/CertificatePreview.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import pageStyles from "../styles/CertificatesPage.module.css";

export default function CertificatesPage() {
  const { user } = useAuth();
  return user?.role === "teacher" ? <TeacherCertificates /> : <StudentCertificates />;
}

function TeacherCertificates() {
  const { students, certificates, certificateTypes, addCertificate, getStudentAttendancePct } = useDirectory();
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ studentId: students[0]?.id || "", type: certificateTypes[0], remarks: "" });

  function issue(e) {
    e.preventDefault();
    const student = students.find((s) => s.id === form.studentId);
    if (!student) return;
    const attendance = getStudentAttendancePct(student.id);
    if (attendance < 75 && form.type !== "Transfer") {
      alert(`${student.name} has ${attendance}% attendance. Certificates typically require 75% or higher — issuing anyway as an override.`);
    }
    addCertificate({
      studentId: form.studentId,
      type: form.type,
      remarks: form.remarks || "Currently enrolled, in good standing.",
    });
    setModalOpen(false);
    setForm({ studentId: students[0]?.id || "", type: certificateTypes[0], remarks: "" });
  }

  return (
    <div>
      <TopBar
        title="Certificates"
        subtitle="Issue and track certificates for your students."
        actions={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Issue certificate
          </button>
        }
      />
      <div className={styles.container}>
        <div className={pageStyles.grid}>
          {certificates.map((c) => {
            const student = students.find((s) => s.id === c.studentId);
            return (
              <div key={c.id} className={`card ${pageStyles.certCard}`}>
                <div>
                  <p className={pageStyles.certType}>{c.type}</p>
                  <p className={pageStyles.certName}>{student?.name}</p>
                  <p className={pageStyles.certMeta}>Issued {c.issuedOn}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => setPreview(c)}>
                  Preview
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Issue a new certificate">
        <form onSubmit={issue} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className={pageStyles.label}>Student</label>
            <select className={pageStyles.select} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.rollNo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={pageStyles.label}>Certificate type</label>
            <select className={pageStyles.select} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {certificateTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={pageStyles.label}>Remarks (optional)</label>
            <textarea
              className={pageStyles.textarea}
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="e.g. Achieved top rank in Data Structures."
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "6px" }}>
            Issue certificate
          </button>
        </form>
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Certificate preview" width={560}>
        {preview && <CertificatePreview certificate={preview} student={students.find((s) => s.id === preview.studentId)} />}
      </Modal>
    </div>
  );
}

function StudentCertificates() {
  const { user } = useAuth();
  const { certificates } = useDirectory();
  const [preview, setPreview] = useState(null);
  const myCerts = useMemo(() => certificates.filter((c) => c.studentId === user?.id), [certificates, user?.id]);

  return (
    <div>
      <TopBar title="My Certificates" subtitle="View, print, or download certificates issued to you." />
      <div className={styles.container}>
        {myCerts.length === 0 ? (
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--color-muted)" }}>
            No certificates issued yet. Once your teacher issues one, it'll show up here.
          </div>
        ) : (
          <div className={pageStyles.grid}>
            {myCerts.map((c) => (
              <div key={c.id} className={`card ${pageStyles.certCard}`}>
                <div>
                  <p className={pageStyles.certType}>{c.type}</p>
                  <p className={pageStyles.certName}>Issued {c.issuedOn}</p>
                  <p className={pageStyles.certMeta}>{c.remarks}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => setPreview(c)}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Certificate" width={560}>
        {preview && (
          <>
            <CertificatePreview certificate={preview} student={user} />
            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                Print / Download
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}