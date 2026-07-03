import { useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import Modal from "../components/Modal.jsx";
import DataTable from "../components/DataTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCombinedRoster, useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import formStyles from "../styles/AdminStudentsPage.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { name: "", email: "", rollNo: "", branchId: "", classId: "" };

// Log of every credential set an admin has issued, kept separately from the
// account store itself (which never exposes passwords back out again once
// created). This is what lets an admin look a temp password back up if the
// "send via email" step gets missed or the modal is closed too soon.
const CREDENTIAL_LOG_KEY = "bp_issued_credentials_v1";

function readCredentialLog() {
  try {
    const raw = window.localStorage.getItem(CREDENTIAL_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function logIssuedCredential(entry) {
  const log = readCredentialLog();
  log.push(entry);
  try {
    window.localStorage.setItem(CREDENTIAL_LOG_KEY, JSON.stringify(log));
  } catch {
    // localStorage unavailable — the account itself is still created either way
  }
}

// Temp password is name-based rather than fully random, so it's something
// the student can actually remember being told (e.g. "Aarav@4821") instead
// of an opaque string — with a random 4-digit suffix so it isn't purely
// guessable from their name alone.
function generatePasswordFromName(name) {
  const firstName = (name || "Student").trim().split(/\s+/)[0];
  const cleanFirstName = firstName.replace(/[^a-zA-Z]/g, "") || "Student";
  const capitalized = cleanFirstName.charAt(0).toUpperCase() + cleanFirstName.slice(1).toLowerCase();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${capitalized}@${suffix}`;
}

function buildMailtoLink(name, email, password) {
  const subject = encodeURIComponent("Your Brightpath account");
  const body = encodeURIComponent(
    `Hi ${name},\n\n` +
      `An account has been created for you on Brightpath.\n\n` +
      `Email: ${email}\n` +
      `Temporary password: ${password}\n\n` +
      `Please sign in and change your password after logging in.`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function AdminStudentsPage() {
  const { allStudents } = useCombinedRoster();
  const { branches, classes, addStudent, updateStudent, removeStudent } = useDirectory();
  const { emailTaken, issueCredentials } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [rollFilter, setRollFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  // Set once a new student's account is created — switches the modal into
  // a "here are the credentials" view instead of closing immediately.
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const isEditing = editingId !== null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError("");
  }

  function openAddModal() {
    setEditingId(null);
    setCredentials(null);
    setForm({ name: "", email: "", rollNo: "", branchId: branches[0].id, classId: classes[0].id });
    setError("");
    setOpen(true);
  }

  function openEditModal(student) {
    setEditingId(student.id);
    setCredentials(null);
    setForm({
      name: student.name || "",
      email: student.email || "",
      rollNo: student.rollNo || "",
      branchId: student.branchId || branches[0].id,
      classId: student.classId || classes[0].id,
    });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setError("");
    setForm(EMPTY_FORM);
    setEditingId(null);
    setCredentials(null);
    setCopied(false);
    setOpen(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const rollNo = form.rollNo.trim();

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    const rollTaken = allStudents.some(
      (s) => s.id !== editingId && rollNo && s.rollNo?.toLowerCase() === rollNo.toLowerCase()
    );
    if (rollTaken) {
      setError(`Roll number "${rollNo}" is already assigned to another student.`);
      return;
    }

    const payload = { name, email, rollNo, branchId: form.branchId, classId: form.classId };

    if (isEditing) {
      updateStudent(editingId, payload);
      closeModal();
      return;
    }

    // New student: check the login-account email isn't already taken
    // *before* creating the roster record, so we never end up with a
    // roster entry that has no matching account.
    if (emailTaken(email)) {
      setError(`An account already exists for ${email}.`);
      return;
    }

    const record = addStudent(payload);
    if (!record) {
      setError("Something went wrong adding the student. Please try again.");
      return;
    }

    const tempPassword = generatePasswordFromName(record.name);
    const result = issueCredentials({ role: "student", profile: record, password: tempPassword });

    if (!result || !result.ok) {
      // Extremely unlikely given the emailTaken check above, but don't
      // silently swallow it — the roster record exists either way.
      setError(`Student added, but the login account could not be created: ${result?.error || "unknown error"}`);
      return;
    }

    logIssuedCredential({
      name: record.name,
      email: result.email,
      password: tempPassword,
      role: "student",
      issuedAt: new Date().toISOString(),
    });

    setCredentials({ name: record.name, email: result.email, password: tempPassword });

    // Confirm to the admin what's about to happen before the mail app
    // takes over the screen — easy to miss otherwise.
    window.alert(`Credentials will be sent to ${result.email}.`);

    // Send it straight to their mail client rather than waiting on a
    // second click — the "Resend via email" button in the panel below is
    // still there in case this gets blocked or they want to resend it.
    const mailLink = buildMailtoLink(record.name, result.email, tempPassword);
    window.location.href = mailLink;
  }

  function handleRemove(student) {
    if (window.confirm(`Remove ${student.name} from the student roster? This can't be undone.`)) {
      removeStudent(student.id);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the text is
      // still visible on screen for the admin to copy by hand.
    }
  }

  function mailtoHref() {
    if (!credentials) return "#";
    return buildMailtoLink(credentials.name, credentials.email, credentials.password);
  }

  const rollOptions = useMemo(
    () => [...new Set(allStudents.map((s) => s.rollNo).filter(Boolean))].sort(),
    [allStudents]
  );

  // Academic year options — derived from the class list (e.g. "CSE - Year 2"
  // -> "Year 2"), so the filter works across every branch's class naming.
  const yearOptions = useMemo(() => {
    const years = classes
      .map((c) => c.name.match(/Year\s*\d+/i)?.[0])
      .filter(Boolean);
    return [...new Set(years)].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
      return numA - numB;
    });
  }, [classes]);

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const matchesBranch = branchFilter === "all" || s.branchId === branchFilter;
      const matchesRoll = rollFilter === "all" || s.rollNo === rollFilter;
      const studentClass = classes.find((c) => c.id === s.classId);
      const studentYear = studentClass?.name.match(/Year\s*\d+/i)?.[0];
      const matchesYear = yearFilter === "all" || studentYear === yearFilter;
      return matchesBranch && matchesRoll && matchesYear;
    });
  }, [allStudents, classes, branchFilter, rollFilter, yearFilter]);

  return (
    <div>
      <TopBar
        title="Students"
        subtitle="Every student profile, branch, and year."
        actions={
          <div className={styles.toolbar}>
            <select className={styles.select} value={rollFilter} onChange={(e) => setRollFilter(e.target.value)}>
              <option value="all">All roll numbers</option>
              {rollOptions.map((roll) => (
                <option key={roll} value={roll}>
                  {roll}
                </option>
              ))}
            </select>
            <select className={styles.select} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select className={styles.select} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="all">All academic years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={openAddModal}>+ Add Student</button>
          </div>
        }
      />
      <div style={{ padding: "0 40px 40px" }}>
        <DataTable
          columns={[
            { key: "rollNo", label: "Roll No.", render: (r) => r.rollNo || "—" },
            { key: "name", label: "Name" },
            { key: "email", label: "Profile / Email" },
            { key: "branch", label: "Branch", render: (r) => branches.find((b) => b.id === r.branchId)?.name || "—" },
            { key: "year", label: "Year", render: (r) => classes.find((c) => c.id === r.classId)?.name || "—" },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className={formStyles.rowActions}>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => openEditModal(r)}>
                    Edit
                  </button>
                  <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => handleRemove(r)}>
                    Remove
                  </button>
                </div>
              ),
            },
          ]}
          rows={filtered}
        />
      </div>

      <Modal open={open} onClose={closeModal} title={credentials ? "Account created" : isEditing ? "Edit Student" : "Add Student"}>
        {credentials ? (
          <div className={formStyles.credentialsPanel}>
            <p className={formStyles.credentialsIntro}>
              {credentials.name}'s login has been created, and your email client should have
              opened with their credentials ready to send. There's no email server here — this
              app only hands off to your own mail app, it doesn't send anything itself. These
              credentials are also saved below in case that window didn't open.
            </p>

            <div className={formStyles.credentialRow}>
              <span className={formStyles.credentialLabel}>Email</span>
              <span className={formStyles.credentialValue}>{credentials.email}</span>
            </div>
            <div className={formStyles.credentialRow}>
              <span className={formStyles.credentialLabel}>Temporary password</span>
              <span className={formStyles.credentialValue}>{credentials.password}</span>
            </div>

            <div className={formStyles.formActions}>
              <a className="btn btn-primary" style={{ flex: 1, textAlign: "center" }} href={mailtoHref()}>
                Resend via email
              </a>
              <button type="button" className="btn btn-outline" onClick={copyCredentials}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: "10px" }} onClick={closeModal}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="as-roll">Roll number</label>
              <input
                id="as-roll"
                className={formStyles.input}
                placeholder="e.g. CS21-005"
                value={form.rollNo}
                onChange={(e) => update("rollNo", e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="as-name">Full name</label>
              <input
                id="as-name"
                className={formStyles.input}
                placeholder="Full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="as-email">Registration email</label>
              <input
                id="as-email"
                type="email"
                className={formStyles.input}
                placeholder="student@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
              {!isEditing && (
                <p className={formStyles.hint}>
                  A login account is created automatically for this email — your mail app will
                  open with their temporary password ready to send.
                </p>
              )}
            </div>

            <div className={formStyles.row2}>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="as-branch">Branch</label>
                <select id="as-branch" className={formStyles.select} value={form.branchId} onChange={(e) => update("branchId", e.target.value)}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="as-class">Year</label>
                <select id="as-class" className={formStyles.select} value={form.classId} onChange={(e) => update("classId", e.target.value)}>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {error && <p className={formStyles.error}>{error}</p>}

            <div className={formStyles.formActions}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {isEditing ? "Save changes" : "Add Student"}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}