import {
  Activity,
  Bell,
  CheckCheck,
  CircleAlert,
  Inbox,
  LoaderCircle,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import StatCard from "../components/StatCard";
import AnalyticsPage from "./AnalyticsPage";
import RulesPage from "./RulesPage";
import SummariesPage from "./SummariesPage";
import IntegrationsPage from "./IntegrationsPage";
import SettingsPage from "./SettingsPage";
import HelpPage from "./HelpPage";
import NotificationItem from "../components/NotificationItem";

const Main = ({
  activePage,
  user,
  busy,
  loading,
  activeItems = [],
  unread = 0,
  important = 0,
  critical = 0,
  notice,
  showNotice,
  loadNotifications,
  classifyNotifications,
  filters = [],
  visibleItems = [],
  status,
  setStatus,
  query = "",
  setQuery,
  smartBusy,
  smartExplanation,
  setSmartResults,
  setSmartExplanation,
  selectedIds = [],
  setSelectedIds,
  updateSelected,
  updateItem,
  setDetailItem,
  runSmartSearch,
  pages = [],
  setNotice,
  onUserUpdated,
}) => {
  return (
    <div>
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
        {activePage === "summaries" && <SummariesPage onNotice={showNotice} />}
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
                <strong className="mr-2">{selectedIds.length} selected</strong>
                <button
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold hover:bg-slate-100"
                  onClick={() => void updateSelected({ readStatus: true })}
                >
                  Mark read
                </button>
                <button
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold hover:bg-slate-100"
                  onClick={() => void updateSelected({ archivedStatus: true })}
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
              NotifyAI helps you spend less time managing notifications and more
              time on what matters.
            </span>
          </div>
        )}
      </section>
    </div>
  );
};

export default Main;
