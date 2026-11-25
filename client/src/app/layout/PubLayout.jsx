import { Outlet } from "react-router-dom";
import HeroHeader from "../../components/header/HeroHeader.jsx";

const PubLayout = () => {
  return (
    <>
      <HeroHeader />
      <Outlet />

      <footer className="mt-auto pt-4 pb-6 shadow-2xl bg-inherit text-ellipsis border-t border-slate-200 focus-within:shadow-slate-200/50 font-serif">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            &copy; {new Date().getFullYear()} Bahirdar Universty BiT NOTIFYAI.
            All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default PubLayout;
