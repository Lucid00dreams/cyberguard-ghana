import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function SettingsRedirect() {
  const { user } = useAuth();
  if (user?.role === "ADMIN" || user?.role === "CSA_OFFICER") {
    return <Navigate to="/admin?tab=settings" replace />;
  }
  return <Navigate to="/dashboard?tab=settings" replace />;
}

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import QuizPage from "./pages/QuizPage";
import Tutors from "./pages/Tutors";
import TutorOnboarding from "./pages/TutorOnboarding";
import CourseStudio from "./pages/CourseStudio";
import IncidentReport from "./pages/IncidentReport";
import IncidentStatus from "./pages/IncidentStatus";
import Dashboard from "./pages/Dashboard";
import CsaPortal from "./pages/CsaPortal";
import PhishingSimulator from "./pages/PhishingSimulator";
import VerifyCertificate from "./pages/VerifyCertificate";
import CyberChat from "./pages/CyberChat";
import ExtensionsStorePage from "./pages/ExtensionsStorePage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="courses/:slug/quiz/:quizId" element={<QuizPage />} />
        <Route path="phishing-simulator" element={<PhishingSimulator />} />
        <Route path="tutors" element={<Tutors />} />
        <Route path="tutor-onboarding" element={<TutorOnboarding />} />
        <Route path="course-studio" element={
          <ProtectedRoute roles={["ADMIN", "TUTOR"]}>
            <CourseStudio />
          </ProtectedRoute>
        } />
        <Route path="report" element={<IncidentReport />} />
        <Route path="report/status" element={<IncidentStatus />} />
        <Route path="verify-certificate" element={<VerifyCertificate />} />
        <Route path="verify-certificate/:certRef" element={<VerifyCertificate />} />

        <Route
          path="cyberchat"
          element={
            <ProtectedRoute>
              <CyberChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["ADMIN", "CSA_OFFICER"]}>
              <CsaPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <SettingsRedirect />
            </ProtectedRoute>
          }
        />

        <Route
          path="extensions"
          element={
            <ProtectedRoute>
              <ExtensionsStorePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

