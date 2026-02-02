import { useSelector } from "react-redux";
import StudentSettings from "./StudentSettings";
import ParentSettings from "./ParentSettings";
import TeacherSettings from "./TeacherSettings";

const SettingsRouter = () => {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.user?.token);
  const student = useSelector(
    (state) => state.students.selectedStudent
  );

  if (!user || !student) {
    return <p>Select a student to manage settings</p>;
  }

  if (user.role === "student") {
    return <StudentSettings student={student} />;
  }

  if (user.role === "parent") {
    return <ParentSettings student={student} token={token} />;
  }

  if (user.role === "teacher") {
    return <TeacherSettings student={student} token={token} />;
  }

  return null;
};

export default SettingsRouter;
