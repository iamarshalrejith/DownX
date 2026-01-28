import crypto from "crypto";

const generateEnrollmentToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export default generateEnrollmentToken;
