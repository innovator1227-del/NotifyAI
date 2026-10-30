import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

const HeroHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg px-3 py-2 shadow-lg hover:translate-x-1 transition-all duration-300">
          <Link
            aria-label="NotifyAI home"
            className="flex shrink-0 items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-slate-900"
            to="/"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <Bell size={20} />
            </span>
            <span>
              Notify<span className="text-indigo-600">AI</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Account" className="flex items-center gap-2 sm:gap-3">
          <Link
            className="rounded-lg px-3 py-2 text-lg font-serif font-semibold text-slate-600 hover:text-indigo-700 shadow-lg hover:-translate-x-2 transition-all duration-300"
            to="/auth"
          >
            Login
          </Link>
          <Link
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-indigo-600/20 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg hover:translate-x-2 transition-all duration-300"
            to="/auth?mode=register"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default HeroHeader;
