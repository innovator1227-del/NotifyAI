import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Play, Eye, Workflow, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { rulesQuery } from "@/lib/queries";
import { CATEGORIES, PRIORITIES } from "@/lib/notify-core";
import { applyRuleNow, previewRule } from "@/lib/notify.functions";
import { EmptyState, PageHeader, label } from "@/components/notify/bits";
import { ConfirmDialog } from "@/components/notify/ConfirmDelete";
export const Route = createFileRoute("/_authenticated/rules")({
  head: () => ({
    meta: [
      { title: "Rules — NotifyAI" },
      {
        name: "description",
        content: "Automate notification handling with rules.",
      },
    ],
  }),
  component: Rules,
});
const blank = {
  name: "",
  conditions: [{ field: "sender", op: "contains", value: "" }],
  actions: [{ type: "set_priority", value: "high" }],
  match_mode: "all",
  active: true,
  rule_priority: 0,
};
function Rules() {
  const { data, isLoading } = useQuery(rulesQuery());
  const qc = useQueryClient();
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewFn = useServerFn(previewRule);
  const applyFn = useServerFn(applyRuleNow);
  const refresh = () => qc.invalidateQueries({ queryKey: ["rules"] });
  const save = async () => {
    if (!edit) return;
    const conds = edit.conditions.filter((c) => c.value.trim());
    if (!edit.name.trim() || !conds.length || !edit.actions.length) {
      toast.error("Name, at least one condition and one action are required");
      return;
    }
    const row = {
      name: edit.name.trim().slice(0, 100),
      conditions: conds,
      actions: edit.actions,
      match_mode: edit.match_mode,
      active: edit.active,
      rule_priority: edit.rule_priority ?? 0,
    };
    const { data: u } = await supabase.auth.getUser();
    const { error } = edit.id
      ? await supabase.from("notification_rules").update(row).eq("id", edit.id)
      : await supabase
          .from("notification_rules")
          .insert({ ...row, user_id: u.user.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rule saved");
    setEdit(null);
    refresh();
  };
  const toggle = async (r) => {
    await supabase
      .from("notification_rules")
      .update({ active: !r.active })
      .eq("id", r.id);
    refresh();
  };
  const runPreview = async (r) => {
    try {
      setPreview(await previewFn({ data: { rule: r } }));
    } catch (e) {
      toast.error(e.message);
    }
  };
  const apply = async (id) => {
    try {
      const r = await applyFn({ data: { ruleId: id } });
      toast.success(`Applied to ${r.updated} notification(s)`);
      refresh();
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e) {
      toast.error(e.message);
    }
  };
  const setCond = (i, p) =>
    setEdit(
      (e) =>
        e && {
          ...e,
          conditions: e.conditions.map((c, j) =>
            j === i ? { ...c, ...p } : c,
          ),
        },
    );
  const setAct = (i, p) =>
    setEdit(
      (e) =>
        e && {
          ...e,
          actions: e.actions.map((c, j) => (j === i ? { ...c, ...p } : c)),
        },
    );
  return _jsxs("div", {
    children: [
      _jsx(PageHeader, {
        title: "Notification rules",
        description:
          "Rules run automatically during analysis. Your manual overrides always win.",
        actions: _jsxs(Button, {
          size: "sm",
          onClick: () => setEdit({ ...blank }),
          children: [_jsx(Plus, { className: "size-4" }), "New rule"],
        }),
      }),
      isLoading
        ? _jsx(Skeleton, { className: "h-40" })
        : !data?.length
          ? _jsx(EmptyState, {
              icon: Workflow,
              title: "No rules yet",
              body: "E.g. mark everything from your manager as high priority, or archive promotions.",
              action: _jsx(Button, {
                onClick: () => setEdit({ ...blank }),
                children: "Create a rule",
              }),
            })
          : _jsx("div", {
              className: "grid gap-3",
              children: data.map((r) => {
                const rule = r;
                return _jsxs(
                  "div",
                  {
                    className:
                      "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:flex-row sm:items-center",
                    children: [
                      _jsx(Switch, {
                        checked: r.active,
                        onCheckedChange: () => toggle(r),
                        "aria-label": "Active",
                      }),
                      _jsxs("div", {
                        className: "min-w-0 flex-1",
                        children: [
                          _jsx("div", {
                            className: "font-semibold",
                            children: r.name,
                          }),
                          _jsxs("div", {
                            className: "mt-1 text-xs text-muted-foreground",
                            children: [
                              "If ",
                              rule.match_mode,
                              " of: ",
                              rule.conditions
                                .map(
                                  (c) =>
                                    `${c.field} ${c.op.replace("_", " ")} "${c.value}"`,
                                )
                                .join(
                                  rule.match_mode === "all" ? " AND " : " OR ",
                                ),
                              " → ",
                              rule.actions
                                .map(
                                  (a) =>
                                    label(a.type) +
                                    (a.value ? ` ${a.value}` : ""),
                                )
                                .join(", "),
                            ],
                          }),
                          _jsxs("div", {
                            className: "mt-1 text-xs text-muted-foreground",
                            children: [
                              "Ran ",
                              r.run_count,
                              "\u00D7 ",
                              r.last_run_at &&
                                `· last ${new Date(r.last_run_at).toLocaleString()}`,
                              " \u00B7 priority ",
                              r.rule_priority,
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "flex gap-1",
                        children: [
                          _jsxs(Button, {
                            variant: "ghost",
                            size: "sm",
                            onClick: () => runPreview(rule),
                            children: [
                              _jsx(Eye, { className: "size-4" }),
                              "Preview",
                            ],
                          }),
                          _jsxs(Button, {
                            variant: "ghost",
                            size: "sm",
                            onClick: () => apply(r.id),
                            children: [
                              _jsx(Play, { className: "size-4" }),
                              "Apply",
                            ],
                          }),
                          _jsx(Button, {
                            variant: "ghost",
                            size: "icon",
                            "aria-label": "Edit",
                            onClick: () => setEdit({ ...rule }),
                            children: _jsx(Pencil, { className: "size-4" }),
                          }),
                          _jsx(Button, {
                            variant: "ghost",
                            size: "icon",
                            "aria-label": "Delete",
                            onClick: () => setDel(r.id),
                            children: _jsx(Trash2, { className: "size-4" }),
                          }),
                        ],
                      }),
                    ],
                  },
                  r.id,
                );
              }),
            }),
      _jsx(Dialog, {
        open: !!edit,
        onOpenChange: (v) => !v && setEdit(null),
        children: _jsxs(DialogContent, {
          className: "max-w-2xl",
          children: [
            _jsx(DialogHeader, {
              children: _jsx(DialogTitle, {
                children: edit?.id ? "Edit rule" : "New rule",
              }),
            }),
            edit &&
              _jsxs("div", {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    className: "grid grid-cols-3 gap-3",
                    children: [
                      _jsxs("div", {
                        className: "col-span-2 space-y-1.5",
                        children: [
                          _jsx(Label, { children: "Name" }),
                          _jsx(Input, {
                            value: edit.name,
                            onChange: (e) =>
                              setEdit({ ...edit, name: e.target.value }),
                            maxLength: 100,
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "space-y-1.5",
                        children: [
                          _jsx(Label, { children: "Rule priority" }),
                          _jsx(Input, {
                            type: "number",
                            value: edit.rule_priority ?? 0,
                            onChange: (e) =>
                              setEdit({
                                ...edit,
                                rule_priority: Number(e.target.value) || 0,
                              }),
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsxs("div", {
                        className: "mb-2 flex items-center gap-2 text-sm",
                        children: [
                          _jsx("span", {
                            className: "font-medium",
                            children: "Conditions \u2014 match",
                          }),
                          _jsxs(Select, {
                            value: edit.match_mode,
                            onValueChange: (v) =>
                              setEdit({ ...edit, match_mode: v }),
                            children: [
                              _jsx(SelectTrigger, {
                                className: "h-8 w-20",
                                children: _jsx(SelectValue, {}),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "all",
                                    children: "all",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "any",
                                    children: "any",
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      edit.conditions.map((c, i) =>
                        _jsxs(
                          "div",
                          {
                            className: "mb-2 flex gap-2",
                            children: [
                              _jsxs(Select, {
                                value: c.field,
                                onValueChange: (v) => setCond(i, { field: v }),
                                children: [
                                  _jsx(SelectTrigger, {
                                    className: "w-32",
                                    children: _jsx(SelectValue, {}),
                                  }),
                                  _jsx(SelectContent, {
                                    children: [
                                      "sender",
                                      "message",
                                      "platform",
                                      "category",
                                      "priority",
                                    ].map((f) =>
                                      _jsx(
                                        SelectItem,
                                        { value: f, children: f },
                                        f,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                              _jsxs(Select, {
                                value: c.op,
                                onValueChange: (v) => setCond(i, { op: v }),
                                children: [
                                  _jsx(SelectTrigger, {
                                    className: "w-36",
                                    children: _jsx(SelectValue, {}),
                                  }),
                                  _jsxs(SelectContent, {
                                    children: [
                                      _jsx(SelectItem, {
                                        value: "contains",
                                        children: "contains",
                                      }),
                                      _jsx(SelectItem, {
                                        value: "equals",
                                        children: "equals",
                                      }),
                                      _jsx(SelectItem, {
                                        value: "not_contains",
                                        children: "doesn't contain",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsx(Input, {
                                value: c.value,
                                onChange: (e) =>
                                  setCond(i, { value: e.target.value }),
                                placeholder: "value",
                                maxLength: 100,
                              }),
                              _jsx(Button, {
                                variant: "ghost",
                                size: "icon",
                                "aria-label": "Remove condition",
                                onClick: () =>
                                  setEdit({
                                    ...edit,
                                    conditions: edit.conditions.filter(
                                      (_, j) => j !== i,
                                    ),
                                  }),
                                children: _jsx(X, { className: "size-4" }),
                              }),
                            ],
                          },
                          i,
                        ),
                      ),
                      _jsxs(Button, {
                        variant: "outline",
                        size: "sm",
                        onClick: () =>
                          setEdit({
                            ...edit,
                            conditions: [
                              ...edit.conditions,
                              { field: "message", op: "contains", value: "" },
                            ],
                          }),
                        children: [
                          _jsx(Plus, { className: "size-4" }),
                          "Condition",
                        ],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx("div", {
                        className: "mb-2 text-sm font-medium",
                        children: "Actions",
                      }),
                      edit.actions.map((a, i) =>
                        _jsxs(
                          "div",
                          {
                            className: "mb-2 flex gap-2",
                            children: [
                              _jsxs(Select, {
                                value: a.type,
                                onValueChange: (v) =>
                                  setAct(i, {
                                    type: v,
                                    value:
                                      v === "set_priority"
                                        ? "high"
                                        : v === "set_category"
                                          ? "work"
                                          : undefined,
                                  }),
                                children: [
                                  _jsx(SelectTrigger, {
                                    className: "w-44",
                                    children: _jsx(SelectValue, {}),
                                  }),
                                  _jsx(SelectContent, {
                                    children: [
                                      "set_priority",
                                      "set_category",
                                      "archive",
                                      "mark_important",
                                      "mark_read",
                                    ].map((t) =>
                                      _jsx(
                                        SelectItem,
                                        { value: t, children: label(t) },
                                        t,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                              (a.type === "set_priority" ||
                                a.type === "set_category") &&
                                _jsxs(Select, {
                                  value: a.value ?? "",
                                  onValueChange: (v) => setAct(i, { value: v }),
                                  children: [
                                    _jsx(SelectTrigger, {
                                      className: "w-40 capitalize",
                                      children: _jsx(SelectValue, {}),
                                    }),
                                    _jsx(SelectContent, {
                                      children: (a.type === "set_priority"
                                        ? PRIORITIES
                                        : CATEGORIES
                                      ).map((v) =>
                                        _jsx(
                                          SelectItem,
                                          {
                                            value: v,
                                            className: "capitalize",
                                            children: v,
                                          },
                                          v,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                              _jsx(Button, {
                                variant: "ghost",
                                size: "icon",
                                "aria-label": "Remove action",
                                onClick: () =>
                                  setEdit({
                                    ...edit,
                                    actions: edit.actions.filter(
                                      (_, j) => j !== i,
                                    ),
                                  }),
                                children: _jsx(X, { className: "size-4" }),
                              }),
                            ],
                          },
                          i,
                        ),
                      ),
                      _jsxs(Button, {
                        variant: "outline",
                        size: "sm",
                        onClick: () =>
                          setEdit({
                            ...edit,
                            actions: [
                              ...edit.actions,
                              { type: "mark_important" },
                            ],
                          }),
                        children: [
                          _jsx(Plus, { className: "size-4" }),
                          "Action",
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            _jsxs(DialogFooter, {
              children: [
                _jsxs(Button, {
                  variant: "outline",
                  onClick: () => edit && runPreview(edit),
                  children: [_jsx(Eye, { className: "size-4" }), "Preview"],
                }),
                _jsx(Button, { onClick: save, children: "Save rule" }),
              ],
            }),
          ],
        }),
      }),
      _jsx(Dialog, {
        open: !!preview,
        onOpenChange: (v) => !v && setPreview(null),
        children: _jsxs(DialogContent, {
          children: [
            _jsx(DialogHeader, {
              children: _jsx(DialogTitle, { children: "Rule preview" }),
            }),
            preview &&
              _jsxs("div", {
                className: "space-y-3 text-sm",
                children: [
                  _jsxs("p", {
                    children: [
                      _jsx("b", { children: preview.count }),
                      " existing notification(s) match. Effects: ",
                      Object.entries(preview.effects).map(([k, v]) =>
                        _jsxs(
                          Badge,
                          {
                            variant: "soft",
                            className: "mr-1",
                            children: [label(k), ": ", String(v)],
                          },
                          k,
                        ),
                      ),
                    ],
                  }),
                  _jsx("ul", {
                    className: "max-h-64 space-y-2 overflow-auto",
                    children: preview.sample.map((n) =>
                      _jsxs(
                        "li",
                        {
                          className: "rounded-md bg-secondary/60 p-2",
                          children: [
                            _jsx("b", { children: n.sender_name }),
                            " \u2014 ",
                            _jsx("span", {
                              className: "text-muted-foreground",
                              children: n.message.slice(0, 100),
                            }),
                          ],
                        },
                        n.id,
                      ),
                    ),
                  }),
                  _jsx("p", {
                    className: "text-xs text-muted-foreground",
                    children:
                      'Nothing has been changed. Use "Apply" on a saved rule to update existing notifications.',
                  }),
                ],
              }),
          ],
        }),
      }),
      _jsx(ConfirmDialog, {
        open: !!del,
        onOpenChange: (v) => !v && setDel(null),
        title: "Delete rule?",
        body: "Notifications already changed by it stay as they are.",
        onConfirm: async () => {
          await supabase.from("notification_rules").delete().eq("id", del);
          setDel(null);
          refresh();
        },
      }),
    ],
  });
}
