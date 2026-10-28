import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Inbox,
  MailWarning,
  Flame,
  Sparkles,
  AlertCircle,
  Wand2,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { allNotificationsQuery } from "@/lib/queries";
import { syncDemoProvider } from "@/lib/notify.functions";
import { useNotifActions } from "@/hooks/use-notif-actions";
import { EmptyState, PageHeader } from "@/components/notify/bits";
import { NotificationRow } from "@/components/notify/NotificationRow";
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — NotifyAI" },
      { name: "description", content: "Your notification overview." },
    ],
  }),
  component: Dashboard,
});
export const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
};
function Stat({ icon: Icon, label, value, tone }) {
  return _jsxs("div", {
    className: "rounded-xl border bg-card p-4 shadow-card",
    children: [
      _jsxs("div", {
        className:
          "flex items-center justify-between text-sm text-muted-foreground",
        children: [label, _jsx(Icon, { className: `size-4 ${tone}` })],
      }),
      _jsx("div", {
        className: "mt-2 text-3xl font-bold tabular-nums",
        children: value,
      }),
    ],
  });
}
function Dashboard() {
  const { data, isLoading } = useQuery(allNotificationsQuery(30));
  const { analyze } = useNotifActions();
  const sync = useServerFn(syncDemoProvider);
  const qc = useQueryClient();
  const stats = useMemo(() => {
    const rows = data ?? [];
    const live = rows.filter((r) => !r.archived_status);
    const days = {};
    for (let i = 13; i >= 0; i--)
      days[new Date(Date.now() - i * 86400_000).toISOString().slice(5, 10)] = 0;
    rows.forEach((r) => {
      const k = r.received_at.slice(5, 10);
      if (k in days) days[k] = (days[k] ?? 0) + 1;
    });
    const cats = {};
    live.forEach((r) => (cats[r.category] = (cats[r.category] ?? 0) + 1));
    return {
      total: rows.length,
      unread: live.filter((r) => !r.read_status).length,
      high: live.filter((r) => ["critical", "high"].includes(r.priority))
        .length,
      ai: rows.filter((r) => r.ai_source).length,
      attention: live.filter(
        (r) =>
          !r.handled &&
          !r.read_status &&
          (["critical", "high"].includes(r.priority) ||
            r.suggested_action === "reply"),
      ).length,
      trend: Object.entries(days).map(([d, c]) => ({ d, c })),
      cats: Object.entries(cats)
        .map(([name, c]) => ({ name, c }))
        .sort((a, b) => b.c - a.c),
      recent: live.slice(0, 6),
      unanalyzed: rows.filter((r) => !r.ai_source).length,
    };
  }, [data]);
  const loadDemo = async () => {
    try {
      let n = 0;
      for (const p of ["demo", "instagram", "linkedin", "x"])
        n += (await sync({ data: { provider: p } })).imported;
      toast.success(`Imported ${n} demo notifications`);
      await qc.invalidateQueries();
      analyze.mutate(undefined);
    } catch (e) {
      toast.error(e.message);
    }
  };
  if (isLoading)
    return _jsxs("div", {
      className: "space-y-4",
      children: [
        _jsx(Skeleton, { className: "h-10 w-60" }),
        _jsx("div", {
          className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-5",
          children: Array.from({ length: 5 }).map((_, i) =>
            _jsx(Skeleton, { className: "h-24" }, i),
          ),
        }),
        _jsx(Skeleton, { className: "h-72" }),
      ],
    });
  return _jsxs("div", {
    children: [
      _jsx(PageHeader, {
        title: "Overview",
        description: "Last 30 days across all connected sources.",
        actions: _jsxs(_Fragment, {
          children: [
            _jsxs(Button, {
              variant: "outline",
              size: "sm",
              onClick: () => analyze.mutate(undefined),
              disabled: analyze.isPending || !stats.unanalyzed,
              children: [
                _jsx(Wand2, { className: "size-4" }),
                "Analyze ",
                stats.unanalyzed ? `(${stats.unanalyzed})` : "",
              ],
            }),
            _jsx(Button, {
              variant: "outline",
              size: "sm",
              asChild: true,
              children: _jsxs(Link, {
                to: "/summaries",
                children: [_jsx(FileText, { className: "size-4" }), "Digest"],
              }),
            }),
          ],
        }),
      }),
      stats.total === 0
        ? _jsx(EmptyState, {
            icon: Inbox,
            title: "No notifications yet",
            body: "Load clearly-labeled demo notifications, add one manually, or connect a platform.",
            action: _jsxs(Button, {
              onClick: loadDemo,
              children: [
                _jsx(Download, { className: "size-4" }),
                "Load demo notifications",
              ],
            }),
          })
        : _jsxs(_Fragment, {
            children: [
              _jsxs("div", {
                className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-5",
                children: [
                  _jsx(Stat, {
                    icon: Inbox,
                    label: "Total",
                    value: stats.total,
                    tone: "text-primary",
                  }),
                  _jsx(Stat, {
                    icon: MailWarning,
                    label: "Unread",
                    value: stats.unread,
                    tone: "text-medium",
                  }),
                  _jsx(Stat, {
                    icon: Flame,
                    label: "High priority",
                    value: stats.high,
                    tone: "text-critical",
                  }),
                  _jsx(Stat, {
                    icon: Sparkles,
                    label: "Analyzed",
                    value: stats.ai,
                    tone: "text-violet",
                  }),
                  _jsx(Stat, {
                    icon: AlertCircle,
                    label: "Needs attention",
                    value: stats.attention,
                    tone: "text-high",
                  }),
                ],
              }),
              _jsxs("div", {
                className: "mt-4 grid gap-4 lg:grid-cols-3",
                children: [
                  _jsxs("div", {
                    className:
                      "rounded-xl border bg-card p-4 shadow-card lg:col-span-2",
                    children: [
                      _jsx("h3", {
                        className: "mb-3 text-sm font-semibold",
                        children: "Notifications \u00B7 last 14 days",
                      }),
                      _jsx(ResponsiveContainer, {
                        width: "100%",
                        height: 220,
                        children: _jsxs(AreaChart, {
                          data: stats.trend,
                          children: [
                            _jsx("defs", {
                              children: _jsxs("linearGradient", {
                                id: "g",
                                x1: "0",
                                y1: "0",
                                x2: "0",
                                y2: "1",
                                children: [
                                  _jsx("stop", {
                                    offset: "0%",
                                    stopColor: "var(--chart-1)",
                                    stopOpacity: 0.4,
                                  }),
                                  _jsx("stop", {
                                    offset: "100%",
                                    stopColor: "var(--chart-1)",
                                    stopOpacity: 0,
                                  }),
                                ],
                              }),
                            }),
                            _jsx(CartesianGrid, {
                              stroke: "var(--border)",
                              vertical: false,
                            }),
                            _jsx(XAxis, {
                              dataKey: "d",
                              stroke: "var(--muted-foreground)",
                              fontSize: 11,
                              tickLine: false,
                              axisLine: false,
                            }),
                            _jsx(YAxis, {
                              allowDecimals: false,
                              stroke: "var(--muted-foreground)",
                              fontSize: 11,
                              tickLine: false,
                              axisLine: false,
                              width: 24,
                            }),
                            _jsx(Tooltip, { contentStyle: tooltipStyle }),
                            _jsx(Area, {
                              dataKey: "c",
                              name: "Notifications",
                              stroke: "var(--chart-1)",
                              fill: "url(#g)",
                              strokeWidth: 2,
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "rounded-xl border bg-card p-4 shadow-card",
                    children: [
                      _jsx("h3", {
                        className: "mb-3 text-sm font-semibold",
                        children: "By category",
                      }),
                      _jsx(ResponsiveContainer, {
                        width: "100%",
                        height: 220,
                        children: _jsxs(BarChart, {
                          data: stats.cats,
                          layout: "vertical",
                          children: [
                            _jsx(XAxis, { type: "number", hide: true }),
                            _jsx(YAxis, {
                              type: "category",
                              dataKey: "name",
                              stroke: "var(--muted-foreground)",
                              fontSize: 11,
                              tickLine: false,
                              axisLine: false,
                              width: 80,
                            }),
                            _jsx(Tooltip, {
                              contentStyle: tooltipStyle,
                              cursor: { fill: "var(--accent)" },
                            }),
                            _jsx(Bar, {
                              dataKey: "c",
                              name: "Count",
                              fill: "var(--chart-2)",
                              radius: 4,
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "mt-4 rounded-xl border bg-card shadow-card",
                children: [
                  _jsxs("div", {
                    className:
                      "flex items-center justify-between border-b px-4 py-3",
                    children: [
                      _jsx("h3", {
                        className: "text-sm font-semibold",
                        children: "Recent",
                      }),
                      _jsx(Link, {
                        to: "/notifications",
                        className: "text-sm text-primary hover:underline",
                        children: "View all",
                      }),
                    ],
                  }),
                  stats.recent.map((n) =>
                    _jsx(NotificationRow, { n: n }, n.id),
                  ),
                ],
              }),
            ],
          }),
    ],
  });
}
