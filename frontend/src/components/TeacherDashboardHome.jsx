import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents, reset } from "../features/student/studentSlice.js";
import { Link, useNavigate } from "react-router-dom";
import Loadingdots from "./Loadingdots.jsx";
import { toast } from "react-hot-toast";

const TeacherDashboardHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { myStudents = [], isLoading, isError, message } = useSelector(
    (state) => state.students
  );
  const { user } = useSelector((state) => state.auth);

  // Fetch students when teacher is logged in
  useEffect(() => {
    if (user?.token) {
      dispatch(getStudents(user.token));
    }
  }, [dispatch, user?.token]);

  // Show toast on error and reset state
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  // Show loader while fetching data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loadingdots />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">
              👨‍🏫 Teacher Dashboard
            </h1>
          </div>

          {/* ✅ Replaced navigate() with Link */}
          <Link
            to="/dashboard/tasks/create"
            className="mt-4 sm:mt-0 inline-block bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300"
          >
            Create New Task
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-indigo-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Total Students</h2>
            <p className="text-4xl font-bold text-indigo-700">
              {myStudents.length}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-indigo-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Active Tasks</h2>
            <p className="text-4xl font-bold text-indigo-700">--</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-indigo-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Completed Tasks</h2>
            <p className="text-4xl font-bold text-indigo-700">--</p>
          </div>
        </div>

        {/* Students List */}
        <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-indigo-100 shadow-md">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
            👩‍🎓 Your Students
          </h2>

          {myStudents.length > 0 ? (
            <ul className="space-y-3">
              {myStudents.map((student) => (
                <li
                  key={student._id}
                  onClick={() => navigate(`/dashboard/students/${student._id}`)} // still fine for dynamic links
                  className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-indigo-50/60 transition cursor-pointer"
                >
                  <span className="font-medium text-gray-800 text-lg">
                    {student.name}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {student.tasks?.length
                      ? `${student.tasks.length} task${
                          student.tasks.length > 1 ? "s" : ""
                        }`
                      : "No tasks yet"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No students assigned yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardHome;
