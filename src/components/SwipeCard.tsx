import { useRef } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Divider, Text } from 'react-native-paper';

import type { Settlement } from '../types';
import type { EligibilityInput } from '../utils/eligibility';
import { evaluateSettlement } from '../utils/eligibility';

const SWIPE_THRESHOLD = 100;
const OUT_X = 500;

type Props = {
  settlement: Settlement;
  profile: EligibilityInput;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isNext?: boolean;
};

export function SwipeCard({ settlement, profile, onSwipeLeft, onSwipeRight, isNext }: Props) {
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.2 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          onSwipeRight();
          Animated.spring(position, {
            toValue: { x: OUT_X, y: gesture.dy },
            useNativeDriver: true,
            speed: 20,
          }).start();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          onSwipeLeft();
          Animated.spring(position, {
            toValue: { x: -OUT_X, y: gesture.dy },
            useNativeDriver: true,
            speed: 20,
          }).start();
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const verdict = evaluateSettlement(settlement, profile);

  const rotate = position.x.interpolate({
    inputRange: [-OUT_X, OUT_X],
    outputRange: ['-25deg', '25deg'],
    extrapolate: 'clamp',
  });

  const yesOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const noOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (isNext) {
    return (
      <View style={[styles.container, styles.nextCard]} pointerEvents="none">
        <View style={styles.card}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          >
            <Text variant="headlineSmall" style={styles.title}>{settlement.title}</Text>
            <View style={styles.chips}>
              <Chip compact icon="map-marker">{settlement.locationSummary}</Chip>
              <Chip compact>{settlement.category}</Chip>
            </View>
            <Text variant="bodyMedium" style={styles.description}>
              {settlement.description}
            </Text>
            <View style={styles.verdict}>
              <Text variant="labelLarge" style={styles.verdictLabel}>{verdict.label}</Text>
              <Text variant="bodySmall" style={styles.verdictReason}>{verdict.reason}</Text>
            </View>
            <Divider style={styles.divider} />
            <MetaRow label="Potential award" value={settlement.potentialAward ?? 'Varies'} />
            <MetaRow label="Deadline" value={settlement.deadlineLabel ?? 'Unknown'} />
            <MetaRow label="Proof required" value={settlement.proofRequired ?? 'Unknown'} />
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Overlays pinned to card corners, outside scroll */}
      <Animated.View style={[styles.overlay, styles.yesOverlay, { opacity: yesOpacity }]} pointerEvents="none">
        <Text style={[styles.overlayText, { color: '#1f4f46' }]}>ADD TO CART</Text>
      </Animated.View>
      <Animated.View style={[styles.overlay, styles.noOverlay, { opacity: noOpacity }]} pointerEvents="none">
        <Text style={[styles.overlayText, { color: '#ad5c2b' }]}>SKIP</Text>
      </Animated.View>

      <View style={styles.card}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          <Text variant="headlineSmall" style={styles.title}>{settlement.title}</Text>

          <View style={styles.chips}>
            <Chip compact icon="map-marker">{settlement.locationSummary}</Chip>
            <Chip compact>{settlement.category}</Chip>
          </View>

          <Text variant="bodyMedium" style={styles.description}>
            {settlement.description}
          </Text>

          <View style={styles.verdict}>
            <Text variant="labelLarge" style={styles.verdictLabel}>{verdict.label}</Text>
            <Text variant="bodySmall" style={styles.verdictReason}>{verdict.reason}</Text>
          </View>

          <Divider style={styles.divider} />

          <MetaRow label="Potential award" value={settlement.potentialAward ?? 'Varies'} />
          <MetaRow label="Deadline" value={settlement.deadlineLabel ?? 'Unknown'} />
          <MetaRow label="Proof required" value={settlement.proofRequired ?? 'Unknown'} />

          <Divider style={styles.divider} />

          <Text variant="bodySmall" style={styles.eligibility}>
            {settlement.eligibilitySummary}
          </Text>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text variant="labelSmall" style={styles.metaLabel}>{label.toUpperCase()}</Text>
      <Text variant="bodyMedium" style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nextCard: {
    top: 8,
    transform: [{ scale: 0.96 }],
    zIndex: 0,
  },
  card: {
    flex: 1,
    backgroundColor: '#fffaf2',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  overlay: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    borderRadius: 8,
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  yesOverlay: {
    right: 20,
    borderColor: '#1f4f46',
    transform: [{ rotate: '15deg' }],
  },
  noOverlay: {
    left: 20,
    borderColor: '#ad5c2b',
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  description: {
    color: '#5f6773',
    lineHeight: 22,
  },
  verdict: {
    backgroundColor: '#ecdfcb',
    borderRadius: 12,
    padding: 14,
  },
  verdictLabel: {
    color: '#1f4f46',
    fontWeight: '700',
    marginBottom: 4,
  },
  verdictReason: {
    color: '#5f6773',
  },
  divider: {
    backgroundColor: '#e0d5c5',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaLabel: {
    color: '#7a6249',
    flexShrink: 0,
    paddingTop: 2,
    width: 110,
  },
  metaValue: {
    flex: 1,
    color: '#1a1a1a',
    textAlign: 'right',
  },
  eligibility: {
    color: '#5f6773',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
