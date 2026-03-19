import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import StudentSettings from "./StudentSettings";
import ParentSettings from "./ParentSettings";
import TeacherSettings from "./TeacherSettings";
import AccountSettings from "./AccountSettings";
import {
  getStudents,
  setSelectedStudent,
} from "../../features/student/studentSlice";
import { User, Settings } from "lucide-react";

const SettingsRouter = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.user?.token);
  const { selectedStudent, myStudents, isLoading } = useSelector(
    (state) => state.students,
  );

  // "account" = My Account tab, "student" = Student Settings tab
  const [activeTab, setActiveTab] = useState("account");

  // Fetch students for teachers/parents when component mounts
  useEffect(() => {
    if (user?.token && (user.role === "teacher" || user.role === "parent")) {
      dispatch(getStudents());
    }
  }, [dispatch, user?.token, user?.role]);

  // Auto-select first student if none selected
  useEffect(() => {
    if (
      !selectedStudent &&
      myStudents.length > 0 &&
      (user?.role === "teacher" || user?.role === "parent")
    ) {
      dispatch(setSelectedStudent(myStudents[0]));
    }
  }, [selectedStudent, myStudents, dispatch, user?.role]);

  // ── Student role — simple read-only profile ────────────────────────────
  if (user?.role === "student") {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
        {selectedStudent ? (
          <StudentSettings student={selectedStudent} />
        ) : (
          <p className="text-gray-600">Loading student information...</p>
        )}
      </div>
    );
  }

  // ── Teacher / Parent role — two tabs ──────────────────────────────────
  if (user?.role === "teacher" || user?.role === "parent") {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab("account")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === "account"
                ? "bg-white shadow text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <User size={15} />
            My Account
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === "student"
                ? "bg-white shadow text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings size={15} />
            Student Settings
          </button>
        </div>

        {/* My Account tab */}
        {activeTab === "account" && <AccountSettings />}

        {/* Student Settings tab */}
        {activeTab === "student" && (
          <>
            {isLoading ? (
              <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : myStudents.length === 0 ? (
              <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
                <p className="text-gray-600">
                  No students available. Please add or link a student first.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student selector */}
                <div className="max-w-xl mx-auto p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manage Settings For:
                  </label>
                  <select
                    value={selectedStudent?._id || ""}
                    onChange={(e) => {
                      const student = myStudents.find(
                        (s) => s._id === e.target.value,
                      );
                      if (student) dispatch(setSelectedStudent(student));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Select a student --</option>
                    {myStudents.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.enrollmentId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Settings component */}
                {selectedStudent &&
                  (user.role === "parent" ? (
                    <ParentSettings student={selectedStudent} token={token} />
                  ) : (
                    <TeacherSettings student={selectedStudent} token={token} />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
};

export default SettingsRouter;
