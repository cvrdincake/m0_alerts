const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { createServer } = require('../backend/server');

async function startServer(exchangeCode) {
  const server = createServer({ exchangeCode });
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  return { server, port: address.port };
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function httpRequest(port, path, { headers } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

test('successfully exchanges tokens when state matches', async () => {
  let exchangeCount = 0;
  const tokens = { access_token: 'token123' };
  const exchangeCode = async () => {
    exchangeCount += 1;
    return tokens;
  };

  const { server, port } = await startServer(exchangeCode);
  try {
    const startResponse = await httpRequest(port, '/auth/twitch');
    assert.strictEqual(startResponse.status, 302);
    const state = new URL(startResponse.headers.location).searchParams.get('state');
    assert.match(state, /^[0-9a-f]{32}$/);

    const cookieHeader = startResponse.headers['set-cookie'][0].split(';')[0];
    const callbackPath = `/auth/twitch/callback?state=${state}&code=valid-code`;
    const callbackResponse = await httpRequest(port, callbackPath, {
      headers: { Cookie: cookieHeader },
    });

    assert.strictEqual(callbackResponse.status, 200);
    assert.deepStrictEqual(JSON.parse(callbackResponse.body), {
      provider: 'twitch',
      tokens,
    });
    assert.strictEqual(exchangeCount, 1);
  } finally {
    await stopServer(server);
  }
});

test('rejects tampered state and skips token exchange', async () => {
  let exchangeCount = 0;
  const exchangeCode = async () => {
    exchangeCount += 1;
    return {};
  };

  const { server, port } = await startServer(exchangeCode);
  try {
    const startResponse = await httpRequest(port, '/auth/twitch');
    assert.strictEqual(startResponse.status, 302);

    const cookieHeader = startResponse.headers['set-cookie'][0].split(';')[0];
    const callbackPath = `/auth/twitch/callback?state=tampered&code=valid-code`;
    const callbackResponse = await httpRequest(port, callbackPath, {
      headers: { Cookie: cookieHeader },
    });

    assert.strictEqual(callbackResponse.status, 400);
    const body = JSON.parse(callbackResponse.body);
    assert.strictEqual(body.error, 'invalid_oauth_state');
    assert.strictEqual(exchangeCount, 0);
  } finally {
    await stopServer(server);
  }
});
