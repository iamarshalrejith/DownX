import React from "react";
import AuthLayout from "../components/common/AuthLayout";
import AuthForm from "../components/common/AuthForm";

const LoginPage = () => {
  return (
    <AuthLayout>
      <AuthForm type="login"  />
    </AuthLayout>
  );
};

export default LoginPage;
