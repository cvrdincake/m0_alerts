import { buildApiUrl, environment } from '../config/environment.js';

const headers = { 'Content-Type': 'application/json' };

export const sendTestAlert = async (type, payload) => {
  if (!environment.apiBaseUrl) {
    return false;
  }

  try {
    const response = await fetch(buildApiUrl('/api/test-alert'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, data: payload }),
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger alert (${response.status})`);
    }

    return true;
  } catch (error) {
    console.error('Failed to trigger backend alert', error);
    return false;
  }
};

export const fetchConnectionStatus = async () => {
  if (!environment.apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(buildApiUrl('/api/status'));
    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch backend status', error);
    return null;
  }
};
