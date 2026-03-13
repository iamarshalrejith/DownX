import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  changePassword,
  reset,
} from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

/**
 * AccountSettings
 *
 * Shown in the Settings panel for teachers and parents.
 * Sections:
 *   1. Edit Profile  — name and email
 *   2. Change Password
 */
const AccountSettings = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (s) => s.auth,
  );

  // Profile form
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  //  Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Track which form was last submitted so toasts go to the right place
  const [activeForm, setActiveForm] = useState(null); // "profile" | "password"

  //  Sync form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Handle thunk feedback
  useEffect(() => {
    if (!activeForm) return;

    if (isSuccess) {
      if (activeForm === "profile") {
        toast.success("Profile updated!");
      } else {
        toast.success("Password changed!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
      dispatch(reset());
      setActiveForm(null);
    }

    if (isError) {
      toast.error(message || "Something went wrong");
      dispatch(reset());
      setActiveForm(null);
    }
  }, [isSuccess, isError, message, activeForm, dispatch]);

  //  Submit profile
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() && !email.trim()) {
      toast.error("Fill in at least one field");
      return;
    }
    setActiveForm("profile");
    dispatch(updateProfile({ name: name.trim(), email: email.trim() }));
  };

  // Submit password
  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must be different from current");
      return;
    }

    setActiveForm("password");
    dispatch(changePassword({ currentPassword, newPassword }));
  };

  // Password strength indicator
  const getStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6)
      return { label: "Too short", color: "bg-red-400", width: "w-1/4" };
    if (pwd.length < 8)
      return { label: "Weak", color: "bg-orange-400", width: "w-2/4" };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd))
      return { label: "Strong", color: "bg-green-500", width: "w-full" };
    return { label: "OK", color: "bg-yellow-400", width: "w-3/4" };
  };
  const strength = getStrength(newPassword);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/*  Edit Profile  */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <div className="bg-blue-100 p-2 rounded-lg">
            <User size={20} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Edit Profile</h3>
        </div>

        {/* Current info badge */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
          <p>
            <span className="font-medium">Current name:</span> {user?.name}
          </p>
          <p>
            <span className="font-medium">Current email:</span> {user?.email}
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading && activeForm === "profile"}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading && activeForm === "profile" ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />{" "}
                Saving…
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Save Profile
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Lock size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Change Password
          </h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            {strength && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Strength</span>
                  <span
                    className={
                      strength.label === "Strong"
                        ? "text-green-600 font-semibold"
                        : strength.label === "Too short"
                          ? "text-red-500"
                          : "text-yellow-600"
                    }
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:border-transparent outline-none transition ${
                  confirmPassword && confirmPassword !== newPassword
                    ? "border-red-400 focus:ring-red-300"
                    : confirmPassword && confirmPassword === newPassword
                      ? "border-green-400 focus:ring-green-300"
                      : "border-gray-300 focus:ring-purple-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Match indicator */}
            {confirmPassword && (
              <p
                className={`text-xs mt-1 ${
                  confirmPassword === newPassword
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {confirmPassword === newPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading && activeForm === "password"}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading && activeForm === "password" ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />{" "}
                Updating…
              </>
            ) : (
              <>
                <Lock size={16} /> Change Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* Role badge */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Account Type
        </p>
        <span
          className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
            user?.role === "teacher"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {user?.role === "teacher" ? "Teacher" : "Parent"}
        </span>
        <p className="text-xs text-gray-400 mt-2">
          To change your role, please contact support.
        </p>
      </div>
    </div>
  );
};

export default AccountSettings;
