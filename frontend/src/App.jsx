import React from 'react'
import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import RegisterPage from './pages/RegisterPage';

const App = () => {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />}/>
      <Route path="/register" element={<RegisterPage />} />
      <Route path='/dashboard' element={<TeacherDashboard />}/>
    </Routes>
  )
}

export default App