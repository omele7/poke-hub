import { useCallback, useEffect, useState } from 'react';

type UseCountdownResult = {
  timeLeft: number;
  resetCountdown: () => void;
};

export function useCountdown(
  initialSeconds: number,
  isActive: boolean,
  onFinished?: () => void,
): UseCountdownResult {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          onFinished?.();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive, onFinished]);

  const resetCountdown = useCallback(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  return {
    timeLeft,
    resetCountdown,
  };
}
