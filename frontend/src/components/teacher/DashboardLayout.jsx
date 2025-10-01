import React from 'react'
import Sidebar from './Sidebar'

const DashboardLayout = ({children}) => {
  return (
    <div className='flex'>
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <div className='flex-1 p-8 bg-gray-100 min-h-screen'>
            {children}
        </div>
    </div>
  )
}

export default DashboardLayout