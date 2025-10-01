import React, { useState,useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/teacher/DashboardLayout'

const TeacherParentDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate()
  const [authorized,setAuthorized] = useState(false);
  const [viewMode,setViewMode] = useState("teacher")

  useEffect(()=>{
    if(!user){
      navigate("/login")
    }
    else if(user.role === "student"){
      navigate("/student-dashboard")
    }
    else if(user.role === "teacher"){
      setAuthorized(true);
      setViewMode("teacher");
    }
    else if(user.role === "parent"){
      setAuthorized(true);
      setViewMode("parent");
    }
    else{
      navigate("/login");
    }
  },[user,navigate])

  if(!authorized) return null;

  return (
    <DashboardLayout>
      <div className='flex flex-col gap-6' >
        <h1 className="text-2xl font-bold">
          {viewMode === "teacher" ? "Teacher Dashboard" : "Parent Dashboard"}
        </h1>
        {viewMode === "teacher" && (
          <button
            onClick={() => navigate("/dashboard/tasks/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-fit"
          >
            + Create New Task
          </button>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TeacherParentDashboard