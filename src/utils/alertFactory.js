import { getAlertDefinition } from '../config/alertPresets.js';

const createAlertId = (type) => `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeAmount = (value) => {
  if (value == null) {
    return value;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
};

export const createDisplayAlert = (type, payload = {}) => {
  const definition = getAlertDefinition(type);
  if (!definition?.display) {
    return null;
  }

  const normalizedPayload = {
    ...payload,
    amount: normalizeAmount(payload.amount),
  };

  return {
    id: createAlertId(type),
    type,
    payload: normalizedPayload,
    definition,
    displayContent: definition.display.template(normalizedPayload),
    displayDuration: definition.display.duration,
    receivedAt: Date.now(),
  };
};

export const createStreamAlert = (type, payload = {}) => {
  const definition = getAlertDefinition(type);
  if (!definition?.stream || !definition?.display) {
    return null;
  }

  const normalizedPayload = {
    ...payload,
    amount: normalizeAmount(payload.amount),
  };

  return {
    id: createAlertId(type),
    type,
    payload: normalizedPayload,
    definition,
    streamContent: definition.stream.template(normalizedPayload),
    displayDuration: definition.display.duration,
    receivedAt: Date.now(),
  };
};
