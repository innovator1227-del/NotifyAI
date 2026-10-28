import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIONS,
  CATEGORIES,
  PLATFORMS,
  PRIORITIES,
  applyRules,
  contentHash,
  fallbackClassify,
  ruleMatches,
  ruleEffects,
} from "./notify-core";
import { demoBatch } from "./demo-data";
const classItem = z.object({
  id: z.string(),
  category: z.string(),
  priority: z.string(),
  importance_score: z.number(),
  summary: z.string(),
  reason: z.string(),
  suggested_action: z.string(),
  is_spam: z.boolean(),
});
const classSchema = z.object({ items: z.array(classItem) });
const pick = (list, v, d) =>
  list.includes(v?.toLowerCase()) ? v.toLowerCase() : d;
// ---------- Analyze ----------
export const analyzeNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        ids: z.array(z.string().uuid()).max(100).optional(),
        force: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .limit(25);
    if (data.ids?.length) q = q.in("id", data.ids);
    else q = q.is("ai_source", null).eq("archived_status", false);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const todo = (rows ?? []).filter(
      (r) => data.force || r.analyzed_hash !== contentHash(r),
    );
    if (!todo.length)
      return {
        processed: 0,
        source: "none",
        message: "Nothing new to analyze",
      };
    const [{ data: prefs }, { data: rules }] = await Promise.all([
      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("notification_rules")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true),
    ]);
    const contacts = prefs?.important_contacts ?? [];
    const { aiAvailable, aiObject } = await import("./ai.server");
    let source = "fallback";
    let warning;
    const results = new Map();
    if (aiAvailable() && prefs?.ai_enabled !== false) {
      try {
        const out = await aiObject(
          classSchema,
          `You triage social media notifications. For each item return: category (one of ${CATEGORIES.join(", ")}), priority (${PRIORITIES.join(", ")}), importance_score 0-100, a summary under 18 words, a one-sentence reason explaining the category and priority, suggested_action (${ACTIONS.join(", ")}), and is_spam (true only for likely promotional/irrelevant content; never for messages from real contacts). Important contacts: ${contacts.join(", ") || "none"}. Important categories: ${(prefs?.important_categories ?? []).join(", ")}.`,
          JSON.stringify(
            todo.map((r) => ({
              id: r.id,
              platform: r.platform,
              sender: r.sender_name,
              username: r.sender_username,
              message: r.message.slice(0, 1200),
            })),
          ),
        );
        for (const it of out.items) {
          results.set(it.id, {
            category: pick(CATEGORIES, it.category, "other"),
            priority: pick(PRIORITIES, it.priority, "medium"),
            importance_score: Math.max(
              0,
              Math.min(100, Math.round(it.importance_score)),
            ),
            summary: it.summary.slice(0, 300),
            reason: it.reason.slice(0, 400),
            suggested_action: pick(ACTIONS, it.suggested_action, "review"),
            is_spam: !!it.is_spam,
          });
        }
        source = "ai";
      } catch (e) {
        warning = `${e.message} — used rule-based fallback instead.`;
      }
    }
    let processed = 0;
    for (const r of todo) {
      const c = results.get(r.id) ?? fallbackClassify(r, contacts);
      const src = results.has(r.id) ? "ai" : "fallback";
      const keepUser = r.user_override;
      const base = {
        category: keepUser ? r.category : c.category,
        priority: keepUser ? r.priority : c.priority,
      };
      const patch = applyRules({ ...r, ...base }, rules ?? []);
      const { error: uerr } = await supabase
        .from("notifications")
        .update({
          ...base,
          importance_score: c.importance_score,
          ai_summary: c.summary,
          ai_reason: c.reason,
          suggested_action: c.suggested_action,
          is_spam: c.is_spam,
          ai_source: src,
          analyzed_hash: contentHash(r),
          ...(keepUser ? {} : patch),
        })
        .eq("id", r.id);
      if (!uerr) processed++;
    }
    return { processed, source, message: warning };
  });
// ---------- Digest ----------
const digestSchema = z.object({
  summary: z.string(),
  highlights: z.array(z.object({ title: z.string(), detail: z.string() })),
  next_actions: z.array(z.string()),
});
export const generateDigest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        hours: z
          .number()
          .min(1)
          .max(24 * 31),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const end = new Date();
    const start = new Date(end.getTime() - data.hours * 3600_000);
    const { data: rows } = await supabase
      .from("notifications")
      .select(
        "id,platform,sender_name,message,category,priority,importance_score,read_status,ai_summary",
      )
      .eq("user_id", userId)
      .eq("archived_status", false)
      .eq("is_spam", false)
      .gte("received_at", start.toISOString())
      .order("importance_score", { ascending: false })
      .limit(60);
    if (!rows?.length)
      return {
        ok: false,
        message: "No eligible notifications in this period.",
      };
    const { aiAvailable, aiObject } = await import("./ai.server");
    let out;
    let source = "ai";
    try {
      if (!aiAvailable()) throw new Error("AI not configured");
      out = await aiObject(
        digestSchema,
        "Write a concise daily digest of the user's notifications. summary: 2-4 sentences. highlights: up to 6 grouped items (group related notifications by topic/sender/conversation). next_actions: up to 5 short imperative suggestions. Never suggest sending messages automatically.",
        JSON.stringify(
          rows.map((r) => ({
            from: r.sender_name,
            platform: r.platform,
            category: r.category,
            priority: r.priority,
            unread: !r.read_status,
            text: (r.ai_summary ?? r.message).slice(0, 400),
          })),
        ),
      );
    } catch {
      source = "fallback";
      const top = rows.slice(0, 5);
      const unreadHigh = rows.filter(
        (r) => !r.read_status && ["critical", "high"].includes(r.priority),
      ).length;
      out = {
        summary: `Rule-based digest: ${rows.length} notifications in this period, ${unreadHigh} unread high-priority.`,
        highlights: top.map((r) => ({
          title: `${r.sender_name} · ${r.platform}`,
          detail: r.ai_summary ?? r.message.slice(0, 140),
        })),
        next_actions: unreadHigh
          ? ["Review unread high-priority notifications in Priority Inbox"]
          : ["You're caught up on important items"],
      };
    }
    const { data: saved, error } = await supabase
      .from("digests")
      .insert({
        user_id: userId,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        summary: out.summary,
        highlights: out.highlights.slice(0, 8),
        next_actions: out.next_actions.slice(0, 6),
        notification_count: rows.length,
        source,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, digest: saved };
  });
// ---------- Smart search ----------
const searchSchema = z.object({
  keywords: z.array(z.string()),
  categories: z.array(z.string()),
  priorities: z.array(z.string()),
  platforms: z.array(z.string()),
  unread_only: z.boolean(),
  days: z.number().nullable(),
});
export const smartSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ query: z.string().min(1).max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { aiAvailable, aiObject } = await import("./ai.server");
    let f = {
      keywords: data.query.split(/\s+/).filter((w) => w.length > 2),
      categories: [],
      priorities: [],
      platforms: [],
      unread_only: false,
      days: null,
    };
    let source = "keyword";
    if (aiAvailable()) {
      try {
        f = await aiObject(
          searchSchema,
          `Convert a natural-language notification search into filters. categories from: ${CATEGORIES.join(",")}. priorities from: ${PRIORITIES.join(",")}. platforms from: ${PLATFORMS.join(",")}. keywords: 0-4 distinctive words or sender names to match in text. days: lookback window or null.`,
          data.query,
        );
        source = "ai";
      } catch {
        /* keyword fallback */
      }
    }
    let q = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("importance_score", { ascending: false })
      .limit(50);
    const cats = f.categories.filter((c) => CATEGORIES.includes(c));
    const pris = f.priorities.filter((c) => PRIORITIES.includes(c));
    const plats = f.platforms.filter((c) => PLATFORMS.includes(c));
    if (cats.length) q = q.in("category", cats);
    if (pris.length) q = q.in("priority", pris);
    if (plats.length) q = q.in("platform", plats);
    if (f.unread_only) q = q.eq("read_status", false);
    if (f.days)
      q = q.gte(
        "received_at",
        new Date(Date.now() - f.days * 86400_000).toISOString(),
      );
    const kws = f.keywords
      .map((k) => k.replace(/[%,()]/g, "").trim())
      .filter(Boolean)
      .slice(0, 4);
    if (kws.length)
      q = q.or(
        kws
          .flatMap((k) => [`message.ilike.%${k}%`, `sender_name.ilike.%${k}%`])
          .join(","),
      );
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return {
      source,
      filters: {
        ...f,
        categories: cats,
        priorities: pris,
        platforms: plats,
        keywords: kws,
      },
      results: rows ?? [],
    };
  });
// ---------- Rules ----------
export const previewRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => d)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("notifications")
      .select(
        "id,platform,sender_name,sender_username,message,category,priority,archived_status",
      )
      .eq("user_id", context.userId)
      .limit(1000);
    const rule = { ...data.rule, active: true };
    const matches = (rows ?? []).filter((n) => ruleMatches(n, rule));
    return {
      count: matches.length,
      effects: ruleEffects(rule),
      sample: matches.slice(0, 8),
    };
  });
export const applyRuleNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ruleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rule } = await supabase
      .from("notification_rules")
      .select("*")
      .eq("id", data.ruleId)
      .eq("user_id", userId)
      .single();
    if (!rule) throw new Error("Rule not found");
    const { data: rows } = await supabase
      .from("notifications")
      .select(
        "id,platform,sender_name,sender_username,message,category,priority",
      )
      .eq("user_id", userId)
      .eq("user_override", false)
      .limit(1000);
    const r = { ...rule, active: true };
    const ids = (rows ?? []).filter((n) => ruleMatches(n, r)).map((n) => n.id);
    const eff = ruleEffects(r);
    if (ids.length && Object.keys(eff).length)
      await supabase.from("notifications").update(eff).in("id", ids);
    await supabase
      .from("notification_rules")
      .update({
        run_count: (rule.run_count ?? 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", rule.id);
    return { updated: ids.length };
  });
// ---------- Integrations (demo provider) ----------
export const syncDemoProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ provider: z.enum(PLATFORMS) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const batch = demoBatch(data.provider).map((n) => ({
      ...n,
      user_id: userId,
      is_seed: true,
    }));
    const { data: inserted, error } = await supabase
      .from("notifications")
      .upsert(batch, {
        onConflict: "user_id,platform,external_notification_id",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) throw new Error(error.message);
    await supabase
      .from("integrations")
      .upsert(
        {
          user_id: userId,
          provider: data.provider,
          status: "demo",
          last_sync_at: new Date().toISOString(),
          error: null,
        },
        { onConflict: "user_id,provider" },
      );
    return { imported: inserted?.length ?? 0 };
  });
// ---------- Settings: export / delete ----------
export const exportData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [p, n, r, i, d, pr] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId),
      supabase.from("notification_rules").select("*").eq("user_id", userId),
      supabase
        .from("integrations")
        .select("provider,status,last_sync_at")
        .eq("user_id", userId),
      supabase.from("digests").select("*").eq("user_id", userId),
      supabase.from("user_preferences").select("*").eq("user_id", userId),
    ]);
    return {
      exported_at: new Date().toISOString(),
      profile: p.data,
      notifications: n.data,
      rules: r.data,
      integrations: i.data,
      digests: d.data,
      preferences: pr.data,
    };
  });
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await Promise.all([
      supabase.from("notifications").delete().eq("user_id", userId),
      supabase.from("notification_rules").delete().eq("user_id", userId),
      supabase.from("integrations").delete().eq("user_id", userId),
      supabase.from("digests").delete().eq("user_id", userId),
      supabase.from("user_preferences").delete().eq("user_id", userId),
    ]);
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
