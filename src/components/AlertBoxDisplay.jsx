import { useCallback, useEffect, useState } from 'react';
import { ALERT_TYPE_KEYS, RANDOM_ALERT_PAYLOADS } from '../config/alertPresets.js';
import { environment } from '../config/environment.js';
import { useAlertQueue } from '../hooks/useAlertQueue.js';
import { useAlertSocket } from '../hooks/useAlertSocket.js';
import { createDisplayAlert } from '../utils/alertFactory.js';

const TEST_QUERY_KEY = 'test';
const TTS_QUERY_KEY = 'tts';
const EXIT_BUFFER_MS = 400;

const pickRandomType = () =>
  ALERT_TYPE_KEYS[Math.floor(Math.random() * ALERT_TYPE_KEYS.length)];

const getAnimationClass = (animation, phase) => {
  const animations = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    shake: phase === 'show' ? 'animate-shake' : '',
    slide: '',
  };

  return animations[animation] || '';
};

const getPhaseTransform = (phase) => {
  if (phase === 'enter') {
    return 'scale-0 opacity-0 -translate-y-20';
  }
  if (phase === 'exit') {
    return 'scale-0 opacity-0 translate-y-20';
  }
  return 'scale-100 opacity-100 translate-y-0';
};

const speakAlert = (alert) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const { displayContent } = alert;
  if (!displayContent) {
    return;
  }

  const { title, message, subtitle, extra } = displayContent;
  const parts = [title, message, subtitle, extra].filter(Boolean);
  if (parts.length === 0) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(parts.join('. '));
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Text-to-speech failed', error);
  }
};

const AlertCard = ({ alert }) => {
  const [phase, setPhase] = useState('enter');
  const { definition, displayContent, displayDuration } = alert;
  const Icon = definition.icon;
  const { colors, animation, sound } = definition.display;
  const content = displayContent || {
    title: '',
    message: '',
    subtitle: '',
    extra: '',
  };

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('show'), 50);
    const exitTimer = setTimeout(
      () => setPhase('exit'),
      Math.max(displayDuration - EXIT_BUFFER_MS, 300),
    );

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
    };
  }, [displayDuration]);

  return (
    <div className={`transform transition-all duration-500 ease-out ${getPhaseTransform(phase)}`}>
      <div className={`bg-gradient-to-br ${colors.primary} rounded-3xl shadow-2xl ${colors.glow} overflow-hidden`}>
        <div
          className="h-2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"
          style={{ backgroundSize: '200% 100%' }}
        />

        <div className="bg-black/40 backdrop-blur-md p-8 min-w-[500px] max-w-[640px]">
          <div className="flex items-center gap-6">
            <div className={`${colors.accent} rounded-2xl p-5 ${getAnimationClass(animation, phase)}`}>
              <Icon className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <div className="text-white/90 text-xs font-bold uppercase tracking-widest mb-2 drop-shadow">
                {content.title}
              </div>
              <div className="text-white text-4xl font-black mb-1 drop-shadow-lg leading-tight">
                {content.message}
              </div>
              <div className="text-white/80 text-lg font-semibold drop-shadow">
                {content.subtitle}
              </div>
              {content.extra && (
                <div className="text-white/70 text-sm mt-2 italic">{content.extra}</div>
              )}
            </div>

            <div className="text-6xl animate-bounce-slow">{sound}</div>
          </div>
        </div>

        <div
          className="h-2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer-reverse"
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>
    </div>
  );
};

const parseOverlayOptions = () => {
  if (typeof window === 'undefined') {
    return { testMode: false, tts: false };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    testMode: params.get(TEST_QUERY_KEY) === 'true',
    tts: params.get(TTS_QUERY_KEY) === 'true',
  };
};

const AlertBoxDisplay = () => {
  const [options, setOptions] = useState(() => parseOverlayOptions());
  const [connectionStatus, setConnectionStatus] = useState(
    environment.wsUrl ? 'connecting' : 'offline',
  );
  const { current, queue, enqueue } = useAlertQueue((alert) => alert.displayDuration);

  const handleIncomingAlert = useCallback(
    (payload) => {
      if (!payload?.type) {
        return;
      }
      const alert = createDisplayAlert(payload.type, payload.data ?? payload.payload);
      if (alert) {
        enqueue(alert);
      }
    },
    [enqueue],
  );

  useAlertSocket({
    enabled: Boolean(environment.wsUrl),
    onAlert: handleIncomingAlert,
    onStatusChange: setConnectionStatus,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const onMessage = (event) => {
      const { type, data, payload } = event.data || {};
      const alert = createDisplayAlert(type, data ?? payload);
      if (alert) {
        enqueue(alert);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [enqueue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleVisibility = () => {
      setOptions(parseOverlayOptions());
    };

    window.addEventListener('focus', handleVisibility);
    window.addEventListener('popstate', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('popstate', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!options.testMode) {
      return undefined;
    }

    let active = true;
    let timeoutId;

    const schedule = (delay) => {
      timeoutId = window.setTimeout(() => {
        if (!active) {
          return;
        }
        const type = pickRandomType();
        const payload = RANDOM_ALERT_PAYLOADS[type]();
        const alert = createDisplayAlert(type, payload);
        if (alert) {
          enqueue(alert);
        }
        schedule(8000 + Math.random() * 4000);
      }, delay);
    };

    schedule(1500);

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [options.testMode, enqueue]);

  useEffect(() => {
    if (!options.tts || !current) {
      return;
    }
    speakAlert(current);
  }, [current, options.tts]);

  useEffect(() => {
    if (!current) {
      return undefined;
    }

    const soundUrl = current.definition.display.soundUrl;
    if (!soundUrl || typeof Audio === 'undefined') {
      return undefined;
    }

    const audio = new Audio(soundUrl);
    audio.volume = 0.8;
    audio.play().catch((error) => console.error('Failed to play alert audio', error));

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [current]);

  return (
    <div
      className="fixed inset-0 pointer-events-none flex items-center justify-center"
      data-connection-status={connectionStatus}
      data-queue-length={queue.length}
    >
      {current && <AlertCard alert={current} />}
    </div>
  );
};

export default AlertBoxDisplay;
