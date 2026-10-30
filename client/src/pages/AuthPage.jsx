import { useState } from "react";
import { Bell, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api.js";

const AuthPage = ({ onAuthenticated }) => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isRegistering = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const payload = isRegistering
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("notifyai_token", data.token);
      onAuthenticated(data.user);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setErrorMessage("");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-indigo-700 p-12 text-white md:flex">
          <div>
            <div className="flex items-center gap-3 font-display text-xl font-extrabold tracking-tight">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Bell size={20} />
              </span>
              <span className="text-indigo-200">NotifyAI</span>
            </div>
            <div className="mt-24 max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Your attention, organized
              </p>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight">
                Make room for what matters.
              </h1>
              <p className="mt-5 text-sm leading-7 text-indigo-100">
                Bring your notifications together and focus on the ones that
                deserve your attention.
              </p>
            </div>
          </div>
          <p className="text-xs text-indigo-200">
            A calmer way to stay connected.
          </p>
        </div>

        <div className="px-6 py-10 sm:px-12 sm:py-14">
          <div className="mb-9 flex items-center gap-3 font-display text-lg font-extrabold tracking-tight text-slate-900 md:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
              <Bell size={18} />
            </span>
            Notify<span className="-ml-3 text-indigo-600">AI</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              {isRegistering ? "Get started" : "Welcome back"}
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900">
              {isRegistering ? "Create your account" : "Sign in to NotifyAI"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isRegistering
                ? "Create an account to securely manage your notifications."
                : "Use your account to continue to your workspace."}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            {isRegistering && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Full name
                </span>
                <input
                  autoComplete="name"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  maxLength={80}
                  minLength={2}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                  value={name}
                />
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </span>
              <span className="relative block">
                <input
                  autoComplete={
                    isRegistering ? "new-password" : "current-password"
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  minLength={isRegistering ? 8 : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    isRegistering ? "At least 8 characters" : "Your password"
                  }
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {errorMessage && (
              <p
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-wait disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy && <LoaderCircle className="animate-spin" size={17} />}
              {busy
                ? isRegistering
                  ? "Creating account..."
                  : "Signing in..."
                : isRegistering
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {isRegistering ? "Already have an account?" : "New to NotifyAI?"}{" "}
            <button
              className="font-bold text-indigo-600 hover:text-indigo-700"
              onClick={() => changeMode(isRegistering ? "login" : "register")}
              type="button"
            >
              {isRegistering ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
