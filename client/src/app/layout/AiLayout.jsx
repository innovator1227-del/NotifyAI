import { Outlet } from "react-router-dom";

const AiLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-500 font-serif">
        © {new Date().getFullYear()} NotifyAI. All rights reserved.
      </footer>
    </div>
  );
};

export default AiLayout;
