import { useState } from "react";
import {
  Archive,
  Check,
  LoaderCircle,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api.js";

const categories = ["Work", "Personal", "Security", "Promotion", "Other"];
const priorities = ["critical", "high", "medium", "low"];

export default function NotificationDetail({
  item,
  onClose,
  onUpdate,
  onAnalyze,
  onDelete,
  onNotice,
}) {
  const [learnAsRule, setLearnAsRule] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const date = new Date(item.receivedAt || item.createdAt);

  async function updateClassification(field, value) {
    const saved = await onUpdate(item._id, { [field]: value });
    if (!saved || !learnAsRule) return;
    try {
      const sender = item.senderUsername || item.senderName;
      await api.post("/rules", {
        name: `${item.senderName.slice(0, 70)}: set ${field}`,
        matchMode: "all",
        conditions: [{ field: "sender", op: "contains", value: sender }],
        actions: [
          {
            type: field === "category" ? "set_category" : "set_priority",
            value,
          },
        ],
      });
      onNotice("Classification updated and saved as a rule.");
    } catch (error) {
      onNotice(
        error.response?.data?.message ||
          "Classification updated, but the rule could not be saved.",
      );
    }
  }

  async function reanalyze() {
    setAnalyzing(true);
    await onAnalyze(item._id);
    setAnalyzing(false);
  }

  async function removeNotification() {
    setDeleting(true);
    await onDelete(item._id);
    setDeleting(false);
  }

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
            <p className="text-xs font-semibold text-indigo-600">
              {item.platform}
            </p>
            <h2
              className="mt-1 font-display text-xl font-bold text-slate-900"
              id="notification-detail-title"
            >
              {item.senderName}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {item.senderUsername ? `@${item.senderUsername} · ` : ""}
              {Number.isNaN(date.getTime()) ? "" : date.toLocaleString()}
            </p>
          </div>
          <button
            aria-label="Close notification details"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {item.message}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Classification
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {item.category} · {item.priority} priority
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Importance score: {item.importanceScore}/100
            </p>
            {item.reason && (
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {item.reason}
              </p>
            )}
            {item.summary && (
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {item.summary}
              </p>
            )}
            {item.aiSource && (
              <span className="mt-3 inline-flex rounded bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                {item.aiSource === "ai"
                  ? "AI analyzed"
                  : "Local rules analyzed"}
              </span>
            )}
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Suggested action
            </h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {item.suggestedAction ||
                item.summary ||
                "Run inbox triage to get an AI-generated summary and suggested action."}
            </p>
            {item.isSpam && (
              <p className="mt-3 rounded bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700">
                Flagged as possible spam
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Category
            <select
              className="mt-1.5 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(event) =>
                void updateClassification("category", event.target.value)
              }
              value={item.category}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Priority
            <select
              className="mt-1.5 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(event) =>
                void updateClassification("priority", event.target.value)
              }
              value={item.priority}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <input
            checked={learnAsRule}
            className="h-4 w-4 accent-indigo-600"
            onChange={(event) => setLearnAsRule(event.target.checked)}
            type="checkbox"
          />
          Save classification changes as a rule for this sender
        </label>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => onUpdate(item._id, { readStatus: !item.readStatus })}
          >
            <Check size={14} /> {item.readStatus ? "Mark unread" : "Mark read"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() =>
              onUpdate(item._id, { isImportant: !item.isImportant })
            }
          >
            <Star size={14} />{" "}
            {item.isImportant ? "Remove importance" : "Mark important"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() =>
              onUpdate(item._id, { archivedStatus: !item.archivedStatus })
            }
          >
            <Archive size={14} /> {item.archivedStatus ? "Restore" : "Archive"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={analyzing}
            onClick={() => void reanalyze()}
          >
            {analyzing ? (
              <LoaderCircle className="animate-spin" size={14} />
            ) : (
              <Sparkles size={14} />
            )}{" "}
            Re-analyze
          </button>
          {!confirmingDelete ? (
            <button
              className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-2 text-xs">
              <span className="text-slate-600">Delete this notification?</span>
              <button
                className="rounded-md px-2 py-1 font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                disabled={deleting}
                onClick={() => void removeNotification()}
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
