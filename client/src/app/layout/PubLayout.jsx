import { Outlet } from "react-router-dom";
import HeroHeader from "../../components/header/HeroHeader.jsx";

const PubLayout = () => {
  return (
    <>
      <HeroHeader />
      <Outlet />
    </>
  );
};

export default PubLayout;
