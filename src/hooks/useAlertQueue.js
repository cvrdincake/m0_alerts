import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const resolveDuration = (alert, getDuration) => {
  if (typeof getDuration === 'function') {
    return getDuration(alert);
  }

  if (alert?.displayDuration) {
    return alert.displayDuration;
  }

  return 5000;
};

export const useAlertQueue = (getDuration) => {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const timerRef = useRef();
  const processingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (processingRef.current) {
      return;
    }

    if (queue.length === 0) {
      setCurrent(null);
      clearTimer();
      return;
    }

    const next = queue[0];
    processingRef.current = true;
    setCurrent(next);

    const duration = resolveDuration(next, getDuration);

    timerRef.current = setTimeout(() => {
      processingRef.current = false;
      setQueue((prev) => {
        const [, ...rest] = prev;
        if (rest.length === 0) {
          setCurrent(null);
        }
        return rest;
      });
    }, duration);
  }, [queue, getDuration, clearTimer]);

  const enqueue = useCallback((alert) => {
    if (!alert) {
      return;
    }
    setQueue((prev) => [...prev, alert]);
  }, []);

  const clear = useCallback(() => {
    clearTimer();
    processingRef.current = false;
    setQueue([]);
    setCurrent(null);
  }, [clearTimer]);

  const isProcessing = useMemo(() => processingRef.current, [queue, current]);

  return {
    queue,
    current,
    enqueue,
    clear,
    isProcessing,
  };
};
