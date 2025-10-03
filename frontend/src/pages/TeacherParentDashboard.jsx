import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/teacher/DashboardLayout';

const TeacherParentDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [authorized, setAuthorized] = useState(false);
  const [viewMode, setViewMode] = useState("teacher");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } 
    else if (user.role === "student") {
      navigate("/student-dashboard");
    } 
    else if (user.role === "teacher") {
      setAuthorized(true);
      setViewMode("teacher");

      // Only redirect if at /dashboard root
      if (location.pathname === "/dashboard") {
        navigate("/dashboard/teacher");
      }
    } 
    else if (user.role === "parent") {
      setAuthorized(true);
      setViewMode("parent");

      // Only redirect if at /dashboard root
      if (location.pathname === "/dashboard") {
        navigate("/dashboard/parent");
      }
    } 
    else {
      navigate("/login");
    }
  }, [user, navigate, location]);

  if (!authorized) return null;

  return (
    <DashboardLayout>
      {/* Nested route content will render here */}
      <Outlet />
    </DashboardLayout>
  );
};

export default TeacherParentDashboard;
