import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppliedState } from '../types';

const STORAGE_KEY = 'claimday.applied';

export function useAppliedStore() {
  const [appliedMap, setAppliedMap] = useState<AppliedState>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) {
          return;
        }

        setAppliedMap(JSON.parse(value) as AppliedState);
      })
      .catch(() => undefined);
  }, []);

  const persist = async (next: AppliedState) => {
    setAppliedMap(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggleApplied = (id: string) => {
    const current = appliedMap[id]?.applied ?? false;
    void persist({
      ...appliedMap,
      [id]: {
        applied: !current,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return { appliedMap, toggleApplied };
}
