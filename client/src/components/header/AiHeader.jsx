import { LogOut, PanelLeft, Plus, Search } from "lucide-react";
import React from "react";

const AiHeader = ({
  aiConfigured,
  setShowQuickAdd,
  signOut,
  pages = [],
  activePage,
  onToggleSidebar,
  setQuery,
  setSmartResults,
  setSmartExplanation,
  query,
}) => {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm sm:px-8 font-serif">
      <div className="flex flex-1 items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <PanelLeft
            size={20}
            className="text-slate-600 hover:text-indigo-700"
          />
        </button>

        <span className="hidden text-slate-800 sm:inline  bg-blue-100 p-1.5 rounded-lg">
          Notification Management
        </span>

        <strong className="text-slate-700">
          {pages.find((page) => page.key === activePage)?.label}
        </strong>

        <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-300 px-3 text-slate-400 focus-within:border-indigo-400">
          <Search size={16} />
          <input
            className="w-full border-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            onChange={(event) => {
              setQuery(event.target.value);
              setSmartResults(null);
              setSmartExplanation("");
            }}
            placeholder="Search notifications..."
            value={query}
          />
        </label>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-900">
        <span
          className={`h-2 w-2 rounded-full ${
            aiConfigured ? "bg-emerald-500" : "bg-blue-400"
          }`}
        />

        <span className="hidden sm:inline">
          {aiConfigured ? "AI connected" : "Local analysis"}
        </span>

        <button
          className="ml-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => setShowQuickAdd(true)}
        >
          <Plus size={14} /> Add
        </button>

        <button
          aria-label="Sign out"
          className="ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          onClick={signOut}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default AiHeader;
