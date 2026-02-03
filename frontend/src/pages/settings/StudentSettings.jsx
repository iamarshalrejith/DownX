const StudentSettings = ({ student }) => {
  if (!student) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p className="text-gray-600">No student information available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Account</h2>

      <p className="text-gray-700">
        <strong>Name:</strong> {student.name}
      </p>
      <p className="text-gray-700">
        <strong>Enrollment ID:</strong> {student.enrollmentId}
      </p>

      <p className="text-gray-500 mt-4">
        Ask your parent or teacher if something needs to be changed.
      </p>
    </div>
  );
};

export default StudentSettings;
