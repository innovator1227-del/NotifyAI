import { useEffect, useState } from "react";
import {
  Send,
  CircleCheck,
  CircleDashed,
  LoaderCircle,
  RefreshCw,
  Unplug,
  ExternalLink,
} from "lucide-react";
import api from "../services/api.js";

const TelegramIntegration = ({ onNotice, onSynced }) => {
  const [connected, setConnected] = useState(false);
  const [connection, setConnection] = useState(null);
  const [deepLink, setDeepLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function loadStatus() {
    try {
      const { data } = await api.get("/telegram/status");

      setConnected(data.connected);
      setConnection(data.connection);
    } catch (error) {
      onNotice(
        error.response?.data?.message ||
          "Could not load Telegram connection status.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function connectTelegram() {
    setConnecting(true);
    setDeepLink("");

    try {
      const { data } = await api.post("/telegram/connect");

      setDeepLink(data.deepLink);
      onNotice("Telegram connection link generated. Open it and press Start.");
    } catch (error) {
      onNotice(
        error.response?.data?.message ||
          "Could not generate Telegram connection link.",
      );
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectTelegram() {
    const confirmed = window.confirm(
      "Are you sure you want to disconnect Telegram?",
    );

    if (!confirmed) return;

    setDisconnecting(true);

    try {
      const { data } = await api.delete("/telegram/disconnect");

      setConnected(false);
      setConnection(null);
      setDeepLink("");

      onNotice(data.message || "Telegram disconnected successfully.");
      onSynced();
    } catch (error) {
      onNotice(
        error.response?.data?.message || "Could not disconnect Telegram.",
      );
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Send size={21} />
          </div>

          <div>
            <h2 className="font-display text-sm font-bold text-slate-900">
              Telegram
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Messages and group alerts
            </p>
          </div>
        </div>

        {loading ? (
          <LoaderCircle className="animate-spin text-slate-400" size={18} />
        ) : connected ? (
          <CircleCheck className="text-emerald-500" size={19} />
        ) : (
          <CircleDashed className="text-slate-300" size={19} />
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="text-xs text-slate-500">
            Checking connection status...
          </p>
        ) : connected ? (
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-700">
              Connected successfully
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              {connection?.username
                ? `@${connection.username}`
                : connection?.firstName || "Telegram account"}
            </p>
          </div>
        ) : (
          <p className="text-xs leading-5 text-slate-500">
            Connect your Telegram account to receive messages in your NotifyAI
            inbox.
          </p>
        )}
      </div>

      {!loading && (
        <div className="mt-4 flex flex-wrap gap-2">
          {connected ? (
            <button
              onClick={disconnectTelegram}
              disabled={disconnecting}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {disconnecting ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Unplug size={14} />
              )}
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={connectTelegram}
              disabled={connecting}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {connecting ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {connecting ? "Generating link..." : "Connect Telegram"}
            </button>
          )}

          <button
            onClick={() => void loadStatus()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      )}

      {deepLink && !connected && (
        <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-3">
          <p className="text-xs font-semibold text-sky-800">
            Your connection link is ready
          </p>
          <p className="mt-1 text-xs leading-5 text-sky-700">
            Open Telegram and press Start to connect your account. This link
            expires after 10 minutes.
          </p>
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900"
          >
            Open Telegram <ExternalLink size={13} />
          </a>
        </div>
      )}
    </article>
  );
};

export default TelegramIntegration;
