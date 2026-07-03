import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    const fallback = user.role === "teacher" ? "/teacher" : user.role === "admin" ? "/admin" : "/student";
    return <Navigate to={fallback} replace />;
  }

  return children;
}