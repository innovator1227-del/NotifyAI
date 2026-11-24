import { Bell, LogOut } from "lucide-react";
import React from "react";

const Sidebar = ({
  pages,
  activePage,
  selectPage,
  activeItems,
  user,
  signOut,
}) => {
  return (
    <div>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="mb-12 flex items-center gap-2.5 px-2 font-display text-xl font-extrabold tracking-tight text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Bell size={19} />
          </span>
          Notify<span className="-ml-2 text-indigo-600">AI</span>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
          WORKSPACE
        </p>
        <nav aria-label="Workspace" className="space-y-1">
          {pages.map(({ key, label, icon: Icon }) => (
            <button
              className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${
                activePage === key
                  ? "bg-indigo-50 font-bold text-indigo-700"
                  : "font-medium text-slate-600 hover:bg-slate-50"
              }`}
              key={key}
              onClick={() => selectPage(key)}
            >
              <Icon size={17} /> {label}
              {key === "inbox" && (
                <span className="ml-auto rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {activeItems.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t border-slate-100 px-2 pt-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-slate-400">{user.email}</p>
          </div>
          <button
            aria-label="Sign out"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={signOut}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
