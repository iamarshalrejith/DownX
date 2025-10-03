import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate,NavLink} from "react-router-dom";
import { logout} from "../../features/auth/authSlice.js"

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handlelogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="h-screen w-64 bg-indigo-600 text-white flex flex-col justify-between">
        {/* Top part */}
        <div>
            <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Welcome,</h2>
                <p className="text-sm">{user?.name} ({user?.role})</p>
            </div>
        

        {/* Nav links */}
        <nav className="mt-6 flex flex-col font-semibold">
            <NavLink to="/dashboard/all-students" className={({isActive}) => `px-6 py-3 hover:bg-indigo-700 block ${isActive ? "bg-indigo-900" : ""}`}>
                All Students
            </NavLink>
            <NavLink to="/dashboard/tasks" className={({isActive}) => `px-6 py-3 hover:bg-indigo-700 block ${isActive ? "bg-indigo-900" : ""}`}>
                Tasks
            </NavLink>
            <NavLink to="/dashboard/students" className={({isActive}) => `px-6 py-3 hover:bg-indigo-700 block ${isActive ? "bg-indigo-900" : ""}`}>
                Student Management
            </NavLink> 
        </nav>
        </div>

        {/* Logout */}
        <div className="p-6 border-t">
            <button onClick={handlelogout} className="w-full bg-gray-100 text-black hover:bg-gray-300  py-2 px-4 rounded-3xl font-semibold">
                Logout
            </button>
        </div>
    </div>
  )
};

export default Sidebar;
