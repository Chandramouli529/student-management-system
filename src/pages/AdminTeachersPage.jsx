import { useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import Modal from "../components/Modal.jsx";
import DataTable from "../components/DataTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCombinedRoster, useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import formStyles from "../styles/AdminTeachersPage.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { name: "", email: "", empId: "", branchId: "" };

// Log of every credential set an admin has issued, kept separately from the
// account store itself (which never exposes passwords back out again once
// created). Shared key with the Students page so there's one combined log
// across both roles.
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
// the teacher can actually remember being told (e.g. "Meera@4821") instead
// of an opaque string — with a random 4-digit suffix so it isn't purely
// guessable from their name alone.
function generatePasswordFromName(name) {
  const firstName = (name || "Teacher").trim().split(/\s+/)[0];
  const cleanFirstName = firstName.replace(/[^a-zA-Z]/g, "") || "Teacher";
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

function nextEmpId(teachers) {
  const nums = teachers
    .map((t) => t.empId?.match(/^EMP-(\d+)$/i)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `EMP-${String(next).padStart(3, "0")}`;
}

export default function AdminTeachersPage() {
  const { allTeachers } = useCombinedRoster();
  const { branches, addTeacher, updateTeacher, removeTeacher } = useDirectory();
  const { emailTaken, issueCredentials } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [empFilter, setEmpFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  // Set once a new teacher's account is created — switches the modal into
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
    setForm({ name: "", email: "", empId: nextEmpId(allTeachers), branchId: branches[0].id });
    setError("");
    setOpen(true);
  }

  function openEditModal(teacher) {
    setEditingId(teacher.id);
    setCredentials(null);
    setForm({
      name: teacher.name || "",
      email: teacher.email || "",
      empId: teacher.empId || "",
      branchId: teacher.branchId || branches[0].id,
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
    const empId = form.empId.trim();

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    const empIdTaken = allTeachers.some(
      (t) => t.id !== editingId && empId && t.empId?.toLowerCase() === empId.toLowerCase()
    );
    if (empIdTaken) {
      setError(`Employee ID "${empId}" is already assigned to another teacher.`);
      return;
    }

    const branch = branches.find((b) => b.id === form.branchId);
    const payload = { name, email, empId, branchId: form.branchId, department: branch?.name };

    if (isEditing) {
      updateTeacher(editingId, payload);
      closeModal();
      return;
    }

    // New teacher: check the login-account email isn't already taken
    // *before* creating the roster record, so we never end up with a
    // roster entry that has no matching account.
    if (emailTaken(email)) {
      setError(`An account already exists for ${email}.`);
      return;
    }

    const record = addTeacher(payload);
    if (!record) {
      setError("Something went wrong adding the teacher. Please try again.");
      return;
    }

    const tempPassword = generatePasswordFromName(record.name);
    const result = issueCredentials({ role: "teacher", profile: record, password: tempPassword });

    if (!result || !result.ok) {
      // Extremely unlikely given the emailTaken check above, but don't
      // silently swallow it — the roster record exists either way.
      setError(`Teacher added, but the login account could not be created: ${result?.error || "unknown error"}`);
      return;
    }

    logIssuedCredential({
      name: record.name,
      email: result.email,
      password: tempPassword,
      role: "teacher",
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

  function handleRemove(teacher) {
    if (window.confirm(`Remove ${teacher.name} from the teacher roster? This can't be undone.`)) {
      removeTeacher(teacher.id);
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

  const empOptions = useMemo(
    () => [...new Set(allTeachers.map((t) => t.empId).filter(Boolean))].sort(),
    [allTeachers]
  );

  const filtered = useMemo(() => {
    return allTeachers.filter((t) => {
      const matchesBranch = branchFilter === "all" || t.branchId === branchFilter;
      const matchesEmp = empFilter === "all" || t.empId === empFilter;
      return matchesBranch && matchesEmp;
    });
  }, [allTeachers, branchFilter, empFilter]);

  return (
    <div>
      <TopBar
        title="Teachers"
        subtitle="Every teacher profile, employee ID, and branch."
        actions={
          <div className={styles.toolbar}>
            <select className={styles.select} value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
              <option value="all">All employee IDs</option>
              {empOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
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
            <button className="btn btn-primary" onClick={openAddModal}>+ Add Teacher</button>
          </div>
        }
      />
      <div style={{ padding: "0 40px 40px" }}>
        <DataTable
          columns={[
            {
              key: "empId",
              label: "Employee ID",
              render: (r) => (r.empId ? <span className={formStyles.empIdBadge}>{r.empId}</span> : "—"),
            },
            { key: "name", label: "Name" },
            { key: "email", label: "Profile / Email" },
            { key: "branch", label: "Branch", render: (r) => branches.find((b) => b.id === r.branchId)?.name || r.department || "—" },
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

      <Modal open={open} onClose={closeModal} title={credentials ? "Account created" : isEditing ? "Edit Teacher" : "Add Teacher"}>
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
              <span className={formStyles.credentialLabel}>Password</span>
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
              <label className={formStyles.label} htmlFor="at-empid">Employee ID</label>
              <input
                id="at-empid"
                className={formStyles.input}
                placeholder="e.g. EMP-013"
                value={form.empId}
                onChange={(e) => update("empId", e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="at-name">Full name</label>
              <input
                id="at-name"
                className={formStyles.input}
                placeholder="Full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="at-email">Registration email</label>
              <input
                id="at-email"
                type="email"
                className={formStyles.input}
                placeholder="teacher@example.com"
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

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="at-branch">Branch</label>
              <select id="at-branch" className={formStyles.select} value={form.branchId} onChange={(e) => update("branchId", e.target.value)}>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {error && <p className={formStyles.error}>{error}</p>}

            <div className={formStyles.formActions}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {isEditing ? "Save changes" : "Add Teacher"}
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