import { useCallback, useEffect, useState } from 'react';

export type DailyStatus = {
  attempts_used: number;
  max_score: number;
};

const DAILY_STATUS_URL = '/my/api/daily-status';
const DAILY_ATTEMPT_URL = '/my/api/daily-attempt';

export function useDailyAttempts(): {
  attempts_used: number;
  max_score: number;
  loading: boolean;
  refetch: () => Promise<void>;
  record_attempt: (score: number) => Promise<void>;
} {
  const [attempts_used, set_attempts_used] = useState(0);
  const [max_score, set_max_score] = useState(0);
  const [loading, set_loading] = useState(true);

  const refetch = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(DAILY_STATUS_URL);
      const data = (await res.json()) as DailyStatus;
      set_attempts_used(Number(data.attempts_used) ?? 0);
      set_max_score(Number(data.max_score) ?? 0);
    } catch {
      set_attempts_used(0);
      set_max_score(0);
    } finally {
      set_loading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const record_attempt = useCallback(
    async (score: number): Promise<void> => {
      try {
        await fetch(DAILY_ATTEMPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score }),
        });
        await refetch();
      } catch {
        await refetch();
      }
    },
    [refetch]
  );

  return { attempts_used, max_score, loading, refetch, record_attempt };
}
