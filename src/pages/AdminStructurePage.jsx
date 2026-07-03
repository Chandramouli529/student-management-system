import { useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import Modal from "../components/Modal.jsx";
import DataTable from "../components/DataTable.jsx";
import { useDirectory } from "../context/DirectoryContext.jsx";
import styles from "../styles/Dashboard.module.css";
import formStyles from "../styles/AdminStructurePage.module.css";

const TABS = ["Branches", "Years", "Subjects"];

export default function AdminStructurePage() {
  const [tab, setTab] = useState("Branches");

  return (
    <div>
      <TopBar
        title="Structure"
        subtitle="Manage branches, years, and subjects — the catalog every other page draws from."
        actions={
          <div className={formStyles.tabs}>
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`${formStyles.tab} ${tab === t ? formStyles.tabActive : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />
      <div style={{ padding: "0 40px 40px" }}>
        {tab === "Branches" && <BranchesTab />}
        {tab === "Years" && <YearsTab />}
        {tab === "Subjects" && <SubjectsTab />}
      </div>
    </div>
  );
}

function BranchesTab() {
  const { branches, addBranch, updateBranch, removeBranch } = useDirectory();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", code: "" });

  const isEditing = editingId !== null;

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", code: "" });
    setError("");
    setOpen(true);
  }

  function openEdit(b) {
    setEditingId(b.id);
    setForm({ name: b.name || "", code: b.code || "" });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Branch name is required.");
      return;
    }
    const payload = { name, code: form.code.trim().toUpperCase() };
    if (isEditing) updateBranch(editingId, payload);
    else addBranch(payload);
    closeModal();
  }

  function handleRemove(b) {
    if (window.confirm(`Remove "${b.name}"? Its years and subjects will be removed too. This can't be undone.`)) {
      removeBranch(b.id);
    }
  }

  return (
    <>
      <div className={formStyles.toolbarRow}>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Branch</button>
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Branch" },
          { key: "code", label: "Code", render: (r) => r.code || "—" },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <div className={formStyles.rowActions}>
                <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => openEdit(r)}>Edit</button>
                <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => handleRemove(r)}>Remove</button>
              </div>
            ),
          },
        ]}
        rows={branches}
        emptyLabel="No branches yet."
      />

      <Modal open={open} onClose={closeModal} title={isEditing ? "Edit Branch" : "Add Branch"}>
        <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="br-name">Branch name</label>
            <input id="br-name" className={formStyles.input} placeholder="e.g. B.Tech – Aerospace Engineering" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="br-code">Short code</label>
            <input id="br-code" className={formStyles.input} placeholder="e.g. AE" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </div>
          {error && <p className={formStyles.error}>{error}</p>}
          <div className={formStyles.formActions}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? "Save changes" : "Add Branch"}</button>
            <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function YearsTab() {
  const { branches, classes, addClass, updateClass, removeClass } = useDirectory();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ branchId: branches[0]?.id || "", name: "" });

  const isEditing = editingId !== null;

  function openAdd() {
    setEditingId(null);
    setForm({ branchId: branches[0]?.id || "", name: "" });
    setError("");
    setOpen(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm({ branchId: c.branchId, name: c.name || "" });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Year/class name is required.");
      return;
    }
    if (!form.branchId) {
      setError("Select a branch.");
      return;
    }
    const payload = { branchId: form.branchId, name };
    if (isEditing) updateClass(editingId, payload);
    else addClass(payload);
    closeModal();
  }

  function handleRemove(c) {
    if (window.confirm(`Remove "${c.name}"? Its subjects will be removed too. This can't be undone.`)) {
      removeClass(c.id);
    }
  }

  const filtered = useMemo(
    () => classes.filter((c) => branchFilter === "all" || c.branchId === branchFilter),
    [classes, branchFilter]
  );

  return (
    <>
      <div className={formStyles.toolbarRow}>
        <select className={styles.select} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="all">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Year</button>
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Year / Class" },
          { key: "branch", label: "Branch", render: (r) => branches.find((b) => b.id === r.branchId)?.name || "—" },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <div className={formStyles.rowActions}>
                <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => openEdit(r)}>Edit</button>
                <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => handleRemove(r)}>Remove</button>
              </div>
            ),
          },
        ]}
        rows={filtered}
        emptyLabel="No years/classes match this filter."
      />

      <Modal open={open} onClose={closeModal} title={isEditing ? "Edit Year" : "Add Year"}>
        <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="yr-branch">Branch</label>
            <select id="yr-branch" className={formStyles.select} value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="yr-name">Year / class name</label>
            <input id="yr-name" className={formStyles.input} placeholder="e.g. CSE - Year 5" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          {error && <p className={formStyles.error}>{error}</p>}
          <div className={formStyles.formActions}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? "Save changes" : "Add Year"}</button>
            <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function SubjectsTab() {
  const { branches, classes, subjects, addSubject, updateSubject, removeSubject } = useDirectory();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ classId: classes[0]?.id || "", name: "", credits: 3 });

  const isEditing = editingId !== null;

  function branchOfClass(classId) {
    return classes.find((c) => c.id === classId)?.branchId;
  }

  function openAdd() {
    setEditingId(null);
    setForm({ classId: classes[0]?.id || "", name: "", credits: 3 });
    setError("");
    setOpen(true);
  }

  function openEdit(s) {
    setEditingId(s.id);
    setForm({ classId: s.classId, name: s.name || "", credits: s.credits || 3 });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Subject name is required.");
      return;
    }
    if (!form.classId) {
      setError("Select a class.");
      return;
    }
    const payload = { classId: form.classId, name, credits: Number(form.credits) || 3 };
    if (isEditing) updateSubject(editingId, payload);
    else addSubject(payload);
    closeModal();
  }

  function handleRemove(s) {
    if (window.confirm(`Remove "${s.name}"? This can't be undone.`)) {
      removeSubject(s.id);
    }
  }

  const classOptions = useMemo(
    () => (branchFilter === "all" ? classes : classes.filter((c) => c.branchId === branchFilter)),
    [classes, branchFilter]
  );

  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const matchesBranch = branchFilter === "all" || branchOfClass(s.classId) === branchFilter;
      const matchesClass = classFilter === "all" || s.classId === classFilter;
      return matchesBranch && matchesClass;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, classes, branchFilter, classFilter]);

  return (
    <>
      <div className={formStyles.toolbarRow}>
        <select className={styles.select} value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setClassFilter("all"); }}>
          <option value="all">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={styles.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="all">All years</option>
          {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Subject</button>
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Subject" },
          { key: "class", label: "Year / Class", render: (r) => classes.find((c) => c.id === r.classId)?.name || "—" },
          { key: "credits", label: "Credits" },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <div className={formStyles.rowActions}>
                <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => openEdit(r)}>Edit</button>
                <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => handleRemove(r)}>Remove</button>
              </div>
            ),
          },
        ]}
        rows={filtered}
        emptyLabel="No subjects match these filters."
      />

      <Modal open={open} onClose={closeModal} title={isEditing ? "Edit Subject" : "Add Subject"}>
        <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="sb-class">Year / Class</label>
            <select id="sb-class" className={formStyles.select} value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="sb-name">Subject name</label>
            <input id="sb-name" className={formStyles.input} placeholder="e.g. Robotics" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="sb-credits">Credits</label>
            <input id="sb-credits" type="number" min="1" max="6" className={formStyles.input} value={form.credits} onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))} />
          </div>
          {error && <p className={formStyles.error}>{error}</p>}
          <div className={formStyles.formActions}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? "Save changes" : "Add Subject"}</button>
            <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}