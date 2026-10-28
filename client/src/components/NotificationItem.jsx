import { Archive, Check, Star } from "lucide-react";

const platformColors = {
  instagram: "bg-pink-50 text-pink-700",
  facebook: "bg-blue-50 text-blue-700",
  linkedin: "bg-sky-50 text-sky-800",
  youtube: "bg-red-50 text-red-700",
  x: "bg-slate-200 text-slate-900",
  telegram: "bg-sky-50 text-sky-700",
};

export default function NotificationItem({ item, onUpdate, onSelect, onOpen, selected = false }) {
  const platform = item.platform || "Other";
  const platformClass =
    platformColors[platform.toLowerCase()] || "bg-indigo-50 text-indigo-700";
  const priorityClass = {
    critical: "bg-rose-50 text-rose-700",
    high: "bg-amber-50 text-amber-700",
    medium: "bg-blue-50 text-blue-700",
    low: "bg-slate-100 text-slate-600",
  }[item.priority] || "bg-blue-50 text-blue-700";
  const date = new Date(item.receivedAt || item.createdAt);
  const hasValidDate = !Number.isNaN(date.getTime());
  const actionLabel = item.readStatus ? "Mark unread" : "Mark read";

  return (
    <article
      className={`flex items-start gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-slate-50/70 ${
        item.readStatus ? "opacity-75" : ""
      }`}
    >
      {onSelect && (
        <input
          aria-label={`Select notification from ${item.senderName}`}
          checked={selected}
          className="mt-2 h-4 w-4 shrink-0 accent-indigo-600"
          onChange={(event) => onSelect(event.target.checked)}
          type="checkbox"
        />
      )}
      <div
        aria-hidden="true"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${platformClass}`}
      >
        {platform.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            className="rounded-sm text-left text-xs font-bold text-slate-800 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={() => onOpen?.(item)}
            type="button"
          >
            {item.senderName || "Unknown sender"}
          </button>
          <span className="text-[10px] text-slate-400">
            @{item.senderUsername || "notification"}
          </span>
          <time
            className="ml-auto text-[10px] text-slate-400"
            dateTime={hasValidDate ? date.toISOString() : undefined}
            title={hasValidDate ? date.toLocaleString() : undefined}
          >
            {hasValidDate ? date.toLocaleDateString() : "Date unavailable"}
          </time>
        </div>
        <p className="my-2 text-xs leading-5 text-slate-600">{item.message}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
            {item.platform || "Other"}
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
            {item.category || "Other"}
          </span>
          <span className={`rounded px-2 py-1 text-[10px] font-bold ${priorityClass}`}>
            {item.priority || "medium"} priority
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-0.5">
        <button
          aria-label={actionLabel}
          aria-pressed={Boolean(item.readStatus)}
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
          onClick={() =>
            onUpdate(item._id, { readStatus: !item.readStatus })
          }
          type="button"
          title={actionLabel}
        >
          <Check size={16} />
        </button>
        <button
          aria-label={item.isImportant ? "Remove importance" : "Mark important"}
          aria-pressed={Boolean(item.isImportant)}
          className={`grid h-8 w-8 place-items-center rounded-md hover:bg-amber-50 hover:text-amber-600 ${
            item.isImportant ? "text-amber-500" : "text-slate-400"
          } focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600`}
          onClick={() =>
            onUpdate(item._id, { isImportant: !item.isImportant })
          }
          type="button"
          title={item.isImportant ? "Remove importance" : "Mark important"}
        >
          <Star size={16} />
        </button>
        <button
          aria-label={item.archivedStatus ? "Restore notification" : "Archive notification"}
          aria-pressed={Boolean(item.archivedStatus)}
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600"
          onClick={() => onUpdate(item._id, { archivedStatus: !item.archivedStatus })}
          type="button"
          title={item.archivedStatus ? "Restore" : "Archive"}
        >
          <Archive size={16} />
        </button>
      </div>
    </article>
  );
}
