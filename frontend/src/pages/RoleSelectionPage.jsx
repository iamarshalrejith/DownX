import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserGraduate, FaUserTie } from "react-icons/fa";

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const handleSelection = (role) => {
    if(role === "student"){
      navigate('/student-login')
    }else{
      navigate('/login')
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-200 via-yellow-100 to-white overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>

      {/* Main Card */}
      <div className="relative z-10 bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-3xl w-full text-center border border-white/40">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 drop-shadow-sm mb-10">
          Choose Your Role
        </h1>

        {/* Role Options */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
          {/* Student Role */}
          <div
            onClick={() => handleSelection("student")}
            className="group relative w-64 h-64 flex flex-col items-center justify-center rounded-3xl cursor-pointer transition-all duration-500 bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <FaUserGraduate size={48} className="mb-4" />
            <h2 className="text-2xl font-bold mb-2">Student</h2>
            <p className="text-white/90 text-sm max-w-[180px]">
              Explore your learning journey with fun!
            </p>

            <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-all"></div>
          </div>

          {/* Teacher / Parent Role */}
          <div
            onClick={() => handleSelection("teacher-parent")}
            className="group relative w-64 h-64 flex flex-col items-center justify-center rounded-3xl cursor-pointer transition-all duration-500 bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <FaUserTie size={48} className="mb-4" />
            <h2 className="text-2xl font-bold mb-2">Teacher / Parent</h2>
            <p className="text-white/90 text-sm max-w-[180px]">
              Manage students and track their progress
            </p>

            <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-all"></div>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <p className="absolute bottom-6 text-blue-800/70 text-sm tracking-wide font-medium">
        © {new Date().getFullYear()} DownX — Empowering Every Mind
      </p>
    </div>
  );
};

export default RoleSelectionPage;
