import { Linking, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppliedStore } from '../hooks/useAppliedStore';
import { useCartStore } from '../hooks/useCartStore';
import { useProfileStore } from '../hooks/useProfileStore';
import { evaluateSettlement } from '../utils/eligibility';
import type { Settlement } from '../types';

type Props = {
  settlement: Settlement | null;
  onClose: () => void;
};

const VERDICT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  'Likely eligible': { border: '#1f4f46', bg: '#d4ede6', text: '#1f4f46' },
  'Possible fit':    { border: '#7a6249', bg: '#ecdfcb', text: '#7a4f1a' },
  'Needs review':    { border: '#ad5c2b', bg: '#f5ddd3', text: '#7a2e1a' },
};

export function SettlementDetailModal({ settlement, onClose }: Props) {
  const { appliedMap, toggleApplied } = useAppliedStore();
  const { inCart, addToCart, removeFromCart } = useCartStore();
  const { profile } = useProfileStore();

  if (!settlement) return null;

  const verdict = evaluateSettlement(settlement, profile);
  const isApplied = appliedMap[settlement.id]?.applied ?? false;
  const cartItem = inCart(settlement.id);
  const colors = VERDICT_COLORS[verdict.label] ?? VERDICT_COLORS['Possible fit'];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Nav bar */}
        <View style={styles.navbar}>
          <IconButton icon="arrow-left" onPress={onClose} style={styles.backButton} />
          <Chip compact style={styles.categoryChip}>{settlement.category}</Chip>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Title block */}
          <Text variant="headlineMedium" style={styles.title}>{settlement.title}</Text>
          <Text variant="bodyMedium" style={styles.description}>{settlement.description}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Chip compact icon="map-marker">{settlement.locationSummary}</Chip>
          </View>

          {/* Eligibility verdict */}
          <View style={[styles.verdictCard, { borderLeftColor: colors.border, backgroundColor: colors.bg }]}>
            <Text variant="labelLarge" style={[styles.verdictLabel, { color: colors.text }]}>
              {verdict.label}
            </Text>
            <Text variant="bodySmall" style={styles.verdictReason}>{verdict.reason}</Text>
          </View>

          {/* Quick-glance stats */}
          <View style={styles.statsRow}>
            <StatBox label="Award" value={settlement.potentialAward ?? 'Varies'} />
            <View style={styles.statDivider} />
            <StatBox label="Deadline" value={settlement.deadlineLabel ?? 'Unknown'} />
          </View>

          <Divider style={styles.divider} />

          {/* Proof */}
          {settlement.proofRequired ? (
            <Section label="Proof Required">
              <Text variant="bodyMedium" style={styles.bodyText}>{settlement.proofRequired}</Text>
            </Section>
          ) : null}

          {/* Final hearing */}
          {settlement.finalHearingLabel ? (
            <Section label="Final Hearing">
              <Text variant="bodyMedium" style={styles.bodyText}>{settlement.finalHearingLabel}</Text>
            </Section>
          ) : null}

          {/* Eligibility */}
          <Section label="Who's Eligible">
            <Text variant="bodyMedium" style={styles.bodyText}>{settlement.eligibilitySummary}</Text>
          </Section>

          <Divider style={styles.divider} />

          {/* Action buttons */}
          <View style={styles.primaryActions}>
            <Button
              mode={isApplied ? 'contained-tonal' : 'contained'}
              icon={isApplied ? 'check-circle' : 'pencil-outline'}
              onPress={() => toggleApplied(settlement.id)}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
            >
              {isApplied ? 'Applied' : 'Mark Applied'}
            </Button>
            <Button
              mode={cartItem ? 'outlined' : 'contained-tonal'}
              icon={cartItem ? 'cart-remove' : 'cart-plus'}
              onPress={() => cartItem ? removeFromCart(settlement.id) : addToCart(settlement.id)}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
            >
              {cartItem ? 'Remove from Cart' : 'Add to Cart'}
            </Button>
          </View>

          <Button
            mode="text"
            icon="open-in-new"
            onPress={() => Linking.openURL(settlement.claimUrl ?? settlement.sourceUrl).catch(() => undefined)}
          >
            Open Claim Page
          </Button>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="labelMedium" style={styles.sectionLabel}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text variant="labelSmall" style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text variant="titleSmall" style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6efe3' },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d5c5',
    gap: 4,
  },
  backButton: { margin: 0 },
  categoryChip: { backgroundColor: '#ecdfcb' },

  content: { padding: 20, paddingBottom: 48, gap: 16 },

  title: { fontWeight: '800', color: '#1a1a1a', lineHeight: 34 },
  description: { color: '#5f6773', lineHeight: 22, marginTop: -4 },

  locationRow: { flexDirection: 'row' },

  verdictCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    gap: 4,
  },
  verdictLabel: { fontWeight: '700' },
  verdictReason: { color: '#5f6773', lineHeight: 18 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fffaf2',
    borderRadius: 14,
    overflow: 'hidden',
  },
  statBox: { flex: 1, padding: 14, gap: 4 },
  statDivider: { width: 1, backgroundColor: '#e0d5c5', marginVertical: 12 },
  statLabel: { color: '#7a6249', letterSpacing: 0.5 },
  statValue: { color: '#1a1a1a', fontWeight: '600' },

  divider: { backgroundColor: '#e0d5c5' },

  section: { gap: 6 },
  sectionLabel: {
    color: '#7a6249',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bodyText: { color: '#3a3a3a', lineHeight: 22 },

  primaryActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
  actionBtnContent: { paddingVertical: 4 },
});
