import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";

interface AdminHeaderProps {
  toggleSidebar: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 1 ? pathParts[pathParts.length - 1].replace(/-/g, ' ') : 'Dashboard';

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const formattedDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <nav className="relative flex flex-wrap items-center justify-between px-6 py-4 mx-6 mt-4 transition-all shadow-sm bg-white rounded-2xl border border-gray-100 lg:flex-nowrap lg:justify-start">
      <div className="flex items-center justify-between w-full mx-auto flex-wrap-inherit">
        
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-2 min-w-[150px]">
          <Link to="/admin" className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          {currentPage !== 'Dashboard' && (
            <>
              <span className="text-gray-400 font-medium text-lg">/</span>
              <h1 className="text-xl font-bold capitalize text-gray-900 tracking-tight leading-none">
                {currentPage}
              </h1>
            </>
          )}
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-1 flex justify-center px-4 hidden md:flex">
          <div className="input-container group">
            <style>{`
              .input-container {
                width: 320px;
                position: relative;
              }
            
              .search-icon-custom {
                position: absolute;
                right: 10px;
                top: calc(50% + 5px);
                transform: translateY(calc(-50% - 5px));
              }
            
              .input-custom {
                width: 100%;
                height: 40px;
                padding: 10px;
                transition: .2s linear;
                border: 2.5px solid black;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 2px;
                background-color: white;
                color: black;
              }
            
              .input-custom:focus {
                outline: none;
                border: 0.5px solid black;
                box-shadow: -5px -5px 0px black;
              }
            
              .input-container:hover > .search-icon-custom {
                animation: anim 1s linear infinite;
              }
            
              @keyframes anim {
                0%,
                100% {
                  transform: translateY(calc(-50% - 5px)) scale(1);
                }
            
                50% {
                  transform: translateY(calc(-50% - 5px)) scale(1.1);
                }
              }
            `}</style>
            <input type="text" name="text" className="input-custom" placeholder="search..." />
            <span className="search-icon-custom"> 
              <svg width="19px" height="19px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" strokeWidth={0} />
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
                <g id="SVGRepo_iconCarrier"> 
                  <path opacity={1} d="M14 5H20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> 
                  <path opacity={1} d="M14 8H17" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> 
                  <path d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> 
                  <path opacity={1} d="M22 22L20 20" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> 
                </g>
              </svg>
            </span>
          </div>
        </div>

        {/* Right: Date/Time Card & Mobile Toggle */}
        <div className="flex items-center justify-end min-w-[150px]">
          <div className="flex items-center justify-between bg-[#eef1f6] border border-gray-300 rounded-lg p-2.5 min-w-[200px] shadow-sm">
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm leading-none mb-1.5">{formattedDay}</span>
              <span className="text-[11px] text-gray-600 font-medium leading-none">{formattedDate}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-gray-900 text-sm leading-none mb-1.5">{formattedTime}</span>
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          
          <button onClick={toggleSidebar} className="ml-4 xl:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default AdminHeader;
