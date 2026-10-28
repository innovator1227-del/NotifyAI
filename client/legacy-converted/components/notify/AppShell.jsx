import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Star,
  Sparkles,
  Workflow,
  Plug,
  BarChart3,
  Settings,
  LifeBuoy,
  Bell,
  LogOut,
  Search,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";
import { QuickAdd } from "./QuickAdd";
const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  {
    to: "/notifications",
    label: "All Notifications",
    icon: Inbox,
    badge: true,
  },
  { to: "/priority", label: "Priority Inbox", icon: Star },
  { to: "/summaries", label: "AI Summaries", icon: Sparkles },
  { to: "/rules", label: "Notification Rules", icon: Workflow },
  { to: "/integrations", label: "Social Integrations", icon: Plug },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];
const NAV2 = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help & Support", icon: LifeBuoy },
];
function useUnread() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () =>
      (
        await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("read_status", false)
          .eq("archived_status", false)
      ).count ?? 0,
  });
}
export function AppShell({ children }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useQuery(profileQuery());
  const { data: unread } = useUnread();
  const [q, setQ] = useState("");
  const name = me?.profile?.display_name ?? me?.user?.email ?? "You";
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return _jsxs(SidebarProvider, {
    children: [
      _jsxs(Sidebar, {
        collapsible: "icon",
        children: [
          _jsx(SidebarHeader, {
            children: _jsxs(Link, {
              to: "/dashboard",
              className: "flex items-center gap-2 px-2 py-1.5",
              children: [
                _jsx("div", {
                  className:
                    "grid size-7 shrink-0 place-items-center rounded-md bg-brand",
                  children: _jsx(Bell, {
                    className: "size-4 text-primary-foreground",
                  }),
                }),
                _jsx("span", {
                  className:
                    "font-bold tracking-tight group-data-[collapsible=icon]:hidden",
                  children: "NotifyAI",
                }),
              ],
            }),
          }),
          _jsxs(SidebarContent, {
            children: [
              _jsxs(SidebarGroup, {
                children: [
                  _jsx(SidebarGroupLabel, { children: "Workspace" }),
                  _jsx(SidebarGroupContent, {
                    children: _jsx(SidebarMenu, {
                      children: NAV.map((n) =>
                        _jsxs(
                          SidebarMenuItem,
                          {
                            children: [
                              _jsx(SidebarMenuButton, {
                                asChild: true,
                                isActive: path.startsWith(n.to),
                                tooltip: n.label,
                                children: _jsxs(Link, {
                                  to: n.to,
                                  children: [
                                    _jsx(n.icon, {}),
                                    _jsx("span", { children: n.label }),
                                  ],
                                }),
                              }),
                              "badge" in n &&
                                !!unread &&
                                _jsx(SidebarMenuBadge, { children: unread }),
                            ],
                          },
                          n.to,
                        ),
                      ),
                    }),
                  }),
                ],
              }),
              _jsxs(SidebarGroup, {
                children: [
                  _jsx(SidebarGroupLabel, { children: "Account" }),
                  _jsx(SidebarGroupContent, {
                    children: _jsx(SidebarMenu, {
                      children: NAV2.map((n) =>
                        _jsx(
                          SidebarMenuItem,
                          {
                            children: _jsx(SidebarMenuButton, {
                              asChild: true,
                              isActive: path.startsWith(n.to),
                              tooltip: n.label,
                              children: _jsxs(Link, {
                                to: n.to,
                                children: [
                                  _jsx(n.icon, {}),
                                  _jsx("span", { children: n.label }),
                                ],
                              }),
                            }),
                          },
                          n.to,
                        ),
                      ),
                    }),
                  }),
                ],
              }),
            ],
          }),
          _jsx(SidebarFooter, {
            children: _jsx(SidebarMenu, {
              children: _jsx(SidebarMenuItem, {
                children: _jsx(SidebarMenuButton, {
                  asChild: true,
                  tooltip: "Profile",
                  children: _jsxs(Link, {
                    to: "/settings",
                    children: [
                      _jsx(User, {}),
                      _jsx("span", { className: "truncate", children: name }),
                    ],
                  }),
                }),
              }),
            }),
          }),
        ],
      }),
      _jsxs(SidebarInset, {
        children: [
          _jsxs("header", {
            className:
              "sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:px-5",
            children: [
              _jsx(SidebarTrigger, {}),
              _jsxs("form", {
                className: "relative max-w-md flex-1",
                onSubmit: (e) => {
                  e.preventDefault();
                  navigate({
                    to: "/notifications",
                    search: { q: q || undefined },
                  });
                },
                children: [
                  _jsx(Search, {
                    className:
                      "absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                  }),
                  _jsx(Input, {
                    value: q,
                    onChange: (e) => setQ(e.target.value),
                    placeholder: "Search notifications\u2026",
                    className: "h-9 pl-8",
                    "aria-label": "Search notifications",
                  }),
                ],
              }),
              _jsxs("div", {
                className: "ml-auto flex items-center gap-2",
                children: [
                  _jsx(Button, {
                    variant: "ghost",
                    size: "icon",
                    className: "relative",
                    asChild: true,
                    children: _jsxs(Link, {
                      to: "/notifications",
                      search: { status: "unread" },
                      "aria-label": `${unread ?? 0} unread`,
                      children: [
                        _jsx(Bell, { className: "size-4" }),
                        !!unread &&
                          _jsx("span", {
                            className:
                              "absolute right-1.5 top-1.5 size-2 rounded-full bg-critical",
                          }),
                      ],
                    }),
                  }),
                  _jsx(QuickAdd, {}),
                  _jsxs(DropdownMenu, {
                    children: [
                      _jsx(DropdownMenuTrigger, {
                        className:
                          "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "aria-label": "Account menu",
                        children: _jsxs(Avatar, {
                          className: "size-8",
                          children: [
                            _jsx(AvatarImage, {
                              src: me?.profile?.avatar_url ?? undefined,
                            }),
                            _jsx(AvatarFallback, {
                              className: "bg-secondary text-xs",
                              children: name.slice(0, 2).toUpperCase(),
                            }),
                          ],
                        }),
                      }),
                      _jsxs(DropdownMenuContent, {
                        align: "end",
                        className: "w-56",
                        children: [
                          _jsx(DropdownMenuLabel, {
                            className: "truncate",
                            children: me?.user?.email,
                          }),
                          _jsx(DropdownMenuSeparator, {}),
                          _jsx(DropdownMenuItem, {
                            asChild: true,
                            children: _jsx(Link, {
                              to: "/settings",
                              children: "Profile & settings",
                            }),
                          }),
                          _jsx(DropdownMenuItem, {
                            asChild: true,
                            children: _jsx(Link, {
                              to: "/help",
                              children: "Help",
                            }),
                          }),
                          _jsx(DropdownMenuSeparator, {}),
                          _jsxs(DropdownMenuItem, {
                            onClick: signOut,
                            children: [
                              _jsx(LogOut, { className: "size-4" }),
                              "Sign out",
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
          _jsx("main", {
            className: "mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6",
            children: children,
          }),
        ],
      }),
    ],
  });
}
