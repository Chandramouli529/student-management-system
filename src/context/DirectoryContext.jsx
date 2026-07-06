import { createContext, useContext, useState, useCallback, useMemo } from "react";

// ---------------------------------------------------------------------
// Single source of truth for ALL app data — branches, classes, subjects,
// teachers, students, attendance, marks, certificates, notifications, and
// the class schedule. Everything lives in localStorage under one key.
// There is no separate static mock-data file: the first time the app runs
// (localStorage empty) it seeds itself with a starter catalog so the UI
// isn't blank, and from then on every read/write goes through here.
// ---------------------------------------------------------------------

const DirectoryContext = createContext(null);
const STORAGE_KEY = "bp_data_v1";

function seedBranches() {
  return [
    { id: "br-1", name: "B.Tech – Computer Science & Engineering", code: "CSE" },
    { id: "br-2", name: "B.Tech – Electrical & Electronics Engineering", code: "EEE" },
    { id: "br-3", name: "B.Tech – Information Technology", code: "IT" },
    { id: "br-4", name: "B.Tech – Electronics & Communication Engineering", code: "ECE" },
    { id: "br-5", name: "B.Tech – Mechanical Engineering", code: "ME" },
    { id: "br-6", name: "B.Tech – Civil Engineering", code: "CE" },
  ];
}

function seedClasses() {
  return [
    { id: "cl-7", branchId: "br-1", name: "CSE - Year 1" },
    { id: "cl-1", branchId: "br-1", name: "CSE - Year 2" },
    { id: "cl-8", branchId: "br-1", name: "CSE - Year 3" },
    { id: "cl-9", branchId: "br-1", name: "CSE - Year 4" },
    { id: "cl-2", branchId: "br-2", name: "EEE - Year 1" },
    { id: "cl-22", branchId: "br-2", name: "EEE - Year 2" },
    { id: "cl-23", branchId: "br-2", name: "EEE - Year 3" },
    { id: "cl-24", branchId: "br-2", name: "EEE - Year 4" },
    { id: "cl-10", branchId: "br-3", name: "IT - Year 1" },
    { id: "cl-3", branchId: "br-3", name: "IT - Year 2" },
    { id: "cl-11", branchId: "br-3", name: "IT - Year 3" },
    { id: "cl-12", branchId: "br-3", name: "IT - Year 4" },
    { id: "cl-13", branchId: "br-4", name: "ECE - Year 1" },
    { id: "cl-4", branchId: "br-4", name: "ECE - Year 2" },
    { id: "cl-14", branchId: "br-4", name: "ECE - Year 3" },
    { id: "cl-15", branchId: "br-4", name: "ECE - Year 4" },
    { id: "cl-16", branchId: "br-5", name: "Mech - Year 1" },
    { id: "cl-5", branchId: "br-5", name: "Mech - Year 2" },
    { id: "cl-17", branchId: "br-5", name: "Mech - Year 3" },
    { id: "cl-18", branchId: "br-5", name: "Mech - Year 4" },
    { id: "cl-19", branchId: "br-6", name: "Civil - Year 1" },
    { id: "cl-6", branchId: "br-6", name: "Civil - Year 2" },
    { id: "cl-20", branchId: "br-6", name: "Civil - Year 3" },
    { id: "cl-21", branchId: "br-6", name: "Civil - Year 4" },
  ];
}

function seedTeachers() {
  return [];
}

function seedSubjects() {
  return [
    // ---- CSE: cl-7 (Y1), cl-1 (Y2), cl-8 (Y3), cl-9 (Y4) ----
    { id: "sub-26", name: "Programming in C", classId: "cl-7", teacherId: null, credits: 4 },
    { id: "sub-27", name: "Engineering Mathematics I", classId: "cl-7", teacherId: null, credits: 3 },
    { id: "sub-28", name: "Engineering Physics", classId: "cl-7", teacherId: null, credits: 3 },
    { id: "sub-1", name: "Data Structures", classId: "cl-1", teacherId: null, credits: 4 },
    { id: "sub-2", name: "Operating Systems", classId: "cl-1", teacherId: null, credits: 4 },
    { id: "sub-3", name: "Discrete Mathematics", classId: "cl-1", teacherId: null, credits: 3 },
    { id: "sub-14", name: "Computer Networks", classId: "cl-1", teacherId: null, credits: 3 },
    { id: "sub-15", name: "Object Oriented Programming", classId: "cl-1", teacherId: null, credits: 4 },
    { id: "sub-29", name: "Design and Analysis of Algorithms", classId: "cl-8", teacherId: null, credits: 4 },
    { id: "sub-30", name: "Database Management Systems", classId: "cl-8", teacherId: null, credits: 4 },
    { id: "sub-31", name: "Compiler Design", classId: "cl-8", teacherId: null, credits: 3 },
    { id: "sub-32", name: "Machine Learning", classId: "cl-9", teacherId: null, credits: 4 },
    { id: "sub-33", name: "Artificial Intelligence", classId: "cl-9", teacherId: null, credits: 3 },
    { id: "sub-34", name: "Big Data Analytics", classId: "cl-9", teacherId: null, credits: 3 },

    // ---- EEE: cl-2 (Y1), cl-22 (Y2), cl-23 (Y3), cl-24 (Y4) ----
    { id: "sub-35", name: "Basic Electrical Engineering", classId: "cl-2", teacherId: null, credits: 4 },
    { id: "sub-36", name: "Engineering Mathematics I", classId: "cl-2", teacherId: null, credits: 3 },
    { id: "sub-37", name: "Engineering Physics", classId: "cl-2", teacherId: null, credits: 3 },
    { id: "sub-4", name: "Electrical Circuit Theory", classId: "cl-22", teacherId: null, credits: 4 },
    { id: "sub-5", name: "Electrical Machines", classId: "cl-22", teacherId: null, credits: 3 },
    { id: "sub-16", name: "Power Systems", classId: "cl-22", teacherId: null, credits: 3 },
    { id: "sub-17", name: "Power Electronics", classId: "cl-22", teacherId: null, credits: 3 },
    { id: "sub-38", name: "Microprocessors and Microcontrollers", classId: "cl-23", teacherId: null, credits: 4 },
    { id: "sub-39", name: "Control Systems Engineering", classId: "cl-23", teacherId: null, credits: 3 },
    { id: "sub-40", name: "Electrical Measurements", classId: "cl-23", teacherId: null, credits: 3 },
    { id: "sub-41", name: "Renewable Energy Systems", classId: "cl-24", teacherId: null, credits: 3 },
    { id: "sub-42", name: "High Voltage Engineering", classId: "cl-24", teacherId: null, credits: 3 },
    { id: "sub-43", name: "Electric Drives", classId: "cl-24", teacherId: null, credits: 3 },

    // ---- IT: cl-10 (Y1), cl-3 (Y2), cl-11 (Y3), cl-12 (Y4) ----
    { id: "sub-44", name: "Programming Fundamentals", classId: "cl-10", teacherId: null, credits: 4 },
    { id: "sub-45", name: "Engineering Mathematics I", classId: "cl-10", teacherId: null, credits: 3 },
    { id: "sub-46", name: "Digital Logic Design", classId: "cl-10", teacherId: null, credits: 3 },
    { id: "sub-6", name: "Database Management Systems", classId: "cl-3", teacherId: null, credits: 4 },
    { id: "sub-7", name: "Web Technologies", classId: "cl-3", teacherId: null, credits: 3 },
    { id: "sub-18", name: "Software Engineering", classId: "cl-3", teacherId: null, credits: 3 },
    { id: "sub-19", name: "Cloud Computing", classId: "cl-3", teacherId: null, credits: 3 },
    { id: "sub-47", name: "Computer Networks", classId: "cl-11", teacherId: null, credits: 3 },
    { id: "sub-48", name: "Operating Systems", classId: "cl-11", teacherId: null, credits: 4 },
    { id: "sub-49", name: "Data Mining", classId: "cl-11", teacherId: null, credits: 3 },
    { id: "sub-50", name: "Artificial Intelligence", classId: "cl-12", teacherId: null, credits: 3 },
    { id: "sub-51", name: "Mobile Application Development", classId: "cl-12", teacherId: null, credits: 3 },
    { id: "sub-52", name: "Information Security", classId: "cl-12", teacherId: null, credits: 3 },

    // ---- ECE: cl-13 (Y1), cl-4 (Y2), cl-14 (Y3), cl-15 (Y4) ----
    { id: "sub-53", name: "Basic Electronics", classId: "cl-13", teacherId: null, credits: 4 },
    { id: "sub-54", name: "Engineering Mathematics I", classId: "cl-13", teacherId: null, credits: 3 },
    { id: "sub-55", name: "Engineering Physics", classId: "cl-13", teacherId: null, credits: 3 },
    { id: "sub-8", name: "Digital Electronics", classId: "cl-4", teacherId: null, credits: 4 },
    { id: "sub-9", name: "Signals & Systems", classId: "cl-4", teacherId: null, credits: 3 },
    { id: "sub-20", name: "Microprocessors & Microcontrollers", classId: "cl-4", teacherId: null, credits: 4 },
    { id: "sub-21", name: "Control Systems", classId: "cl-4", teacherId: null, credits: 3 },
    { id: "sub-56", name: "Analog Communication", classId: "cl-14", teacherId: null, credits: 3 },
    { id: "sub-57", name: "VLSI Design", classId: "cl-14", teacherId: null, credits: 4 },
    { id: "sub-58", name: "Embedded Systems", classId: "cl-14", teacherId: null, credits: 3 },
    { id: "sub-59", name: "Digital Communication", classId: "cl-15", teacherId: null, credits: 3 },
    { id: "sub-60", name: "Wireless Networks", classId: "cl-15", teacherId: null, credits: 3 },
    { id: "sub-61", name: "Satellite Communication", classId: "cl-15", teacherId: null, credits: 3 },

    // ---- Mechanical: cl-16 (Y1), cl-5 (Y2), cl-17 (Y3), cl-18 (Y4) ----
    { id: "sub-62", name: "Engineering Mechanics I", classId: "cl-16", teacherId: null, credits: 4 },
    { id: "sub-63", name: "Engineering Mathematics I", classId: "cl-16", teacherId: null, credits: 3 },
    { id: "sub-64", name: "Engineering Graphics", classId: "cl-16", teacherId: null, credits: 3 },
    { id: "sub-10", name: "Thermodynamics", classId: "cl-5", teacherId: null, credits: 4 },
    { id: "sub-11", name: "Engineering Mechanics", classId: "cl-5", teacherId: null, credits: 3 },
    { id: "sub-22", name: "Fluid Mechanics", classId: "cl-5", teacherId: null, credits: 3 },
    { id: "sub-23", name: "Manufacturing Processes", classId: "cl-5", teacherId: null, credits: 3 },
    { id: "sub-65", name: "Heat Transfer", classId: "cl-17", teacherId: null, credits: 4 },
    { id: "sub-66", name: "Machine Design", classId: "cl-17", teacherId: null, credits: 4 },
    { id: "sub-67", name: "Dynamics of Machinery", classId: "cl-17", teacherId: null, credits: 3 },
    { id: "sub-68", name: "CAD/CAM", classId: "cl-18", teacherId: null, credits: 3 },
    { id: "sub-69", name: "Automobile Engineering", classId: "cl-18", teacherId: null, credits: 3 },
    { id: "sub-70", name: "Industrial Engineering", classId: "cl-18", teacherId: null, credits: 3 },

    // ---- Civil: cl-19 (Y1), cl-6 (Y2), cl-20 (Y3), cl-21 (Y4) ----
    { id: "sub-71", name: "Engineering Mechanics", classId: "cl-19", teacherId: null, credits: 4 },
    { id: "sub-72", name: "Engineering Mathematics I", classId: "cl-19", teacherId: null, credits: 3 },
    { id: "sub-73", name: "Building Materials", classId: "cl-19", teacherId: null, credits: 3 },
    { id: "sub-12", name: "Structural Analysis", classId: "cl-6", teacherId: null, credits: 4 },
    { id: "sub-13", name: "Surveying", classId: "cl-6", teacherId: null, credits: 3 },
    { id: "sub-24", name: "Geotechnical Engineering", classId: "cl-6", teacherId: null, credits: 3 },
    { id: "sub-25", name: "Environmental Engineering", classId: "cl-6", teacherId: null, credits: 3 },
    { id: "sub-74", name: "Concrete Technology", classId: "cl-20", teacherId: null, credits: 4 },
    { id: "sub-75", name: "Transportation Engineering", classId: "cl-20", teacherId: null, credits: 3 },
    { id: "sub-76", name: "Water Resources Engineering", classId: "cl-20", teacherId: null, credits: 3 },
    { id: "sub-77", name: "Estimation and Costing", classId: "cl-21", teacherId: null, credits: 3 },
    { id: "sub-78", name: "Earthquake Engineering", classId: "cl-21", teacherId: null, credits: 3 },
    { id: "sub-79", name: "Construction Management", classId: "cl-21", teacherId: null, credits: 3 },
  ];
}

function seedStudents() {
  return [];
}

const STATUS_CYCLE = ["Present", "Present", "Present", "Late", "Present", "Absent", "Present", "Excused", "Present", "Present"];

function seedAttendance(students, subjects) {
  const records = [];
  const today = new Date();
  students.forEach((student) => {
    const subjectIds = subjects.filter((s) => s.classId === student.classId).map((s) => s.id);
    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const day = date.getDay();
      if (day === 0 || day === 6) continue;
      subjectIds.forEach((subjectId, idx) => {
        const seed = (student.id.charCodeAt(2) + d + idx) % STATUS_CYCLE.length;
        records.push({
          id: `att-${student.id}-${subjectId}-${date.toISOString().slice(0, 10)}`,
          studentId: student.id,
          subjectId,
          date: date.toISOString().slice(0, 10),
          status: STATUS_CYCLE[seed],
        });
      });
    }
  });
  return records;
}

function seededScore(seed, base, spread) {
  const x = Math.sin(seed) * 10000;
  const frac = x - Math.floor(x);
  return Math.round(base + frac * spread);
}

function seedMarks(students, subjects) {
  const assessments = ["Unit Test 1", "Unit Test 2", "Mid Term", "Final Exam"];
  const records = [];
  students.forEach((student, sIdx) => {
    const subjectIds = subjects.filter((s) => s.classId === student.classId).map((s) => s.id);
    subjectIds.forEach((subjectId, subIdx) => {
      assessments.forEach((assessment, aIdx) => {
        const seed = sIdx * 17 + subIdx * 7 + aIdx * 3 + 1;
        const score = seededScore(seed, 62, 35);
        records.push({
          id: `mk-${student.id}-${subjectId}-${aIdx}`,
          studentId: student.id,
          subjectId,
          assessment,
          score: Math.min(100, Math.max(38, score)),
          maxScore: 100,
        });
      });
    });
  });
  return records;
}

function seedCertificates() {
  return [];
}

function seedNotifications() {
  return {
    teacher: [],
    student: [],
    admin: [],
  };
}

function seedAll() {
  const students = seedStudents();
  const subjects = seedSubjects();
  return {
    branches: seedBranches(),
    classes: seedClasses(),
    teachers: seedTeachers(),
    subjects,
    students,
    attendanceRecords: seedAttendance(students, subjects),
    marksRecords: seedMarks(students, subjects),
    certificateTypes: ["Bonafide", "Merit", "Completion", "Transfer"],
    certificates: seedCertificates(),
    notifications: seedNotifications(),
    schedule: [],
    exams: [],
    announcements: [],
  };
}

// Default value for any key that might be missing from an older saved
// snapshot in localStorage (e.g. `exams` didn't exist before this was
// added) — merged underneath whatever's actually stored, so existing
// data is never lost and new fields never come back as `undefined`.
function emptyDefaults() {
  return {
    branches: [],
    classes: [],
    teachers: [],
    subjects: [],
    students: [],
    attendanceRecords: [],
    marksRecords: [],
    certificateTypes: ["Bonafide", "Merit", "Completion", "Transfer"],
    certificates: [],
    notifications: { teacher: [], student: [], admin: [] },
    schedule: [],
    exams: [],
    announcements: [],
  };
}

function readData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyDefaults(), ...JSON.parse(raw) };
  } catch {
    // fall through to reseed
  }
  const seeded = seedAll();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // localStorage unavailable — app still works for this tab's lifetime
  }
  return seeded;
}

export function scoreToGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function DirectoryProvider({ children }) {
  const [data, setData] = useState(readData);

  const persist = useCallback((next) => {
    setData(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota/availability errors — state still updates for this tab
    }
  }, []);

  const addStudent = useCallback(
    (details) => {
      const record = {
        id: details.id || `stu-${Date.now()}`,
        name: details.name || "New Student",
        rollNo: details.rollNo || `NEW-${Math.floor(Math.random() * 900 + 100)}`,
        classId: details.classId,
        branchId: details.branchId,
        email: details.email || "",
        phone: details.phone || "",
        dob: details.dob || "",
        address: details.address || "",
        parent: details.parent || null,
      };
      persist({ ...data, students: [...data.students, record] });
      return record;
    },
    [data, persist]
  );

  const addTeacher = useCallback(
    (details) => {
      const record = {
        id: details.id || `tch-${Date.now()}`,
        name: details.name || "New Teacher",
        email: details.email || "",
        empId: details.empId || "",
        subjectIds: details.subjectIds || [],
        department: details.department,
        branchId: details.branchId,
      };
      persist({ ...data, teachers: [...data.teachers, record] });
      return record;
    },
    [data, persist]
  );

  const updateStudent = useCallback(
    (id, patch) => {
      const idx = data.students.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const current = data.students[idx];
      const next = { ...current, ...patch, parent: { ...(current.parent || {}), ...(patch.parent || {}) } };
      const nextStudents = [...data.students];
      nextStudents[idx] = next;
      persist({ ...data, students: nextStudents });
      return next;
    },
    [data, persist]
  );

  const updateTeacher = useCallback(
    (id, patch) => {
      const idx = data.teachers.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      const next = { ...data.teachers[idx], ...patch };
      const nextTeachers = [...data.teachers];
      nextTeachers[idx] = next;
      persist({ ...data, teachers: nextTeachers });
      return next;
    },
    [data, persist]
  );

  const removeStudent = useCallback((id) => persist({ ...data, students: data.students.filter((s) => s.id !== id) }), [data, persist]);
  const removeTeacher = useCallback((id) => persist({ ...data, teachers: data.teachers.filter((t) => t.id !== id) }), [data, persist]);

  const upsertAttendance = useCallback(
    (studentId, subjectId, date, status) => {
      const idx = data.attendanceRecords.findIndex((r) => r.studentId === studentId && r.subjectId === subjectId && r.date === date);
      const nextRecords = [...data.attendanceRecords];
      if (idx !== -1) nextRecords[idx] = { ...nextRecords[idx], status };
      else nextRecords.push({ id: `att-${studentId}-${subjectId}-${date}`, studentId, subjectId, date, status });
      persist({ ...data, attendanceRecords: nextRecords });
    },
    [data, persist]
  );

  const removeAttendance = useCallback(
    (id) => persist({ ...data, attendanceRecords: data.attendanceRecords.filter((r) => r.id !== id) }),
    [data, persist]
  );

  const upsertMarks = useCallback(
    (studentId, subjectId, assessment, score) => {
      const idx = data.marksRecords.findIndex((r) => r.studentId === studentId && r.subjectId === subjectId && r.assessment === assessment);
      const nextRecords = [...data.marksRecords];
      if (idx !== -1) nextRecords[idx] = { ...nextRecords[idx], score };
      else nextRecords.push({ id: `mk-${studentId}-${subjectId}-${assessment}`.replace(/\s+/g, "-"), studentId, subjectId, assessment, score, maxScore: 100 });
      persist({ ...data, marksRecords: nextRecords });
    },
    [data, persist]
  );

  const removeMarks = useCallback(
    (id) => persist({ ...data, marksRecords: data.marksRecords.filter((r) => r.id !== id) }),
    [data, persist]
  );

  const addCertificate = useCallback(
    (details) => {
      const record = { id: `cert-${Date.now()}`, issuedOn: new Date().toISOString().slice(0, 10), ...details };
      persist({ ...data, certificates: [record, ...data.certificates] });
      return record;
    },
    [data, persist]
  );

  const updateCertificate = useCallback(
    (id, patch) => {
      const idx = data.certificates.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      const next = { ...data.certificates[idx], ...patch };
      const nextCerts = [...data.certificates];
      nextCerts[idx] = next;
      persist({ ...data, certificates: nextCerts });
      return next;
    },
    [data, persist]
  );

  const removeCertificate = useCallback(
    (id) => persist({ ...data, certificates: data.certificates.filter((c) => c.id !== id) }),
    [data, persist]
  );

  const assignSchedule = useCallback(
    (entry) => {
      const record = {
        id: entry.id || `sch-${Date.now()}`,
        classId: entry.classId,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        day: entry.day,
        date: entry.date || "",
        startTime: entry.startTime,
        endTime: entry.endTime,
      };
      persist({ ...data, schedule: [...(data.schedule || []), record] });
      return record;
    },
    [data, persist]
  );

  const updateSchedule = useCallback(
    (patch) => {
      const list = data.schedule || [];
      const idx = list.findIndex((s) => s.id === patch.id);
      if (idx === -1) return null;
      const next = { ...list[idx], ...patch };
      const nextSchedule = [...list];
      nextSchedule[idx] = next;
      persist({ ...data, schedule: nextSchedule });
      return next;
    },
    [data, persist]
  );

  const removeSchedule = useCallback((id) => persist({ ...data, schedule: (data.schedule || []).filter((s) => s.id !== id) }), [data, persist]);

  const addExam = useCallback(
    (details) => {
      const record = {
        id: details.id || `exam-${Date.now()}`,
        name: details.name,
        branchId: details.branchId,
        date: details.date,
        startTime: details.startTime,
        endTime: details.endTime,
      };
      persist({ ...data, exams: [...(data.exams || []), record] });
      return record;
    },
    [data, persist]
  );

  const updateExam = useCallback(
    (id, patch) => {
      const list = data.exams || [];
      const idx = list.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      const next = { ...list[idx], ...patch };
      const nextExams = [...list];
      nextExams[idx] = next;
      persist({ ...data, exams: nextExams });
      return next;
    },
    [data, persist]
  );

  const removeExam = useCallback((id) => persist({ ...data, exams: (data.exams || []).filter((e) => e.id !== id) }), [data, persist]);

  // ---- Announcements ----
  // branchId of null/"" means "everyone, every branch" — the same
  // convention used for the certificate/exam filters elsewhere.
  const addAnnouncement = useCallback(
    (details) => {
      const record = {
        id: details.id || `ann-${Date.now()}`,
        title: details.title,
        message: details.message || "",
        branchId: details.branchId || null,
        date: details.date || new Date().toISOString().slice(0, 10),
      };
      persist({ ...data, announcements: [record, ...(data.announcements || [])] });
      return record;
    },
    [data, persist]
  );

  const updateAnnouncement = useCallback(
    (id, patch) => {
      const list = data.announcements || [];
      const idx = list.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      const next = { ...list[idx], ...patch };
      const nextList = [...list];
      nextList[idx] = next;
      persist({ ...data, announcements: nextList });
      return next;
    },
    [data, persist]
  );

  const removeAnnouncement = useCallback(
    (id) => persist({ ...data, announcements: (data.announcements || []).filter((a) => a.id !== id) }),
    [data, persist]
  );

  // ---- Branches ----
  const addBranch = useCallback(
    (details) => {
      const record = {
        id: details.id || `br-${Date.now()}`,
        name: details.name,
        code: details.code || "",
      };
      persist({ ...data, branches: [...data.branches, record] });
      return record;
    },
    [data, persist]
  );

  const updateBranch = useCallback(
    (id, patch) => {
      const idx = data.branches.findIndex((b) => b.id === id);
      if (idx === -1) return null;
      const next = { ...data.branches[idx], ...patch };
      const nextBranches = [...data.branches];
      nextBranches[idx] = next;
      persist({ ...data, branches: nextBranches });
      return next;
    },
    [data, persist]
  );

  // Removing a branch cascades: its classes and subjects go too, since a
  // class with no branch and a subject with no class are both dead weight
  // that would otherwise linger in every dropdown across the app.
  const removeBranch = useCallback(
    (id) => {
      const classIdsInBranch = new Set(data.classes.filter((c) => c.branchId === id).map((c) => c.id));
      persist({
        ...data,
        branches: data.branches.filter((b) => b.id !== id),
        classes: data.classes.filter((c) => c.branchId !== id),
        subjects: data.subjects.filter((s) => !classIdsInBranch.has(s.classId)),
      });
    },
    [data, persist]
  );

  // ---- Classes (years) ----
  const addClass = useCallback(
    (details) => {
      const record = {
        id: details.id || `cl-${Date.now()}`,
        branchId: details.branchId,
        name: details.name,
      };
      persist({ ...data, classes: [...data.classes, record] });
      return record;
    },
    [data, persist]
  );

  const updateClass = useCallback(
    (id, patch) => {
      const idx = data.classes.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      const next = { ...data.classes[idx], ...patch };
      const nextClasses = [...data.classes];
      nextClasses[idx] = next;
      persist({ ...data, classes: nextClasses });
      return next;
    },
    [data, persist]
  );

  // Removing a class cascades to its subjects, same reasoning as removeBranch.
  const removeClass = useCallback(
    (id) => {
      persist({
        ...data,
        classes: data.classes.filter((c) => c.id !== id),
        subjects: data.subjects.filter((s) => s.classId !== id),
      });
    },
    [data, persist]
  );

  // ---- Subjects ----
  const addSubject = useCallback(
    (details) => {
      const record = {
        id: details.id || `sub-${Date.now()}`,
        name: details.name,
        classId: details.classId,
        teacherId: details.teacherId || null,
        credits: details.credits || 3,
      };
      persist({ ...data, subjects: [...data.subjects, record] });
      return record;
    },
    [data, persist]
  );

  const updateSubject = useCallback(
    (id, patch) => {
      const idx = data.subjects.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const next = { ...data.subjects[idx], ...patch };
      const nextSubjects = [...data.subjects];
      nextSubjects[idx] = next;
      persist({ ...data, subjects: nextSubjects });
      return next;
    },
    [data, persist]
  );

  const removeSubject = useCallback((id) => persist({ ...data, subjects: data.subjects.filter((s) => s.id !== id) }), [data, persist]);

  // ---- Derived read helpers, bound to current state ----
  const getSubjectsForClass = useCallback((classId) => data.subjects.filter((s) => s.classId === classId), [data.subjects]);
  const getStudentAttendancePct = useCallback(
    (studentId) => {
      const recs = data.attendanceRecords.filter((r) => r.studentId === studentId);
      if (recs.length === 0) return 0;
      const present = recs.filter((r) => r.status === "Present" || r.status === "Late").length;
      return Math.round((present / recs.length) * 100);
    },
    [data.attendanceRecords]
  );
  const getStudentAverage = useCallback(
    (studentId) => {
      const recs = data.marksRecords.filter((r) => r.studentId === studentId);
      if (recs.length === 0) return 0;
      const total = recs.reduce((sum, r) => sum + r.score, 0);
      return Math.round(total / recs.length);
    },
    [data.marksRecords]
  );
  const getTeacherById = useCallback((id) => data.teachers.find((t) => t.id === id), [data.teachers]);
  const getClassById = useCallback((id) => data.classes.find((c) => c.id === id), [data.classes]);
  const getBranchById = useCallback((id) => data.branches.find((b) => b.id === id), [data.branches]);
  const getSubjectById = useCallback((id) => data.subjects.find((s) => s.id === id), [data.subjects]);

  const value = useMemo(
    () => ({
      ...data,
      addStudent,
      addTeacher,
      updateStudent,
      updateTeacher,
      removeStudent,
      removeTeacher,
      upsertAttendance,
      removeAttendance,
      upsertMarks,
      removeMarks,
      addCertificate,
      updateCertificate,
      removeCertificate,
      assignSchedule,
      updateSchedule,
      removeSchedule,
      addExam,
      updateExam,
      removeExam,
      addAnnouncement,
      updateAnnouncement,
      removeAnnouncement,
      addBranch,
      updateBranch,
      removeBranch,
      addClass,
      updateClass,
      removeClass,
      addSubject,
      updateSubject,
      removeSubject,
      getSubjectsForClass,
      getStudentAttendancePct,
      getStudentAverage,
      getTeacherById,
      getClassById,
      getBranchById,
      getSubjectById,
    }),
    [
      data,
      addStudent,
      addTeacher,
      updateStudent,
      updateTeacher,
      removeStudent,
      removeTeacher,
      upsertAttendance,
      removeAttendance,
      upsertMarks,
      removeMarks,
      addCertificate,
      updateCertificate,
      removeCertificate,
      assignSchedule,
      updateSchedule,
      removeSchedule,
      addExam,
      updateExam,
      removeExam,
      addAnnouncement,
      updateAnnouncement,
      removeAnnouncement,
      addBranch,
      updateBranch,
      removeBranch,
      addClass,
      updateClass,
      removeClass,
      addSubject,
      updateSubject,
      removeSubject,
      getSubjectsForClass,
      getStudentAttendancePct,
      getStudentAverage,
      getTeacherById,
      getClassById,
      getBranchById,
      getSubjectById,
    ]
  );

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
}

export function useDirectory() {
  const ctx = useContext(DirectoryContext);
  if (!ctx) throw new Error("useDirectory must be used within a DirectoryProvider");
  return ctx;
}

// Back-compat alias: everything now lives in one store, so "combined roster"
// is just the store itself under the old field names some pages still use.
export function useCombinedRoster() {
  const dir = useDirectory();
  return {
    allStudents: dir.students,
    allTeachers: dir.teachers,
    allAttendance: dir.attendanceRecords,
    allMarks: dir.marksRecords,
  };
}

export function getAttendancePct(records, studentId) {
  const recs = records.filter((r) => r.studentId === studentId);
  if (recs.length === 0) return 0;
  const present = recs.filter((r) => r.status === "Present" || r.status === "Late").length;
  return Math.round((present / recs.length) * 100);
}

export function getAverageScore(records, studentId) {
  const recs = records.filter((r) => r.studentId === studentId);
  if (recs.length === 0) return 0;
  const total = recs.reduce((sum, r) => sum + r.score, 0);
  return Math.round(total / recs.length);
}