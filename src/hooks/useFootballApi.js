import { useState, useEffect, useRef } from 'react';

const CACHE_PREFIX = 'wc26_api_';

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    return { data, stale: Date.now() >= expires };
  } catch {
    return null;
  }
}

function cacheSet(key, data, ttl) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, expires: Date.now() + ttl * 1000 }),
    );
  } catch {
    // localStorage full — ignore
  }
}

// path: API sub-path, e.g. 'competitions/WC/matches?team=762'
// ttl: cache lifetime in seconds (default 60)
// pollInterval: refetch every N seconds, 0 = no polling (default 0)
// enabled: set false to skip fetching entirely (default true)
export function useFootballApi(path, { ttl = 60, pollInterval = 0, enabled = true } = {}) {
  const [data, setData] = useState(() => cacheGet(path)?.data ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backoffRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      const cached = cacheGet(path);

      // Fresh cache — skip network
      if (cached && !cached.stale) {
        if (!cancelled) {
          setData(cached.data);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/football?path=${encodeURIComponent(path)}`);

        if (res.status === 429) {
          // Rate limited — back off exponentially, serve stale if available
          backoffRef.current = Math.min((backoffRef.current || 60) * 2, 3600);
          if (!cancelled) {
            if (cached) setData(cached.data);
            setError({ status: 429, message: 'Rate limited — showing cached data' });
            setLoading(false);
          }
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!cancelled) {
          cacheSet(path, json, ttl);
          setData(json);
          setError(null);
          backoffRef.current = 0;
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          if (cached) setData(cached.data); // stale fallback on network error
          setError({ message: err.message });
          setLoading(false);
        }
      }
    }

    fetchData();

    if (pollInterval > 0) {
      timerRef.current = setInterval(fetchData, pollInterval * 1000);
    }

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [path, ttl, pollInterval, enabled]);

  return { data, loading, error };
}
