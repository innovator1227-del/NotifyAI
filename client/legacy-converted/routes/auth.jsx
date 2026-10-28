import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
const search = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
});
export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — NotifyAI" },
      {
        name: "description",
        content: "Sign in or create your NotifyAI account.",
      },
      { property: "og:title", content: "Sign in — NotifyAI" },
      {
        property: "og:description",
        content: "Access your AI-sorted notification inbox.",
      },
    ],
  }),
  component: AuthPage,
});
const creds = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
function AuthPage() {
  const { mode = "signin" } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(
        ({ data }) =>
          data.user && navigate({ to: "/dashboard", replace: true }),
      );
    const { data } = supabase.auth.onAuthStateChange(
      (_e, s) => s && navigate({ to: "/dashboard", replace: true }),
    );
    return () => data.subscription.unsubscribe();
  }, [navigate]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const v = z.string().email().safeParse(email.trim());
        if (!v.success) {
          toast.error("Enter a valid email");
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(v.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(
          "If an account exists, we sent a password reset link to your email.",
        );
        return;
      }
      const v = creds.safeParse({ email, password });
      if (!v.success) {
        toast.error(v.error.issues[0]?.message ?? "Invalid input");
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          ...v.data,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: name },
          },
        });
        if (error) throw error;
        setSent("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(v.data);
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const oauth = async (p) => {
    const r = await lovable.auth.signInWithOAuth(p, {
      redirect_uri: window.location.origin + "/auth",
    });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  };
  const title =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";
  return _jsx("div", {
    className: "grid min-h-screen place-items-center bg-background px-4",
    children: _jsxs("div", {
      className: "w-full max-w-sm",
      children: [
        _jsxs(Link, {
          to: "/",
          className: "mb-8 flex items-center justify-center gap-2",
          children: [
            _jsx("div", {
              className: "grid size-8 place-items-center rounded-md bg-brand",
              children: _jsx(Bell, {
                className: "size-4 text-primary-foreground",
              }),
            }),
            _jsx("span", { className: "font-bold", children: "NotifyAI" }),
          ],
        }),
        _jsxs("div", {
          className: "rounded-xl border bg-card p-6 shadow-card",
          children: [
            _jsx("h1", { className: "text-xl font-bold", children: title }),
            sent
              ? _jsx("p", {
                  className: "mt-4 rounded-md bg-secondary p-3 text-sm",
                  children: sent,
                })
              : _jsxs(_Fragment, {
                  children: [
                    mode !== "forgot" &&
                      _jsxs("div", {
                        className: "mt-5 space-y-2",
                        children: [
                          _jsx(Button, {
                            variant: "outline",
                            className: "w-full",
                            onClick: () => oauth("google"),
                            children: "Continue with Google",
                          }),
                          _jsx("button", {
                            type: "button",
                            className: "lovable-auth-button w-full",
                            onClick: () => oauth("lovable"),
                            children: "Continue with Lovable",
                          }),
                          _jsxs("div", {
                            className:
                              "flex items-center gap-3 py-2 text-xs text-muted-foreground",
                            children: [
                              _jsx("div", {
                                className: "h-px flex-1 bg-border",
                              }),
                              "or",
                              _jsx("div", {
                                className: "h-px flex-1 bg-border",
                              }),
                            ],
                          }),
                        ],
                      }),
                    _jsxs("form", {
                      onSubmit: submit,
                      className: "mt-3 space-y-3",
                      children: [
                        mode === "signup" &&
                          _jsxs("div", {
                            className: "space-y-1.5",
                            children: [
                              _jsx(Label, {
                                htmlFor: "name",
                                children: "Name",
                              }),
                              _jsx(Input, {
                                id: "name",
                                value: name,
                                onChange: (e) => setName(e.target.value),
                                maxLength: 80,
                              }),
                            ],
                          }),
                        _jsxs("div", {
                          className: "space-y-1.5",
                          children: [
                            _jsx(Label, {
                              htmlFor: "email",
                              children: "Email",
                            }),
                            _jsx(Input, {
                              id: "email",
                              type: "email",
                              autoComplete: "email",
                              value: email,
                              onChange: (e) => setEmail(e.target.value),
                              required: true,
                            }),
                          ],
                        }),
                        mode !== "forgot" &&
                          _jsxs("div", {
                            className: "space-y-1.5",
                            children: [
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx(Label, {
                                    htmlFor: "pw",
                                    children: "Password",
                                  }),
                                  mode === "signin" &&
                                    _jsx(Link, {
                                      to: "/auth",
                                      search: { mode: "forgot" },
                                      className:
                                        "text-xs text-primary hover:underline",
                                      children: "Forgot?",
                                    }),
                                ],
                              }),
                              _jsx(Input, {
                                id: "pw",
                                type: "password",
                                autoComplete:
                                  mode === "signup"
                                    ? "new-password"
                                    : "current-password",
                                value: password,
                                onChange: (e) => setPassword(e.target.value),
                                required: true,
                              }),
                            ],
                          }),
                        _jsx(Button, {
                          type: "submit",
                          className: "w-full",
                          disabled: busy,
                          children:
                            mode === "signup"
                              ? "Create account"
                              : mode === "forgot"
                                ? "Send reset link"
                                : "Sign in",
                        }),
                      ],
                    }),
                  ],
                }),
            _jsx("p", {
              className: "mt-5 text-center text-sm text-muted-foreground",
              children:
                mode === "signin"
                  ? _jsxs(_Fragment, {
                      children: [
                        "No account? ",
                        _jsx(Link, {
                          to: "/auth",
                          search: { mode: "signup" },
                          className: "text-primary hover:underline",
                          onClick: () => setSent(null),
                          children: "Sign up",
                        }),
                      ],
                    })
                  : _jsxs(_Fragment, {
                      children: [
                        "Have an account? ",
                        _jsx(Link, {
                          to: "/auth",
                          search: { mode: "signin" },
                          className: "text-primary hover:underline",
                          onClick: () => setSent(null),
                          children: "Sign in",
                        }),
                      ],
                    }),
            }),
          ],
        }),
      ],
    }),
  });
}
