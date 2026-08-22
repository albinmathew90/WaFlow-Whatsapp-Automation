import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

// ─── Searchable items ─────────────────────────────────────────────────────────
// Add any page / feature you want to be discoverable here.
const SEARCH_ITEMS = [
  // Main nav
  { label: "Dashboard", description: "Overview & stats", path: "/" },
  { label: "Inbox", description: "Messages & conversations", path: "/inbox" },
  { label: "Contacts", description: "Manage your contacts", path: "/contacts" },
  { label: "Broadcasts", description: "Send bulk messages", path: "/broadcasts" },
  // Templates
  { label: "Templates", description: "List all templates", path: "/templates" },
  { label: "Create Template", description: "Build a new template", path: "/templates/create" },
  // Flows
  { label: "Flows", description: "Automation flow builder", path: "/flows" },
  { label: "Settings", description: "App settings", path: "/settings" },
  { label: "Account Management", description: "Manage your profile and security", path: "/settings/account" },
  { label: "Account Profile", description: "Update your profile information", path: "/settings/account#profile" },
  { label: "Change Password", description: "Update your account password", path: "/settings/account#password" },
  { label: "Delete Account", description: "Permanently delete your account", path: "/settings/account#delete" },
  { label: "Tags", description: "Manage contact tags", path: "/settings/tags" },
  { label: "Media Library", description: "Uploaded media files", path: "/settings/media" },
  { label: "Contact Custom Fields", description: "Manage custom contact fields", path: "/settings/contact-fields" },
  { label: "WhatsApp Connect", description: "Manage WhatsApp connections", path: "/whatsapp-connect" },
  // OTP Builder
  { label: "OTP Applications", description: "Manage OTP apps & integrations", path: "/otp-builder/applications" },
  { label: "OTP API Keys", description: "Manage API keys for OTP", path: "/otp-builder/api-keys" },
  { label: "OTP Templates", description: "Create and manage OTP templates", path: "/otp-builder/templates" },
  { label: "OTP Webhooks", description: "Configure webhooks for OTP", path: "/otp-builder/webhooks" },
  { label: "OTP Logs & Analytics", description: "View API, OTP and webhook logs", path: "/otp-builder/logs" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg className="fill-gray-400 dark:fill-gray-500" width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// ─── Highlight matched text ───────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Main GlobalSearch component ──────────────────────────────────────────────
const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter results
  const results = query.trim()
    ? SEARCH_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Ctrl/Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIndex]) {
        handleSelect(results[activeIndex].path);
      }
    }
  };

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          autoComplete="off"
          className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
        />
      </div>

      {/* Dropdown */}
      {isOpen && query.trim() && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 w-full xl:w-[430px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {results.length > 0 ? (
            <ul className="py-2 max-h-72 overflow-y-auto">
              {results.map((item, i) => (
                <li key={item.path + item.label}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item.path);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIndex
                        ? "bg-brand-50 dark:bg-brand-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                        <Highlight text={item.label} query={query} />
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        <Highlight text={item.description} query={query} />
                      </span>
                    </div>
                    <ArrowIcon />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No results for <span className="font-medium text-gray-800 dark:text-white">"{query}"</span>
              </p>
            </div>
          )}

          {/* Footer hint */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs font-mono">↵</kbd>
              go
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs font-mono">Esc</kbd>
              close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
