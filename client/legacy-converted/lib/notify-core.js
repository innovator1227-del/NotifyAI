// Pure, deterministic logic shared by client and server: taxonomy, rule engine, fallback classifier.
export const CATEGORIES = [
  "personal",
  "work",
  "education",
  "business",
  "news",
  "promotions",
  "social",
  "security",
  "other",
];
export const PRIORITIES = ["critical", "high", "medium", "low"];
export const PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "linkedin",
  "youtube",
  "telegram",
  "demo",
];
export const ACTIONS = ["reply", "review", "save_for_later", "ignore"];
export const PRIORITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
function fieldValue(n, f) {
  switch (f) {
    case "sender":
      return `${n.sender_name} ${n.sender_username ?? ""}`;
    case "message":
      return n.message;
    case "platform":
      return n.platform;
    case "category":
      return n.category ?? "";
    case "priority":
      return n.priority ?? "";
  }
}
export function matchCondition(n, c) {
  const hay = fieldValue(n, c.field).toLowerCase().trim();
  const needle = c.value.toLowerCase().trim();
  if (!needle) return false;
  if (c.op === "equals") return hay === needle;
  if (c.op === "contains") return hay.includes(needle);
  return !hay.includes(needle);
}
export function ruleMatches(n, r) {
  if (!r.active || r.conditions.length === 0) return false;
  return r.match_mode === "any"
    ? r.conditions.some((c) => matchCondition(n, c))
    : r.conditions.every((c) => matchCondition(n, c));
}
export function ruleEffects(r) {
  const p = {};
  for (const a of r.actions) {
    if (a.type === "set_priority" && a.value && PRIORITIES.includes(a.value))
      p.priority = a.value;
    if (a.type === "set_category" && a.value && CATEGORIES.includes(a.value))
      p.category = a.value;
    if (a.type === "archive") p.archived_status = true;
    if (a.type === "mark_important") p.is_important = true;
    if (a.type === "mark_read") p.read_status = true;
  }
  return p;
}
/** Apply rules in priority order (higher first); later-ordered rules don't override earlier ones. */
export function applyRules(n, rules) {
  const sorted = [...rules].sort(
    (a, b) => (b.rule_priority ?? 0) - (a.rule_priority ?? 0),
  );
  const out = {};
  for (const r of sorted) {
    if (!ruleMatches(n, r)) continue;
    const e = ruleEffects(r);
    for (const k of Object.keys(e)) {
      if (out[k] === undefined) out[k] = e[k];
    }
  }
  return out;
}
// ---------- Rule-based fallback classifier (clearly labeled, not AI) ----------
const KEYWORDS = {
  security: [
    "password",
    "login attempt",
    "verify",
    "suspicious",
    "2fa",
    "security",
    "unauthorized",
    "breach",
    "code is",
  ],
  work: [
    "meeting",
    "deadline",
    "project",
    "client",
    "invoice",
    "standup",
    "report",
    "manager",
    "sprint",
    "job",
  ],
  education: [
    "assignment",
    "course",
    "lecture",
    "exam",
    "class",
    "homework",
    "professor",
    "grade",
  ],
  business: [
    "partnership",
    "proposal",
    "contract",
    "deal",
    "revenue",
    "investor",
  ],
  news: ["breaking", "news", "update:", "headline", "announced"],
  promotions: [
    "sale",
    "% off",
    "discount",
    "offer",
    "promo",
    "deal of",
    "limited time",
    "free trial",
    "buy now",
    "coupon",
  ],
  social: [
    "liked",
    "commented",
    "followed",
    "tagged",
    "mentioned",
    "shared",
    "reacted",
    "birthday",
  ],
  personal: [
    "mom",
    "dad",
    "family",
    "dinner",
    "love",
    "friend",
    "weekend",
    "call me",
  ],
  other: [],
};
export function fallbackClassify(n, importantContacts = []) {
  const text = `${n.message} ${n.sender_name}`.toLowerCase();
  let best = "other";
  let bestHits = 0;
  for (const c of CATEGORIES) {
    const hits = KEYWORDS[c].filter((k) => text.includes(k)).length;
    if (hits > bestHits) {
      best = c;
      bestHits = hits;
    }
  }
  const urgent = /urgent|asap|immediately|now|today|critical/.test(text);
  const isContact = importantContacts.some(
    (c) =>
      c &&
      (n.sender_name.toLowerCase().includes(c.toLowerCase()) ||
        (n.sender_username ?? "").toLowerCase().includes(c.toLowerCase())),
  );
  let score = {
    security: 85,
    work: 65,
    education: 60,
    business: 60,
    personal: 55,
    news: 35,
    social: 30,
    promotions: 15,
    other: 40,
  }[best];
  if (urgent) score += 15;
  if (isContact) score += 20;
  score = Math.max(0, Math.min(100, score));
  const priority =
    score >= 85
      ? "critical"
      : score >= 65
        ? "high"
        : score >= 40
          ? "medium"
          : "low";
  const is_spam = best === "promotions" && !isContact;
  const suggested_action =
    best === "promotions"
      ? "ignore"
      : ["personal", "work", "business"].includes(best)
        ? "reply"
        : best === "security"
          ? "review"
          : "save_for_later";
  const summary =
    n.message.length > 110
      ? n.message.slice(0, 107).trimEnd() + "…"
      : n.message;
  const reason = `Rule-based fallback: ${bestHits ? `matched ${bestHits} ${best} keyword(s)` : "no keywords matched"}${urgent ? ", urgency words found" : ""}${isContact ? ", sender is an important contact" : ""}.`;
  return {
    category: best,
    priority,
    importance_score: score,
    summary,
    reason,
    suggested_action,
    is_spam,
  };
}
export function contentHash(n) {
  const s = `${n.platform}|${n.sender_name}|${n.message}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}
