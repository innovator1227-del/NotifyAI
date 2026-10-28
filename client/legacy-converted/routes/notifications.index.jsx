import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  MailOpen,
  Mail,
  Star,
  Trash2,
  Wand2,
  Inbox,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notificationsQuery, PAGE_SIZE } from "@/lib/queries";
import { CATEGORIES, PLATFORMS, PRIORITIES } from "@/lib/notify-core";
import { smartSearch } from "@/lib/notify.functions";
import { useNotifActions } from "@/hooks/use-notif-actions";
import {
  EmptyState,
  PageHeader,
  PLATFORM_META,
} from "@/components/notify/bits";
import { NotificationRow } from "@/components/notify/NotificationRow";
import { ConfirmDialog } from "@/components/notify/ConfirmDelete";
const searchSchema = z.object({
  q: z.string().optional(),
  platform: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.enum(["all", "unread", "read", "important", "archived"]).optional(),
  sort: z.enum(["newest", "oldest", "priority", "relevance"]).optional(),
  range: z.enum(["any", "1", "7", "30"]).optional(),
  page: z.number().int().min(0).optional(),
});
export const Route = createFileRoute("/_authenticated/notifications/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "All notifications — NotifyAI" },
      {
        name: "description",
        content: "Browse, filter and manage notifications.",
      },
    ],
  }),
  component: NotificationsPage,
});
function FilterSelect({ value, onChange, placeholder, options }) {
  return _jsxs(Select, {
    value: value ?? "__all",
    onValueChange: (v) => onChange(v === "__all" ? undefined : v),
    children: [
      _jsx(SelectTrigger, {
        className: "h-9 w-[140px]",
        children: _jsx(SelectValue, { placeholder: placeholder }),
      }),
      _jsxs(SelectContent, {
        children: [
          _jsx(SelectItem, { value: "__all", children: placeholder }),
          options.map((o) =>
            _jsx(SelectItem, { value: o.v, children: o.l }, o.v),
          ),
        ],
      }),
    ],
  });
}
function NotificationsPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const set = (patch) =>
    navigate({ search: (p) => ({ ...p, page: undefined, ...patch }) });
  const from =
    s.range && s.range !== "any"
      ? new Date(Date.now() - Number(s.range) * 86400_000).toISOString()
      : undefined;
  const { data, isLoading, isError, error } = useQuery(
    notificationsQuery({ ...s, from }),
  );
  const { update, remove, analyze } = useNotifActions();
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);
  const [smartQ, setSmartQ] = useState("");
  const [smart, setSmart] = useState(null);
  const smartFn = useServerFn(smartSearch);
  const [smartBusy, setSmartBusy] = useState(false);
  const rows = smart ? smart.results : (data?.rows ?? []);
  const ids = [...selected];
  const toggle = (id, v) =>
    setSelected((p) => {
      const n = new Set(p);
      v ? n.add(id) : n.delete(id);
      return n;
    });
  const bulk = (patch) => {
    update.mutate({ ids, patch });
    setSelected(new Set());
  };
  const pages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);
  const runSmart = async (e) => {
    e.preventDefault();
    if (!smartQ.trim()) return;
    setSmartBusy(true);
    try {
      setSmart(await smartFn({ data: { query: smartQ } }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSmartBusy(false);
    }
  };
  return _jsxs("div", {
    children: [
      _jsx(PageHeader, {
        title: "All notifications",
        description: `${data?.count ?? 0} matching`,
      }),
      _jsxs("form", {
        onSubmit: runSmart,
        className: "mb-4 flex gap-2 rounded-xl border bg-card p-2 shadow-card",
        children: [
          _jsx(Sparkles, {
            className: "ml-2 mt-2.5 size-4 shrink-0 text-violet",
          }),
          _jsx(Input, {
            value: smartQ,
            onChange: (e) => setSmartQ(e.target.value),
            placeholder:
              'Smart search, e.g. "unread work messages from this week"',
            className: "border-0 bg-transparent focus-visible:ring-0",
            "aria-label": "Smart search",
          }),
          _jsx(Button, {
            type: "submit",
            size: "sm",
            variant: "secondary",
            disabled: smartBusy,
            children: smartBusy ? "Searching…" : "Ask",
          }),
        ],
      }),
      smart &&
        _jsxs("div", {
          className: "mb-3 flex flex-wrap items-center gap-2 text-sm",
          children: [
            _jsx(Badge, {
              variant: smart.source === "ai" ? "ai" : "fallback",
              children:
                smart.source === "ai" ? "AI interpreted" : "Keyword search",
            }),
            _jsxs("span", {
              className: "text-muted-foreground",
              children: [smart.results.length, " results"],
            }),
            _jsxs(Button, {
              size: "sm",
              variant: "ghost",
              onClick: () => setSmart(null),
              children: [_jsx(X, { className: "size-3.5" }), "Clear"],
            }),
          ],
        }),
      !smart &&
        _jsxs(_Fragment, {
          children: [
            _jsx(Tabs, {
              value: s.status ?? "all",
              onValueChange: (v) => set({ status: v }),
              className: "mb-3",
              children: _jsx(TabsList, {
                children: [
                  "all",
                  "unread",
                  "read",
                  "important",
                  "archived",
                ].map((t) =>
                  _jsx(
                    TabsTrigger,
                    { value: t, className: "capitalize", children: t },
                    t,
                  ),
                ),
              }),
            }),
            _jsxs("div", {
              className: "mb-4 flex flex-wrap gap-2",
              children: [
                _jsx(
                  Input,
                  {
                    defaultValue: s.q,
                    placeholder: "Filter text\u2026",
                    className: "h-9 w-48",
                    onKeyDown: (e) =>
                      e.key === "Enter" &&
                      set({ q: e.target.value || undefined }),
                    "aria-label": "Filter text",
                  },
                  s.q,
                ),
                _jsx(FilterSelect, {
                  value: s.platform,
                  onChange: (v) => set({ platform: v }),
                  placeholder: "All platforms",
                  options: PLATFORMS.map((p) => ({
                    v: p,
                    l: PLATFORM_META[p]?.label ?? p,
                  })),
                }),
                _jsx(FilterSelect, {
                  value: s.category,
                  onChange: (v) => set({ category: v }),
                  placeholder: "All categories",
                  options: CATEGORIES.map((c) => ({ v: c, l: c })),
                }),
                _jsx(FilterSelect, {
                  value: s.priority,
                  onChange: (v) => set({ priority: v }),
                  placeholder: "All priorities",
                  options: PRIORITIES.map((c) => ({ v: c, l: c })),
                }),
                _jsx(FilterSelect, {
                  value: s.range,
                  onChange: (v) => set({ range: v }),
                  placeholder: "Any time",
                  options: [
                    { v: "1", l: "Last 24h" },
                    { v: "7", l: "Last 7 days" },
                    { v: "30", l: "Last 30 days" },
                  ],
                }),
                _jsx(FilterSelect, {
                  value: s.sort,
                  onChange: (v) => set({ sort: v }),
                  placeholder: "Newest",
                  options: [
                    { v: "oldest", l: "Oldest" },
                    { v: "priority", l: "Priority" },
                    { v: "relevance", l: "Relevance" },
                  ],
                }),
              ],
            }),
          ],
        }),
      selected.size > 0 &&
        _jsxs("div", {
          className:
            "sticky top-16 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-popover p-2 shadow-card",
          children: [
            _jsxs("span", {
              className: "px-2 text-sm font-medium",
              children: [selected.size, " selected"],
            }),
            _jsxs(Button, {
              size: "sm",
              variant: "ghost",
              onClick: () => bulk({ read_status: true }),
              children: [_jsx(MailOpen, { className: "size-4" }), "Read"],
            }),
            _jsxs(Button, {
              size: "sm",
              variant: "ghost",
              onClick: () => bulk({ read_status: false }),
              children: [_jsx(Mail, { className: "size-4" }), "Unread"],
            }),
            _jsxs(Button, {
              size: "sm",
              variant: "ghost",
              onClick: () => bulk({ is_important: true }),
              children: [_jsx(Star, { className: "size-4" }), "Important"],
            }),
            _jsxs(Button, {
              size: "sm",
              variant: "ghost",
              onClick: () => bulk({ archived_status: s.status !== "archived" }),
              children: [
                s.status === "archived"
                  ? _jsx(ArchiveRestore, { className: "size-4" })
                  : _jsx(Archive, { className: "size-4" }),
                s.status === "archived" ? "Restore" : "Archive",
              ],
            }),
            _jsxs(Button, {
              size: "sm",
              variant: "ghost",
              onClick: () => {
                analyze.mutate(ids);
                setSelected(new Set());
              },
              children: [_jsx(Wand2, { className: "size-4" }), "Re-analyze"],
            }),
            _jsxs(Button, {
              size: "sm",
              variant: "ghost",
              className: "text-destructive",
              onClick: () => setConfirm(ids),
              children: [_jsx(Trash2, { className: "size-4" }), "Delete"],
            }),
          ],
        }),
      _jsxs("div", {
        className: "overflow-hidden rounded-xl border bg-card shadow-card",
        children: [
          rows.length > 0 &&
            _jsxs("div", {
              className:
                "flex items-center gap-3 border-b px-4 py-2 text-xs text-muted-foreground",
              children: [
                _jsx(Checkbox, {
                  checked: rows.every((r) => selected.has(r.id)),
                  onCheckedChange: (v) =>
                    setSelected(v ? new Set(rows.map((r) => r.id)) : new Set()),
                  "aria-label": "Select all",
                }),
                "Select page",
              ],
            }),
          isLoading && !smart
            ? _jsx("div", {
                className: "space-y-px",
                children: Array.from({ length: 6 }).map((_, i) =>
                  _jsx(Skeleton, { className: "h-20 rounded-none" }, i),
                ),
              })
            : isError
              ? _jsxs("div", {
                  className: "p-6 text-sm text-destructive",
                  children: ["Failed to load: ", error.message],
                })
              : rows.length === 0
                ? _jsx("div", {
                    className: "p-6",
                    children: _jsx(EmptyState, {
                      icon: Inbox,
                      title: "Nothing here",
                      body: "No notifications match these filters.",
                    }),
                  })
                : rows.map((n) =>
                    _jsx(
                      NotificationRow,
                      {
                        n: n,
                        selected: selected.has(n.id),
                        onSelect: (v) => toggle(n.id, v),
                        onDelete: () => setConfirm([n.id]),
                      },
                      n.id,
                    ),
                  ),
        ],
      }),
      !smart &&
        pages > 1 &&
        _jsxs("div", {
          className: "mt-4 flex items-center justify-center gap-2",
          children: [
            _jsx(Button, {
              variant: "outline",
              size: "sm",
              disabled: !s.page,
              onClick: () =>
                navigate({
                  search: (p) => ({ ...p, page: (s.page ?? 0) - 1 }),
                }),
              children: "Previous",
            }),
            _jsxs("span", {
              className: "text-sm text-muted-foreground",
              children: ["Page ", (s.page ?? 0) + 1, " of ", pages],
            }),
            _jsx(Button, {
              variant: "outline",
              size: "sm",
              disabled: (s.page ?? 0) + 1 >= pages,
              onClick: () =>
                navigate({
                  search: (p) => ({ ...p, page: (s.page ?? 0) + 1 }),
                }),
              children: "Next",
            }),
          ],
        }),
      _jsx(ConfirmDialog, {
        open: !!confirm,
        onOpenChange: (v) => !v && setConfirm(null),
        title: `Delete ${confirm?.length ?? 0} notification(s)?`,
        body: "This permanently removes them. This can't be undone.",
        onConfirm: () => {
          if (confirm) remove.mutate(confirm);
          setConfirm(null);
          setSelected(new Set());
        },
      }),
    ],
  });
}
