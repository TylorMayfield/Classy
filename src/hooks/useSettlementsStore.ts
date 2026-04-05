import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { settlements as bundled } from '../data';
import type { Settlement } from '../types';

const STORAGE_KEY = 'claimday.settlements';
const LAST_REFRESHED_KEY = 'claimday.settlements.refreshedAt';
const DATA_URL =
  'https://raw.githubusercontent.com/TylorMayfield/Classy/main/src/data/settlements.generated.json';

export function useSettlementsStore() {
  const [settlements, setSettlements] = useState<Settlement[]>(bundled);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(LAST_REFRESHED_KEY),
    ])
      .then(([cached, refreshedAt]) => {
        if (cached) {
          setSettlements(JSON.parse(cached) as Settlement[]);
        }
        if (refreshedAt) {
          setLastRefreshedAt(refreshedAt);
        }
      })
      .catch(() => undefined);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Settlement[];
      const refreshedAt = new Date().toISOString();
      setSettlements(data);
      setLastRefreshedAt(refreshedAt);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)),
        AsyncStorage.setItem(LAST_REFRESHED_KEY, refreshedAt),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  return { settlements, refresh, refreshing, lastRefreshedAt, error };
}
