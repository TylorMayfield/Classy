import { useMemo, useState } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';

import { SwipeCard } from '../components/SwipeCard';
import { useCartStore } from '../hooks/useCartStore';
import { useProfileStore } from '../hooks/useProfileStore';
import { useSettlementsStore } from '../hooks/useSettlementsStore';
import { useAppliedStore } from '../hooks/useAppliedStore';
import { evaluateSettlement } from '../utils/eligibility';

export function SwipeScreen() {
  const { settlements } = useSettlementsStore();
  const { profile } = useProfileStore();
  const { addToCart, inCart } = useCartStore();
  const { appliedMap } = useAppliedStore();

  // Deck: settlements not already in cart or applied, sorted by fit score descending
  const deck = useMemo(
    () =>
      settlements
        .filter((s) => !inCart(s.id) && !appliedMap[s.id]?.applied)
        .sort((a, b) => evaluateSettlement(b, profile).score - evaluateSettlement(a, profile).score),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settlements, profile],
  );

  const [index, setIndex] = useState(0);
  const [lastAction, setLastAction] = useState<'right' | 'left' | null>(null);
  const [cardKey, setCardKey] = useState(0);

  const advance = (action: 'right' | 'left') => {
    setLastAction(action);
    setIndex((i) => i + 1);
    setCardKey((k) => k + 1);
  };

  const handleSwipeRight = () => {
    const s = deck[index];
    if (s) addToCart(s.id);
    advance('right');
  };

  const handleSwipeLeft = () => {
    advance('left');
  };

  const current = deck[index] ?? null;
  const next = deck[index + 1] ?? null;
  const remaining = deck.length - index;

  if (!current) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text variant="headlineMedium" style={styles.emptyTitle}>All caught up</Text>
          <Text variant="bodyLarge" style={styles.emptyBody}>
            {deck.length === 0
              ? 'No new settlements to review. Check back after a data refresh.'
              : 'You\'ve reviewed all available settlements.'}
          </Text>
          <Button mode="contained" onPress={() => { setIndex(0); setCardKey((k) => k + 1); }} style={styles.resetButton}>
            Start over
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.header}>
        <Text variant="labelLarge" style={styles.eyebrow}>Discover</Text>
        <Text variant="bodySmall" style={styles.remaining}>
          {remaining} remaining
        </Text>
      </View>

      <Text variant="bodySmall" style={styles.hint}>Swipe right to add to cart · left to skip</Text>

<View style={styles.deck} collapsable={false}>
        {next ? <SwipeCard key={`next-${index}`} settlement={next} profile={profile} onSwipeLeft={() => {}} onSwipeRight={() => {}} isNext /> : null}
        <SwipeCard
          key={cardKey}
          settlement={current}
          profile={profile}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </View>

      {/* Button controls (for accessibility / non-swipe use) */}
      <View style={styles.controls}>
        <IconButton
          icon="close"
          mode="contained"
          size={32}
          containerColor="#ad5c2b"
          iconColor="#fffaf2"
          onPress={handleSwipeLeft}
        />
        <IconButton
          icon="cart-plus"
          mode="contained"
          size={32}
          containerColor="#1f4f46"
          iconColor="#fffaf2"
          onPress={handleSwipeRight}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6efe3' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1, color: '#1f4f46' },
  remaining: { color: '#7a6249' },
  hint: { textAlign: 'center', color: '#7a6249', marginBottom: 8 },

  deck: {
    flex: 1,
    marginHorizontal: 16,
    position: 'relative',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontWeight: '700', color: '#1f4f46', textAlign: 'center' },
  emptyBody: { color: '#5f6773', textAlign: 'center' },
  resetButton: { marginTop: 8 },
});
