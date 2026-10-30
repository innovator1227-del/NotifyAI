import { ArrowRight, Bell, Check, Clock3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <main className="relative isolate min-h-[calc(100vh-4.5rem)] overflow-hidden bg-slate-50">
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -right-32 top-20 h-[26rem] w-[26rem] rounded-full bg-violet-200/40 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_0.7px,transparent_0.7px)] [background-size:24px_24px] opacity-20" />
    </div>

    <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-20">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs font-bold tracking-wide text-indigo-700 shadow-sm">
          <Sparkles size={14} />A smarter way to stay in the loop
        </div>
        <h1 className="mt-7 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
          Your notifications,
          <span className="block text-indigo-600">finally in focus.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Bring every update into one calm workspace. Let AI surface what
          matters, so you can spend less time sorting and more time doing.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/25"
            to="/auth?mode=register"
          >
            Get started free <ArrowRight size={17} />
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
            to="/auth"
          >
            Log in
          </Link>
        </div>
        <p className="mt-5 text-xs font-medium text-slate-500">
          A clearer inbox starts with one simple step.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
        <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-indigo-200/70 via-white/40 to-violet-200/70 blur-2xl" />
        <div className="relative rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                YOUR WORKSPACE
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Today at focus
              </h2>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Bell size={20} />
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-indigo-600 p-5 text-white">
            <div>
              <p className="text-sm font-medium text-indigo-100">
                Important updates
              </p>
              <p className="mt-1 text-3xl font-extrabold">03</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
              <Sparkles size={21} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Check size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  Your day, organized
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Noise filtered. Priorities found.
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Now
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  A little more focus
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Catch up when you’re ready.
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                2 min
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Everything important, all in one place
          </div>
        </div>
        <div className="absolute -bottom-14 -left-0 hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-lg sm:flex">
          <Sparkles className="text-indigo-600" size={16} />
          Less noise, more signal
        </div>
      </div>
    </section>
  </main>
);

export default Hero;
