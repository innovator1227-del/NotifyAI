export default function StatCard({ label, value, note, icon: Icon }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <span>{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{note}</p>
    </article>
  );
}
