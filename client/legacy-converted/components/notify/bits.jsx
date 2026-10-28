import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "@/components/ui/badge";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  Twitter,
  FlaskConical,
  Sparkles,
  Cpu,
} from "lucide-react";
export const PLATFORM_META = {
  facebook: { label: "Facebook", icon: Facebook },
  instagram: { label: "Instagram", icon: Instagram },
  x: { label: "X", icon: Twitter },
  linkedin: { label: "LinkedIn", icon: Linkedin },
  youtube: { label: "YouTube", icon: Youtube },
  telegram: { label: "Telegram", icon: Send },
  demo: { label: "Demo", icon: FlaskConical },
};
export function PlatformIcon({ platform, className = "size-4" }) {
  const Icon = PLATFORM_META[platform]?.icon ?? FlaskConical;
  return _jsx(Icon, {
    className: className,
    "aria-label": PLATFORM_META[platform]?.label ?? platform,
  });
}
export function PriorityBadge({ priority }) {
  const v = ["critical", "high", "medium", "low"].includes(priority)
    ? priority
    : "low";
  return _jsx(Badge, {
    variant: v,
    className: "capitalize",
    children: priority,
  });
}
export function SourceBadge({ source }) {
  if (!source)
    return _jsx(Badge, { variant: "fallback", children: "Not analyzed" });
  return source === "ai"
    ? _jsxs(Badge, {
        variant: "ai",
        className: "gap-1",
        children: [_jsx(Sparkles, { className: "size-3" }), "AI"],
      })
    : _jsxs(Badge, {
        variant: "fallback",
        className: "gap-1",
        children: [_jsx(Cpu, { className: "size-3" }), "Rule-based"],
      });
}
export function PageHeader({ title, description, actions }) {
  return _jsxs("div", {
    className:
      "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
    children: [
      _jsxs("div", {
        children: [
          _jsx("h1", {
            className: "text-2xl font-bold tracking-tight",
            children: title,
          }),
          description &&
            _jsx("p", {
              className: "mt-1 text-sm text-muted-foreground",
              children: description,
            }),
        ],
      }),
      actions &&
        _jsx("div", { className: "flex flex-wrap gap-2", children: actions }),
    ],
  });
}
export function EmptyState({ icon: Icon, title, body, action }) {
  return _jsxs("div", {
    className:
      "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 px-6 py-14 text-center",
    children: [
      _jsx("div", {
        className: "mb-3 rounded-full bg-secondary p-3",
        children: _jsx(Icon, { className: "size-5 text-muted-foreground" }),
      }),
      _jsx("h3", { className: "font-semibold", children: title }),
      _jsx("p", {
        className: "mt-1 max-w-sm text-sm text-muted-foreground",
        children: body,
      }),
      action && _jsx("div", { className: "mt-4", children: action }),
    ],
  });
}
export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export const label = (s) =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
