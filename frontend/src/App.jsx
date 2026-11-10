import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import CyberSpinner from "./components/CyberSpinner";

function SettingsRedirect() {
  const { user } = useAuth();
  if (user?.role === "ADMIN" || user?.role === "CSA_OFFICER") {
    return <Navigate to="/admin?tab=settings" replace />;
  }
  return <Navigate to="/dashboard?tab=settings" replace />;
}

// Code-split all routes so the initial bundle downloads instantly (~80kB instead of 1.5MB)
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const Tutors = lazy(() => import("./pages/Tutors"));
const TutorOnboarding = lazy(() => import("./pages/TutorOnboarding"));
const CourseStudio = lazy(() => import("./pages/CourseStudio"));
const IncidentReport = lazy(() => import("./pages/IncidentReport"));
const IncidentStatus = lazy(() => import("./pages/IncidentStatus"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CsaPortal = lazy(() => import("./pages/CsaPortal"));
const PhishingSimulator = lazy(() => import("./pages/PhishingSimulator"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const CyberChat = lazy(() => import("./pages/CyberChat"));
const ExtensionsStorePage = lazy(() => import("./pages/ExtensionsStorePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <Suspense fallback={<CyberSpinner fullScreen label="Loading CyberGuard..." />}>
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
          <Route
            path="course-studio"
            element={
              <ProtectedRoute roles={["ADMIN", "TUTOR"]}>
                <CourseStudio />
              </ProtectedRoute>
            }
          />
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
    </Suspense>
  );
}
