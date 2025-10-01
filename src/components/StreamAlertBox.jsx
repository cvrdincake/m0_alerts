import { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import {
  ALERT_DEFINITIONS,
  ALERT_TYPE_KEYS,
  RANDOM_ALERT_PAYLOADS,
  TEST_ALERT_PAYLOADS,
} from '../config/alertPresets.js';
import { useAlertQueue } from '../hooks/useAlertQueue.js';
import { environment } from '../config/environment.js';
import { fetchConnectionStatus, sendTestAlert } from '../services/alertApi.js';

const AUTO_MODE_INTERVAL = 5000;

const buildAlert = (type, payload) => ({
  id: `${type}-${Date.now()}-${Math.random()}`,
  type,
  payload,
  createdAt: Date.now(),
});

export const StreamAlertBox = () => {
  const [autoMode, setAutoMode] = useState(false);
  const [status, setStatus] = useState(null);
  const { current, queue, enqueue, clear } = useAlertQueue(() => 5000);

  useEffect(() => {
    if (!autoMode) {
      return undefined;
    }

    const timer = setInterval(() => {
      const type = ALERT_TYPE_KEYS[Math.floor(Math.random() * ALERT_TYPE_KEYS.length)];
      const payloadFactory = RANDOM_ALERT_PAYLOADS[type];
      const payload = payloadFactory();
      enqueue(buildAlert(type, payload));
    }, AUTO_MODE_INTERVAL);

    return () => clearInterval(timer);
  }, [autoMode, enqueue]);

  const triggerTestAlert = (type) => {
    const payload = TEST_ALERT_PAYLOADS[type];
    enqueue(buildAlert(type, payload));

    if (environment.apiBaseUrl) {
      sendTestAlert(type, payload);
    }
  };

  const activeQueue = useMemo(() => queue.slice(1, 6), [queue]);

  useEffect(() => {
    if (!environment.apiBaseUrl) {
      return undefined;
    }

    let isMounted = true;

    const loadStatus = async () => {
      const response = await fetchConnectionStatus();
      if (isMounted && response) {
        setStatus(response);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [environment.apiBaseUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-purple-500/20">
          <header className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Volume2 className="w-8 h-8 text-purple-400" />
              Stream Alert Box
            </h1>
            {environment.apiBaseUrl && (
              <StatusGrid status={status} />
            )}
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setAutoMode((value) => !value)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  autoMode
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {autoMode ? 'Auto Mode: ON' : 'Auto Mode: OFF'}
              </button>
              <button
                type="button"
                onClick={clear}
                className="px-6 py-2 rounded-lg font-semibold transition-all bg-slate-700 hover:bg-slate-600 text-slate-200"
              >
                Clear Queue
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ALERT_TYPE_KEYS.map((type) => {
                const { icon: Icon, label } = ALERT_DEFINITIONS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => triggerTestAlert(type)}
                    className="bg-gradient-to-r hover:scale-105 transition-transform from-slate-700 to-slate-600 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-3 rounded-lg font-medium flex items-center gap-2 justify-center"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
            <section className="text-sm text-slate-300 space-y-1">
              <p className="font-semibold text-slate-100">Integration Checklist</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Add this project as a Browser Source in OBS (1920x1080 canvas recommended).</li>
                <li>Connect Twitch and YouTube APIs via secure OAuth tokens.</li>
                <li>Configure webhook endpoints or EventSub for realtime alerts.</li>
                <li>Adjust alert durations and templates within <code>src/config/alertPresets.js</code>.</li>
                <li>Leverage <code>window.postMessage</code> to inject live events.</li>
              </ul>
            </section>
          </header>
        </div>

        <div className="relative h-96 flex items-center justify-center">
          {current ? (
            <StreamAlertCard alert={current} />
          ) : (
            <div className="text-slate-500 text-center">
              <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Waiting for alerts...</p>
            </div>
          )}
        </div>

        {queue.length > 1 && (
          <aside className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-purple-500/10">
            <h3 className="text-white font-semibold mb-3">Alert Queue ({queue.length - 1})</h3>
            <div className="space-y-2">
              {activeQueue.map((alert) => (
                <QueuedAlert key={alert.id} alert={alert} />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const StreamAlertCard = ({ alert }) => {
  const config = ALERT_DEFINITIONS[alert.type];
  const Icon = config.icon;

  return (
    <div className="transform transition-all duration-500 scale-100 opacity-100">
      <div
        className={`bg-gradient-to-r ${config.stream.gradient} rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform`}
      >
        <div className="bg-black/30 backdrop-blur-sm p-8 min-w-[400px]">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 rounded-full p-4 animate-pulse">
              <Icon className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">
                {config.label}
              </div>
              <div className="text-white text-2xl font-bold">
                {config.stream.template(alert.payload)}
              </div>
            </div>
            <div className="text-4xl animate-bounce">{config.stream.sound}</div>
          </div>
        </div>
        <div className="h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
      </div>
    </div>
  );
};

const StatusGrid = ({ status }) => {
  const items = [
    { label: 'Twitch', active: status?.twitch },
    { label: 'YouTube', active: status?.youtube },
    { label: 'StreamLabs', active: status?.streamlabs },
    {
      label: 'Clients',
      value: typeof status?.connectedClients === 'number' ? status.connectedClients : '–',
      active: (status?.connectedClients ?? 0) > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ label, active, value }) => (
        <div
          key={label}
          className={`glass-card glass-medium px-4 py-3 rounded-xl border border-white/10 flex flex-col gap-1 transition-colors ${
            active ? 'border-emerald-400/60 text-emerald-300' : 'text-slate-300'
          }`}
        >
          <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
          <span className="text-base font-semibold">
            {typeof value !== 'undefined' ? value : active ? 'Connected' : 'Pending'}
          </span>
        </div>
      ))}
    </div>
  );
};

const QueuedAlert = ({ alert }) => {
  const config = ALERT_DEFINITIONS[alert.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-700/30 rounded-lg px-3 py-2">
      <Icon className="w-4 h-4" />
      <span className="font-medium capitalize">{alert.type}</span>
      <span className="text-slate-400">-</span>
      <span>{config.stream.template(alert.payload)}</span>
    </div>
  );
};

export default StreamAlertBox;
