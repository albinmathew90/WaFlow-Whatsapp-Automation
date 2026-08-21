import React, { useState } from "react";
import { Outlet } from "react-router";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-950 font-outfit text-gray-800 dark:text-gray-200 h-screen overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden transition-opacity"
        ></div>
      )}
      
      <main className="relative h-full overflow-y-auto transition-all duration-200 ease-in-out xl:ml-64 rounded-xl">
        <AdminHeader toggleSidebar={toggleSidebar} />
        
        <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
