import { useRef, useEffect, useState, useMemo } from "react";
import gsap from "gsap";
import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import pageStyles from "../styles/ProfilePage.module.css";

const RELATIONS = ["Father", "Mother", "Guardian"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const { user } = useAuth();
  return user?.role === "teacher" ? <TeacherProfile /> : <StudentProfile />;
}

function emptyParentForm(parent) {
  return {
    name: parent?.name || "",
    relation: parent?.relation || "Father",
    phone: parent?.phone || "",
    email: parent?.email || "",
  };
}

function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const { getClassById, getBranchById, getStudentAttendancePct, getStudentAverage } = useDirectory();
  const cardRef = useRef(null);
  const parentCardRef = useRef(null);
  const cls = getClassById(user?.classId);
  const branch = getBranchById(user?.branchId);

  const hasParentDetails = !!(user?.parent?.name && user?.parent?.phone);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => emptyParentForm(user?.parent));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    gsap.fromTo(cardRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
  }, []);

  useEffect(() => {
    if (!parentCardRef.current) return;
    gsap.fromTo(parentCardRef.current, { opacity: 0.5, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
  }, [editing]);

  function startEdit() {
    setForm(emptyParentForm(user?.parent));
    setError("");
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setError("");
    setEditing(false);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required.");
      gsap.fromTo(parentCardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });
      return;
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      setError("Enter a valid email address, or leave it blank.");
      return;
    }

    updateProfile({
      parent: {
        name: form.name.trim(),
        relation: form.relation,
        phone: form.phone.trim(),
        email: form.email.trim(),
      },
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <TopBar title="My Profile" subtitle="Your personal details and parent/guardian information." />
      <div className={styles.container}>
        <div className={pageStyles.heroCard} ref={cardRef}>
          <div className={pageStyles.avatar}>{user?.name?.charAt(0)}</div>
          <div>
            <h2 className={pageStyles.name}>{user?.name}</h2>
            <p className={pageStyles.meta}>
              {user?.rollNo} · {cls?.name} · {branch?.name}
            </p>
          </div>
          <div className={pageStyles.heroStats}>
            <div>
              <p className={pageStyles.heroStatValue}>{getStudentAttendancePct(user?.id)}%</p>
              <p className={pageStyles.heroStatLabel}>Attendance</p>
            </div>
            <div>
              <p className={pageStyles.heroStatValue}>{getStudentAverage(user?.id)}%</p>
              <p className={pageStyles.heroStatLabel}>Average score</p>
            </div>
          </div>
        </div>

        <div className={pageStyles.splitGrid}>
          <div className="card" style={{ padding: "24px" }}>
            <p className={styles.cardTitle}>Contact & personal details</p>
            <Row label="Email" value={user?.email} />
            <Row label="Phone" value={user?.phone} />
            <Row label="Date of birth" value={user?.dob} />
            <Row label="Address" value={user?.address} />
          </div>

          <div className="card" style={{ padding: "24px" }} ref={parentCardRef}>
            <div className={pageStyles.cardHeader}>
              <p className={styles.cardTitle} style={{ margin: 0 }}>Parent / Guardian details</p>
              {!editing && (
                <button type="button" className="btn btn-ghost" onClick={startEdit} style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                  {hasParentDetails ? "Edit" : "Add details"}
                </button>
              )}
            </div>

            {saved && <p className={pageStyles.savedNote}>Saved — your parent/guardian details are up to date.</p>}

            {editing ? (
              <form onSubmit={handleSave} className={pageStyles.form}>
                <label className={pageStyles.fieldLabel} htmlFor="pf-parent-name">Name</label>
                <input
                  id="pf-parent-name"
                  className={pageStyles.input}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Parent / guardian full name"
                />

                <label className={pageStyles.fieldLabel} htmlFor="pf-parent-relation">Relation</label>
                <select
                  id="pf-parent-relation"
                  className={pageStyles.input}
                  value={form.relation}
                  onChange={(e) => update("relation", e.target.value)}
                >
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <label className={pageStyles.fieldLabel} htmlFor="pf-parent-phone">Phone</label>
                <input
                  id="pf-parent-phone"
                  className={pageStyles.input}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 90000 00000"
                />

                <label className={pageStyles.fieldLabel} htmlFor="pf-parent-email">Email (optional)</label>
                <input
                  id="pf-parent-email"
                  className={pageStyles.input}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="parent@example.com"
                />

                {error && <p className={pageStyles.error}>{error}</p>}

                <div className={pageStyles.formActions}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Save details
                  </button>
                  <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : hasParentDetails ? (
              <>
                <Row label="Name" value={user?.parent?.name} />
                <Row label="Relation" value={user?.parent?.relation} />
                <Row label="Phone" value={user?.parent?.phone} />
                <Row label="Email" value={user?.parent?.email} />
                <p className={pageStyles.note}>Only you can edit this information. Teachers can view it, not change it.</p>
              </>
            ) : (
              <div className={pageStyles.emptyState}>
                <p>No parent or guardian details on file yet.</p>
                <p className={pageStyles.note}>Add them any time — your teacher will be able to view them, but not edit them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherProfile() {
  const { user, updateProfile } = useAuth();
  const { branches, subjects, getClassById, getBranchById } = useDirectory();
  const cardRef = useRef(null);
  const detailsCardRef = useRef(null);
  const branch = getBranchById(user?.branchId);
  const teacherSubjects = subjects.filter((s) => (user?.subjectIds || []).includes(s.id));

  // Deduplicate the teacher's subjects down to the distinct classes they
  // teach, along with how many subjects they take in each and which branch
  // that class belongs to.
  const teacherClasses = useMemo(() => {
    const map = new Map();
    teacherSubjects.forEach((s) => {
      if (!map.has(s.classId)) {
        const cls = getClassById(s.classId);
        map.set(s.classId, {
          id: s.classId,
          name: cls?.name || "Unnamed class",
          branchName: getBranchById(cls?.branchId)?.name,
          subjectCount: 0,
        });
      }
      map.get(s.classId).subjectCount += 1;
    });
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherSubjects]);

  const classCount = teacherClasses.length;

  function emptyTeacherForm(u) {
    return {
      name: u?.name || "",
      phone: u?.phone || "",
      branchId: u?.branchId || branches[0]?.id,
    };
  }

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => emptyTeacherForm(user));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    gsap.fromTo(cardRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
  }, []);

  useEffect(() => {
    if (!detailsCardRef.current) return;
    gsap.fromTo(detailsCardRef.current, { opacity: 0.5, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
  }, [editing]);

  function startEdit() {
    setForm(emptyTeacherForm(user));
    setError("");
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setError("");
    setEditing(false);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      gsap.fromTo(detailsCardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });
      return;
    }

    const selectedBranch = branches.find((b) => b.id === form.branchId);
    updateProfile({
      name: form.name.trim(),
      phone: form.phone.trim(),
      branchId: form.branchId,
      department: selectedBranch?.name,
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <TopBar title="My Profile" subtitle="Your account and teaching details." />
      <div className={styles.container}>
        <div className={pageStyles.heroCard} ref={cardRef}>
          <div className={pageStyles.avatar}>{user?.name?.charAt(0)}</div>
          <div>
            <h2 className={pageStyles.name}>{user?.name}</h2>
            <p className={pageStyles.meta}>{branch?.name || "No department set yet"}</p>
          </div>
          <div className={pageStyles.heroStats}>
            <div>
              <p className={pageStyles.heroStatValue}>{teacherSubjects.length}</p>
              <p className={pageStyles.heroStatLabel}>Subjects taught</p>
            </div>
            <div>
              <p className={pageStyles.heroStatValue}>{classCount}</p>
              <p className={pageStyles.heroStatLabel}>Classes</p>
            </div>
          </div>
        </div>

        <div className={pageStyles.splitGrid}>
          <div className="card" style={{ padding: "24px" }} ref={detailsCardRef}>
            <div className={pageStyles.cardHeader}>
              <p className={styles.cardTitle} style={{ margin: 0 }}>Contact & profile details</p>
              {!editing && (
                <button type="button" className="btn btn-ghost" onClick={startEdit} style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                  Edit
                </button>
              )}
            </div>

            {saved && <p className={pageStyles.savedNote}>Saved — your profile is up to date.</p>}

            {editing ? (
              <form onSubmit={handleSave} className={pageStyles.form}>
                <label className={pageStyles.fieldLabel} htmlFor="tp-name">Full name</label>
                <input
                  id="tp-name"
                  className={pageStyles.input}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Full name"
                />

                <label className={pageStyles.fieldLabel} htmlFor="tp-phone">Phone</label>
                <input
                  id="tp-phone"
                  className={pageStyles.input}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 90000 00000"
                />

                <label className={pageStyles.fieldLabel} htmlFor="tp-branch">Branch / Department</label>
                <select
                  id="tp-branch"
                  className={pageStyles.input}
                  value={form.branchId}
                  onChange={(e) => update("branchId", e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                {error && <p className={pageStyles.error}>{error}</p>}

                <div className={pageStyles.formActions}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Save changes
                  </button>
                  <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <Row label="Email" value={user?.email} />
                <Row label="Phone" value={user?.phone} />
                <Row label="Branch / Department" value={branch?.name} />
                <p className={pageStyles.note}>Email is tied to your login and can't be changed here.</p>
              </>
            )}
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <p className={styles.cardTitle}>Subjects you teach</p>
            {teacherSubjects.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <p>No subjects assigned yet.</p>
                <p className={pageStyles.note}>An administrator assigns subjects to your account.</p>
              </div>
            ) : (
              teacherSubjects.map((subj) => (
                <Row key={subj.id} label={subj.name} value={getClassById(subj.classId)?.name} />
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: "24px", marginTop: "24px" }}>
          <p className={styles.cardTitle}>Classes you teach</p>
          {teacherClasses.length === 0 ? (
            <div className={pageStyles.emptyState}>
              <p>No classes assigned yet.</p>
              <p className={pageStyles.note}>Classes appear here once an administrator assigns you a subject.</p>
            </div>
          ) : (
            teacherClasses.map((c) => (
              <Row
                key={c.id}
                label={c.name}
                value={`${c.subjectCount} subject${c.subjectCount > 1 ? "s" : ""}${c.branchName ? ` · ${c.branchName}` : ""}`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className={pageStyles.row}>
      <span className={pageStyles.rowLabel}>{label}</span>
      <span className={pageStyles.rowValue}>{value || "—"}</span>
    </div>
  );
}