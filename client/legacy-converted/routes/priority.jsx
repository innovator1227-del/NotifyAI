import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ShieldAlert,
  Flame,
  Users,
  Briefcase,
  Reply,
  Star,
  PartyPopper,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { allNotificationsQuery, prefsQuery } from "@/lib/queries";
import { PRIORITY_RANK } from "@/lib/notify-core";
import { EmptyState, PageHeader } from "@/components/notify/bits";
import { NotificationRow } from "@/components/notify/NotificationRow";
export const Route = createFileRoute("/_authenticated/priority")({
  head: () => ({
    meta: [
      { title: "Priority inbox — NotifyAI" },
      {
        name: "description",
        content: "The notifications that need you first.",
      },
    ],
  }),
  component: Priority,
});
function Section({ icon: Icon, title, rows, tone }) {
  if (!rows.length) return null;
  return _jsxs("div", {
    className: "overflow-hidden rounded-xl border bg-card shadow-card",
    children: [
      _jsxs("div", {
        className: "flex items-center gap-2 border-b px-4 py-3",
        children: [
          _jsx(Icon, { className: `size-4 ${tone}` }),
          _jsx("h3", { className: "text-sm font-semibold", children: title }),
          _jsx("span", {
            className: "ml-auto text-xs text-muted-foreground",
            children: rows.length,
          }),
        ],
      }),
      rows.map((n) => _jsx(NotificationRow, { n: n, showHandled: true }, n.id)),
    ],
  });
}
function Priority() {
  const { data, isLoading } = useQuery(allNotificationsQuery(30));
  const { data: prefs } = useQuery(prefsQuery());
  const groups = useMemo(() => {
    const live = (data ?? [])
      .filter((n) => !n.archived_status && !n.handled)
      .sort(
        (a, b) =>
          (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0) ||
          b.importance_score - a.importance_score,
      );
    const used = new Set();
    const take = (f) =>
      live
        .filter((n) => !used.has(n.id) && f(n))
        .map((n) => (used.add(n.id), n));
    const contacts = (prefs?.important_contacts ?? [])
      .map((c) => c.toLowerCase())
      .filter(Boolean);
    const threshold = prefs?.priority_threshold ?? 70;
    return {
      security: take((n) => n.category === "security"),
      critical: take(
        (n) => n.priority === "critical" || n.importance_score >= 90,
      ),
      contacts: take((n) =>
        contacts.some(
          (c) =>
            n.sender_name.toLowerCase().includes(c) ||
            (n.sender_username ?? "").toLowerCase().includes(c),
        ),
      ),
      high: take(
        (n) => n.priority === "high" || n.importance_score >= threshold,
      ),
      saved: take((n) => n.is_important),
      work: take((n) => n.category === "work" && n.priority !== "low"),
      reply: take((n) => n.suggested_action === "reply" && !n.read_status),
    };
  }, [data, prefs]);
  if (isLoading) return _jsx(Skeleton, { className: "h-96" });
  const empty = Object.values(groups).every((g) => !g.length);
  return _jsxs("div", {
    children: [
      _jsx(PageHeader, {
        title: "Priority inbox",
        description:
          "Most important first. Tune contacts and thresholds in Settings.",
        actions: _jsx(Button, {
          variant: "outline",
          size: "sm",
          asChild: true,
          children: _jsx(Link, {
            to: "/settings",
            children: "Configure priorities",
          }),
        }),
      }),
      empty
        ? _jsx(EmptyState, {
            icon: PartyPopper,
            title: "All clear",
            body: "Nothing important is waiting on you right now.",
          })
        : _jsxs("div", {
            className: "space-y-4",
            children: [
              _jsx(Section, {
                icon: ShieldAlert,
                title: "Security alerts",
                rows: groups.security,
                tone: "text-critical",
              }),
              _jsx(Section, {
                icon: Flame,
                title: "Critical",
                rows: groups.critical,
                tone: "text-critical",
              }),
              _jsx(Section, {
                icon: Users,
                title: "Important contacts",
                rows: groups.contacts,
                tone: "text-violet",
              }),
              _jsx(Section, {
                icon: Flame,
                title: "High priority",
                rows: groups.high,
                tone: "text-high",
              }),
              _jsx(Section, {
                icon: Star,
                title: "Saved for later",
                rows: groups.saved,
                tone: "text-high",
              }),
              _jsx(Section, {
                icon: Briefcase,
                title: "Work",
                rows: groups.work,
                tone: "text-primary",
              }),
              _jsx(Section, {
                icon: Reply,
                title: "May need a reply",
                rows: groups.reply,
                tone: "text-medium",
              }),
            ],
          }),
    ],
  });
}
