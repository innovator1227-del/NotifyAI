import { useEffect, useState } from "react";
import { LoaderCircle, Play, Plus, Trash2 } from "lucide-react";
import api from "../services/api.js";

const emptyRule = {
  name: "",
  matchMode: "all",
  conditions: [{ field: "sender", op: "contains", value: "" }],
  actions: [{ type: "mark_important", value: "" }],
};
const actionLabels = {
  set_priority: "Set priority",
  set_category: "Set category",
  archive: "Archive",
  mark_important: "Mark important",
  mark_read: "Mark read",
};

const RulesPage = ({ onNotice, onRefresh }) => {
  const [rules, setRules] = useState([]);
  const [rule, setRule] = useState(emptyRule);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRules() {
    setLoading(true);
    try {
      const { data } = await api.get("/rules");
      setRules(data.rules);
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not load rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRules();
  }, []);

  function updateRule(key, value) {
    setRule((current) => ({ ...current, [key]: value }));
  }

  async function saveRule(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/rules", rule);
      setRules((current) => [data.rule, ...current]);
      setRule(emptyRule);
      setPreview(null);
      onNotice("Rule created.");
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not create rule.");
    } finally {
      setBusy(false);
    }
  }

  async function previewRule(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/rules/preview", rule);
      setPreview(data);
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not preview rule.");
    } finally {
      setBusy(false);
    }
  }

  async function applyRule(id) {
    setBusy(true);
    try {
      const { data } = await api.post(`/rules/${id}/apply`);
      onNotice(`Rule applied to ${data.updated} notification(s).`);
      onRefresh();
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not apply rule.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRule(id) {
    try {
      await api.delete(`/rules/${id}`);
      setRules((current) => current.filter((entry) => entry._id !== id));
      onNotice("Rule deleted.");
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not delete rule.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-display text-sm font-bold text-slate-900">
            Create a rule
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Match notification content and apply actions automatically when you
            run a rule.
          </p>
        </div>
        <form className="space-y-4" onSubmit={saveRule}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Rule name
            </span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              maxLength={100}
              onChange={(event) => updateRule("name", event.target.value)}
              placeholder="Important security alerts"
              required
              value={rule.name}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Match field
              </span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                onChange={(event) =>
                  updateRule("conditions", [
                    { ...rule.conditions[0], field: event.target.value },
                  ])
                }
                value={rule.conditions[0].field}
              >
                {["sender", "message", "platform", "category", "priority"].map(
                  (field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Operator
              </span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                onChange={(event) =>
                  updateRule("conditions", [
                    { ...rule.conditions[0], op: event.target.value },
                  ])
                }
                value={rule.conditions[0].op}
              >
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="not_contains">does not contain</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Value
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                maxLength={200}
                onChange={(event) =>
                  updateRule("conditions", [
                    { ...rule.conditions[0], value: event.target.value },
                  ])
                }
                placeholder="Security"
                required
                value={rule.conditions[0].value}
              />
            </label>
          </div>
          <label className="block max-w-sm">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Action
            </span>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
              onChange={(event) =>
                updateRule("actions", [{ type: event.target.value, value: "" }])
              }
              value={rule.actions[0].type}
            >
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {["set_category", "set_priority"].includes(rule.actions[0].type) && (
            <label className="block max-w-sm">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Set to
              </span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                onChange={(event) =>
                  updateRule("actions", [
                    { ...rule.actions[0], value: event.target.value },
                  ])
                }
                required
                value={rule.actions[0].value}
              >
                <option value="">Choose a value</option>
                {(rule.actions[0].type === "set_category"
                  ? ["Work", "Personal", "Security", "Promotion", "Other"]
                  : ["critical", "high", "medium", "low"]
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={busy}
              onClick={previewRule}
              type="button"
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={15} />
              ) : (
                <Play size={15} />
              )}
              Preview
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={busy}
              type="submit"
            >
              <Plus size={15} /> Save rule
            </button>
          </div>
        </form>
        {preview && (
          <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-xs text-indigo-900">
            This rule matches <strong>{preview.count}</strong> notification(s).
            {preview.sample.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {preview.sample.map((item) => (
                  <li key={item._id}>
                    {item.senderName}: {item.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-sm font-bold text-slate-900">
          Your rules
        </h2>
        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
            <LoaderCircle className="animate-spin" size={16} /> Loading rules...
          </div>
        ) : rules.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {rules.map((entry) => (
              <article className="py-4 first:pt-1" key={entry._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {entry.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.conditions
                        .map(
                          (condition) =>
                            `${condition.field} ${condition.op.replace("_", " ")} “${condition.value}”`,
                        )
                        .join(` ${entry.matchMode} `)}
                    </p>
                    <p className="mt-1 text-xs text-indigo-600">
                      {entry.actions
                        .map(
                          (action) =>
                            `${actionLabels[action.type]}${action.value ? `: ${action.value}` : ""}`,
                        )
                        .join(", ")}
                    </p>
                  </div>
                  <button
                    aria-label={`Delete ${entry.name}`}
                    className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => void deleteRule(entry._id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <button
                  className="mt-3 rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  disabled={busy || !entry.active}
                  onClick={() => void applyRule(entry._id)}
                >
                  Apply to matching notifications
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs leading-5 text-slate-500">
            No rules yet. Add one to automate notification triage.
          </p>
        )}
      </section>
    </div>
  );
};

export default RulesPage;
