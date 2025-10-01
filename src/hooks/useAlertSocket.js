import { useEffect, useRef } from 'react';
import { environment } from '../config/environment.js';

const DEFAULT_RETRY = { initialDelay: 2000, maxDelay: 15000 };

export const useAlertSocket = ({ enabled = true, onAlert, onStatusChange } = {}) => {
  const alertHandlerRef = useRef(onAlert);
  const statusHandlerRef = useRef(onStatusChange);

  useEffect(() => {
    alertHandlerRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    statusHandlerRef.current = onStatusChange;
  }, [onStatusChange]);

  const wsUrl = environment.wsUrl;

  useEffect(() => {
    if (!enabled || !wsUrl) {
      return undefined;
    }

    let socket;
    let retryDelay = DEFAULT_RETRY.initialDelay;
    let reconnectTimeout;
    let shouldReconnect = true;

    const emitStatus = (status) => {
      statusHandlerRef.current?.(status);
    };

    const cleanup = ({ preventReconnect = false } = {}) => {
      if (preventReconnect) {
        shouldReconnect = false;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = undefined;
      }
      if (socket) {
        socket.close();
        socket = undefined;
      }
    };

    const scheduleReconnect = () => {
      if (!enabled || !shouldReconnect) {
        return;
      }
      emitStatus('connecting');
      reconnectTimeout = setTimeout(() => {
        retryDelay = Math.min(retryDelay * 1.5, DEFAULT_RETRY.maxDelay);
        connect();
      }, retryDelay);
    };

    const connect = () => {
      cleanup({ preventReconnect: true });

      try {
        socket = new WebSocket(wsUrl);
      } catch (error) {
        console.error('WebSocket connection failed', error);
        scheduleReconnect();
        return;
      }

      socket.addEventListener('open', () => {
        retryDelay = DEFAULT_RETRY.initialDelay;
        shouldReconnect = true;
        emitStatus('connected');
      });

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          alertHandlerRef.current?.(data);
        } catch (error) {
          console.error('Failed to parse alert payload', error);
        }
      });

      socket.addEventListener('error', (error) => {
        console.error('Alert WebSocket error', error);
      });

      socket.addEventListener('close', () => {
        emitStatus('disconnected');
        if (shouldReconnect) {
          scheduleReconnect();
        }
      });

      shouldReconnect = true;
    };

    emitStatus('connecting');
    connect();

    return () => {
      emitStatus('disconnected');
      cleanup({ preventReconnect: true });
    };
  }, [enabled, wsUrl]);
};
