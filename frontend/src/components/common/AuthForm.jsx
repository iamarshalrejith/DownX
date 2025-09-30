import React, { useState } from "react";
import { Link } from "react-router-dom";

const AuthForm = ({ type = "login", onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const isLogin = type === "login";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
      aria-label={isLogin ? "Login form" : "Registration form"}
    >
      {/* Title */}
      <h2 className="text-3xl font-extrabold text-center ">
        {isLogin ? "Welcome Back" : "Create Account"}
      </h2>
      <p className="text-center font-bold text-sm">
        {isLogin ? "Login in" : "Sign up"} 
      </p>

      {/* Registration Fields */}
      {!isLogin && (
        <>
          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="John Doe"
            />
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        </>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          placeholder="you@example.com"
        />
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          placeholder="••••••••"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg bg-gray-950 hover:bg-black transition"
      >
        {isLogin ? "Login" : "Register"}
      </button>

      {/* Login or register */}
      <p className="text-center text-sm text-gray-600 mt-4">
        {isLogin ? (
          <>
            Don’t have an account?{" "}
            <Link to="/register" className="text-gray-900 font-semibold hover:underline">
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link to="/login" className="text-gray-900 font-semibold hover:underline">
              Login
            </Link>
          </>
        )}
      </p>
    </form>
  );
};

export default AuthForm;
