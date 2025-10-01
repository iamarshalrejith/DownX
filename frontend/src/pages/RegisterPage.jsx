import React from "react";
import AuthLayout from "../components/common/AuthLayout";
import AuthForm from "../components/common/AuthForm";

const RegisterPage = () => {
  return (
    <AuthLayout>
      <AuthForm type="register"  />
    </AuthLayout>
  );
};

export default RegisterPage;
