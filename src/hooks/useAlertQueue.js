import { useCallback, useEffect, useRef, useState } from 'react';

export const useAlertQueue = (getDuration) => {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const timerRef = useRef();
  const processingRef = useRef(false);

  const dequeue = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const processQueue = useCallback(() => {
    if (processingRef.current || queue.length === 0) {
      return;
    }

    const next = queue[0];
    processingRef.current = true;
    setCurrent(next);

    const duration = typeof getDuration === 'function' ? getDuration(next) : 5000;

    clearTimer();
    timerRef.current = setTimeout(() => {
      processingRef.current = false;
      setCurrent(null);
      dequeue();
    }, duration);
  }, [dequeue, getDuration, queue]);

  useEffect(() => {
    processQueue();
    return clearTimer;
  }, [processQueue]);

  const enqueue = useCallback((alert) => {
    setQueue((prev) => [...prev, alert]);
  }, []);

  const clear = useCallback(() => {
    clearTimer();
    processingRef.current = false;
    setQueue([]);
    setCurrent(null);
  }, []);

  return {
    queue,
    current,
    enqueue,
    clear,
    isProcessing: processingRef.current,
  };
};
