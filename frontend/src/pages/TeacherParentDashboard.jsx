import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/teacher/DashboardLayout";

const TeacherParentDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [authorized, setAuthorized] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    
    // Check if user is teacher or parent
    if (user.role === "teacher" || user.role === "parent") {
      setAuthorized(true);

      // Only redirect once if at /dashboard root
      if (location.pathname === "/dashboard" && !hasRedirected.current) {
        hasRedirected.current = true;
        navigate(`/dashboard/${user.role}`, { replace: true });
      }
      return;
    }

    // Fallback: unknown role -> login
    navigate("/login", { replace: true });
  }, [user, navigate, location.pathname]);

  // Reset redirect flag when user changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [user?.role]);

  // Prevent rendering dashboard layout before authorization
  if (!authorized) return null;

  return (
    <DashboardLayout>
      {/* Nested route content will render here */}
      <Outlet />
    </DashboardLayout>
  );
};

export default TeacherParentDashboard;