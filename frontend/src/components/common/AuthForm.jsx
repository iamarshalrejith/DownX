import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, register, reset } from "../../features/auth/authSlice.js";
import Loadingdots from "../Loadingdots.jsx";
import toast from "react-hot-toast";

const AuthForm = ({ type = "login" }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const isLogin = type === "login";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasShownToast = useRef(false);

  // get auth state from redux
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  // Handle login/register success or errors
  useEffect(() => {
    // Only show toast and navigate on fresh success
    if (isSuccess && user && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success("Welcome Back!");

      // Navigate based on role
      switch (user.role) {
        case "teacher":
          navigate("/dashboard/teacher", { replace: true });
          break;
        case "parent":
          navigate("/dashboard/parent", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true }); // fallback
      }
    }

    if (isError) {
      toast.error(message || "Login/Register failed");
    }

    // Reset form and auth state after success or error
    if (isSuccess || isError) {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
      });
      dispatch(reset());
      
      // Reset the toast flag when resetting state
      if (isError) {
        hasShownToast.current = false;
      }
    }
  }, [isError, isSuccess, message, dispatch, navigate, user]);

  // Reset toast flag when component mounts
  useEffect(() => {
    hasShownToast.current = false;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    hasShownToast.current = false; // Reset before new submission
    
    if (isLogin) {
      dispatch(login({ email: formData.email, password: formData.password }));
    } else {
      dispatch(
        register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        })
      );
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
      aria-label={isLogin ? "Login form" : "Registration form"}
    >
      {/* Title */}
      <h2 className="text-3xl font-extrabold text-center">
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
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg transition ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gray-950 hover:bg-black"
        }`}
      >
        {isLoading ? (
          <Loadingdots size="w-3 h-3" color="bg-white" gap="mx-1" />
        ) : isLogin ? (
          "Login"
        ) : (
          "Register"
        )}
      </button>

      {/* Login or register */}
      <p className="text-center text-sm text-gray-600 mt-4">
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-gray-900 font-semibold hover:underline"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-gray-900 font-semibold hover:underline"
            >
              Login
            </Link>
          </>
        )}
      </p>
    </form>
  );
};

export default AuthForm;