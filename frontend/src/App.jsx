import React from 'react'
import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage";
import TeacherParentDashboard from "./pages/TeacherParentDashboard";
import TeacherDashboardHome from './components/TeacherDashboardHome';
import ParentDashboardHome from './components/ParentDashboardHome';
import StudentDashboard from "./pages/StudentDashboard";
import RegisterPage from './pages/RegisterPage';
import StudentManagementPage from './pages/StudentManagementPage';

const App = () => {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />}/>
      <Route path="/register" element={<RegisterPage />} />

      <Route path='/dashboard' element={<TeacherParentDashboard />}>
         <Route path='teacher' element={<TeacherDashboardHome />}/>
         <Route path='parent' element={<ParentDashboardHome />} />
         <Route path='students' element={<StudentManagementPage />}/>
      </Route>

      <Route path='student-dashboard' element={<StudentDashboard />}/>
    </Routes>
  )
}

export default App