import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { analyzeNotifications } from "@/lib/notify.functions";
import { PLATFORMS } from "@/lib/notify-core";
import { PLATFORM_META } from "./bits";
const schema = z.object({
  platform: z.enum(PLATFORMS),
  sender_name: z.string().trim().min(1, "Required").max(100),
  sender_username: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1, "Required").max(4000),
  source_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional(),
});
export function QuickAdd({ compact }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeNotifications);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      platform: "demo",
      sender_name: "",
      message: "",
      sender_username: "",
      source_url: "",
    },
  });
  const onSubmit = async (v) => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        ...v,
        source_url: v.source_url || null,
        sender_username: v.sender_username || null,
        user_id: u.user.id,
      })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notification added");
    setOpen(false);
    form.reset();
    qc.invalidateQueries({ queryKey: ["notifications"] });
    analyze({ data: { ids: [data.id] } })
      .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .catch(() => {});
  };
  return _jsxs(Dialog, {
    open: open,
    onOpenChange: setOpen,
    children: [
      _jsx(DialogTrigger, {
        asChild: true,
        children: _jsxs(Button, {
          size: compact ? "icon" : "sm",
          "aria-label": "Add notification",
          children: [_jsx(Plus, { className: "size-4" }), !compact && "New"],
        }),
      }),
      _jsxs(DialogContent, {
        children: [
          _jsxs(DialogHeader, {
            children: [
              _jsx(DialogTitle, { children: "Add a test notification" }),
              _jsx(DialogDescription, {
                children: "It will be analyzed automatically after saving.",
              }),
            ],
          }),
          _jsxs("form", {
            onSubmit: form.handleSubmit(onSubmit),
            className: "space-y-3",
            children: [
              _jsxs("div", {
                className: "grid grid-cols-2 gap-3",
                children: [
                  _jsxs("div", {
                    className: "space-y-1.5",
                    children: [
                      _jsx(Label, { children: "Platform" }),
                      _jsxs(Select, {
                        value: form.watch("platform"),
                        onValueChange: (v) => form.setValue("platform", v),
                        children: [
                          _jsx(SelectTrigger, {
                            children: _jsx(SelectValue, {}),
                          }),
                          _jsx(SelectContent, {
                            children: PLATFORMS.map((p) =>
                              _jsx(
                                SelectItem,
                                { value: p, children: PLATFORM_META[p]?.label },
                                p,
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
                      _jsx(Label, { htmlFor: "sn", children: "Sender" }),
                      _jsx(Input, {
                        id: "sn",
                        ...form.register("sender_name"),
                      }),
                      _jsx("p", {
                        className: "text-xs text-destructive",
                        children: form.formState.errors.sender_name?.message,
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "space-y-1.5",
                children: [
                  _jsx(Label, {
                    htmlFor: "su",
                    children: "Username (optional)",
                  }),
                  _jsx(Input, {
                    id: "su",
                    ...form.register("sender_username"),
                  }),
                ],
              }),
              _jsxs("div", {
                className: "space-y-1.5",
                children: [
                  _jsx(Label, { htmlFor: "msg", children: "Message" }),
                  _jsx(Textarea, {
                    id: "msg",
                    rows: 4,
                    ...form.register("message"),
                  }),
                  _jsx("p", {
                    className: "text-xs text-destructive",
                    children: form.formState.errors.message?.message,
                  }),
                ],
              }),
              _jsxs("div", {
                className: "space-y-1.5",
                children: [
                  _jsx(Label, {
                    htmlFor: "url",
                    children: "Source URL (optional)",
                  }),
                  _jsx(Input, {
                    id: "url",
                    placeholder: "https://",
                    ...form.register("source_url"),
                  }),
                  _jsx("p", {
                    className: "text-xs text-destructive",
                    children: form.formState.errors.source_url?.message,
                  }),
                ],
              }),
              _jsx(Button, {
                type: "submit",
                className: "w-full",
                disabled: form.formState.isSubmitting,
                children: "Save notification",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
