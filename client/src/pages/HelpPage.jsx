import { BookOpenCheck, CircleHelp } from "lucide-react";

const topics = [
  {
    title: "Connect a social account",
    detail:
      "The integrations page currently imports sample notifications for development. Live account connections require provider OAuth credentials and approved API access.",
  },
  {
    title: "Run notification triage",
    detail:
      "Use Run AI triage to analyze up to 25 recent notifications. Without an OpenAI API key the server uses clearly labeled local rules instead.",
  },
  {
    title: "Create a rule",
    detail:
      "Rules match a sender, message, platform, category, or priority and can update priority, category, read state, importance, or archive status.",
  },
  {
    title: "Manage your account data",
    detail:
      "Update profile and notification preferences in Settings, or export your profile, notifications, rules, integrations, and summaries to JSON.",
  },
];

const HelpPage = () => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <BookOpenCheck size={19} />
        </span>
        <div>
          <h2 className="font-display text-sm font-bold text-slate-900">
            NotifyAI help
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Quick answers about your workspace.
          </p>
        </div>
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {topics.map(({ title, detail }) => (
          <article className="flex gap-3 py-4 first:pt-1" key={title}>
            <CircleHelp className="mt-0.5 shrink-0 text-indigo-500" size={16} />
            <div>
              <h3 className="text-xs font-bold text-slate-800">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
export default HelpPage;
