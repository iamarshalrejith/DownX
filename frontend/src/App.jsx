import React from 'react'
import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard";

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<LoginPage />}/>
      <Route path='/dashboard' element={<TeacherDashboard />}/>
    </Routes>
  )
}

export default App