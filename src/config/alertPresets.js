import {
  Crown,
  DollarSign,
  Gift,
  Heart,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
  Coffee,
} from 'lucide-react';

const formatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const ALERT_DEFINITIONS = {
  follow: {
    label: 'Follow',
    icon: Heart,
    stream: {
      gradient: 'from-pink-500 to-rose-500',
      sound: '🔔',
      template: (data) => `${data.username} just followed!`,
    },
    display: {
      colors: {
        primary: 'from-pink-500 to-rose-600',
        glow: 'shadow-pink-500/50',
        accent: 'bg-pink-400',
      },
      sound: '💖',
      duration: 4000,
      animation: 'bounce',
      template: (data) => ({
        title: 'NEW FOLLOWER',
        message: data.username,
        subtitle: 'Thanks for the follow!',
      }),
    },
  },
  subscribe: {
    label: 'Subscribe',
    icon: Star,
    stream: {
      gradient: 'from-purple-500 to-indigo-500',
      sound: '✨',
      template: (data) => `${data.username} subscribed${data.months > 1 ? ` for ${data.months} months` : ''}!`,
    },
    display: {
      colors: {
        primary: 'from-purple-500 via-violet-500 to-indigo-600',
        glow: 'shadow-purple-500/50',
        accent: 'bg-purple-400',
      },
      sound: '⭐',
      duration: 5000,
      animation: 'pulse',
      template: (data) => ({
        title: 'NEW SUBSCRIBER',
        message: data.username,
        subtitle: data.months > 1 ? `${data.months} month streak!` : 'Welcome to the family!',
      }),
    },
  },
  donation: {
    label: 'Donation',
    icon: DollarSign,
    stream: {
      gradient: 'from-green-500 to-emerald-500',
      sound: '💰',
      template: (data) => `${data.username} donated $${formatter.format(Number(data.amount))}!`,
    },
    display: {
      colors: {
        primary: 'from-green-400 via-emerald-500 to-teal-600',
        glow: 'shadow-green-500/50',
        accent: 'bg-green-400',
      },
      sound: '💰',
      duration: 6000,
      animation: 'shake',
      template: (data) => ({
        title: 'DONATION',
        message: `$${formatter.format(Number(data.amount))}`,
        subtitle: `from ${data.username}`,
        extra: data.message ? `"${data.message}"` : null,
      }),
    },
  },
  raid: {
    label: 'Raid',
    icon: Users,
    stream: {
      gradient: 'from-orange-500 to-red-500',
      sound: '🚀',
      template: (data) => `${data.username} is raiding with ${data.viewers} viewers!`,
    },
    display: {
      colors: {
        primary: 'from-orange-500 via-red-500 to-pink-600',
        glow: 'shadow-orange-500/50',
        accent: 'bg-orange-400',
      },
      sound: '🚀',
      duration: 7000,
      animation: 'slide',
      template: (data) => ({
        title: 'INCOMING RAID',
        message: data.username,
        subtitle: `with ${data.viewers} raiders!`,
        extra: 'Welcome everyone!',
      }),
    },
  },
  cheer: {
    label: 'Cheer',
    icon: Zap,
    stream: {
      gradient: 'from-yellow-500 to-amber-500',
      sound: '⚡',
      template: (data) => `${data.username} cheered ${data.bits} bits!`,
    },
    display: {
      colors: {
        primary: 'from-yellow-400 via-amber-500 to-orange-500',
        glow: 'shadow-yellow-500/50',
        accent: 'bg-yellow-400',
      },
      sound: '⚡',
      duration: 5000,
      animation: 'bounce',
      template: (data) => ({
        title: 'BITS CHEERED',
        message: `${data.bits} bits`,
        subtitle: `from ${data.username}`,
        extra: data.message || null,
      }),
    },
  },
  giftsub: {
    label: 'Gift Sub',
    icon: Gift,
    stream: {
      gradient: 'from-cyan-500 to-blue-500',
      sound: '🎁',
      template: (data) => `${data.username} gifted ${data.count} sub${data.count > 1 ? 's' : ''}!`,
    },
    display: {
      colors: {
        primary: 'from-cyan-400 via-blue-500 to-indigo-600',
        glow: 'shadow-cyan-500/50',
        accent: 'bg-cyan-400',
      },
      sound: '🎁',
      duration: 6000,
      animation: 'pulse',
      template: (data) => ({
        title: 'GIFT SUBS',
        message: `${data.count} sub${data.count > 1 ? 's' : ''}`,
        subtitle: `gifted by ${data.username}`,
        extra: 'What a legend!',
      }),
    },
  },
  member: {
    label: 'Member',
    icon: Crown,
    stream: {
      gradient: 'from-yellow-400 to-yellow-600',
      sound: '👑',
      template: (data) => `${data.username} became a member!`,
    },
    display: {
      colors: {
        primary: 'from-yellow-400 via-amber-500 to-yellow-600',
        glow: 'shadow-yellow-500/50',
        accent: 'bg-yellow-400',
      },
      sound: '👑',
      duration: 5000,
      animation: 'bounce',
      template: (data) => ({
        title: 'NEW MEMBER',
        message: data.username,
        subtitle: data.tier ? `${data.tier} Tier` : 'Welcome!',
        extra: 'Thanks for the support!',
      }),
    },
  },
  superchat: {
    label: 'Super Chat',
    icon: Sparkles,
    stream: {
      gradient: 'from-red-500 to-pink-500',
      sound: '💵',
      template: (data) => `${data.username} sent $${formatter.format(Number(data.amount))} Super Chat!`,
    },
    display: {
      colors: {
        primary: 'from-red-500 via-pink-500 to-rose-600',
        glow: 'shadow-red-500/50',
        accent: 'bg-red-400',
      },
      sound: '💵',
      duration: 7000,
      animation: 'shake',
      template: (data) => ({
        title: 'SUPER CHAT',
        message: `$${formatter.format(Number(data.amount))}`,
        subtitle: `from ${data.username}`,
        extra: data.message || null,
      }),
    },
  },
  host: {
    label: 'Host',
    icon: Trophy,
    stream: {
      gradient: 'from-indigo-500 to-purple-500',
      sound: '🏆',
      template: (data) => `${data.username} is hosting with ${data.viewers} viewers!`,
    },
    display: {
      colors: {
        primary: 'from-indigo-500 via-purple-500 to-pink-500',
        glow: 'shadow-indigo-500/50',
        accent: 'bg-indigo-400',
      },
      sound: '🏆',
      duration: 5000,
      animation: 'slide',
      template: (data) => ({
        title: 'HOSTED',
        message: data.username,
        subtitle: `with ${data.viewers} viewers`,
        extra: 'Thanks for the host!',
      }),
    },
  },
  tip: {
    label: 'Tip',
    icon: Coffee,
    stream: {
      gradient: 'from-amber-600 to-red-500',
      sound: '☕',
      template: (data) => `${data.username} tipped $${formatter.format(Number(data.amount))}!`,
    },
    display: {
      colors: {
        primary: 'from-amber-600 via-orange-500 to-red-500',
        glow: 'shadow-amber-500/50',
        accent: 'bg-amber-400',
      },
      sound: '☕',
      duration: 5000,
      animation: 'pulse',
      template: (data) => ({
        title: 'TIP RECEIVED',
        message: `$${formatter.format(Number(data.amount))}`,
        subtitle: `from ${data.username}`,
        extra: data.message || 'Thanks for the coffee!',
      }),
    },
  },
};

export const ALERT_TYPE_KEYS = Object.keys(ALERT_DEFINITIONS);

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomAmount = (min, max) => formatter.format(Math.random() * (max - min) + min);

export const RANDOM_ALERT_PAYLOADS = {
  follow: () => ({ username: `GamerTag${randomInt(100, 999)}` }),
  subscribe: () => ({ username: `SubUser${randomInt(100, 999)}`, months: randomInt(1, 12) }),
  donation: () => ({ username: `Donor${randomInt(100, 999)}`, amount: randomAmount(5, 75), message: 'Love the stream!' }),
  raid: () => ({ username: `Raider${randomInt(100, 999)}`, viewers: randomInt(10, 150) }),
  cheer: () => ({ username: `Cheerer${randomInt(100, 999)}`, bits: randomInt(100, 1000), message: 'Poggers!' }),
  giftsub: () => ({ username: `Gifter${randomInt(100, 999)}`, count: randomInt(1, 5) }),
  member: () => ({ username: `Member${randomInt(100, 999)}`, tier: ['Bronze', 'Silver', 'Gold'][randomInt(0, 2)] }),
  superchat: () => ({ username: `SuperFan${randomInt(100, 999)}`, amount: randomAmount(10, 120), message: 'Amazing content!' }),
  host: () => ({ username: `Host${randomInt(100, 999)}`, viewers: randomInt(5, 80) }),
  tip: () => ({ username: `Tipper${randomInt(100, 999)}`, amount: randomAmount(2, 20), message: null }),
};

export const TEST_ALERT_PAYLOADS = {
  follow: { username: 'TestFollower' },
  subscribe: { username: 'TestSubscriber', months: 3 },
  donation: { username: 'TestDonor', amount: '25.00', message: 'Keep it up!' },
  raid: { username: 'TestRaider', viewers: 50 },
  cheer: { username: 'TestCheerer', bits: 500, message: 'Wooo!' },
  giftsub: { username: 'TestGifter', count: 5 },
  member: { username: 'TestMember', tier: 'Gold' },
  superchat: { username: 'TestSuperChatter', amount: '50.00', message: 'This is awesome!' },
  host: { username: 'TestHost', viewers: 35 },
  tip: { username: 'TestTipper', amount: '7.50', message: 'Enjoy a coffee!' },
};
