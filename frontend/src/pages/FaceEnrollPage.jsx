import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const FaceEnrollPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState("validating");

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await axios.get(
          `/api/students/face-enroll/validate?token=${token}`
        );
        setStatus("valid");
      } catch (err) {
        setStatus("invalid");
      }
    }

    if (token) validateToken();
    else setStatus("invalid");
  }, [token]);

  if (status === "validating") return <p>Validating enrollment link…</p>;
  if (status === "invalid") return <p>Enrollment link invalid or expired.</p>;

  return (
    <div>
      <h2>Face Enrollment</h2>
      <p>Camera will start here (Day 8)</p>
    </div>
  );
};

export default FaceEnrollPage;
