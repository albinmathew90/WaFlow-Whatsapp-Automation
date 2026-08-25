import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  ChevronDownIcon,
  ChatIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PaperPlaneIcon,
  PlugInIcon,
  UserCircleIcon,
} from "../icons";
import { BotIcon } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <PlugInIcon />,
    name: "WhatsApp Connect",
    path: "/whatsapp-connect",
  },
  {
    icon: <ChatIcon />,
    name: "Inbox",
    path: "/inbox",
  },
  {
    icon: <UserCircleIcon />,
    name: "Contacts",
    path: "/contacts",
  },
  {
    icon: <PaperPlaneIcon />,
    name: "Broadcasts",
    path: "/broadcasts",
  },
  {
    icon: <PageIcon />,
    name: "Templates",
    subItems: [
      { name: "List Templates", path: "/templates" },
      { name: "Create Template", path: "/templates/create" },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Flows",
    path: "/flows",
  },
  {
    icon: <BotIcon size={20} />,
    name: "Chatbot",
    subItems: [
      { name: "Bot Settings", path: "/chatbot" },
      { name: "Chatbot Leads", path: "/chatbot/leads" },
    ],
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    name: "Health Monitor",
    path: "/health-monitor",
  },
  {
    icon: (
      <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
        {/* Phone body */}
        <path d="M320 16H128C99 16 76 39 76 68v376c0 29 23 52 52 52h192c29 0 52-23 52-52V68c0-29-23-52-52-52z" />
        {/* Phone top bar */}
        <line x1="76" y1="100" x2="372" y2="100" />
        {/* Phone bottom bar */}
        <line x1="76" y1="412" x2="372" y2="412" />
        {/* Notch */}
        <line x1="200" y1="58" x2="248" y2="58" strokeWidth="14" strokeLinecap="round" />
        {/* OTP speech bubble */}
        <rect x="16" y="160" width="280" height="110" rx="22" ry="22" />
        {/* Bubble tail */}
        <path d="M120 270 L100 310 L155 270" />
        {/* Asterisk 1 */}
        <line x1="80" y1="215" x2="80" y2="225" strokeWidth="14" />
        <line x1="75" y1="212" x2="85" y2="228" strokeWidth="14" />
        <line x1="85" y1="212" x2="75" y2="228" strokeWidth="14" />
        {/* Asterisk 2 */}
        <line x1="156" y1="215" x2="156" y2="225" strokeWidth="14" />
        <line x1="151" y1="212" x2="161" y2="228" strokeWidth="14" />
        <line x1="161" y1="212" x2="151" y2="228" strokeWidth="14" />
        {/* Asterisk 3 */}
        <line x1="232" y1="215" x2="232" y2="225" strokeWidth="14" />
        <line x1="227" y1="212" x2="237" y2="228" strokeWidth="14" />
        <line x1="237" y1="212" x2="227" y2="228" strokeWidth="14" />
        {/* Clock circle */}
        <circle cx="390" cy="340" r="90" />
        <circle cx="390" cy="340" r="72" />
        {/* Clock hands */}
        <line x1="390" y1="340" x2="390" y2="292" strokeWidth="16" />
        <line x1="390" y1="340" x2="426" y2="360" strokeWidth="16" />
        {/* Clock notch at 6 o'clock */}
        <line x1="390" y1="400" x2="390" y2="408" strokeWidth="14" />
      </svg>
    ),
    name: "OTP Builder",
    subItems: [
      { name: "Applications", path: "/otp-builder/applications" },
      { name: "API Keys", path: "/otp-builder/api-keys" },
      { name: "Templates", path: "/otp-builder/templates" },
      { name: "Webhooks", path: "/otp-builder/webhooks" },
      { name: "Logs", path: "/otp-builder/logs" },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Settings",
    subItems: [
      { name: "Account Management", path: "/settings/account" },
      { name: "Billing & Subscription", path: "/settings/billing" },
      { name: "Media Library", path: "/settings/media" },
      { name: "Contact Custom Fields", path: "/settings/contact-fields" },
      { name: "Activity Logs", path: "/settings/logs" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [leadCount, setLeadCount] = useState<number>(0);

  useEffect(() => {
    let socket: any;
    const token = sessionStorage.getItem('crm_token');
    if (!token) return;

    const fetchLeads = () => {
      fetch('/openwa-api/crm/chatbot/leads', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          const leads = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          setAllLeads(leads);
        })
        .catch(() => {});
    };

    fetchLeads();
    
    import("socket.io-client").then(({ io }) => {
      socket = io("/crm-events", {
        auth: { token },
        transports: ["websocket", "polling"],
      });
      socket.on('chatbot:lead:message', () => {
        fetchLeads();
      });
    });

    const handleReceiptUpdate = () => {
      setAllLeads(prev => [...prev]);
    };
    window.addEventListener('chatbot_read_receipt_updated', handleReceiptUpdate);

    return () => {
      if (socket) socket.disconnect();
      window.removeEventListener('chatbot_read_receipt_updated', handleReceiptUpdate);
    };
  }, []);

  useEffect(() => {
    const receipts = JSON.parse(localStorage.getItem('chatbot_read_receipts') || '{}');
    const unreadCount = allLeads.filter(l => {
      if (!l.messages || l.messages.length === 0) return false;
      const receipt = receipts[l.id];
      if (!receipt) return true;
      return new Date(l.updatedAt).getTime() > new Date(receipt).getTime();
    }).length;
    setLeadCount(unreadCount);
  }, [allLeads]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.name === "Chatbot Leads" && leadCount > 0 && (
                          <span
                            className={`ml-auto px-2 py-0.5 rounded-full text-[10.5px] font-bold shadow-sm transition-colors ${isActive(subItem.path)
                              ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-200"
                              : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                              }`}
                          >
                            {leadCount}
                          </span>
                        )}
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed top-[64px] lg:top-[73px] flex flex-col px-5 pt-8 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-[calc(100vh-64px)] lg:h-[calc(100vh-73px)] transition-all duration-300 ease-in-out z-40 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
