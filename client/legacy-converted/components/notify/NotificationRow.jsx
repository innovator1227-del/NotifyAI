import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Check,
  ExternalLink,
  MoreHorizontal,
  Star,
  Trash2,
  Mail,
  MailOpen,
  Clock,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifActions } from "@/hooks/use-notif-actions";
import {
  PlatformIcon,
  PriorityBadge,
  SourceBadge,
  label,
  timeAgo,
} from "./bits";
export function NotificationRow({
  n,
  selected,
  onSelect,
  onDelete,
  showHandled,
}) {
  const { update } = useNotifActions();
  const set = (patch) => update.mutate({ ids: [n.id], patch });
  return _jsxs("div", {
    className: cn(
      "group flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-accent/40",
      !n.read_status && "bg-primary/[0.04]",
    ),
    children: [
      onSelect &&
        _jsx(Checkbox, {
          checked: !!selected,
          onCheckedChange: (v) => onSelect(!!v),
          className: "mt-1",
          "aria-label": "Select notification",
        }),
      _jsx("div", {
        className:
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary",
        children: _jsx(PlatformIcon, { platform: n.platform }),
      }),
      _jsxs(Link, {
        to: "/notifications/$id",
        params: { id: n.id },
        className: "min-w-0 flex-1",
        onClick: () => !n.read_status && set({ read_status: true }),
        children: [
          _jsxs("div", {
            className: "flex flex-wrap items-center gap-x-2 gap-y-1",
            children: [
              !n.read_status &&
                _jsx("span", {
                  className: "size-2 rounded-full bg-primary",
                  "aria-label": "Unread",
                }),
              _jsx("span", {
                className: "font-semibold",
                children: n.sender_name,
              }),
              n.sender_username &&
                _jsxs("span", {
                  className: "text-xs text-muted-foreground",
                  children: ["@", n.sender_username],
                }),
              _jsxs("span", {
                className: "text-xs text-muted-foreground",
                children: ["\u00B7 ", timeAgo(n.received_at)],
              }),
              n.is_important &&
                _jsx(Star, { className: "size-3.5 fill-high text-high" }),
            ],
          }),
          _jsx("p", {
            className: "mt-0.5 line-clamp-2 text-sm text-muted-foreground",
            children: n.ai_summary ?? n.message,
          }),
          _jsxs("div", {
            className: "mt-2 flex flex-wrap items-center gap-1.5",
            children: [
              _jsx(PriorityBadge, { priority: n.priority }),
              _jsx(Badge, {
                variant: "soft",
                className: "capitalize",
                children: n.category,
              }),
              n.suggested_action &&
                _jsx(Badge, {
                  variant: "outline",
                  children: label(n.suggested_action),
                }),
              n.is_spam &&
                _jsx(Badge, { variant: "fallback", children: "Likely promo" }),
              _jsx(SourceBadge, { source: n.ai_source }),
              _jsx("span", {
                className: "ml-auto font-mono text-xs text-muted-foreground",
                children: n.importance_score,
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "flex items-center gap-1",
        children: [
          showHandled &&
            _jsx(Button, {
              variant: "ghost",
              size: "icon",
              "aria-label": "Mark handled",
              onClick: () => set({ handled: true, read_status: true }),
              children: _jsx(Check, { className: "size-4" }),
            }),
          _jsxs(DropdownMenu, {
            children: [
              _jsx(DropdownMenuTrigger, {
                asChild: true,
                children: _jsx(Button, {
                  variant: "ghost",
                  size: "icon",
                  "aria-label": "Actions",
                  children: _jsx(MoreHorizontal, { className: "size-4" }),
                }),
              }),
              _jsxs(DropdownMenuContent, {
                align: "end",
                children: [
                  _jsxs(DropdownMenuItem, {
                    onClick: () => set({ read_status: !n.read_status }),
                    children: [
                      n.read_status
                        ? _jsx(Mail, { className: "size-4" })
                        : _jsx(MailOpen, { className: "size-4" }),
                      "Mark as ",
                      n.read_status ? "unread" : "read",
                    ],
                  }),
                  _jsxs(DropdownMenuItem, {
                    onClick: () => set({ is_important: !n.is_important }),
                    children: [
                      _jsx(Star, { className: "size-4" }),
                      n.is_important ? "Unmark important" : "Mark important",
                    ],
                  }),
                  _jsxs(DropdownMenuItem, {
                    onClick: () =>
                      set({
                        is_important: true,
                        read_status: true,
                        suggested_action: "save_for_later",
                      }),
                    children: [
                      _jsx(Clock, { className: "size-4" }),
                      "Save for later",
                    ],
                  }),
                  _jsxs(DropdownMenuItem, {
                    onClick: () => set({ archived_status: !n.archived_status }),
                    children: [
                      n.archived_status
                        ? _jsx(ArchiveRestore, { className: "size-4" })
                        : _jsx(Archive, { className: "size-4" }),
                      n.archived_status ? "Restore" : "Archive",
                    ],
                  }),
                  n.source_url &&
                    _jsx(DropdownMenuItem, {
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
                  onDelete &&
                    _jsxs(_Fragment, {
                      children: [
                        _jsx(DropdownMenuSeparator, {}),
                        _jsxs(DropdownMenuItem, {
                          className: "text-destructive",
                          onClick: onDelete,
                          children: [
                            _jsx(Trash2, { className: "size-4" }),
                            "Delete",
                          ],
                        }),
                      ],
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
