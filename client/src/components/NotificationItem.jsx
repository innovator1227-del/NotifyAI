import { Archive, Check, Star } from "lucide-react";

const platformColors = {
  instagram: "bg-pink-50 text-pink-700",
  facebook: "bg-blue-50 text-blue-700",
  youtube: "bg-red-50 text-red-700",
  x: "bg-slate-200 text-slate-900",
  telegram: "bg-sky-50 text-sky-700",
};

const NotificationItem = ({
  item,
  onUpdate,
  onSelect,
  onOpen,
  selected = false,
}) => {
  const platformClass =
    platformColors[item.platform?.toLowerCase()] ||
    "bg-indigo-50 text-indigo-700";
  const priorityClass =
    {
      critical: "bg-rose-50 text-rose-700",
      high: "bg-amber-50 text-amber-700",
      medium: "bg-blue-50 text-blue-700",
      low: "bg-slate-100 text-slate-600",
    }[item.priority] || "bg-blue-50 text-blue-700";
  const date = new Date(item.receivedAt || item.createdAt);

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
        aria-label={item.platform || "Other"}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${platformClass}`}
      >
        {(item.platform || "N").slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            className="text-left text-xs font-bold text-slate-800 hover:text-indigo-700"
            onClick={() => onOpen?.(item)}
            type="button"
          >
            {item.senderName}
          </button>
          <span className="text-[10px] text-slate-400">
            @{item.senderUsername || "notification"}
          </span>
          <time className="ml-auto text-[10px] text-slate-400">
            {Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()}
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
          <span
            className={`rounded px-2 py-1 text-[10px] font-bold ${priorityClass}`}
          >
            {item.priority || "medium"} priority
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-0.5">
        <button
          aria-label={item.readStatus ? "Mark unread" : "Mark read"}
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
          onClick={() => onUpdate(item._id, { readStatus: !item.readStatus })}
          title={item.readStatus ? "Mark unread" : "Mark read"}
        >
          <Check size={16} />
        </button>
        <button
          aria-label={item.isImportant ? "Remove importance" : "Mark important"}
          className={`grid h-8 w-8 place-items-center rounded-md hover:bg-amber-50 hover:text-amber-600 ${
            item.isImportant ? "text-amber-500" : "text-slate-400"
          }`}
          onClick={() => onUpdate(item._id, { isImportant: !item.isImportant })}
          title={item.isImportant ? "Remove importance" : "Mark important"}
        >
          <Star size={16} />
        </button>
        <button
          aria-label={
            item.archivedStatus
              ? "Restore notification"
              : "Archive notification"
          }
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={() =>
            onUpdate(item._id, { archivedStatus: !item.archivedStatus })
          }
          title={item.archivedStatus ? "Restore" : "Archive"}
        >
          <Archive size={16} />
        </button>
      </div>
    </article>
  );
};

export default NotificationItem;
