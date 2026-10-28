import { useEffect, useState } from "react";
import { CircleCheck, CircleDashed, LoaderCircle, RefreshCw } from "lucide-react";
import api from "../services/api.js";

const providerDescriptions = {
  Facebook: "Security and social notifications",
  Instagram: "Comments and mentions",
  X: "Updates and mentions",
  LinkedIn: "Work and network notifications",
  YouTube: "New videos and channel updates",
  Telegram: "Messages and group alerts",
  Demo: "Sample notifications for exploring the inbox",
};

export default function IntegrationsPage({ onNotice, onSynced }) {
  const [integrations, setIntegrations] = useState([]);
  const [providers, setProviders] = useState(Object.keys(providerDescriptions));
  const [busyProvider, setBusyProvider] = useState("");

  async function loadIntegrations() {
    try {
      const { data } = await api.get("/integrations");
      setIntegrations(data.integrations);
      setProviders(data.providers);
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not load integrations.");
    }
  }

  useEffect(() => {
    void loadIntegrations();
  }, []);

  async function syncProvider(provider) {
    setBusyProvider(provider);
    try {
      const { data } = await api.post("/integrations/sync-demo", { provider });
      setIntegrations((current) => [
        data.integration,
        ...current.filter((item) => item.provider !== provider),
      ]);
      onNotice(`Imported ${data.imported} new sample notification(s) from ${provider}.`);
      onSynced();
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not sync sample data.");
    } finally {
      setBusyProvider("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        These are demo data sources for development and testing. Real social-platform connections require each provider&apos;s approved OAuth access and credentials; no live account is connected here.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => {
          const integration = integrations.find((item) => item.provider === provider);
          const syncing = busyProvider === provider;
          return (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={provider}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">{provider}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{providerDescriptions[provider]}</p>
                </div>
                {integration ? (
                  <CircleCheck className="text-emerald-500" size={18} />
                ) : (
                  <CircleDashed className="text-slate-300" size={18} />
                )}
              </div>
              <p className="mt-4 text-[10px] text-slate-400">
                {integration?.lastSyncAt
                  ? `Sample data synced ${new Date(integration.lastSyncAt).toLocaleString()}`
                  : "No sample data synced"}
              </p>
              <button
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                disabled={Boolean(busyProvider)}
                onClick={() => void syncProvider(provider)}
              >
                {syncing ? <LoaderCircle className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                {syncing ? "Syncing..." : "Load demo notifications"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
