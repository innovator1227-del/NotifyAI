import { useMemo } from "react";
import { BarChart3, CircleCheck, CircleHelp, Inbox } from "lucide-react";
import StatCard from "../components/StatCard.jsx";

function Bars({ title, rows }) {
  const maximum = Math.max(1, ...rows.map(([, count]) => count));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold text-slate-900">{title}</h2>
      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.map(([label, count]) => (
            <div className="flex items-center gap-3" key={label}>
              <span className="w-24 truncate text-xs text-slate-500">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(count / maximum) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-semibold text-slate-700">
                {count}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-xs text-slate-400">No data to display yet.</p>
      )}
    </section>
  );
}

export default function AnalyticsPage({ items }) {
  const analytics = useMemo(() => {
    const categories = new Map();
    const platforms = new Map();
    const priorities = new Map();
    const senders = new Map();
    const days = new Map();
    let analyzed = 0;
    let unread = 0;

    for (const item of items) {
      categories.set(item.category || "Other", (categories.get(item.category || "Other") || 0) + 1);
      platforms.set(item.platform || "Other", (platforms.get(item.platform || "Other") || 0) + 1);
      priorities.set(item.priority || "medium", (priorities.get(item.priority || "medium") || 0) + 1);
      senders.set(item.senderName, (senders.get(item.senderName) || 0) + 1);
      if (item.aiSource) analyzed += 1;
      if (!item.readStatus) unread += 1;

      const received = new Date(item.receivedAt || item.createdAt);
      if (!Number.isNaN(received.getTime())) {
        const key = received.toLocaleDateString();
        days.set(key, (days.get(key) || 0) + 1);
      }
    }

    return {
      categories: [...categories].sort((a, b) => b[1] - a[1]),
      platforms: [...platforms].sort((a, b) => b[1] - a[1]),
      priorities: [...priorities].sort((a, b) => b[1] - a[1]),
      senders: [...senders].sort((a, b) => b[1] - a[1]).slice(0, 8),
      days: [...days].slice(-14),
      analyzed,
      unread,
    };
  }, [items]);

  const sortedDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const label = date.toLocaleDateString();
    return [date.toLocaleDateString("en", { month: "short", day: "numeric" }), analytics.days.find(([day]) => day === label)?.[1] || 0];
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total analyzed" value={items.length} note="Notifications in your workspace" icon={Inbox} />
        <StatCard label="Unread" value={analytics.unread} note="Waiting for your attention" icon={CircleHelp} />
        <StatCard label="AI analyzed" value={analytics.analyzed} note="Processed by AI or local rules" icon={CircleCheck} />
        <StatCard label="Platforms" value={analytics.platforms.length} note="Sources represented in your inbox" icon={BarChart3} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Bars title="14-day notification volume" rows={sortedDays} />
        <Bars title="By platform" rows={analytics.platforms} />
        <Bars title="By category" rows={analytics.categories} />
        <Bars title="By priority" rows={analytics.priorities} />
        <Bars title="Top senders" rows={analytics.senders} />
      </div>
    </div>
  );
}
