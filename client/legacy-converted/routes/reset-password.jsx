import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — NotifyAI" },
      {
        name: "description",
        content: "Choose a new password for your NotifyAI account.",
      },
      { property: "og:title", content: "Set a new password — NotifyAI" },
      { property: "og:description", content: "Reset your NotifyAI password." },
    ],
  }),
  component: Reset,
});
function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange(
      (e) => e === "PASSWORD_RECOVERY" && setReady(true),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error("At least 8 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };
  return _jsx("div", {
    className: "grid min-h-screen place-items-center bg-background px-4",
    children: _jsxs("form", {
      onSubmit: submit,
      className:
        "w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-card",
      children: [
        _jsx("h1", {
          className: "text-xl font-bold",
          children: "Set a new password",
        }),
        !ready &&
          _jsx("p", {
            className: "text-sm text-muted-foreground",
            children: "Open this page from the link in your reset email.",
          }),
        _jsxs("div", {
          className: "space-y-1.5",
          children: [
            _jsx(Label, { htmlFor: "pw", children: "New password" }),
            _jsx(Input, {
              id: "pw",
              type: "password",
              value: pw,
              onChange: (e) => setPw(e.target.value),
              autoComplete: "new-password",
            }),
          ],
        }),
        _jsx(Button, {
          className: "w-full",
          disabled: !ready,
          children: "Update password",
        }),
      ],
    }),
  });
}
