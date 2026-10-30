import { useCallback, useEffect, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import api from "./services/api.js";
import AppRouter from "./app/router.jsx";
const App = () => {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(
    Boolean(localStorage.getItem("notifyai_token")),
  );
  const [sessionError, setSessionError] = useState("");

  const clearSession = useCallback(() => {
    localStorage.removeItem("notifyai_token");
    setUser(null);
  }, []);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem("notifyai_token");
    if (!token) {
      setCheckingSession(false);
      setSessionError("");
      return;
    }

    setCheckingSession(true);
    setSessionError("");
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
      } else {
        setSessionError(
          error.response?.data?.message ||
            "Unable to verify your session. Check the API connection and try again.",
        );
      }
    } finally {
      setCheckingSession(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("notifyai:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("notifyai:unauthorized", handleUnauthorized);
  }, [clearSession]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <LoaderCircle className="mr-3 animate-spin text-indigo-600" size={22} />
        <span className="text-sm">Verifying your session...</span>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 text-rose-500" size={30} />
          <h1 className="font-display text-xl font-bold text-slate-900">
            Could not verify your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {sessionError}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => void checkSession()}
            >
              Try again
            </button>
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={() => {
                clearSession();
                setSessionError("");
              }}
            >
              Sign in again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <AppRouter
      onAuthenticated={(authenticatedUser) => {
        setSessionError("");
        setUser(authenticatedUser);
      }}
      onLogout={clearSession}
      onUserUpdated={setUser}
      user={user}
    />
  );
};

export default App;
