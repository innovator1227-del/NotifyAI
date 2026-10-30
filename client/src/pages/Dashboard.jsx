import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  CheckCheck,
  Cable,
  CircleAlert,
  CircleHelp,
  Settings,
  Inbox,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import NotificationItem from "../components/NotificationItem.jsx";
import NotificationDetail from "../components/NotificationDetail.jsx";
import QuickAdd from "../components/QuickAdd.jsx";
import AnalyticsPage from "./AnalyticsPage.jsx";
import IntegrationsPage from "./IntegrationsPage.jsx";
import HelpPage from "./HelpPage.jsx";
import RulesPage from "./RulesPage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import SummariesPage from "./SummariesPage.jsx";
import api from "../services/api.js";

const filters = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "important", label: "Important" },
  { key: "archived", label: "Archived" },
];

const pages = [
  { key: "overview", label: "Overview", icon: Inbox },
  { key: "inbox", label: "All notifications", icon: Bell },
  { key: "priority", label: "Priority inbox", icon: Star },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "rules", label: "Rules", icon: Activity },
  { key: "summaries", label: "AI summaries", icon: Sparkles },
  { key: "integrations", label: "Integrations", icon: Cable },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "help", label: "Help", icon: CircleHelp },
];

const Dashboard = ({ user, onLogout, onUserUpdated }) => {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("overview");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [smartResults, setSmartResults] = useState(null);
  const [smartExplanation, setSmartExplanation] = useState("");
  const [smartBusy, setSmartBusy] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [inbox, archived] = await Promise.all([
        api.get("/notifications", { params: { status: "all", limit: 100 } }),
        api.get("/notifications", {
          params: { status: "archived", limit: 100 },
        }),
      ]);
      setItems([...(inbox.data.rows || []), ...(archived.data.rows || [])]);
      setNotice("");
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          "Could not load notifications. Check that the API is running.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    api
      .get("/ai/status")
      .then(({ data }) => setAiConfigured(data.configured && data.enabled))
      .catch(() => setAiConfigured(false));
  }, []);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const text =
          `${item.senderName} ${item.senderUsername} ${item.message} ${item.platform}`.toLowerCase();
        const matchesQuery = text.includes(query.trim().toLowerCase());
        const matchesStatus =
          status === "archived"
            ? item.archivedStatus
            : !item.archivedStatus &&
              (status === "all" ||
                (status === "unread" && !item.readStatus) ||
                (status === "important" && item.isImportant));
        const matchesPage =
          activePage !== "priority" ||
          item.priority === "critical" ||
          item.priority === "high" ||
          item.importanceScore >= 70;
        const matchesSmartSearch =
          smartResults === null || smartResults.includes(item._id);
        return (
          matchesQuery && matchesStatus && matchesPage && matchesSmartSearch
        );
      }),
    [activePage, items, query, smartResults, status],
  );

  const activeItems = items.filter((item) => !item.archivedStatus);
  const unread = activeItems.filter((item) => !item.readStatus).length;
  const important = activeItems.filter((item) => item.isImportant).length;
  const critical = activeItems.filter(
    (item) => item.priority === "critical",
  ).length;

  function showNotice(message) {
    setNotice(message);
  }

  async function updateItem(id, changes) {
    try {
      const { data } = await api.patch(`/notifications/${id}`, changes);
      setItems((current) =>
        current.map((item) => (item._id === id ? data.notification : item)),
      );
      setDetailItem((current) =>
        current?._id === id ? data.notification : current,
      );
      return true;
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Could not update notification.",
      );
      return false;
    }
  }

  async function analyzeItem(id) {
    try {
      const { data } = await api.post(`/notifications/${id}/analyze`);
      setItems((current) =>
        current.map((item) => (item._id === id ? data.notification : item)),
      );
      setDetailItem((current) =>
        current?._id === id ? data.notification : current,
      );
      setNotice(
        data.notification.aiSource === "ai"
          ? "Notification analyzed with AI."
          : "Notification analyzed with local rules.",
      );
      return true;
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Could not analyze notification.",
      );
      return false;
    }
  }

  async function deleteItem(id) {
    try {
      await api.delete(`/notifications/${id}`);
      setItems((current) => current.filter((item) => item._id !== id));
      setDetailItem(null);
      setNotice("Notification deleted.");
      return true;
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Could not delete notification.",
      );
      return false;
    }
  }

  async function classifyNotifications() {
    if (!activeItems.length) {
      setNotice("Add a notification first.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const { data } = await api.post("/ai/triage", { limit: 25 });
      const updates = new Map(data.updated.map((item) => [item._id, item]));
      setItems((current) =>
        current.map((item) => updates.get(item._id) || item),
      );
      setNotice(
        data.source === "ai"
          ? `AI analyzed ${data.count} notification(s).`
          : `Local rule-based analysis processed ${data.count} notification(s). Add OPENAI_API_KEY to server/.env for AI analysis.`,
      );
    } catch (error) {
      setNotice(error.response?.data?.message || "AI triage failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runSmartSearch() {
    if (!query.trim()) {
      setNotice("Enter a search phrase first.");
      return;
    }
    setSmartBusy(true);
    try {
      const { data } = await api.post("/ai/search", { query });
      setSmartResults(data.rows.map((item) => item._id));
      setSmartExplanation(data.explanation || "");
      setNotice(
        data.source === "ai"
          ? "AI search applied to your inbox."
          : "Keyword search applied. Configure OPENAI_API_KEY for natural-language search.",
      );
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Could not search notifications.",
      );
    } finally {
      setSmartBusy(false);
    }
  }

  async function updateSelected(patch) {
    if (!selectedIds.length) return;
    try {
      await api.patch("/notifications/bulk", { ids: selectedIds, patch });
      setSelectedIds([]);
      await loadNotifications();
      setNotice("Selected notifications updated.");
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          "Could not update selected notifications.",
      );
    }
  }

  function selectPage(page) {
    setActivePage(page);
    setQuery("");
    setSmartResults(null);
    setSmartExplanation("");
    setSelectedIds([]);
    if (page === "inbox") setStatus("all");
    if (page === "priority") setStatus("all");
    if (page === "overview") setStatus("all");
  }

  function signOut() {
    localStorage.removeItem("notifyai_token");
    onLogout();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="mb-12 flex items-center gap-2.5 px-2 font-display text-xl font-extrabold tracking-tight text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Bell size={19} />
          </span>
          Notify<span className="-ml-2 text-indigo-600">AI</span>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
          WORKSPACE
        </p>
        <nav aria-label="Workspace" className="space-y-1">
          {pages.map(({ key, label, icon: Icon }) => (
            <button
              className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${
                activePage === key
                  ? "bg-indigo-50 font-bold text-indigo-700"
                  : "font-medium text-slate-600 hover:bg-slate-50"
              }`}
              key={key}
              onClick={() => selectPage(key)}
            >
              <Icon size={17} /> {label}
              {key === "inbox" && (
                <span className="ml-auto rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {activeItems.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t border-slate-100 px-2 pt-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-slate-400">{user.email}</p>
          </div>
          <button
            aria-label="Sign out"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={signOut}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="min-h-screen md:ml-60">
        <header className="sticky top-0 z-50 w-full flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Workspace</span>
            <span className="text-slate-300">/</span>
            <strong className="text-slate-700">
              {pages.find((page) => page.key === activePage)?.label}
            </strong>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`h-2 w-2 rounded-full ${aiConfigured ? "bg-emerald-500" : "bg-amber-400"}`}
            />
            {aiConfigured ? "AI connected" : "Local analysis"}
            <button
              className="ml-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setShowQuickAdd(true)}
            >
              <Plus size={14} /> Add
            </button>
            <button
              aria-label="Sign out"
              className="ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
              onClick={signOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <nav
          aria-label="Workspace pages"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden"
        >
          {pages.map(({ key, label }) => (
            <button
              className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold ${
                activePage === key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500"
              }`}
              key={key}
              onClick={() => selectPage(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-[0.17em] text-indigo-600">
                {activePage === "overview"
                  ? "YOUR ATTENTION, ORGANIZED"
                  : "NOTIFYAI WORKSPACE"}
              </p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                {activePage === "overview"
                  ? `Good to see you, ${user.name.split(" ")[0]}.`
                  : pages.find((page) => page.key === activePage)?.label}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {activePage === "overview"
                  ? "Here's what matters across your social channels today."
                  : "Manage your notifications and workspace preferences."}
              </p>
            </div>
            {["overview", "inbox", "priority"].includes(activePage) && (
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                disabled={busy || loading || !activeItems.length}
                onClick={classifyNotifications}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                {busy ? "Working..." : "Run AI triage"}
              </button>
            )}
          </div>

          {notice && (
            <div
              className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
              role="status"
            >
              <span className="flex items-center gap-2">
                <CircleAlert className="shrink-0" size={16} />
                {notice}
              </span>
              <button
                aria-label="Dismiss message"
                className="text-lg leading-none text-blue-700"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}

          {activePage === "overview" && (
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total notifications"
                value={activeItems.length}
                note="Across your connected channels"
                icon={Inbox}
              />
              <StatCard
                label="Unread"
                value={unread}
                note="Waiting for your attention"
                icon={Bell}
              />
              <StatCard
                label="Important"
                value={important}
                note="Marked for follow-up"
                icon={Star}
              />
              <StatCard
                label="Critical priority"
                value={critical}
                note="Review these first"
                icon={Activity}
              />
            </div>
          )}

          {activePage === "analytics" && <AnalyticsPage items={activeItems} />}
          {activePage === "rules" && (
            <RulesPage
              onNotice={showNotice}
              onRefresh={() => void loadNotifications()}
            />
          )}
          {activePage === "summaries" && (
            <SummariesPage onNotice={showNotice} />
          )}
          {activePage === "integrations" && (
            <IntegrationsPage
              onNotice={showNotice}
              onSynced={() => void loadNotifications()}
            />
          )}
          {activePage === "settings" && (
            <SettingsPage
              onNotice={showNotice}
              onUserUpdated={onUserUpdated}
              user={user}
            />
          )}
          {activePage === "help" && <HelpPage />}

          {["overview", "inbox", "priority"].includes(activePage) && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Notification inbox
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Prioritized to help you focus on what matters.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live data
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
                <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400 focus-within:border-indigo-400">
                  <Search size={16} />
                  <input
                    className="w-full border-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSmartResults(null);
                      setSmartExplanation("");
                    }}
                    placeholder="Search notifications..."
                    value={query}
                  />
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-2 text-[11px] font-semibold text-indigo-700 disabled:opacity-50"
                    disabled={smartBusy || !query.trim()}
                    onClick={() => void runSmartSearch()}
                  >
                    {smartBusy ? (
                      <LoaderCircle className="animate-spin" size={13} />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    Smart search
                  </button>
                  {filters.map((filter) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-[11px] font-semibold transition ${
                        status === filter.key
                          ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                          : "border-transparent text-slate-500 hover:bg-slate-50"
                      }`}
                      key={filter.key}
                      onClick={() => setStatus(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {smartExplanation && (
                <p className="border-b border-indigo-100 bg-indigo-50/60 px-5 py-2 text-[11px] text-indigo-800">
                  {smartExplanation}
                </p>
              )}

              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs">
                  <strong className="mr-2">
                    {selectedIds.length} selected
                  </strong>
                  <button
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold hover:bg-slate-100"
                    onClick={() => void updateSelected({ readStatus: true })}
                  >
                    Mark read
                  </button>
                  <button
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold hover:bg-slate-100"
                    onClick={() =>
                      void updateSelected({ archivedStatus: true })
                    }
                  >
                    Archive
                  </button>
                  <button
                    className="ml-auto px-2 py-1.5 text-slate-500 hover:text-slate-800"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear selection
                  </button>
                </div>
              )}

              <div>
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                    <LoaderCircle
                      className="animate-spin text-indigo-600"
                      size={18}
                    />
                    Loading notifications...
                  </div>
                ) : visibleItems.length ? (
                  visibleItems.map((item) => (
                    <NotificationItem
                      item={item}
                      key={item._id}
                      onUpdate={updateItem}
                      onSelect={(checked) =>
                        setSelectedIds((current) =>
                          checked
                            ? [...new Set([...current, item._id])]
                            : current.filter((id) => id !== item._id),
                        )
                      }
                      onOpen={setDetailItem}
                      selected={selectedIds.includes(item._id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 px-4 py-14 text-center text-slate-400">
                    <CheckCheck size={25} />
                    <strong className="text-sm text-slate-700">
                      You&apos;re all caught up
                    </strong>
                    <span className="text-xs">
                      No notifications match this view.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400">
                <span>Showing {visibleItems.length} notifications</span>
                <span>Sorted by recent activity</span>
              </div>
            </section>
          )}

          {activePage === "overview" && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-900/75">
              <Sparkles className="shrink-0 text-indigo-600" size={16} />
              <span>
                <strong className="text-indigo-900">Stay focused.</strong>{" "}
                NotifyAI helps you spend less time managing notifications and
                more time on what matters.
              </span>
            </div>
          )}
        </section>
      </main>
      {showQuickAdd && (
        <QuickAdd
          onClose={() => setShowQuickAdd(false)}
          onCreated={(notification) =>
            setItems((current) => [notification, ...current])
          }
          onNotice={showNotice}
        />
      )}
      {detailItem && (
        <NotificationDetail
          item={detailItem}
          onAnalyze={analyzeItem}
          onClose={() => setDetailItem(null)}
          onDelete={deleteItem}
          onNotice={showNotice}
          onUpdate={updateItem}
        />
      )}
    </div>
  );
};

export default Dashboard;
