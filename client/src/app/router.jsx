import { Navigate, Route, Routes } from "react-router-dom";
import AiLayout from "./layout/AiLayout.jsx";
import PubLayout from "./layout/PubLayout.jsx";
import Hero from "../components/aihero/Hero.jsx";
import AuthPage from "../pages/AuthPage.jsx";
import Dashboard from "../pages/Dashboard.jsx";

const AppRouter = ({ user, onAuthenticated, onLogout, onUserUpdated }) => (
  <Routes>
    <Route element={<PubLayout />}>
      <Route index element={<Hero />} />
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate replace to="/app" />
          ) : (
            <AuthPage onAuthenticated={onAuthenticated} />
          )
        }
      />
    </Route>

    <Route
      path="/app"
      element={user ? <AiLayout /> : <Navigate replace to="/auth" />}
    >
      <Route
        index
        element={
          <Dashboard
            onLogout={onLogout}
            onUserUpdated={onUserUpdated}
            user={user}
          />
        }
      />
    </Route>
    <Route path="*" element={<Navigate replace to="/" />} />
  </Routes>
);

export default AppRouter;
