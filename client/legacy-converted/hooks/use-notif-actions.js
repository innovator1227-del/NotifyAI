import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeNotifications } from "@/lib/notify.functions";
export function useNotifActions() {
  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzeNotifications);
  const done = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const update = useMutation({
    mutationFn: async ({ ids, patch }) => {
      const { error } = await supabase
        .from("notifications")
        .update(patch)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: done,
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      done();
    },
    onError: (e) => toast.error(e.message),
  });
  const analyze = useMutation({
    mutationFn: (ids) => analyzeFn({ data: { ids, force: !!ids } }),
    onSuccess: (r) => {
      if (r.processed === 0) toast.info(r.message ?? "Nothing new to analyze");
      else
        toast.success(
          `Analyzed ${r.processed} notification(s) · ${r.source === "ai" ? "AI" : "rule-based fallback"}`,
        );
      if (r.message && r.processed) toast.warning(r.message);
      done();
    },
    onError: (e) => toast.error(e.message),
  });
  return { update, remove, analyze };
}
