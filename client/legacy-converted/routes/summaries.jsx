import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allNotificationsQuery, digestsQuery } from "@/lib/queries";
import { generateDigest } from "@/lib/notify.functions";
import { EmptyState, PageHeader } from "@/components/notify/bits";
import { NotificationRow } from "@/components/notify/NotificationRow";
export const Route = createFileRoute("/_authenticated/summaries")({
  head: () => ({
    meta: [
      { title: "AI summaries — NotifyAI" },
      {
        name: "description",
        content: "Daily digests and grouped conversations.",
      },
    ],
  }),
  component: Summaries,
});
function DigestCard({ d }) {
  const highlights = d.highlights ?? [];
  const actions = d.next_actions ?? [];
  return _jsxs("div", {
    className: "rounded-xl border bg-card p-5 shadow-card",
    children: [
      _jsxs("div", {
        className:
          "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
        children: [
          _jsx(Badge, {
            variant: d.source === "ai" ? "ai" : "fallback",
            children: d.source === "ai" ? "AI digest" : "Rule-based digest",
          }),
          new Date(d.period_start).toLocaleString(),
          " \u2192 ",
          new Date(d.period_end).toLocaleString(),
          " \u00B7 ",
          d.notification_count,
          " notifications",
        ],
      }),
      _jsx("p", { className: "mt-3 leading-relaxed", children: d.summary }),
      highlights.length > 0 &&
        _jsx("ul", {
          className: "mt-4 grid gap-2 sm:grid-cols-2",
          children: highlights.map((h, i) =>
            _jsxs(
              "li",
              {
                className: "rounded-lg bg-secondary/60 p-3 text-sm",
                children: [
                  _jsx("div", { className: "font-medium", children: h.title }),
                  _jsx("div", {
                    className: "text-muted-foreground",
                    children: h.detail,
                  }),
                ],
              },
              i,
            ),
          ),
        }),
      actions.length > 0 &&
        _jsxs("div", {
          className: "mt-4",
          children: [
            _jsx("div", {
              className:
                "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              children: "Next actions",
            }),
            _jsx("ul", {
              className: "mt-2 list-inside list-disc space-y-1 text-sm",
              children: actions.map((a, i) => _jsx("li", { children: a }, i)),
            }),
          ],
        }),
    ],
  });
}
function Summaries() {
  const [hours, setHours] = useState("24");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const gen = useServerFn(generateDigest);
  const { data: digests, isLoading } = useQuery(digestsQuery());
  const { data: all } = useQuery(allNotificationsQuery(1));
  const today = useMemo(
    () =>
      (all ?? [])
        .filter((n) => !n.archived_status && n.importance_score >= 60)
        .sort((a, b) => b.importance_score - a.importance_score)
        .slice(0, 5),
    [all],
  );
  const unreadHigh = useMemo(
    () =>
      (all ?? []).filter(
        (n) => !n.read_status && ["critical", "high"].includes(n.priority),
      ).length,
    [all],
  );
  const groups = useMemo(() => {
    const m = new Map();
    (all ?? []).forEach((n) =>
      m.set(n.sender_name, (m.get(n.sender_name) ?? 0) + 1),
    );
    return [...m.entries()]
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [all]);
  const run = async () => {
    setBusy(true);
    try {
      const r = await gen({ data: { hours: Number(hours) } });
      if (!r.ok) toast.info(r.message);
      else toast.success("Digest generated");
      qc.invalidateQueries({ queryKey: ["digests"] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return _jsxs("div", {
    children: [
      _jsx(PageHeader, {
        title: "AI summaries",
        description: `${unreadHigh} unread high-priority items today`,
        actions: _jsxs(_Fragment, {
          children: [
            _jsxs(Select, {
              value: hours,
              onValueChange: setHours,
              children: [
                _jsx(SelectTrigger, {
                  className: "h-9 w-36",
                  children: _jsx(SelectValue, {}),
                }),
                _jsxs(SelectContent, {
                  children: [
                    _jsx(SelectItem, {
                      value: "24",
                      children: "Last 24 hours",
                    }),
                    _jsx(SelectItem, { value: "72", children: "Last 3 days" }),
                    _jsx(SelectItem, { value: "168", children: "Last 7 days" }),
                    _jsx(SelectItem, {
                      value: "720",
                      children: "Last 30 days",
                    }),
                  ],
                }),
              ],
            }),
            _jsxs(Button, {
              size: "sm",
              onClick: run,
              disabled: busy,
              children: [
                busy
                  ? _jsx(Loader2, { className: "size-4 animate-spin" })
                  : _jsx(Sparkles, { className: "size-4" }),
                "Generate digest",
              ],
            }),
          ],
        }),
      }),
      _jsxs("div", {
        className: "grid gap-4 lg:grid-cols-3",
        children: [
          _jsxs("div", {
            className: "space-y-4 lg:col-span-2",
            children: [
              _jsx("h2", {
                className: "text-sm font-semibold text-muted-foreground",
                children: "Recent digests",
              }),
              isLoading
                ? _jsx(Skeleton, { className: "h-48" })
                : digests?.length
                  ? digests.map((d) => _jsx(DigestCard, { d: d }, d.id))
                  : _jsx(EmptyState, {
                      icon: FileText,
                      title: "No digests yet",
                      body: "Generate one to get a concise summary of what mattered.",
                    }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-4",
            children: [
              _jsxs("div", {
                className:
                  "overflow-hidden rounded-xl border bg-card shadow-card",
                children: [
                  _jsx("h3", {
                    className: "border-b px-4 py-3 text-sm font-semibold",
                    children: "Today's important",
                  }),
                  today.length
                    ? today.map((n) => _jsx(NotificationRow, { n: n }, n.id))
                    : _jsx("p", {
                        className: "p-4 text-sm text-muted-foreground",
                        children: "Nothing important in the last 24 hours.",
                      }),
                ],
              }),
              _jsxs("div", {
                className: "rounded-xl border bg-card p-4 shadow-card",
                children: [
                  _jsx("h3", {
                    className: "text-sm font-semibold",
                    children: "Grouped conversations",
                  }),
                  groups.length
                    ? _jsx("ul", {
                        className: "mt-3 space-y-2 text-sm",
                        children: groups.map(([s, c]) =>
                          _jsxs(
                            "li",
                            {
                              className: "flex justify-between",
                              children: [
                                _jsx("span", { children: s }),
                                _jsx(Badge, { variant: "soft", children: c }),
                              ],
                            },
                            s,
                          ),
                        ),
                      })
                    : _jsx("p", {
                        className: "mt-2 text-sm text-muted-foreground",
                        children: "No repeated senders today.",
                      }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
