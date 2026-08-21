import React from "react";
import { Link, useLocation } from "react-router";
import ThemeSwitch from "./ThemeSwitch";
import LogoutButton from "./LogoutButton";

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/admin", icon: DashboardIcon },
  { name: "Users", path: "/admin/collections/users", icon: UsersIcon },
  { name: "Media", path: "/admin/collections/media", icon: MediaIcon },
  { name: "Blogs", path: "/admin/collections/blogs", icon: BlogsIcon },
  { name: "Blog Topics", path: "/admin/collections/blog-topics", icon: TopicsIcon },
  { name: "SEO", path: "/admin/collections/seo", icon: SeoIcon },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex flex-col flex-shrink-0 w-60 h-[calc(100vh-32px)] my-4 ml-4 font-outfit duration-200 ease-in-out transition-transform xl:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-[120%]"
      }`}
      aria-label="Sidebar"
    >
      <div className="relative flex flex-col flex-1 min-h-0 pt-0 bg-white dark:bg-gray-900 p-5 shadow-md shadow-gray-200/50 dark:shadow-none rounded-md border-0 overflow-hidden">
        {/* Header/Logo Area */}
        <div className="flex items-center justify-center pt-8 pb-4">
          <Link to="/admin" className="flex items-center justify-center">
            <img 
              src="/logo-light.png" 
              alt="Waflow Admin" 
              className="h-8 w-auto object-contain scale-[1.8] origin-center dark:hidden" 
            />
            <img 
              src="/logo-dark.png" 
              alt="Waflow Admin" 
              className="h-8 w-auto object-contain scale-[1.8] origin-center hidden dark:block" 
            />
          </Link>
        </div>
        
        <hr className="h-px mt-0 bg-transparent bg-gradient-to-r from-transparent via-gray-200 to-transparent border-none" />

        <div className="flex flex-col flex-1 pt-4 pb-4 overflow-y-auto no-scrollbar">
          <div className="flex-1 space-y-1">
            <div className="mt-2 mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase px-4">
              Collections
            </div>
            <ul className="w-full flex flex-col gap-2">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.name} className="flex items-center justify-center cursor-pointer w-full whitespace-nowrap">
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1280) toggleSidebar();
                      }}
                      className={`flex w-full h-full gap-3 py-3 px-4 group font-semibold rounded-full bg-cover transition-all ease-linear ${
                        active
                          ? "bg-black dark:bg-gray-800 text-white shadow-md"
                          : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-inner"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 transition-colors ${
                          active ? "text-white" : "text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white"
                        }`}
                      />
                      <span className="truncate text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="mt-auto pt-4 flex flex-col items-center">
            <div className="flex w-full items-center justify-between px-2 mb-4">
              <ThemeSwitch />
              <LogoutButton />
            </div>
            <ul className="w-full flex flex-col gap-2">
              <li className="flex items-center justify-center cursor-pointer w-full whitespace-nowrap">
                <Link
                  to="/admin/settings"
                  onClick={() => {
                    if (window.innerWidth < 1280) toggleSidebar();
                  }}
                  className={`flex w-full h-full gap-3 py-3 px-4 group font-semibold rounded-full bg-cover transition-all ease-linear ${
                    isActive('/admin/settings')
                      ? "bg-black dark:bg-gray-800 text-white shadow-md"
                      : "bg-gray-100 dark:bg-transparent text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <SettingsIcon
                    className={`w-5 h-5 transition-colors ${
                      isActive('/admin/settings') ? "text-white" : "text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white"
                    }`}
                  />
                  <span className="truncate text-sm">Settings</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
};

/* --- Icons --- */

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function MediaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BlogsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function TopicsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}



function SeoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default AdminSidebar;
