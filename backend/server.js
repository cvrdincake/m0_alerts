import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import axios from 'axios';
import crypto from 'node:crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'node:http';
import { io as socketIoClient } from 'socket.io-client';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

const webhookBaseUrl = process.env.WEBHOOK_BASE_URL?.replace(/\/$/, '');

const config = {
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    redirectUri: process.env.TWITCH_REDIRECT_URI || `http://localhost:${PORT}/auth/twitch/callback`,
    webhookSecret: process.env.TWITCH_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex'),
    webhookBaseUrl,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || `http://localhost:${PORT}/auth/youtube/callback`,
  },
  streamlabs: {
    clientId: process.env.STREAMLABS_CLIENT_ID,
    clientSecret: process.env.STREAMLABS_CLIENT_SECRET,
    redirectUri:
      process.env.STREAMLABS_REDIRECT_URI || `http://localhost:${PORT}/auth/streamlabs/callback`,
  },
};

const tokens = {
  twitch: null,
  youtube: null,
  streamlabs: null,
};

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcastAlert(type, data) {
  const alert = { type, data, timestamp: Date.now() };
  const message = JSON.stringify(alert);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`Broadcasted ${type} alert:`, data);
}

app.get('/auth/twitch', (req, res) => {
  const scopes = [
    'channel:read:subscriptions',
    'bits:read',
    'channel:read:redemptions',
    'moderator:read:followers',
  ].join(' ');

  const authUrl =
    `https://id.twitch.tv/oauth2/authorize?` +
    `client_id=${config.twitch.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.twitch.redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}`;

  res.redirect(authUrl);
});

app.get('/auth/twitch/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', {
      client_id: config.twitch.clientId,
      client_secret: config.twitch.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.twitch.redirectUri,
    });

    tokens.twitch = response.data;

    const userInfo = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${tokens.twitch.access_token}`,
        'Client-Id': config.twitch.clientId,
      },
    });

    tokens.twitch.userId = userInfo.data.data[0].id;
    tokens.twitch.userName = userInfo.data.data[0].login;

    await subscribeTwitchEvents();

    res.send('Twitch connected successfully! You can close this window.');
  } catch (error) {
    console.error('Twitch auth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

async function subscribeTwitchEvents() {
  if (!tokens.twitch?.access_token || !tokens.twitch?.userId) {
    console.warn('Twitch token missing, skip subscription');
    return;
  }

  const events = [
    { type: 'channel.follow', version: '2' },
    { type: 'channel.subscribe', version: '1' },
    { type: 'channel.subscription.gift', version: '1' },
    { type: 'channel.subscription.message', version: '1' },
    { type: 'channel.cheer', version: '1' },
    { type: 'channel.raid', version: '1' },
  ];

  if (!config.twitch.webhookBaseUrl) {
    console.warn('WEBHOOK_BASE_URL is not configured; Twitch webhooks are disabled.');
    return;
  }

  for (const event of events) {
    try {
      await axios.post(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
          type: event.type,
          version: event.version,
          condition: {
            broadcaster_user_id: tokens.twitch.userId,
            ...(event.type === 'channel.follow'
              ? { moderator_user_id: tokens.twitch.userId }
              : {}),
          },
          transport: {
            method: 'webhook',
            callback: `${config.twitch.webhookBaseUrl}/webhooks/twitch`,
            secret: config.twitch.webhookSecret,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.twitch.access_token}`,
            'Client-Id': config.twitch.clientId,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(`Subscribed to ${event.type}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${event.type}:`, error.response?.data || error.message);
    }
  }
}

app.post('/webhooks/twitch', (req, res) => {
  const messageId = req.headers['twitch-eventsub-message-id'];
  const timestamp = req.headers['twitch-eventsub-message-timestamp'];
  const messageSignature = req.headers['twitch-eventsub-message-signature'];
  const messageType = req.headers['twitch-eventsub-message-type'];

  const hmac = crypto.createHmac('sha256', config.twitch.webhookSecret);
  const body = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
  hmac.update(messageId + timestamp + body);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  if (messageSignature !== expectedSignature) {
    console.error('Invalid signature');
    return res.status(403).send('Invalid signature');
  }

  if (messageType === 'webhook_callback_verification') {
    return res.status(200).send(req.body.challenge);
  }

  if (messageType === 'notification') {
    const { subscription, event } = req.body;
    handleTwitchEvent(subscription.type, event);
  }

  return res.status(200).send('OK');
});

function handleTwitchEvent(type, event) {
  switch (type) {
    case 'channel.follow':
      broadcastAlert('follow', {
        username: event.user_name,
      });
      break;
    case 'channel.subscribe':
      broadcastAlert('subscribe', {
        username: event.user_name,
        months: 1,
        tier: event.tier,
      });
      break;
    case 'channel.subscription.gift':
      broadcastAlert('giftsub', {
        username: event.user_name,
        count: event.total,
      });
      break;
    case 'channel.subscription.message':
      broadcastAlert('subscribe', {
        username: event.user_name,
        months: event.cumulative_months,
        tier: event.tier,
        message: event.message.text,
      });
      break;
    case 'channel.cheer':
      broadcastAlert('cheer', {
        username: event.user_name,
        bits: event.bits,
        message: event.message,
      });
      break;
    case 'channel.raid':
      broadcastAlert('raid', {
        username: event.from_broadcaster_user_name,
        viewers: event.viewers,
      });
      break;
    default:
      break;
  }
}

app.get('/auth/youtube', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
  ].join(' ');

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.youtube.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.youtube.redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `access_type=offline`;

  res.redirect(authUrl);
});

app.get('/auth/youtube/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: config.youtube.clientId,
      client_secret: config.youtube.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.youtube.redirectUri,
    });

    tokens.youtube = response.data;
    startYouTubePolling();

    res.send('YouTube connected successfully! You can close this window.');
  } catch (error) {
    console.error('YouTube auth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

let youtubePollingInterval = null;
function startYouTubePolling() {
  if (youtubePollingInterval) clearInterval(youtubePollingInterval);

  youtubePollingInterval = setInterval(async () => {
    try {
      const broadcasts = await axios.get('https://www.googleapis.com/youtube/v3/liveBroadcasts', {
        params: {
          part: 'snippet',
          broadcastStatus: 'active',
          access_token: tokens.youtube.access_token,
        },
      });

      if (broadcasts.data.items.length === 0) return;

      const liveChatId = broadcasts.data.items[0].snippet.liveChatId;

      const messages = await axios.get('https://www.googleapis.com/youtube/v3/liveChat/messages', {
        params: {
          liveChatId,
          part: 'snippet,authorDetails',
          access_token: tokens.youtube.access_token,
        },
      });

      messages.data.items.forEach((msg) => {
        const { snippet, authorDetails } = msg;

        if (
          snippet.type === 'memberMilestoneChatMessage' ||
          snippet.type === 'newSponsorEvent'
        ) {
          broadcastAlert('member', {
            username: authorDetails.displayName,
            tier: authorDetails.isChatSponsor ? 'Member' : null,
          });
        }

        if (snippet.type === 'superChatEvent') {
          broadcastAlert('superchat', {
            username: authorDetails.displayName,
            amount: (snippet.superChatDetails.amountMicros / 1_000_000).toFixed(2),
            message: snippet.displayMessage,
          });
        }
      });
    } catch (error) {
      console.error('YouTube polling error:', error.response?.data || error.message);
    }
  }, 10_000);
}

app.get('/auth/streamlabs', (req, res) => {
  const authUrl =
    `https://streamlabs.com/api/v2.0/authorize?` +
    `client_id=${config.streamlabs.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.streamlabs.redirectUri)}&` +
    `response_type=code&` +
    `scope=donations.read`;

  res.redirect(authUrl);
});

app.get('/auth/streamlabs/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post('https://streamlabs.com/api/v2.0/token', {
      client_id: config.streamlabs.clientId,
      client_secret: config.streamlabs.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.streamlabs.redirectUri,
    });

    tokens.streamlabs = response.data;
    connectStreamLabsSocket();

    res.send('StreamLabs connected successfully! You can close this window.');
  } catch (error) {
    console.error('StreamLabs auth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

function connectStreamLabsSocket() {
  if (!tokens.streamlabs?.access_token) {
    console.warn('StreamLabs token missing');
    return;
  }

  const socket = socketIoClient(
    `https://sockets.streamlabs.com?token=${tokens.streamlabs.access_token}`,
  );

  socket.on('event', (data) => {
    switch (data.type) {
      case 'donation':
        data.message.forEach((donation) => {
          broadcastAlert('donation', {
            username: donation.name,
            amount: donation.amount,
            message: donation.message,
          });
        });
        break;
      default:
        break;
    }
  });
}

app.post('/api/test-alert', (req, res) => {
  const { type, data } = req.body ?? {};
  if (!type) {
    return res.status(400).json({ success: false, error: 'Missing alert type' });
  }
  broadcastAlert(type, data ?? {});
  return res.json({ success: true });
});

app.get('/api/status', (req, res) => {
  res.json({
    twitch: Boolean(tokens.twitch),
    youtube: Boolean(tokens.youtube),
    streamlabs: Boolean(tokens.streamlabs),
    connectedClients: clients.size,
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('\nConnect your accounts:');
  console.log(`  Twitch: http://localhost:${PORT}/auth/twitch`);
  console.log(`  YouTube: http://localhost:${PORT}/auth/youtube`);
  console.log(`  StreamLabs: http://localhost:${PORT}/auth/streamlabs`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
