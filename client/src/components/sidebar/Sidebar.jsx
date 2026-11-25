import { Bell, LogOut, X } from "lucide-react";
import React from "react";

const Sidebar = ({
  pages = [],
  activePage,
  selectPage,
  activeItems = [],
  user,
  signOut,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const closeSidebar = () => setSidebarOpen(false);
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 md:hidden" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-slate-200 bg-white px-3 py-6 font-serif transition-all duration-300
          ${sidebarOpen ? "w-60" : "w-20"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div
          className={`mb-12 flex items-center ${
            sidebarOpen ? "justify-between px-2" : "justify-center"
          }`}
        >
          <div className="flex items-center gap-2 font-display text-xl font-extrabold text-slate-900">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
              <Bell size={19} />
            </span>

            {sidebarOpen && (
              <span>
                Notify<span className="text-indigo-600">AI</span>
              </span>
            )}
          </div>

          {/* Mobile close */}
          <button
            className="md:hidden"
            onClick={() => {
              closeSidebar;
            }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {sidebarOpen && (
          <p className="mb-3 px-3 text-[15px] font-bold tracking-[0.16em] text-blue-400">
            WORKSPACE
          </p>
        )}

        {/* Navigation */}
        <nav aria-label="Workspace" className="space-y-1">
          {pages.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              title={!sidebarOpen ? label : undefined}
              onClick={() => selectPage(key)}
              className={`flex h-10 w-full items-center rounded-lg text-sm transition-colors
                ${sidebarOpen ? "gap-3 px-3" : "justify-center"}
                ${
                  activePage === key
                    ? "bg-indigo-50 font-bold text-indigo-700"
                    : "font-medium text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Icon size={19} className="shrink-0" />

              {sidebarOpen && <span>{label}</span>}

              {sidebarOpen && key === "inbox" && (
                <span className="ml-auto rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {activeItems.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User information */}
        <div
          className={`mt-auto flex items-center border-t border-slate-100 pt-5 ${
            sidebarOpen ? "gap-3 px-2" : "justify-center"
          }`}
        >
          <div
            title={!sidebarOpen ? user?.name : undefined}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700"
          >
            {user?.name?.slice(0, 1).toUpperCase() || "U"}
          </div>

          {sidebarOpen && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">
                  {user?.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {user?.email}
                </p>
              </div>

              <button
                aria-label="Sign out"
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
