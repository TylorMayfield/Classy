import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EligibilityInput } from '../utils/eligibility';

const STORAGE_KEY = 'claimday.profile';

const defaultProfile: EligibilityInput = {
  states: [],
  keywords: [],
};

export function useProfileStore() {
  const [profile, setProfile] = useState<EligibilityInput>(defaultProfile);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) {
          return;
        }
        const stored = JSON.parse(value) as Record<string, unknown>;
        // Migrate old single-state string to states array
        if (typeof stored.state === 'string' && !Array.isArray(stored.states)) {
          stored.states = stored.state ? [stored.state] : [];
          delete stored.state;
        }
        stored.states = Array.isArray(stored.states) ? stored.states : [];
        stored.keywords = Array.isArray(stored.keywords) ? stored.keywords : [];
        setProfile(stored as unknown as EligibilityInput);
      })
      .catch(() => undefined);
  }, []);

  const updateProfile = (next: Partial<EligibilityInput>) => {
    const merged = { ...profile, ...next };
    setProfile(merged);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  return { profile, updateProfile };
}
