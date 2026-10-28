import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const PAGE_SIZE = 20;
export const notificationsQuery = (f) =>
  queryOptions({
    queryKey: ["notifications", f],
    queryFn: async () => {
      const page = f.page ?? 0;
      let q = supabase.from("notifications").select("*", { count: "exact" });
      const status = f.status ?? "all";
      q = q.eq("archived_status", status === "archived");
      if (status === "unread") q = q.eq("read_status", false);
      if (status === "read") q = q.eq("read_status", true);
      if (status === "important") q = q.eq("is_important", true);
      if (f.platform) q = q.eq("platform", f.platform);
      if (f.category) q = q.eq("category", f.category);
      if (f.priority) q = q.eq("priority", f.priority);
      if (f.from) q = q.gte("received_at", f.from);
      if (f.q) {
        const s = f.q.replace(/[%,()]/g, "");
        q = q.or(
          `message.ilike.%${s}%,sender_name.ilike.%${s}%,sender_username.ilike.%${s}%`,
        );
      }
      const sort = f.sort ?? "newest";
      if (sort === "oldest") q = q.order("received_at", { ascending: true });
      else if (sort === "priority" || sort === "relevance")
        q = q
          .order("importance_score", { ascending: false })
          .order("received_at", { ascending: false });
      else q = q.order("received_at", { ascending: false });
      const { data, error, count } = await q.range(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE - 1,
      );
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });
export const allNotificationsQuery = (sinceDays = 30) =>
  queryOptions({
    queryKey: ["notifications", "all", sinceDays],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .gte(
          "received_at",
          new Date(Date.now() - sinceDays * 86400_000).toISOString(),
        )
        .order("received_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });
export const prefsQuery = () =>
  queryOptions({
    queryKey: ["prefs"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .maybeSingle();
      if (data) return data;
      const { data: created } = await supabase
        .from("user_preferences")
        .upsert({ user_id: u.user.id })
        .select()
        .single();
      return created;
    },
  });
export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .maybeSingle();
      return { user: u.user, profile: data };
    },
  });
export const rulesQuery = () =>
  queryOptions({
    queryKey: ["rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_rules")
        .select("*")
        .order("rule_priority", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
export const integrationsQuery = () =>
  queryOptions({
    queryKey: ["integrations"],
    queryFn: async () =>
      (await supabase.from("integrations").select("*")).data ?? [],
  });
export const digestsQuery = () =>
  queryOptions({
    queryKey: ["digests"],
    queryFn: async () =>
      (
        await supabase
          .from("digests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
      ).data ?? [],
  });
