const StudentSettings = ({ student }) => {
  return (
    <div>
      <h2>My Account</h2>

      <p><strong>Name:</strong> {student.name}</p>
      <p><strong>Enrollment ID:</strong> {student.enrollmentId}</p>

      <p style={{ color: "gray" }}>
        Ask your parent or teacher if something needs to be changed 
      </p>
    </div>
  );
};

export default StudentSettings;
