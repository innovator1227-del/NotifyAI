import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import api from "../services/api.js";

const QuickAdd = ({ onClose, onCreated, onNotice }) => {
  const [form, setForm] = useState({
    platform: "Other",
    senderName: "",
    senderUsername: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/notifications", form);
      onCreated(data.notification);
      onNotice(data.analysisError || "Notification added.");
      onClose();
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not add notification.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-slate-900/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="quick-add-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              className="font-display text-lg font-bold text-slate-900"
              id="quick-add-title"
            >
              Add a notification
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Save a notification to your workspace.
            </p>
          </div>
          <button
            aria-label="Close"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-xs font-semibold text-slate-700">
            Platform
            <select
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal"
              onChange={(event) => update("platform", event.target.value)}
              value={form.platform}
            >
              {[
                "Other",
                "Facebook",
                "Instagram",
                "X",
                "LinkedIn",
                "YouTube",
                "Telegram",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">
              Sender
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal"
                maxLength={120}
                onChange={(event) => update("senderName", event.target.value)}
                required
                value={form.senderName}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Username (optional)
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal"
                maxLength={120}
                onChange={(event) =>
                  update("senderUsername", event.target.value)
                }
                value={form.senderUsername}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-700">
            Message
            <textarea
              className="mt-1.5 min-h-28 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal"
              maxLength={4000}
              onChange={(event) => update("message", event.target.value)}
              required
              value={form.message}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={busy}
              type="submit"
            >
              {busy && <LoaderCircle className="animate-spin" size={14} />}
              Add notification
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default QuickAdd;
