import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useDirectory } from "./DirectoryContext.jsx";

const AuthContext = createContext(null);

// Active session (who's currently signed in) — cleared when the tab closes,
// same as any normal login session.
const SESSION_KEY = "bp_auth_user";

// Created accounts — { [emailLowercase]: { password, profile } }. Stored in
// localStorage (not sessionStorage) so an account created via Signup is
// still there to log into after closing the browser, reopening it, or on a
// different tab. This is the only place credentials are checked against —
// there is no seeded/demo login path anymore.
const ACCOUNTS_KEY = "bp_accounts_v1";

function readSessionUser() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readAccounts() {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const directory = useDirectory();
  const [user, setUser] = useState(readSessionUser);
  const [accounts, setAccounts] = useState(readAccounts);

  const persistAccounts = useCallback((next) => {
    setAccounts(next);
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
  }, []);

  // Creates a brand-new account from the signup form. Also enrolls the
  // person into the Directory store (the single data source for the whole
  // app — see DirectoryContext.jsx) so they immediately show up on the teacher's
  // Students page, attendance grid, marks entry, and certificate picker.
  // Using that same directory record as the account's profile keeps the
  // two in sync by construction rather than by id-matching later. Does NOT
  // log the person in — they're sent back to the login page to
  // authenticate with the credentials they just set, confirming the save
  // round-trips.
  const signup = useCallback(
    (payload) => {
      const cleanEmail = (payload.email || "").trim().toLowerCase();

      if (!cleanEmail || !payload.password) {
        return { ok: false, error: "Email and password are required." };
      }
      if (accounts[cleanEmail]) {
        return { ok: false, error: "An account with that email already exists. Sign in instead." };
      }

      const { password, confirmPassword, role, ...details } = payload;

      const directoryRecord =
        role === "teacher"
          ? directory.addTeacher({ ...details, email: cleanEmail })
          : role === "student"
          ? directory.addStudent({ ...details, email: cleanEmail })
          : { id: `adm-${Date.now()}`, name: details.name, email: cleanEmail };

      const fullProfile = { ...directoryRecord, role };

      persistAccounts({
        ...accounts,
        [cleanEmail]: { password, profile: fullProfile },
      });

      return { ok: true, email: cleanEmail };
    },
    [accounts, persistAccounts, directory]
  );

  // Authenticates strictly against accounts created via signup — there is
  // no fallback to any seeded/demo teacher or student here.
  const login = useCallback(
    ({ email, password }) => {
      const cleanEmail = (email || "").trim().toLowerCase();

      if (!cleanEmail || !password) {
        return { ok: false, error: "Enter your email and password to continue." };
      }

      const record = accounts[cleanEmail];
      if (!record) {
        return { ok: false, error: "No account found for that email. Create one on the signup page first." };
      }
      if (record.password !== password) {
        return { ok: false, error: "That password doesn't match this account." };
      }

      setUser(record.profile);
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(record.profile));
      return { ok: true, user: record.profile };
    },
    [accounts]
  );

  const logout = useCallback(() => {
    setUser(null);
    window.sessionStorage.removeItem(SESSION_KEY);
  }, []);

  // Lets a signed-in user patch their own profile (used for parent/guardian
  // details on the student Profile page). Updates the live session, the
  // saved account record, and — for students — the shared roster entry
  // teachers see, so the change shows up everywhere and is still there
  // next time they log in.
  const updateProfile = useCallback(
    (patch) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          ...patch,
          parent: { ...(prev.parent || {}), ...(patch.parent || {}) },
        };
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));

        if (next.role === "student") {
          directory.updateStudent(next.id, patch);
        } else if (next.role === "teacher") {
          directory.updateTeacher(next.id, patch);
        }

        const email = (next.email || "").trim().toLowerCase();
        if (email && accounts[email]) {
          persistAccounts({
            ...accounts,
            [email]: { ...accounts[email], profile: next },
          });
        }
        return next;
      });
    },
    [accounts, persistAccounts, directory]
  );

  const emailTaken = useCallback(
    (email) => Boolean(accounts[(email || "").trim().toLowerCase()]),
    [accounts]
  );

  // Issues login credentials for a person who already exists in the
  // Directory (e.g. a student or teacher an admin just added via the Admin
  // pages), rather than creating a new roster record the way signup()
  // does. Used to hand someone a temporary password after admin adds them.
  const issueCredentials = useCallback(
    ({ role, profile, password }) => {
      const cleanEmail = (profile?.email || "").trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { ok: false, error: "Email and password are required." };
      }
      if (accounts[cleanEmail]) {
        return { ok: false, error: "An account with that email already exists." };
      }

      const fullProfile = { ...profile, email: cleanEmail, role };
      persistAccounts({
        ...accounts,
        [cleanEmail]: { password, profile: fullProfile },
      });
      return { ok: true, email: cleanEmail };
    },
    [accounts, persistAccounts]
  );

  const value = useMemo(
    () => ({ user, login, signup, logout, updateProfile, emailTaken, issueCredentials }),
    [user, login, signup, logout, updateProfile, emailTaken, issueCredentials]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}