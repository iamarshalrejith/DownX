import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TeacherParentDashboard from "./pages/TeacherParentDashboard";
import TeacherDashboardHome from "./components/TeacherDashboardHome";
import ParentDashboardHome from "./components/ParentDashboardHome";
import StudentDashboard from "./pages/StudentDashboard";
import RegisterPage from "./pages/RegisterPage";
import StudentManagementPage from "./pages/StudentManagementPage";
import AllStudentsPage from "./pages/AllStudentsPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import StudentLoginPage from "./pages/StudentLoginPage";
import TaskListView from "./pages/TaskListView";
import CreateTaskPage from "./pages/CreateTaskPage";
import { useSelector } from "react-redux";

// Protected dashboard route wrapper
const DashboardRedirect = () => {
  const user = useSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "teacher") return <Navigate to="/dashboard/teacher" replace />;
  if (user.role === "parent") return <Navigate to="/dashboard/parent" replace />;
  if (user.role === "student") return <Navigate to="/student-dashboard" replace />;
  
  return <Navigate to="/login" replace />; // fallback
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectionPage />} />
      <Route path="/student-login" element={<StudentLoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard routes */}
      <Route path="/dashboard" element={<TeacherParentDashboard />}>
        {/* Redirect from /dashboard root */}
        <Route index element={<DashboardRedirect />} />
        <Route path="teacher" element={<TeacherDashboardHome />} />
        <Route path="parent" element={<ParentDashboardHome />} />
        <Route path="students" element={<StudentManagementPage />} />
        <Route path="all-students" element={<AllStudentsPage />} />
        <Route path="tasks" element={<TaskListView />} />
        <Route path="tasks/create" element={<CreateTaskPage />} />
      </Route>

      <Route path="/student-dashboard" element={<StudentDashboard />} />
    </Routes>
  );
};

export default App;
