import { useEffect, useMemo, useState } from 'react';
import {
  ALERT_DEFINITIONS,
  ALERT_TYPE_KEYS,
  RANDOM_ALERT_PAYLOADS,
} from '../config/alertPresets.js';
import { useAlertQueue } from '../hooks/useAlertQueue.js';

const buildDisplayAlert = (type, payload) => {
  const definition = ALERT_DEFINITIONS[type];
  return {
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    payload,
    definition,
  };
};

const getDuration = (alert) => alert.definition.display.duration;

export const AlertBoxDisplay = () => {
  const [autoMode, setAutoMode] = useState(false);
  const { current, queue, enqueue } = useAlertQueue(getDuration);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAutoMode(params.get('test') === 'true');
  }, []);

  useEffect(() => {
    if (!autoMode) {
      return undefined;
    }

    const timer = setInterval(() => {
      const type = ALERT_TYPE_KEYS[Math.floor(Math.random() * ALERT_TYPE_KEYS.length)];
      const payload = RANDOM_ALERT_PAYLOADS[type]();
      enqueue(buildDisplayAlert(type, payload));
    }, 8000 + Math.random() * 4000);

    return () => clearInterval(timer);
  }, [autoMode, enqueue]);

  useEffect(() => {
    const handler = (event) => {
      const { type, data } = event.data ?? {};
      if (!type || !ALERT_DEFINITIONS[type]) {
        return;
      }
      enqueue(buildDisplayAlert(type, data));
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [enqueue]);

  const isConnected = useMemo(() => queue.length > 0 || Boolean(current), [current, queue]);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
      <ConnectionIndicator isConnected={isConnected} />
      {current && <DisplayAlert alert={current} />}
    </div>
  );
};

const ConnectionIndicator = ({ isConnected }) => (
  <div className={`connection-status-pro ${isConnected ? 'connected-pro' : ''}`}>
    <span className={`connection-dot-pro ${isConnected ? 'connected-pro' : ''}`} />
    <span className="connection-text-pro">{isConnected ? 'Connected' : 'Idle'}</span>
  </div>
);

const DisplayAlert = ({ alert }) => {
  const { definition, payload } = alert;
  const { icon: Icon, display } = definition;
  const content = display.template(payload);

  const animationClass = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    shake: 'animate-shake',
    slide: '',
  }[display.animation];

  return (
    <div className="transform transition-all duration-500 ease-out scale-100 opacity-100">
      <div className={`bg-gradient-to-br ${display.colors.primary} rounded-3xl shadow-2xl ${display.colors.glow} overflow-hidden`}>
        <div className="h-2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        <div className="bg-black/40 backdrop-blur-md p-8 min-w-[500px] max-w-[620px]">
          <div className="flex items-center gap-6">
            <div className={`${display.colors.accent} rounded-2xl p-5 ${animationClass ?? ''}`}>
              <Icon className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="text-white/90 text-xs font-bold uppercase tracking-widest mb-2 drop-shadow">
                {content.title}
              </div>
              <div className="text-white text-4xl font-black mb-1 drop-shadow-lg leading-tight">
                {content.message}
              </div>
              <div className="text-white/80 text-lg font-semibold drop-shadow">{content.subtitle}</div>
              {content.extra && <div className="text-white/70 text-sm mt-2 italic">{content.extra}</div>}
            </div>
            <div className="text-6xl animate-bounce-slow">{display.sound}</div>
          </div>
        </div>
        <div className="h-2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer-reverse" style={{ backgroundSize: '200% 100%' }} />
      </div>
    </div>
  );
};

export default AlertBoxDisplay;
