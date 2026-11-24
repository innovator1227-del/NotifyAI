import { LogOut, PanelLeft, Plus } from "lucide-react";
import React from "react";

const Header = ({
  aiConfigured,
  setShowQuickAdd,
  signOut,
  pages,
  activePage,
}) => {
  return (
    <div>
      <header className="sticky top-0 z-50 w-full flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8 shadow-lg">
        <div className="flex items-center gap-2 font-sanserif">
          <PanelLeft />
          <span className="text-slate-800">Notification Management</span>
          <span className="text-slate-300">/</span>
          <strong className="text-slate-700">
            {pages.find((page) => page.key === activePage)?.label}
          </strong>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${aiConfigured ? "bg-emerald-500" : "bg-amber-400"}`}
          />
          {aiConfigured ? "AI connected" : "Local analysis"}
          <button
            className="ml-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setShowQuickAdd(true)}
          >
            <Plus size={14} /> Add
          </button>
          <button
            aria-label="Sign out"
            className="ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={signOut}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
    </div>
  );
};

export default Header;
