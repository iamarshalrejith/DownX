import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createStudent, linkStudent, reset } from "../features/student/studentSlice";
import Loadingdots from "../components/Loadingdots";
import { toast } from "react-hot-toast";

const StudentManagementPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.students
  );

  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    if (isSuccess || isError) {
      dispatch(reset());
    }
  }, [dispatch, isSuccess, isError]);

  // Handlers
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createStudent({ name: studentName })).unwrap();
      toast.success("Student created successfully!");
      setStudentName("");
    } catch (err) {
      toast.error(err || "Failed to create student");
    }
  };

  const handleLinkStudent = async (e) => {
    e.preventDefault();
    try {
      await dispatch(linkStudent({ studentId })).unwrap();
      toast.success("Student linked successfully!");
      setStudentId("");
    } catch (err) {
      toast.error(err || "Failed to link student");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Student Management</h1>

      {/* Teacher only -> add new student */}
      {user?.role === "teacher" && (
        <div className="mb-10 bg-white shadow-lg rounded-3xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Student</h2>
          <form onSubmit={handleCreateStudent} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Student's Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="border p-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? <Loadingdots /> : "Add Student"}
            </button>
          </form>
        </div>
      )}

      {/* Teacher/Parent: Link Student */}
      <div className="bg-white shadow-lg rounded-3xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Link to Existing Student</h2>
        <form onSubmit={handleLinkStudent} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Student ID / Enrollment Code"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="border p-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 flex justify-center items-center"
            disabled={isLoading}
          >
            {isLoading ? <Loadingdots /> : "Link Student"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentManagementPage;
