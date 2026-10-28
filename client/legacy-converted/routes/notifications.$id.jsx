import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Wand2,
  Trash2,
  Archive,
  ArchiveRestore,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PRIORITIES } from "@/lib/notify-core";
import { useNotifActions } from "@/hooks/use-notif-actions";
import {
  PlatformIcon,
  PLATFORM_META,
  PriorityBadge,
  SourceBadge,
  label,
} from "@/components/notify/bits";
import { ConfirmDialog } from "@/components/notify/ConfirmDelete";
export const Route = createFileRoute("/_authenticated/notifications/$id")({
  head: () => ({
    meta: [
      { title: "Notification — NotifyAI" },
      { name: "description", content: "Notification details and AI analysis." },
    ],
  }),
  component: Detail,
});
function Detail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { update, remove, analyze } = useNotifActions();
  const [confirm, setConfirm] = useState(false);
  const [learn, setLearn] = useState(false);
  const { data: n, isLoading } = useQuery({
    queryKey: ["notifications", "one", id],
    queryFn: async () =>
      (
        await supabase
          .from("notifications")
          .select("*")
          .eq("id", id)
          .maybeSingle()
      ).data,
  });
  if (isLoading) return _jsx(Skeleton, { className: "h-96" });
  if (!n)
    return _jsxs("div", {
      className: "text-muted-foreground",
      children: [
        "Notification not found. ",
        _jsx(Link, {
          to: "/notifications",
          className: "text-primary",
          children: "Back",
        }),
      ],
    });
  const override = async (field, value) => {
    update.mutate({
      ids: [n.id],
      patch: { [field]: value, user_override: true },
    });
    if (learn) {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("notification_rules").insert({
        user_id: u.user.id,
        name: `From ${n.sender_name} → ${field} ${value}`,
        conditions: [
          {
            field: "sender",
            op: "contains",
            value: n.sender_username || n.sender_name,
          },
        ],
        actions: [
          {
            type: field === "category" ? "set_category" : "set_priority",
            value,
          },
        ],
        match_mode: "all",
      });
      if (!error) {
        toast.success("Saved as a personal rule");
        qc.invalidateQueries({ queryKey: ["rules"] });
      }
    }
  };
  return _jsxs("div", {
    className: "mx-auto max-w-3xl",
    children: [
      _jsx(Button, {
        variant: "ghost",
        size: "sm",
        asChild: true,
        className: "mb-4",
        children: _jsxs(Link, {
          to: "/notifications",
          children: [_jsx(ArrowLeft, { className: "size-4" }), "Back"],
        }),
      }),
      _jsxs("div", {
        className: "rounded-xl border bg-card p-6 shadow-card",
        children: [
          _jsxs("div", {
            className: "flex items-start gap-3",
            children: [
              _jsx("div", {
                className:
                  "grid size-10 place-items-center rounded-full bg-secondary",
                children: _jsx(PlatformIcon, { platform: n.platform }),
              }),
              _jsxs("div", {
                className: "flex-1",
                children: [
                  _jsxs("div", {
                    className: "font-semibold",
                    children: [
                      n.sender_name,
                      " ",
                      n.sender_username &&
                        _jsxs("span", {
                          className:
                            "text-sm font-normal text-muted-foreground",
                          children: ["@", n.sender_username],
                        }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "text-xs text-muted-foreground",
                    children: [
                      PLATFORM_META[n.platform]?.label,
                      " \u00B7 ",
                      new Date(n.received_at).toLocaleString(),
                      " ",
                      n.is_seed && "· demo data",
                    ],
                  }),
                ],
              }),
              _jsx(PriorityBadge, { priority: n.priority }),
            ],
          }),
          _jsx("p", {
            className: "mt-5 whitespace-pre-wrap leading-relaxed",
            children: n.message,
          }),
          _jsxs("div", {
            className: "mt-5 flex flex-wrap gap-2",
            children: [
              _jsxs(Button, {
                size: "sm",
                variant: "outline",
                onClick: () =>
                  update.mutate({
                    ids: [n.id],
                    patch: { is_important: !n.is_important },
                  }),
                children: [
                  _jsx(Star, { className: "size-4" }),
                  n.is_important ? "Unmark" : "Important",
                ],
              }),
              _jsxs(Button, {
                size: "sm",
                variant: "outline",
                onClick: () =>
                  update.mutate({
                    ids: [n.id],
                    patch: { archived_status: !n.archived_status },
                  }),
                children: [
                  n.archived_status
                    ? _jsx(ArchiveRestore, { className: "size-4" })
                    : _jsx(Archive, { className: "size-4" }),
                  n.archived_status ? "Restore" : "Archive",
                ],
              }),
              _jsxs(Button, {
                size: "sm",
                variant: "outline",
                onClick: () =>
                  analyze.mutate([n.id], {
                    onSuccess: () =>
                      qc.invalidateQueries({
                        queryKey: ["notifications", "one", id],
                      }),
                  }),
                disabled: analyze.isPending,
                children: [_jsx(Wand2, { className: "size-4" }), "Re-analyze"],
              }),
              n.source_url &&
                _jsx(Button, {
                  size: "sm",
                  variant: "outline",
                  asChild: true,
                  children: _jsxs("a", {
                    href: n.source_url,
                    target: "_blank",
                    rel: "noreferrer",
                    children: [
                      _jsx(ExternalLink, { className: "size-4" }),
                      "Open original",
                    ],
                  }),
                }),
              _jsxs(Button, {
                size: "sm",
                variant: "ghost",
                className: "ml-auto text-destructive",
                onClick: () => setConfirm(true),
                children: [_jsx(Trash2, { className: "size-4" }), "Delete"],
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "mt-4 rounded-xl border bg-card p-6 shadow-card",
        children: [
          _jsxs("div", {
            className: "flex items-center justify-between",
            children: [
              _jsx("h2", { className: "font-semibold", children: "Analysis" }),
              _jsx(SourceBadge, { source: n.ai_source }),
            ],
          }),
          n.ai_source
            ? _jsxs("dl", {
                className: "mt-4 grid gap-4 text-sm sm:grid-cols-3",
                children: [
                  _jsxs("div", {
                    children: [
                      _jsx("dt", {
                        className: "text-muted-foreground",
                        children: "Importance",
                      }),
                      _jsx("dd", {
                        className: "mt-1 font-mono text-2xl font-bold",
                        children: n.importance_score,
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx("dt", {
                        className: "text-muted-foreground",
                        children: "Suggested action",
                      }),
                      _jsx("dd", {
                        className: "mt-1 font-medium",
                        children: label(n.suggested_action ?? "—"),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx("dt", {
                        className: "text-muted-foreground",
                        children: "Promotional",
                      }),
                      _jsx("dd", {
                        className: "mt-1 font-medium",
                        children: n.is_spam ? "Likely" : "No",
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "sm:col-span-3",
                    children: [
                      _jsx("dt", {
                        className: "text-muted-foreground",
                        children: "Summary",
                      }),
                      _jsx("dd", { className: "mt-1", children: n.ai_summary }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "sm:col-span-3",
                    children: [
                      _jsx("dt", {
                        className: "text-muted-foreground",
                        children: "Why",
                      }),
                      _jsx("dd", { className: "mt-1", children: n.ai_reason }),
                    ],
                  }),
                ],
              })
            : _jsx("p", {
                className: "mt-3 text-sm text-muted-foreground",
                children: "Not analyzed yet.",
              }),
          _jsxs("div", {
            className: "mt-6 border-t pt-4",
            children: [
              _jsx("h3", {
                className: "text-sm font-semibold",
                children: "Override classification",
              }),
              _jsxs("div", {
                className: "mt-3 flex flex-wrap items-end gap-3",
                children: [
                  _jsxs("div", {
                    className: "space-y-1.5",
                    children: [
                      _jsx(Label, { children: "Category" }),
                      _jsxs(Select, {
                        value: n.category,
                        onValueChange: (v) => override("category", v),
                        children: [
                          _jsx(SelectTrigger, {
                            className: "w-40 capitalize",
                            children: _jsx(SelectValue, {}),
                          }),
                          _jsx(SelectContent, {
                            children: CATEGORIES.map((c) =>
                              _jsx(
                                SelectItem,
                                {
                                  value: c,
                                  className: "capitalize",
                                  children: c,
                                },
                                c,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "space-y-1.5",
                    children: [
                      _jsx(Label, { children: "Priority" }),
                      _jsxs(Select, {
                        value: n.priority,
                        onValueChange: (v) => override("priority", v),
                        children: [
                          _jsx(SelectTrigger, {
                            className: "w-36 capitalize",
                            children: _jsx(SelectValue, {}),
                          }),
                          _jsx(SelectContent, {
                            children: PRIORITIES.map((c) =>
                              _jsx(
                                SelectItem,
                                {
                                  value: c,
                                  className: "capitalize",
                                  children: c,
                                },
                                c,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs("label", {
                    className: "flex items-center gap-2 pb-2 text-sm",
                    children: [
                      _jsx(Switch, {
                        checked: learn,
                        onCheckedChange: setLearn,
                      }),
                      "Create a rule for this sender",
                    ],
                  }),
                ],
              }),
              n.user_override &&
                _jsx("p", {
                  className: "mt-2 text-xs text-muted-foreground",
                  children:
                    "You've overridden this one \u2014 future analysis keeps your choice.",
                }),
            ],
          }),
        ],
      }),
      _jsx(ConfirmDialog, {
        open: confirm,
        onOpenChange: setConfirm,
        title: "Delete notification?",
        body: "This can't be undone.",
        onConfirm: () => {
          remove.mutate([n.id]);
          navigate({ to: "/notifications" });
        },
      }),
    ],
  });
}
