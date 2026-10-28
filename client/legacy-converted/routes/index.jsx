import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Sparkles,
  Star,
  Workflow,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NotifyAI — Tame your social media notifications" },
      {
        name: "description",
        content:
          "AI that categorizes, prioritizes and summarizes notifications across Facebook, Instagram, X, LinkedIn, YouTube and Telegram.",
      },
      {
        property: "og:title",
        content: "NotifyAI — Tame your social media notifications",
      },
      {
        property: "og:description",
        content:
          "Focus on the notifications that matter. AI triage, priority inbox, rules and daily digests.",
      },
    ],
  }),
  component: Landing,
});
const FEATURES = [
  {
    icon: Sparkles,
    title: "AI triage",
    body: "Every notification gets a category, priority, 0–100 importance score and a one-line reason.",
  },
  {
    icon: Star,
    title: "Priority inbox",
    body: "Critical items, security alerts and your key contacts — first.",
  },
  {
    icon: Workflow,
    title: "Rules you control",
    body: "Deterministic rules with previews before they touch anything.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "See where your attention goes by platform, category and sender.",
  },
];
function Landing() {
  return _jsxs("div", {
    className: "min-h-screen bg-background",
    children: [
      _jsx("div", {
        className:
          "bg-grid absolute inset-x-0 top-0 h-[560px] [mask-image:linear-gradient(to_bottom,black,transparent)]",
      }),
      _jsxs("header", {
        className:
          "relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5",
        children: [
          _jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              _jsx("div", {
                className: "grid size-8 place-items-center rounded-md bg-brand",
                children: _jsx(Bell, {
                  className: "size-4 text-primary-foreground",
                }),
              }),
              _jsx("span", {
                className: "font-bold tracking-tight",
                children: "NotifyAI",
              }),
            ],
          }),
          _jsxs("div", {
            className: "flex gap-2",
            children: [
              _jsx(Button, {
                variant: "ghost",
                asChild: true,
                children: _jsx(Link, { to: "/auth", children: "Sign in" }),
              }),
              _jsx(Button, {
                asChild: true,
                children: _jsx(Link, {
                  to: "/auth",
                  search: { mode: "signup" },
                  children: "Get started",
                }),
              }),
            ],
          }),
        ],
      }),
      _jsxs("section", {
        className: "relative mx-auto max-w-4xl px-6 pb-16 pt-20 text-center",
        children: [
          _jsxs("span", {
            className:
              "inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground",
            children: [
              _jsx(ShieldCheck, { className: "size-3.5 text-success" }),
              " Your data stays yours \u2014 no scraping, no passwords",
            ],
          }),
          _jsxs("h1", {
            className:
              "mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl",
            children: [
              "Notifications, ",
              _jsx("span", {
                className: "text-brand",
                children: "sorted by what matters.",
              }),
            ],
          }),
          _jsx("p", {
            className: "mx-auto mt-5 max-w-2xl text-lg text-muted-foreground",
            children:
              "NotifyAI reads the noise from every platform, surfaces the messages that need you, and quietly files the rest.",
          }),
          _jsxs("div", {
            className: "mt-8 flex justify-center gap-3",
            children: [
              _jsx(Button, {
                size: "lg",
                asChild: true,
                children: _jsx(Link, {
                  to: "/auth",
                  search: { mode: "signup" },
                  children: "Start free",
                }),
              }),
              _jsx(Button, {
                size: "lg",
                variant: "outline",
                asChild: true,
                children: _jsx(Link, {
                  to: "/auth",
                  children: "I have an account",
                }),
              }),
            ],
          }),
        ],
      }),
      _jsx("section", {
        className:
          "relative mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4",
        children: FEATURES.map((f) =>
          _jsxs(
            "div",
            {
              className: "rounded-xl border bg-card p-5 shadow-card",
              children: [
                _jsx(f.icon, { className: "size-5 text-primary" }),
                _jsx("h3", {
                  className: "mt-3 font-semibold",
                  children: f.title,
                }),
                _jsx("p", {
                  className: "mt-1 text-sm text-muted-foreground",
                  children: f.body,
                }),
              ],
            },
            f.title,
          ),
        ),
      }),
    ],
  });
}
