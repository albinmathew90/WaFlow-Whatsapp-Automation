import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";

const SEARCH_INDEX = [
  { title: 'Dashboard', subtitle: 'Overview and stats', path: '/admin', keywords: ['dashboard', 'home', 'stats', 'analytics', 'overview'] },
  { title: 'Users', subtitle: 'Manage accounts and clients', path: '/admin/collections/users', keywords: ['users', 'clients', 'customers', 'email', 'phone', 'account'] },
  { title: 'Media', subtitle: 'Manage images and uploads', path: '/admin/collections/media', keywords: ['media', 'images', 'files', 'uploads', 'pictures'] },
  { title: 'Blogs', subtitle: 'Write and publish posts', path: '/admin/collections/blogs', keywords: ['blogs', 'posts', 'articles', 'content'] },
  { title: 'Blog Topics', subtitle: 'Organize blog categories', path: '/admin/collections/blog-topics', keywords: ['blog topics', 'categories', 'tags'] },
  { title: 'SEO', subtitle: 'Search engine optimization', path: '/admin/collections/seo', keywords: ['seo', 'meta', 'tags', 'search engine', 'ranking'] },
  { title: 'Profile & Security', subtitle: 'Admin account settings', path: '/admin/settings#security', keywords: ['settings', 'profile', 'password', 'security', '2fa', 'email', 'login', 'two factor authentication'] },
  { title: 'Email & Notifications', subtitle: 'Configure SMTP and alerts', path: '/admin/settings#notifications', keywords: ['settings', 'email', 'notifications', 'smtp', 'templates', 'triggers', 'alert', 'welcome email', 'invoice email', 'whatsapp'] },
  { title: 'Subscriptions & Billing', subtitle: 'Manage plans and payments', path: '/admin/settings#billing', keywords: ['settings', 'subscription', 'billing', 'invoice', 'payment', 'tax', 'plan', 'gst', 'razorpay', 'stripe', 'cashfree', 'coupon'] },
];

const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-black text-white px-[2px] rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

interface AdminHeaderProps {
  toggleSidebar: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 1 ? pathParts[pathParts.length - 1].replace(/-/g, ' ') : 'Dashboard';

  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const filteredResults = SEARCH_INDEX.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        navigate(filteredResults[selectedIndex].path);
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <nav className="relative flex flex-wrap items-center justify-between px-6 py-4 mx-6 mt-4 transition-all shadow-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 lg:flex-nowrap lg:justify-start">
      <div className="flex items-center justify-between w-full mx-auto flex-wrap-inherit">
        
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-2 min-w-[150px]">
          <Link to="/admin" className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          {currentPage !== 'Dashboard' && (
            <>
              <span className="text-gray-400 font-medium text-lg">/</span>
              <h1 className="text-xl font-medium capitalize text-gray-900 dark:text-white tracking-tight leading-none">
                {currentPage}
              </h1>
            </>
          )}
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-1 flex justify-center px-4 hidden md:flex">
          <div className="input-container group" ref={searchRef}>
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
              
              .dark .input-custom {
                border-color: #374151;
                background-color: #1f2937;
                color: white;
              }
              
              .dark .input-custom:focus {
                border-color: #4b5563;
                box-shadow: -5px -5px 0px #374151;
              }
              
              .dark .search-icon-custom path {
                stroke: #9ca3af;
              }
            `}</style>
            <input 
              type="text" 
              name="text" 
              className="input-custom" 
              placeholder="search..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
            />
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

            {isDropdownOpen && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-700 shadow-[-5px_5px_0px_black] dark:shadow-[-5px_5px_0px_#374151] z-50 flex flex-col">
                {filteredResults.length > 0 ? (
                  <>
                    <ul className="max-h-64 overflow-y-auto flex-1">
                      {filteredResults.map((result, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => {
                              navigate(result.path);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 group ${idx === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
                          >
                            <div className="flex flex-col items-start text-left">
                              <span className="text-[12px] font-bold uppercase tracking-widest text-black dark:text-white mb-0.5">
                                <HighlightText text={result.title} query={searchQuery} />
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                                <HighlightText text={result.subtitle} query={searchQuery} />
                              </span>
                            </div>
                            <svg className={`w-4 h-4 transition-colors ${idx === selectedIndex ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-start gap-4 text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider shrink-0">
                      <span className="flex items-center gap-1.5"><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-[1px_1px_0px_rgba(0,0,0,0.2)] text-gray-600 font-sans text-[9px] font-bold">↑↓</kbd> navigate</span>
                      <span className="flex items-center gap-1.5"><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-[1px_1px_0px_rgba(0,0,0,0.2)] text-gray-600 font-sans text-[9px] font-bold">↵</kbd> go</span>
                      <span className="flex items-center gap-1.5"><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-[1px_1px_0px_rgba(0,0,0,0.2)] text-gray-600 font-sans text-[9px] font-bold">ESC</kbd> close</span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-[11px] text-gray-500 uppercase tracking-widest font-bold text-center">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Date/Time Card & Mobile Toggle */}
        <div className="flex items-center justify-end min-w-[150px]">
          <div className="flex flex-col bg-[#eef1f6] dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 min-w-[180px] shadow-sm">
            <div className="flex justify-center mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">
              <span className="font-bold text-gray-900 dark:text-white text-sm tracking-wider">{formattedTime}</span>
            </div>
            <div className="flex justify-between items-center w-full mt-0.5">
              <span className="text-[11px] text-gray-600 dark:text-gray-400 font-bold">{formattedDate}</span>
              <span className="text-[11px] text-gray-600 dark:text-gray-400 font-bold">{formattedDay}</span>
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
