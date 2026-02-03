import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import StudentSettings from "./StudentSettings";
import ParentSettings from "./ParentSettings";
import TeacherSettings from "./TeacherSettings";
import { getStudents, setSelectedStudent } from "../../features/student/studentSlice";

const SettingsRouter = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.user?.token);
  const { selectedStudent, myStudents, isLoading } = useSelector(
    (state) => state.students
  );

  // Fetch students for teachers/parents when component mounts
  useEffect(() => {
    if (user?.token && (user.role === "teacher" || user.role === "parent")) {
      dispatch(getStudents());
    }
  }, [dispatch, user?.token, user?.role]);

  // Auto-select first student if none selected and students are available
  useEffect(() => {
    if (
      !selectedStudent &&
      myStudents.length > 0 &&
      (user?.role === "teacher" || user?.role === "parent")
    ) {
      dispatch(setSelectedStudent(myStudents[0]));
    }
  }, [selectedStudent, myStudents, dispatch, user?.role]);

  // Student role - use the logged-in student
  if (user?.role === "student") {
    if (!selectedStudent) {
      return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
          <p className="text-gray-600">Loading student information...</p>
        </div>
      );
    }
    return <StudentSettings student={selectedStudent} />;
  }

  // Teacher/Parent role - show student selector
  if (user?.role === "teacher" || user?.role === "parent") {
    if (isLoading) {
      return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
          <p className="text-gray-600">Loading students...</p>
        </div>
      );
    }

    if (myStudents.length === 0) {
      return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
          <p className="text-gray-600">No students available. Please add or link a student first.</p>
        </div>
      );
    }

    if (!selectedStudent) {
      return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
          <p className="text-gray-600 mb-4">Select a student to manage settings</p>
          <select
            onChange={(e) => {
              const student = myStudents.find((s) => s._id === e.target.value);
              if (student) dispatch(setSelectedStudent(student));
            }}
            className="w-full p-2 border rounded-md"
            defaultValue=""
          >
            <option value="">-- Select a student --</option>
            {myStudents.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.enrollmentId})
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Student Selector */}
        <div className="max-w-xl mx-auto p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manage Settings For:
          </label>
          <select
            value={selectedStudent._id}
            onChange={(e) => {
              const student = myStudents.find((s) => s._id === e.target.value);
              if (student) dispatch(setSelectedStudent(student));
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {myStudents.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.enrollmentId})
              </option>
            ))}
          </select>
        </div>

        {/* Settings Component */}
        {user.role === "parent" ? (
          <ParentSettings student={selectedStudent} token={token} />
        ) : (
          <TeacherSettings student={selectedStudent} token={token} />
        )}
      </div>
    );
  }

  return null;
};

export default SettingsRouter;
