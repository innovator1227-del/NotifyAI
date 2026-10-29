import { useEffect, useState } from "react";
import { CalendarClock, LoaderCircle, Sparkles } from "lucide-react";
import api from "../services/api.js";

const SummariesPage = ({ onNotice }) => {
  const [digests, setDigests] = useState([]);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadDigests() {
    setLoading(true);
    try {
      const { data } = await api.get("/ai/digests");
      setDigests(data.digests);
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not load digests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDigests();
  }, []);

  async function generateDigest() {
    setBusy(true);
    try {
      const { data } = await api.post("/ai/digests", { hours });
      setDigests((current) => [data.digest, ...current]);
      onNotice(
        data.digest.source === "ai"
          ? "AI digest generated and saved."
          : "Digest generated with local rules. Configure OPENAI_API_KEY to enable AI summaries.",
      );
    } catch (error) {
      onNotice(error.response?.data?.message || "Could not generate digest.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-display text-sm font-bold text-slate-900">
            Notification digests
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Generate a summary of your recent notifications. AI summaries use
            the server-side provider when configured; a local summary is clearly
            labeled otherwise.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="digest-period">
            Summary period
          </label>
          <select
            className="h-10 rounded-lg border border-slate-200 px-3 text-xs text-slate-700"
            id="digest-period"
            onChange={(event) => setHours(Number(event.target.value))}
            value={hours}
          >
            <option value={24}>Past 24 hours</option>
            <option value={72}>Past 3 days</option>
            <option value={168}>Past 7 days</option>
            <option value={720}>Past 30 days</option>
          </select>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={busy}
            onClick={() => void generateDigest()}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={15} />
            ) : (
              <Sparkles size={15} />
            )}
            {busy ? "Generating..." : "Generate digest"}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <LoaderCircle className="animate-spin" size={20} />
        </div>
      ) : digests.length ? (
        <div className="space-y-4">
          {digests.map((digest) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              key={digest._id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  {digest.notificationCount} notifications · {digest.period}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <CalendarClock size={13} />
                  {new Date(digest.createdAt).toLocaleString()}
                  <span
                    className={`rounded px-2 py-1 font-bold ${digest.source === "ai" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {digest.source === "ai" ? "AI summary" : "Local summary"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {digest.summary}
              </p>
              {digest.highlights?.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {digest.highlights.map((highlight, index) => (
                    <li
                      className="rounded-lg bg-slate-50 p-3"
                      key={`${digest._id}-${index}`}
                    >
                      <strong className="text-xs text-slate-800">
                        {highlight.title}
                      </strong>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {highlight.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {digest.nextActions?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700">
                    Suggested next steps
                  </h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-500">
                    {digest.nextActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center text-sm text-slate-500">
          No digests yet. Generate one to summarize your recent notifications.
        </div>
      )}
    </div>
  );
};
export default SummariesPage;
