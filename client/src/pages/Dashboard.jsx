import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Cable,
  CircleHelp,
  Settings,
  Inbox,
  Sparkles,
  Star,
} from "lucide-react";
import NotificationDetail from "../components/NotificationDetail.jsx";
import QuickAdd from "../components/QuickAdd.jsx";
import api from "../services/api.js";
import Main from "./Main.jsx";
import Sidebar from "../components/sidebar/Sidebar.jsx";
import AiHeader from "../components/header/AiHeader.jsx";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-serif">
      <Sidebar
        pages={pages}
        activePage={activePage}
        selectPage={selectPage}
        activeItems={activeItems}
        user={user}
        signOut={signOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main
        className={`min-h-screen transition-all duration-300 ${sidebarOpen ? "md:ml-60" : "md:ml-20"} `}
      >
        <AiHeader
          aiConfigured={aiConfigured}
          setShowQuickAdd={setShowQuickAdd}
          signOut={signOut}
          pages={pages}
          activePage={activePage}
          setQuery={setQuery}
          setSmartResults={setSmartResults}
          setSmartExplanation={setSmartExplanation}
          query={query}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

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

        <Main
          activePage={activePage}
          user={user}
          busy={busy}
          loading={loading}
          activeItems={activeItems}
          unread={unread}
          important={important}
          critical={critical}
          notice={notice}
          showNotice={showNotice}
          setNotice={setNotice}
          loadNotifications={loadNotifications}
          visibleItems={visibleItems}
          filters={filters}
          status={status}
          setStatus={setStatus}
          query={query}
          setQuery={setQuery}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          smartBusy={smartBusy}
          smartExplanation={smartExplanation}
          setSmartResults={setSmartResults}
          setSmartExplanation={setSmartExplanation}
          updateSelected={updateSelected}
          updateItem={updateItem}
          setDetailItem={setDetailItem}
          runSmartSearch={runSmartSearch}
          classifyNotifications={classifyNotifications}
          pages={pages}
          onUserUpdated={onUserUpdated}
        />

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
      </main>
    </div>
  );
};

export default Dashboard;
