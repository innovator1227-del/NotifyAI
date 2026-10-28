import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Unplug, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { integrationsQuery } from "@/lib/queries";
import { syncDemoProvider } from "@/lib/notify.functions";
import {
  PageHeader,
  PlatformIcon,
  PLATFORM_META,
  timeAgo,
} from "@/components/notify/bits";
import { ConfirmDialog } from "@/components/notify/ConfirmDelete";
export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — NotifyAI" },
      { name: "description", content: "Connect your social platforms." },
    ],
  }),
  component: Integrations,
});
// What each platform's official API actually allows. Live OAuth requires approved developer apps.
const PROVIDERS = [
  {
    id: "facebook",
    note: "Meta Graph API does not expose a user's personal notification feed. Page notifications require an approved Meta app with pages permissions.",
  },
  {
    id: "instagram",
    note: "Instagram Graph API supports Business/Creator accounts (comments, mentions) via an approved Meta app. Personal accounts aren't supported.",
  },
  {
    id: "x",
    note: "X API v2 can read mentions with a paid developer tier and OAuth 2.0 user context.",
  },
  {
    id: "linkedin",
    note: "LinkedIn restricts notification and messaging APIs to approved partners.",
  },
  {
    id: "youtube",
    note: "YouTube Data API can read comments on your channel via Google OAuth.",
  },
  {
    id: "telegram",
    note: "A Telegram bot you create can forward messages sent to it. User account notifications aren't available via the Bot API.",
  },
];
function Integrations() {
  const { data } = useQuery(integrationsQuery());
  const qc = useQueryClient();
  const sync = useServerFn(syncDemoProvider);
  const [busy, setBusy] = useState(null);
  const [info, setInfo] = useState(null);
  const [disc, setDisc] = useState(null);
  const doSync = async (p) => {
    setBusy(p);
    try {
      const r = await sync({ data: { provider: p } });
      toast.success(
        r.imported
          ? `Imported ${r.imported} demo notification(s)`
          : "Already up to date — no duplicates imported",
      );
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };
  const disconnect = async (p) => {
    await supabase.from("integrations").delete().eq("provider", p);
    toast.success("Disconnected");
    qc.invalidateQueries({ queryKey: ["integrations"] });
  };
  return _jsxs("div", {
    children: [
      _jsx(PageHeader, {
        title: "Social integrations",
        description:
          "Live connections need approved developer access per platform. Until then, use the clearly-labeled demo provider.",
      }),
      _jsxs("div", {
        className:
          "mb-4 flex items-start gap-3 rounded-xl border border-medium/30 bg-medium/10 p-4 text-sm",
        children: [
          _jsx(Info, { className: "mt-0.5 size-4 shrink-0 text-medium" }),
          _jsx("p", {
            children:
              "NotifyAI never asks for your social media passwords and never scrapes websites. Demo data is tagged as such everywhere it appears.",
          }),
        ],
      }),
      _jsx("div", {
        className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        children: PROVIDERS.map((p) => {
          const row = data?.find((d) => d.provider === p.id);
          return _jsxs(
            "div",
            {
              className:
                "flex flex-col rounded-xl border bg-card p-5 shadow-card",
              children: [
                _jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [
                    _jsx("div", {
                      className:
                        "grid size-10 place-items-center rounded-lg bg-secondary",
                      children: _jsx(PlatformIcon, {
                        platform: p.id,
                        className: "size-5",
                      }),
                    }),
                    _jsxs("div", {
                      className: "flex-1",
                      children: [
                        _jsx("div", {
                          className: "font-semibold",
                          children: PLATFORM_META[p.id]?.label,
                        }),
                        _jsx("div", {
                          className: "text-xs text-muted-foreground",
                          children: row?.last_sync_at
                            ? `Last sync ${timeAgo(row.last_sync_at)}`
                            : "Never synced",
                        }),
                      ],
                    }),
                    row
                      ? _jsx(Badge, {
                          variant: "medium",
                          children: "Demo mode",
                        })
                      : _jsx(Badge, {
                          variant: "fallback",
                          children: "Not connected",
                        }),
                  ],
                }),
                _jsxs("div", {
                  className: "mt-auto flex flex-wrap gap-2 pt-5",
                  children: [
                    _jsxs(Button, {
                      size: "sm",
                      variant: "outline",
                      onClick: () => setInfo(p),
                      children: [
                        _jsx(Lock, { className: "size-4" }),
                        "Connect",
                      ],
                    }),
                    _jsxs(Button, {
                      size: "sm",
                      variant: "secondary",
                      onClick: () => doSync(p.id),
                      disabled: busy === p.id,
                      children: [
                        _jsx(RefreshCw, {
                          className: `size-4 ${busy === p.id ? "animate-spin" : ""}`,
                        }),
                        "Sync demo",
                      ],
                    }),
                    row &&
                      _jsxs(Button, {
                        size: "sm",
                        variant: "ghost",
                        onClick: () => setDisc(p.id),
                        children: [
                          _jsx(Unplug, { className: "size-4" }),
                          "Disconnect",
                        ],
                      }),
                  ],
                }),
              ],
            },
            p.id,
          );
        }),
      }),
      _jsx(Dialog, {
        open: !!info,
        onOpenChange: (v) => !v && setInfo(null),
        children: _jsxs(DialogContent, {
          children: [
            _jsxs(DialogHeader, {
              children: [
                _jsxs(DialogTitle, {
                  children: ["Connect ", info && PLATFORM_META[info.id]?.label],
                }),
                _jsx(DialogDescription, {
                  children: "Live connection isn't available yet.",
                }),
              ],
            }),
            _jsx("p", { className: "text-sm", children: info?.note }),
            _jsx("p", {
              className: "text-sm text-muted-foreground",
              children:
                'Once developer credentials are approved, sign-in will happen on the platform\'s own page \u2014 NotifyAI will never see your password. Meanwhile, "Sync demo" imports sample data.',
            }),
          ],
        }),
      }),
      _jsx(ConfirmDialog, {
        open: !!disc,
        onOpenChange: (v) => !v && setDisc(null),
        title: "Disconnect?",
        body: "Imported notifications stay in your inbox.",
        confirm: "Disconnect",
        onConfirm: () => {
          disconnect(disc);
          setDisc(null);
        },
      }),
    ],
  });
}
