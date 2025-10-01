const http = require('http');
const crypto = require('crypto');

const providers = {
  twitch: {
    authorizeUrl: 'https://id.twitch.tv/oauth2/authorize',
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    scope: process.env.TWITCH_SCOPE || 'user:read:email',
    clientId: process.env.TWITCH_CLIENT_ID || 'twitch-client-id',
    clientSecret: process.env.TWITCH_CLIENT_SECRET || 'twitch-client-secret',
    redirectUri:
      process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/twitch/callback',
  },
  youtube: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope:
      process.env.YOUTUBE_SCOPE || 'https://www.googleapis.com/auth/youtube.readonly',
    clientId: process.env.YOUTUBE_CLIENT_ID || 'youtube-client-id',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || 'youtube-client-secret',
    redirectUri:
      process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/auth/youtube/callback',
  },
  streamlabs: {
    authorizeUrl: 'https://streamlabs.com/api/v2.0/authorize',
    tokenUrl: 'https://streamlabs.com/api/v2.0/token',
    scope: process.env.STREAMLABS_SCOPE || 'read donations',
    clientId: process.env.STREAMLABS_CLIENT_ID || 'streamlabs-client-id',
    clientSecret:
      process.env.STREAMLABS_CLIENT_SECRET || 'streamlabs-client-secret',
    redirectUri:
      process.env.STREAMLABS_REDIRECT_URI ||
      'http://localhost:3000/auth/streamlabs/callback',
  },
};

function generateState(randomBytes = crypto.randomBytes) {
  return randomBytes(16).toString('hex');
}

function buildAuthorizeUrl(config, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state,
  });
  return `${config.authorizeUrl}?${params.toString()}`;
}

function parseCookies(header = '') {
  return header.split(';').reduce((acc, cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (!name) {
      return acc;
    }
    acc[name] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function serializeCookie(name, value) {
  const attributes = ['HttpOnly', 'SameSite=Lax', 'Path=/'];
  return `${name}=${encodeURIComponent(value)}; ${attributes.join('; ')}`;
}

async function defaultExchangeCode(config, code) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error('Token exchange failed');
    error.status = response.status;
    error.responseBody = text;
    throw error;
  }

  return response.json();
}

function createSession(sessionStore, sessionId) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, { oauthStates: {} });
  }
  return sessionStore.get(sessionId);
}

function createServer({ exchangeCode = defaultExchangeCode } = {}) {
  const sessionStore = new Map();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const cookies = parseCookies(req.headers.cookie);
      let sessionId = cookies.sid;

      if (!sessionId || !sessionStore.has(sessionId)) {
        sessionId = crypto.randomBytes(18).toString('hex');
      }

      const session = createSession(sessionStore, sessionId);
      const setCookie = serializeCookie('sid', sessionId);

      const startMatch = url.pathname.match(/^\/auth\/(twitch|youtube|streamlabs)$/);
      const callbackMatch = url.pathname.match(
        /^\/auth\/(twitch|youtube|streamlabs)\/callback$/,
      );

      if (startMatch) {
        const provider = startMatch[1];
        const config = providers[provider];
        const state = generateState();
        session.oauthStates[provider] = state;
        const authorizeUrl = buildAuthorizeUrl(config, state);
        res.statusCode = 302;
        res.setHeader('Location', authorizeUrl);
        res.setHeader('Set-Cookie', setCookie);
        res.end();
        return;
      }

      if (callbackMatch) {
        const provider = callbackMatch[1];
        const config = providers[provider];
        const expectedState = session.oauthStates[provider];
        const state = url.searchParams.get('state');
        const code = url.searchParams.get('code');

        if (!state || !expectedState || state !== expectedState) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Set-Cookie', setCookie);
          res.end(
            JSON.stringify({
              error: 'invalid_oauth_state',
              message: 'OAuth state parameter missing or does not match.',
            }),
          );
          return;
        }

        if (!code) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Set-Cookie', setCookie);
          res.end(
            JSON.stringify({
              error: 'missing_code',
              message: 'Authorization code missing.',
            }),
          );
          return;
        }

        delete session.oauthStates[provider];
        const tokenData = await exchangeCode(config, code);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Set-Cookie', setCookie);
        res.end(JSON.stringify({ provider, tokens: tokenData }));
        return;
      }

      res.statusCode = 404;
      res.setHeader('Set-Cookie', setCookie);
      res.end('Not Found');
    } catch (error) {
      res.statusCode = error.status || 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
    }
  });

  return server;
}

module.exports = {
  providers,
  generateState,
  buildAuthorizeUrl,
  parseCookies,
  serializeCookie,
  createServer,
  defaultExchangeCode,
};
