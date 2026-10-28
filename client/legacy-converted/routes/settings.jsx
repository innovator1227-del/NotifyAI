import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { prefsQuery, profileQuery } from "@/lib/queries";
import { CATEGORIES } from "@/lib/notify-core";
import { deleteAccount, exportData } from "@/lib/notify.functions";
import { PageHeader } from "@/components/notify/bits";
import { ConfirmDialog } from "@/components/notify/ConfirmDelete";
export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NotifyAI" },
      { name: "description", content: "Profile, AI and privacy settings." },
    ],
  }),
  component: Settings,
});
function Row({ title, desc, children }) {
  return _jsxs("div", {
    className:
      "flex flex-col gap-3 border-b py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between",
    children: [
      _jsxs("div", {
        children: [
          _jsx("div", { className: "font-medium", children: title }),
          desc &&
            _jsx("div", {
              className: "text-sm text-muted-foreground",
              children: desc,
            }),
        ],
      }),
      _jsx("div", { className: "shrink-0", children: children }),
    ],
  });
}
function Settings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: prefs, isLoading } = useQuery(prefsQuery());
  const { data: me } = useQuery(profileQuery());
  const [p, setP] = useState(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [del, setDel] = useState(false);
  const exportFn = useServerFn(exportData);
  const deleteFn = useServerFn(deleteAccount);
  useEffect(() => {
    if (prefs) setP(prefs);
  }, [prefs]);
  useEffect(() => {
    setName(me?.profile?.display_name ?? "");
  }, [me]);
  if (isLoading || !p) return _jsx(Skeleton, { className: "h-96" });
  const savePrefs = async (patch) => {
    const next = { ...p, ...patch };
    setP(next);
    const { error } = await supabase
      .from("user_preferences")
      .update(patch)
      .eq("user_id", p.user_id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["prefs"] });
  };
  const saveProfile = async () => {
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: me.user.id, display_name: name.trim().slice(0, 80) });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
  const doExport = async () => {
    const d = await exportFn();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }),
    );
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "notifyai-export.json",
    });
    a.click();
    URL.revokeObjectURL(url);
  };
  const doDelete = async () => {
    try {
      await deleteFn();
      qc.clear();
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e.message);
    }
  };
  return _jsxs("div", {
    className: "mx-auto max-w-3xl",
    children: [
      _jsx(PageHeader, { title: "Settings" }),
      _jsxs(Tabs, {
        defaultValue: "profile",
        children: [
          _jsxs(TabsList, {
            className: "flex-wrap",
            children: [
              _jsx(TabsTrigger, { value: "profile", children: "Profile" }),
              _jsx(TabsTrigger, {
                value: "priorities",
                children: "Priorities",
              }),
              _jsx(TabsTrigger, { value: "ai", children: "AI" }),
              _jsx(TabsTrigger, {
                value: "notifications",
                children: "Quiet hours & digest",
              }),
              _jsx(TabsTrigger, { value: "privacy", children: "Privacy" }),
            ],
          }),
          _jsxs("div", {
            className: "mt-4 rounded-xl border bg-card px-5 shadow-card",
            children: [
              _jsxs(TabsContent, {
                value: "profile",
                className: "mt-0",
                children: [
                  _jsx(Row, {
                    title: "Email",
                    children: _jsx("span", {
                      className: "text-sm text-muted-foreground",
                      children: me?.user?.email,
                    }),
                  }),
                  _jsx(Row, {
                    title: "Display name",
                    children: _jsxs("div", {
                      className: "flex gap-2",
                      children: [
                        _jsx(Input, {
                          value: name,
                          onChange: (e) => setName(e.target.value),
                          className: "w-56",
                          maxLength: 80,
                        }),
                        _jsx(Button, {
                          onClick: saveProfile,
                          children: "Save",
                        }),
                      ],
                    }),
                  }),
                  _jsx(Row, {
                    title: "Password",
                    desc: "Get a reset link by email.",
                    children: _jsx(Button, {
                      variant: "outline",
                      onClick: async () => {
                        await supabase.auth.resetPasswordForEmail(
                          me.user.email,
                          {
                            redirectTo: `${window.location.origin}/reset-password`,
                          },
                        );
                        toast.success("Reset link sent");
                      },
                      children: "Send reset link",
                    }),
                  }),
                ],
              }),
              _jsxs(TabsContent, {
                value: "priorities",
                className: "mt-0",
                children: [
                  _jsx(Row, {
                    title: "Important categories",
                    desc: "Considered when scoring and in Priority Inbox.",
                    children: _jsx("div", {
                      className: "flex max-w-sm flex-wrap justify-end gap-1.5",
                      children: CATEGORIES.map((c) => {
                        const on = p.important_categories.includes(c);
                        return _jsx(
                          "button",
                          {
                            onClick: () =>
                              savePrefs({
                                important_categories: on
                                  ? p.important_categories.filter(
                                      (x) => x !== c,
                                    )
                                  : [...p.important_categories, c],
                              }),
                            children: _jsx(Badge, {
                              variant: on ? "default" : "soft",
                              className: "cursor-pointer capitalize",
                              children: c,
                            }),
                          },
                          c,
                        );
                      }),
                    }),
                  }),
                  _jsx(Row, {
                    title: `Priority threshold: ${p.priority_threshold}`,
                    desc: "Importance score at which items count as high priority.",
                    children: _jsx(Slider, {
                      className: "w-56",
                      min: 30,
                      max: 95,
                      step: 5,
                      value: [p.priority_threshold],
                      onValueChange: ([v]) =>
                        setP({ ...p, priority_threshold: v ?? 70 }),
                      onValueCommit: ([v]) =>
                        savePrefs({ priority_threshold: v ?? 70 }),
                    }),
                  }),
                  _jsx(Row, {
                    title: "Important contacts",
                    desc: "Names or usernames always boosted.",
                    children: _jsxs("div", {
                      className: "w-64 space-y-2",
                      children: [
                        _jsxs("form", {
                          className: "flex gap-2",
                          onSubmit: (e) => {
                            e.preventDefault();
                            const c = contact.trim().slice(0, 60);
                            if (c && !p.important_contacts.includes(c))
                              savePrefs({
                                important_contacts: [
                                  ...p.important_contacts,
                                  c,
                                ],
                              });
                            setContact("");
                          },
                          children: [
                            _jsx(Input, {
                              value: contact,
                              onChange: (e) => setContact(e.target.value),
                              placeholder: "e.g. jane.m",
                            }),
                            _jsx(Button, {
                              type: "submit",
                              variant: "secondary",
                              children: "Add",
                            }),
                          ],
                        }),
                        _jsx("div", {
                          className: "flex flex-wrap gap-1.5",
                          children: p.important_contacts.map((c) =>
                            _jsxs(
                              Badge,
                              {
                                variant: "soft",
                                className: "gap-1",
                                children: [
                                  c,
                                  _jsx("button", {
                                    "aria-label": `Remove ${c}`,
                                    onClick: () =>
                                      savePrefs({
                                        important_contacts:
                                          p.important_contacts.filter(
                                            (x) => x !== c,
                                          ),
                                      }),
                                    children: _jsx(X, { className: "size-3" }),
                                  }),
                                ],
                              },
                              c,
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              _jsxs(TabsContent, {
                value: "ai",
                className: "mt-0",
                children: [
                  _jsx(Row, {
                    title: "Use AI analysis",
                    desc: "When off, a clearly labeled rule-based classifier is used instead.",
                    children: _jsx(Switch, {
                      checked: p.ai_enabled,
                      onCheckedChange: (v) => savePrefs({ ai_enabled: v }),
                    }),
                  }),
                  _jsx(Row, {
                    title: "Auto-analyze new notifications",
                    desc: "Analyze manually added items right after saving.",
                    children: _jsx(Switch, {
                      checked: p.auto_analyze,
                      onCheckedChange: (v) => savePrefs({ auto_analyze: v }),
                    }),
                  }),
                  _jsx(Row, {
                    title: "Safety",
                    desc: "NotifyAI never sends messages, deletes notifications or acts on your accounts without you.",
                    children: _jsx(Badge, {
                      variant: "ai",
                      children: "Always on",
                    }),
                  }),
                ],
              }),
              _jsxs(TabsContent, {
                value: "notifications",
                className: "mt-0",
                children: [
                  _jsx(Row, {
                    title: "Quiet hours",
                    children: _jsx(Switch, {
                      checked: p.quiet_hours_enabled,
                      onCheckedChange: (v) =>
                        savePrefs({ quiet_hours_enabled: v }),
                    }),
                  }),
                  _jsx(Row, {
                    title: "Quiet window",
                    children: _jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(Input, {
                          type: "time",
                          className: "w-28",
                          value: p.quiet_start,
                          onChange: (e) =>
                            savePrefs({ quiet_start: e.target.value }),
                          disabled: !p.quiet_hours_enabled,
                        }),
                        "\u2013",
                        _jsx(Input, {
                          type: "time",
                          className: "w-28",
                          value: p.quiet_end,
                          onChange: (e) =>
                            savePrefs({ quiet_end: e.target.value }),
                          disabled: !p.quiet_hours_enabled,
                        }),
                      ],
                    }),
                  }),
                  _jsx(Row, {
                    title: "Digest frequency",
                    children: _jsxs(Select, {
                      value: p.digest_frequency,
                      onValueChange: (v) => savePrefs({ digest_frequency: v }),
                      children: [
                        _jsx(SelectTrigger, {
                          className: "w-36",
                          children: _jsx(SelectValue, {}),
                        }),
                        _jsxs(SelectContent, {
                          children: [
                            _jsx(SelectItem, {
                              value: "daily",
                              children: "Daily",
                            }),
                            _jsx(SelectItem, {
                              value: "weekly",
                              children: "Weekly",
                            }),
                            _jsx(SelectItem, {
                              value: "off",
                              children: "On demand only",
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              _jsxs(TabsContent, {
                value: "privacy",
                className: "mt-0",
                children: [
                  _jsx(Row, {
                    title: "Export your data",
                    desc: "Download everything as JSON.",
                    children: _jsxs(Button, {
                      variant: "outline",
                      onClick: doExport,
                      children: [
                        _jsx(Download, { className: "size-4" }),
                        "Export",
                      ],
                    }),
                  }),
                  _jsx(Row, {
                    title: "Delete account",
                    desc: "Permanently deletes your account and all data.",
                    children: _jsxs(Button, {
                      variant: "destructive",
                      onClick: () => setDel(true),
                      children: [
                        _jsx(Trash2, { className: "size-4" }),
                        "Delete account",
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsx(Label, { className: "sr-only", children: "settings" }),
      _jsx(ConfirmDialog, {
        open: del,
        onOpenChange: setDel,
        title: "Delete your account?",
        body: "All notifications, rules, digests and settings will be permanently erased.",
        confirm: "Delete forever",
        onConfirm: doDelete,
      }),
    ],
  });
}
