import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import gsap from "gsap";

import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminStudentsPage from "./pages/AdminStudentsPage.jsx";
import AdminTeachersPage from "./pages/AdminTeachersPage.jsx";
import AdminClassesPage from "./pages/AdminClassesPage.jsx";
import AdminStudentAttendancePage from "./pages/AdminStudentAttendancePage.jsx";
import AdminExamsPage from "./pages/AdminExamsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import MarksPage from "./pages/MarksPage.jsx";
import CertificatesPage from "./pages/CertificatesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PerformancePage from "./pages/PerformancePage.jsx";
import StructurePage from "./pages/StructurePage.jsx";
import MyClasses from "./pages/MyClasses.jsx";

function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, [location.pathname]);

  return (
    <div ref={ref} key={location.pathname}>
      {children}
    </div>
  );
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === "teacher" ? "/teacher" : user.role === "admin" ? "/admin" : "/student") : "/login"} replace />} />
      <Route
        path="/admin"
        element={<ProtectedRoute role="admin"><AppShell><AdminDashboard /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/admin/students"
        element={<ProtectedRoute role="admin"><AppShell><AdminStudentsPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/admin/teachers"
        element={<ProtectedRoute role="admin"><AppShell><AdminTeachersPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/admin/classes"
        element={<ProtectedRoute role="admin"><AppShell><AdminClassesPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/admin/attendance"
        element={<ProtectedRoute role="admin"><AppShell><AdminStudentAttendancePage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/admin/exams"
        element={<ProtectedRoute role="admin"><AppShell><AdminExamsPage /></AppShell></ProtectedRoute>}
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <TeacherDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/profile"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <MyClasses/>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <StudentsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <AttendancePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/marks"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <MarksPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/certificates"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <CertificatesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/structure"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <StructurePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <AppShell>
              <StudentDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute role="student">
            <AppShell>
              <AttendancePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/performance"
        element={
          <ProtectedRoute role="student">
            <AppShell>
              <PerformancePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/certificates"
        element={
          <ProtectedRoute role="student">
            <AppShell>
              <CertificatesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/structure"
        element={
          <ProtectedRoute role="student">
            <AppShell>
              <StructurePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}