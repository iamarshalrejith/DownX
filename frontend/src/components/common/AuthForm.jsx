
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, register, reset } from "../../features/auth/authSlice.js";
import Loadingdots from "../Loadingdots.jsx";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from "react-icons/fi";

const AuthForm = ({ type = "login" }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const isLogin = type === "login";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasShownToast = useRef(false);

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isSuccess && user && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success("Welcome to DownX!");

      if (user.role === "teacher") {
        navigate("/dashboard/teacher", { replace: true });
      } else if (user.role === "parent") {
        navigate("/dashboard/parent", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }

    if (isError) {
      toast.error(message || "Login/Register failed");
      hasShownToast.current = false;
    }

    if (isSuccess || isError) {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
      });

      dispatch(reset());
    }
  }, [isError, isSuccess, message, dispatch, navigate, user]);

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
    hasShownToast.current = false;

    if (isLogin) {
      dispatch(
        login({
          email: formData.email,
          password: formData.password,
        })
      );
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

  const inputClass =
    "w-full rounded-xl border border-border bg-bg py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-soft/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
      aria-label={isLogin ? "Login form" : "Registration form"}
    >
      {/* Heading */}
      <div className="mb-7 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {isLogin
            ? "Sign in to continue your learning journey."
            : "Join the DownX learning community."}
        </p>
      </div>

      {/* Name */}
      {!isLogin && (
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Full Name
          </label>

          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              placeholder="Enter your name"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Role */}
      {!isLogin && (
        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            I am a
          </label>

          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-border bg-bg px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
          >
            <option value="">Choose your role</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-ink"
        >
          Email Address
        </label>

        <div className="relative">
          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-ink"
        >
          Password
        </label>

        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />

          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="Enter your password"
            className={`${inputClass} pr-12`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft transition hover:text-brand"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 px-4 font-bold text-white shadow-md transition hover:bg-brand-dark hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <Loadingdots size="w-3 h-3" color="bg-white" gap="mx-1" />
        ) : (
          isLogin ? "Sign In" : "Create Account"
        )}
      </button>

      {/* Register / Login link */}
      <p className="pt-1 text-center text-sm text-ink-soft">
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-brand hover:text-brand-dark hover:underline"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-brand hover:text-brand-dark hover:underline"
            >
              Sign In
            </Link>
          </>
        )}
      </p>
    </form>
  );
};

export default AuthForm;
