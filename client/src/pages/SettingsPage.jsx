import { useEffect, useState } from "react";
import { Download, LoaderCircle, Save } from "lucide-react";
import api from "../services/api.js";

const categoryOptions = ["Work", "Personal", "Security", "Promotion", "Other"];

export default function SettingsPage({ user, onUserUpdated, onNotice }) {
  const [name, setName] = useState(user.name);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then(({ data }) => setPreferences(data.preferences))
      .catch((error) =>
        onNotice(
          error.response?.data?.message || "Could not load preferences.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", { name });
      onUserUpdated(data.user);
      setName(data.user.name);
      onNotice("Profile updated.");
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePreference(key, value) {
    setSaving(true);
    try {
      const { data } = await api.patch("/settings", { [key]: value });
      setPreferences(data.preferences);
    } catch (error) {
      onNotice(
        error.response?.data?.message || "Could not update preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    try {
      const { data } = await api.get("/settings/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `notifyai-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onNotice("Your data export has been downloaded.");
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not export your data.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <LoaderCircle className="animate-spin" size={20} />
      </div>
    );
  }

  if (!preferences) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Could not load your account preferences.
      </p>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-sm font-bold text-slate-900">
          Profile
        </h2>
        <form className="mt-4 space-y-4" onSubmit={saveProfile}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Display name
            </span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              maxLength={80}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Email address
            </span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
              disabled
              value={user.email}
            />
          </label>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={saving || name === user.name}
            type="submit"
          >
            {saving ? (
              <LoaderCircle className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-sm font-bold text-slate-900">
          Notification preferences
        </h2>
        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-4 text-xs text-slate-700">
            <span>
              <strong className="block">AI-assisted analysis</strong>
              <span className="mt-1 block text-slate-400">
                Allow AI features when the server is configured.
              </span>
            </span>
            <input
              checked={preferences.aiEnabled}
              className="h-4 w-4 accent-indigo-600"
              disabled={saving}
              onChange={(event) =>
                void updatePreference("aiEnabled", event.target.checked)
              }
              type="checkbox"
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-xs text-slate-700">
            <span>
              <strong className="block">Automatic analysis</strong>
              <span className="mt-1 block text-slate-400">
                Analyze notifications when they are imported.
              </span>
            </span>
            <input
              checked={preferences.autoAnalyze}
              className="h-4 w-4 accent-indigo-600"
              disabled={saving}
              onChange={(event) =>
                void updatePreference("autoAnalyze", event.target.checked)
              }
              type="checkbox"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            High-priority threshold: {preferences.priorityThreshold}
            <input
              className="mt-2 block w-full accent-indigo-600"
              max="100"
              min="0"
              onChange={(event) =>
                void updatePreference(
                  "priorityThreshold",
                  Number(event.target.value),
                )
              }
              type="range"
              value={preferences.priorityThreshold}
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-slate-700">
              Important categories
            </legend>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((category) => {
                const checked =
                  preferences.importantCategories.includes(category);
                return (
                  <label
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-xs ${checked ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
                    key={category}
                  >
                    <input
                      checked={checked}
                      className="sr-only"
                      onChange={() => {
                        const next = checked
                          ? preferences.importantCategories.filter(
                              (item) => item !== category,
                            )
                          : [...preferences.importantCategories, category];
                        void updatePreference("importantCategories", next);
                      }}
                      type="checkbox"
                    />
                    {category}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="block text-xs font-semibold text-slate-700">
            Important contacts
            <input
              className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-normal"
              onBlur={(event) => {
                const contacts = event.target.value
                  .split(",")
                  .map((contact) => contact.trim())
                  .filter(Boolean);
                void updatePreference("importantContacts", contacts);
              }}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  importantContactsText: event.target.value,
                }))
              }
              placeholder="Names or usernames, separated by commas"
              value={
                preferences.importantContactsText ??
                preferences.importantContacts.join(", ")
              }
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-xs text-slate-700">
            <span>
              <strong className="block">Quiet hours</strong>
              <span className="mt-1 block text-slate-400">
                Set a time window for quieter notifications.
              </span>
            </span>
            <input
              checked={preferences.quietHoursEnabled}
              className="h-4 w-4 accent-indigo-600"
              disabled={saving}
              onChange={(event) =>
                void updatePreference("quietHoursEnabled", event.target.checked)
              }
              type="checkbox"
            />
          </label>
          {preferences.quietHoursEnabled && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">
                Quiet hours start
                <input
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-normal"
                  onBlur={(event) =>
                    void updatePreference("quietStart", event.target.value)
                  }
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      quietStart: event.target.value,
                    }))
                  }
                  type="time"
                  value={preferences.quietStart}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Quiet hours end
                <input
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-normal"
                  onBlur={(event) =>
                    void updatePreference("quietEnd", event.target.value)
                  }
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      quietEnd: event.target.value,
                    }))
                  }
                  type="time"
                  value={preferences.quietEnd}
                />
              </label>
            </div>
          )}
          <label className="block text-xs font-semibold text-slate-700">
            Digest frequency
            <select
              className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-normal"
              onChange={(event) =>
                void updatePreference("digestFrequency", event.target.value)
              }
              value={preferences.digestFrequency}
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
        <h2 className="font-display text-sm font-bold text-slate-900">
          Your data
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Download your profile, preferences, notifications, rules,
          integrations, and digests as a JSON file.
        </p>
        <button
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
          onClick={() => void exportData()}
        >
          <Download size={15} /> Export my data
        </button>
      </section>
    </div>
  );
}
