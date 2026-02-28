import React from 'react';
import Sidebar from './Sidebar';
import GestureHelp from '../gesture/GestureHelp'; 
import { useSelector } from 'react-redux'; 

const DashboardLayout = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  // Only show GestureHelp for teachers and parents
  const showGestureHelp = user?.role === 'teacher' || user?.role === 'parent';

  return (
    <div className='flex'>
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div className='flex-1 p-8 bg-gray-100 min-h-screen'>
        {children}
      </div>

      {/* Floating Help Request Panel (Teacher/Parent Only) */}
      {showGestureHelp && <GestureHelp />}
    </div>
  );
};

export default DashboardLayout;