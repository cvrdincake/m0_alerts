import { useEffect, useRef, useState } from 'react';
import {
  Coffee,
  Crown,
  DollarSign,
  Gift,
  Heart,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

const ALERT_ANIMATION_STYLE_ID = 'alertbox-display-animations';

const ensureAnimationStyles = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById(ALERT_ANIMATION_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = ALERT_ANIMATION_STYLE_ID;
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes shimmer-reverse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    @keyframes bounce-slow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .animate-shimmer {
      animation: shimmer 2s linear infinite;
    }

    .animate-shimmer-reverse {
      animation: shimmer-reverse 2s linear infinite;
    }

    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }

    .animate-bounce-slow {
      animation: bounce-slow 2s ease-in-out infinite;
    }
  `;

  document.head.appendChild(style);
};

const ALERT_CONFIGS = {
  follow: {
    icon: Heart,
    colors: {
      primary: 'from-pink-500 to-rose-600',
      glow: 'shadow-pink-500/50',
      accent: 'bg-pink-400',
    },
    sound: '💖',
    soundUrl: '/sounds/follow.mp3',
    duration: 4000,
    animation: 'bounce',
    template: (data) => ({
      title: 'NEW FOLLOWER',
      message: `${data.username}`,
      subtitle: 'Thanks for the follow!',
    }),
  },
  subscribe: {
    icon: Star,
    colors: {
      primary: 'from-purple-500 via-violet-500 to-indigo-600',
      glow: 'shadow-purple-500/50',
      accent: 'bg-purple-400',
    },
    sound: '⭐',
    soundUrl: '/sounds/subscribe.mp3',
    duration: 5000,
    animation: 'pulse',
    template: (data) => ({
      title: 'NEW SUBSCRIBER',
      message: `${data.username}`,
      subtitle:
        data.months > 1 ? `${data.months} month streak!` : 'Welcome to the family!',
    }),
  },
  donation: {
    icon: DollarSign,
    colors: {
      primary: 'from-green-400 via-emerald-500 to-teal-600',
      glow: 'shadow-green-500/50',
      accent: 'bg-green-400',
    },
    sound: '💰',
    soundUrl: '/sounds/donation.mp3',
    duration: 6000,
    animation: 'shake',
    template: (data) => ({
      title: 'DONATION',
      message: `$${data.amount}`,
      subtitle: `from ${data.username}`,
      extra: data.message ? `"${data.message}"` : null,
    }),
  },
  raid: {
    icon: Users,
    colors: {
      primary: 'from-orange-500 via-red-500 to-pink-600',
      glow: 'shadow-orange-500/50',
      accent: 'bg-orange-400',
    },
    sound: '🚀',
    soundUrl: '/sounds/raid.mp3',
    duration: 7000,
    animation: 'slide',
    template: (data) => ({
      title: 'INCOMING RAID',
      message: `${data.username}`,
      subtitle: `with ${data.viewers} raiders!`,
      extra: 'Welcome everyone!',
    }),
  },
  cheer: {
    icon: Zap,
    colors: {
      primary: 'from-yellow-400 via-amber-500 to-orange-500',
      glow: 'shadow-yellow-500/50',
      accent: 'bg-yellow-400',
    },
    sound: '⚡',
    soundUrl: '/sounds/cheer.mp3',
    duration: 5000,
    animation: 'bounce',
    template: (data) => ({
      title: 'BITS CHEERED',
      message: `${data.bits} bits`,
      subtitle: `from ${data.username}`,
      extra: data.message || null,
    }),
  },
  giftsub: {
    icon: Gift,
    colors: {
      primary: 'from-cyan-400 via-blue-500 to-indigo-600',
      glow: 'shadow-cyan-500/50',
      accent: 'bg-cyan-400',
    },
    sound: '🎁',
    soundUrl: '/sounds/giftsub.mp3',
    duration: 6000,
    animation: 'pulse',
    template: (data) => ({
      title: 'GIFT SUBS',
      message: `${data.count} sub${data.count > 1 ? 's' : ''}`,
      subtitle: `gifted by ${data.username}`,
      extra: 'What a legend!',
    }),
  },
  member: {
    icon: Crown,
    colors: {
      primary: 'from-yellow-400 via-amber-500 to-yellow-600',
      glow: 'shadow-yellow-500/50',
      accent: 'bg-yellow-400',
    },
    sound: '👑',
    soundUrl: '/sounds/member.mp3',
    duration: 5000,
    animation: 'bounce',
    template: (data) => ({
      title: 'NEW MEMBER',
      message: `${data.username}`,
      subtitle: data.tier ? `${data.tier} Tier` : 'Welcome!',
      extra: 'Thanks for the support!',
    }),
  },
  superchat: {
    icon: Sparkles,
    colors: {
      primary: 'from-red-500 via-pink-500 to-rose-600',
      glow: 'shadow-red-500/50',
      accent: 'bg-red-400',
    },
    sound: '💵',
    soundUrl: '/sounds/superchat.mp3',
    duration: 7000,
    animation: 'shake',
    template: (data) => ({
      title: 'SUPER CHAT',
      message: `$${data.amount}`,
      subtitle: `from ${data.username}`,
      extra: data.message || null,
    }),
  },
  host: {
    icon: Trophy,
    colors: {
      primary: 'from-indigo-500 via-purple-500 to-pink-500',
      glow: 'shadow-indigo-500/50',
      accent: 'bg-indigo-400',
    },
    sound: '🏆',
    soundUrl: '/sounds/host.mp3',
    duration: 5000,
    animation: 'slide',
    template: (data) => ({
      title: 'HOSTED',
      message: `${data.username}`,
      subtitle: `with ${data.viewers} viewers`,
      extra: 'Thanks for the host!',
    }),
  },
  tip: {
    icon: Coffee,
    colors: {
      primary: 'from-amber-600 via-orange-500 to-red-500',
      glow: 'shadow-amber-500/50',
      accent: 'bg-amber-400',
    },
    sound: '☕',
    soundUrl: '/sounds/tip.mp3',
    duration: 5000,
    animation: 'pulse',
    template: (data) => ({
      title: 'TIP RECEIVED',
      message: `$${data.amount}`,
      subtitle: `from ${data.username}`,
      extra: data.message || 'Thanks for the coffee!',
    }),
  },
};

const getMockPayload = (type) => ({
  follow: { username: `CoolViewer${Math.floor(Math.random() * 1000)}` },
  subscribe: {
    username: `SubUser${Math.floor(Math.random() * 1000)}`,
    months: Math.floor(Math.random() * 12) + 1,
  },
  donation: {
    username: `GenerousDonor${Math.floor(Math.random() * 1000)}`,
    amount: (Math.random() * 50 + 5).toFixed(2),
    message: 'Love the stream!',
  },
  raid: {
    username: `RaidLeader${Math.floor(Math.random() * 1000)}`,
    viewers: Math.floor(Math.random() * 100) + 10,
  },
  cheer: {
    username: `BitsCheerer${Math.floor(Math.random() * 1000)}`,
    bits: Math.floor(Math.random() * 500) + 100,
    message: 'Poggers!',
  },
  giftsub: {
    username: `GiftGod${Math.floor(Math.random() * 1000)}`,
    count: Math.floor(Math.random() * 5) + 1,
  },
  member: {
    username: `NewMember${Math.floor(Math.random() * 1000)}`,
    tier: ['Bronze', 'Silver', 'Gold'][Math.floor(Math.random() * 3)],
  },
  superchat: {
    username: `SuperFan${Math.floor(Math.random() * 1000)}`,
    amount: (Math.random() * 100 + 10).toFixed(2),
    message: 'Amazing content!',
  },
  host: {
    username: `HostStreamer${Math.floor(Math.random() * 1000)}`,
    viewers: Math.floor(Math.random() * 50) + 5,
  },
  tip: {
    username: `Tipper${Math.floor(Math.random() * 1000)}`,
    amount: (Math.random() * 10 + 2).toFixed(2),
    message: null,
  },
}[type]);

const AlertBoxDisplay = () => {
  const [alertQueue, setAlertQueue] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    ensureAnimationStyles();
  }, []);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return undefined;
    }

    audioRef.current = new Audio();
    audioRef.current.volume = 0.8;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
          console.log('Connected to alert server');
        };

        ws.onmessage = (event) => {
          try {
            const alert = JSON.parse(event.data);
            if (alert && alert.type && ALERT_CONFIGS[alert.type]) {
              addToQueue(alert.type, alert.data);
            }
          } catch (error) {
            console.error('Failed to parse alert:', error);
          }
        };

        ws.onclose = () => {
          console.log('Disconnected from server, reconnecting...');
          reconnectTimerRef.current = window.setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        reconnectTimerRef.current = window.setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testMode = params.get('test') === 'true';
    if (!testMode) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const types = Object.keys(ALERT_CONFIGS);
      const randomType = types[Math.floor(Math.random() * types.length)];
      addToQueue(randomType, getMockPayload(randomType));
    }, 2000);

    const interval = window.setInterval(() => {
      const types = Object.keys(ALERT_CONFIGS);
      const randomType = types[Math.floor(Math.random() * types.length)];
      addToQueue(randomType, getMockPayload(randomType));
    }, Math.random() * 4000 + 8000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      const { type, data } = event.data ?? {};
      if (type && ALERT_CONFIGS[type]) {
        addToQueue(type, data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addToQueue = (type, data) => {
    setAlertQueue((previous) => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        type,
        data,
        config: ALERT_CONFIGS[type],
      },
    ]);
  };

  const playSound = (soundUrl) => {
    if (!soundUrl) {
      return;
    }

    try {
      const audioInstance = audioRef.current;
      if (!audioInstance) {
        return;
      }

      audioInstance.pause();
      audioInstance.currentTime = 0;
      audioInstance.src = soundUrl;
      const playPromise = audioInstance.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.error('Failed to play sound:', error);
        });
      }
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  const speakText = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isProcessing || alertQueue.length === 0) {
      return undefined;
    }

    const nextAlert = alertQueue[0];
    setIsProcessing(true);
    setCurrentAlert(nextAlert);

    playSound(nextAlert.config.soundUrl);

    const params = new URLSearchParams(window.location.search);
    if (params.get('tts') === 'true') {
      const content = nextAlert.config.template(nextAlert.data);
      speakText(`${content.title}, ${content.message}`);
    }

    const timer = window.setTimeout(() => {
      setCurrentAlert(null);
      setAlertQueue((previous) => previous.slice(1));
      setIsProcessing(false);
    }, nextAlert.config.duration);

    return () => window.clearTimeout(timer);
  }, [alertQueue, isProcessing]);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
      {currentAlert && <Alert alert={currentAlert} config={currentAlert.config} />}
    </div>
  );
};

const Alert = ({ alert, config }) => {
  const [phase, setPhase] = useState('enter');
  const Icon = config.icon;
  const content = config.template(alert.data);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setPhase('show'), 50);
    const exitTimer = window.setTimeout(
      () => setPhase('exit'),
      Math.max(0, config.duration - 500),
    );

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
    };
  }, [config.duration]);

  const animationClass = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    shake: phase === 'show' ? 'animate-shake' : '',
    slide: '',
  }[config.animation];

  const phaseTransform = (() => {
    if (phase === 'enter') return 'scale-0 opacity-0 -translate-y-20';
    if (phase === 'exit') return 'scale-0 opacity-0 translate-y-20';
    return 'scale-100 opacity-100 translate-y-0';
  })();

  return (
    <div className={`transform transition-all duration-500 ease-out ${phaseTransform}`}>
      <div
        className={`bg-gradient-to-br ${config.colors.primary} rounded-3xl shadow-2xl ${config.colors.glow} overflow-hidden`}
      >
        <div
          className="h-2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"
          style={{ backgroundSize: '200% 100%' }}
        />

        <div className="bg-black/40 backdrop-blur-md p-8 min-w-[500px] max-w-[600px]">
          <div className="flex items-center gap-6">
            <div className={`${config.colors.accent} rounded-2xl p-5 ${animationClass ?? ''}`}>
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
              {content.extra && (
                <div className="text-white/70 text-sm mt-2 italic">{content.extra}</div>
              )}
            </div>

            <div className="text-6xl animate-bounce-slow">{config.sound}</div>
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

export default AlertBoxDisplay;

