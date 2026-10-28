import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/notify/bits";
export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help — NotifyAI" },
      { name: "description", content: "How NotifyAI works." },
    ],
  }),
  component: Help,
});
const FAQ = [
  [
    "How is a notification analyzed?",
    "AI assigns a category, priority, 0–100 importance score, short summary, suggested action and a one-line reason. If AI is off or unavailable, a rule-based classifier runs instead and is labeled 'Rule-based'.",
  ],
  [
    "Will NotifyAI act on my accounts?",
    "No. It never sends messages, deletes important notifications or performs external actions without you.",
  ],
  [
    "Why can't I connect Facebook for real?",
    "Each platform restricts notification access to approved developer apps. Until that access exists, use 'Sync demo' — demo data is always labeled.",
  ],
  [
    "Do my corrections matter?",
    "Yes. Overriding a category or priority keeps your choice on future analysis, and you can turn it into a rule for that sender.",
  ],
  [
    "How do rules interact with AI?",
    "Rules run after analysis in rule-priority order. Preview a rule before applying it to existing notifications.",
  ],
  ["How do I export or delete my data?", "Settings → Privacy."],
];
function Help() {
  return _jsxs("div", {
    className: "mx-auto max-w-3xl",
    children: [
      _jsx(PageHeader, { title: "Help & support" }),
      _jsx(Accordion, {
        type: "single",
        collapsible: true,
        className: "rounded-xl border bg-card px-5 shadow-card",
        children: FAQ.map(([q, a]) =>
          _jsxs(
            AccordionItem,
            {
              value: q ?? "",
              children: [
                _jsx(AccordionTrigger, { children: q }),
                _jsx(AccordionContent, {
                  className: "text-muted-foreground",
                  children: a,
                }),
              ],
            },
            q,
          ),
        ),
      }),
    ],
  });
}
