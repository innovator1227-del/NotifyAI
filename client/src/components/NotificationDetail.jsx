import { Archive, Check, Star, X } from "lucide-react";

export default function NotificationDetail({ item, onClose, onUpdate }) {
  const date = new Date(item.receivedAt || item.createdAt);

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-slate-900/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="notification-detail-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600">{item.platform}</p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900" id="notification-detail-title">
              {item.senderName}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {item.senderUsername ? `@${item.senderUsername} · ` : ""}
              {Number.isNaN(date.getTime()) ? "" : date.toLocaleString()}
            </p>
          </div>
          <button aria-label="Close notification details" className="rounded-md p-2 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.message}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Classification</h3>
            <p className="mt-2 text-sm font-semibold text-slate-800">{item.category} · {item.priority} priority</p>
            <p className="mt-1 text-xs text-slate-500">Importance score: {item.importanceScore}/100</p>
            {item.reason && <p className="mt-2 text-xs leading-5 text-slate-600">{item.reason}</p>}
            {item.summary && <p className="mt-2 text-xs leading-5 text-slate-600">{item.summary}</p>}
            {item.aiSource && (
              <span className="mt-3 inline-flex rounded bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                {item.aiSource === "ai" ? "AI analyzed" : "Local rules analyzed"}
              </span>
            )}
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Suggested action</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {item.suggestedAction || item.summary || "Run inbox triage to get an AI-generated summary and suggested action."}
            </p>
            {item.isSpam && <p className="mt-3 rounded bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700">Flagged as possible spam</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => onUpdate(item._id, { readStatus: !item.readStatus })}>
            <Check size={14} /> {item.readStatus ? "Mark unread" : "Mark read"}
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => onUpdate(item._id, { isImportant: !item.isImportant })}>
            <Star size={14} /> {item.isImportant ? "Remove importance" : "Mark important"}
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => onUpdate(item._id, { archivedStatus: !item.archivedStatus })}>
            <Archive size={14} /> {item.archivedStatus ? "Restore" : "Archive"}
          </button>
        </div>
      </section>
    </div>
  );
}
