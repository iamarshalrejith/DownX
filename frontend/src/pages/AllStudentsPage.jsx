import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents, reset } from "../features/student/studentSlice";
import Loadingdots from "../components/Loadingdots";

const AllStudentsPage = () => {
  const dispatch = useDispatch();
  const { myStudents, isLoading, isError, message } = useSelector(
    (state) => state.students
  );

  useEffect(() => {
    dispatch(getStudents());
    return () => dispatch(reset());
  }, [dispatch]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Linked Students</h1>

      {/* Loading state */}
      {isLoading && (
            <Loadingdots />
      )}

      {/* Error state */}
      {isError && (
        <div className="text-red-500 bg-red-100 p-3 rounded">
          {message || "Failed to load students"}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && myStudents.length === 0 && (
        <p className="text-gray-600">No students linked yet.</p>
      )}

      {/* Students table */}
      {!isLoading && !isError && myStudents.length > 0 && (
        <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 mt-4">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-sm font-semibold uppercase">
                  Enrollment ID
                </th>
              </tr>
            </thead>
            <tbody>
              {myStudents.map((student) => (
                <tr
                  key={student._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-3 text-gray-800">{student.name}</td>
                  <td className="px-6 py-3 font-mono text-gray-600">
                    {student.enrollmentId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllStudentsPage;
