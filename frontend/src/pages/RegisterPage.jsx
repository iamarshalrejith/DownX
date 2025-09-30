import React from "react";
import AuthLayout from "../components/common/AuthLayout";
import AuthForm from "../components/common/AuthForm";

const RegisterPage = () => {
  const handleRegister = (data) => {
    console.log("Registration data:", data);
    // TODO: Add API call
  };

  return (
    <AuthLayout>
      <AuthForm type="register" onSubmit={handleRegister} />
    </AuthLayout>
  );
};

export default RegisterPage;
