import React from 'react'
import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage";
import TeacherParentDashboard from "./pages/TeacherParentDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import RegisterPage from './pages/RegisterPage';

const App = () => {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />}/>
      <Route path="/register" element={<RegisterPage />} />
      <Route path='/dashboard' element={<TeacherParentDashboard />}/>
      <Route path='student-dashboard' element={<StudentDashboard />}/>
    </Routes>
  )
}

export default App