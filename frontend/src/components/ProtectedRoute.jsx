import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CyberSpinner from "./CyberSpinner";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <CyberSpinner fullScreen label="Verifying CyberGuard Credentials..." />;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location, intercepted: true }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
