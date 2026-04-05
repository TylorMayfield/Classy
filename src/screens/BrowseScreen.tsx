import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Chip, IconButton, Searchbar, Text } from 'react-native-paper';

import { useAppliedStore } from '../hooks/useAppliedStore';
import { useCartStore } from '../hooks/useCartStore';
import { useProfileStore } from '../hooks/useProfileStore';
import { useSettlementsStore } from '../hooks/useSettlementsStore';
import { evaluateSettlement } from '../utils/eligibility';
import { ProfileModal } from '../components/ProfileModal';
import { SettlementDetailModal } from '../components/SettlementDetailModal';
import { SettlementCard } from '../components/SettlementCard';
import type { Settlement } from '../types';

type SortKey = 'default' | 'score' | 'deadline';

const CATEGORIES = [
  'All',
  'Data breach',
  'Employment',
  'False advertising',
  'General settlement',
  'Subscription',
];

export function BrowseScreen() {
  const { appliedMap } = useAppliedStore();
  const { cart } = useCartStore();
  const { profile } = useProfileStore();
  const { settlements, refresh, refreshing, lastRefreshedAt, error } = useSettlementsStore();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [appliedOnly, setAppliedOnly] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState<Settlement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return settlements.filter((item) => {
      if (appliedOnly && !appliedMap[item.id]?.applied) return false;
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return [item.title, item.description, item.eligibilitySummary, item.locationSummary, item.keywordTags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [appliedMap, appliedOnly, categoryFilter, query, settlements]);

  const sorted = useMemo(() => {
    if (sortKey === 'score') {
      return [...filtered].sort(
        (a, b) => evaluateSettlement(b, profile).score - evaluateSettlement(a, profile).score,
      );
    }
    if (sortKey === 'deadline') {
      return [...filtered].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    }
    return filtered;
  }, [filtered, sortKey, profile]);

  const appliedCount = Object.values(appliedMap).filter((v) => v.applied).length;
  const cartCount = Object.keys(cart).length;
  const profileComplete = (profile.states?.length ?? 0) > 0 || profile.keywords.length > 0;
  const lastRefreshedLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  const listHeader = (
    <View style={styles.listHeader}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text variant="bodySmall" style={styles.stat}>{settlements.length} settlements</Text>
        <Text variant="bodySmall" style={styles.statDivider}>·</Text>
        <Text variant="bodySmall" style={styles.stat}>{appliedCount} applied</Text>
        {cartCount > 0 && (
          <>
            <Text variant="bodySmall" style={styles.statDivider}>·</Text>
            <Text variant="bodySmall" style={styles.stat}>{cartCount} in cart</Text>
          </>
        )}
        <View style={styles.statSpacer} />
        {refreshing ? (
          <ActivityIndicator size={14} color="#7a6249" />
        ) : (
          <Text variant="bodySmall" style={styles.refreshLabel} onPress={() => void refresh()}>
            {lastRefreshedLabel ? `Updated ${lastRefreshedLabel}` : 'Refresh'}
          </Text>
        )}
        {error ? <Text variant="bodySmall" style={styles.errorText}> · {error}</Text> : null}
      </View>

      {!profileComplete && (
        <View style={styles.profileNudge}>
          <Text variant="bodySmall" style={styles.profileNudgeText}>
            Set your state and keywords to see personalized eligibility scores.
          </Text>
          <Text variant="labelSmall" style={styles.profileNudgeLink} onPress={() => setProfileOpen(true)}>
            Set up profile →
          </Text>
        </View>
      )}

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            compact
            selected={categoryFilter === cat}
            onPress={() => setCategoryFilter(cat)}
            style={styles.categoryChip}
          >
            {cat}
          </Chip>
        ))}
      </ScrollView>

      {/* Sort + Applied filter */}
      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {(['default', 'score', 'deadline'] as SortKey[]).map((key) => (
            <Chip
              key={key}
              compact
              selected={sortKey === key}
              onPress={() => setSortKey(key)}
              style={styles.sortChip}
            >
              {key === 'default' ? 'Default' : key === 'score' ? 'Best fit' : 'Soonest'}
            </Chip>
          ))}
        </ScrollView>
        <Chip
          compact
          selected={appliedOnly}
          onPress={() => setAppliedOnly((v) => !v)}
          icon={appliedOnly ? 'check-circle' : 'circle-outline'}
          style={styles.appliedChip}
        >
          Applied
        </Chip>
      </View>

      <Text variant="bodySmall" style={styles.resultCount}>
        {sorted.length} result{sorted.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text variant="headlineSmall" style={styles.topBarTitle}>Browse</Text>
        <IconButton
          icon={profileComplete ? 'account-circle' : 'account-circle-outline'}
          iconColor={profileComplete ? '#1f4f46' : '#7a6249'}
          onPress={() => setProfileOpen(true)}
        />
      </View>

      <Searchbar
        placeholder="Search settlements..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
      />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <SettlementCard
            settlement={item}
            profile={profile}
            isApplied={appliedMap[item.id]?.applied ?? false}
            inCart={Boolean(cart[item.id])}
            onPress={() => setSelected(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor="#1f4f46"
            colors={['#1f4f46']}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>No settlements match your filters.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettlementDetailModal settlement={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6efe3' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 4, paddingTop: 4 },
  topBarTitle: { fontWeight: '800', color: '#1f4f46' },
  searchbar: { marginHorizontal: 12, marginBottom: 8, borderRadius: 12, backgroundColor: '#fffaf2', elevation: 0 },
  searchInput: { fontSize: 15 },
  listContent: { paddingBottom: 32 },
  listHeader: { paddingHorizontal: 12, gap: 10, paddingBottom: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'nowrap' },
  stat: { color: '#7a6249' },
  statDivider: { color: '#cdbda6' },
  statSpacer: { flex: 1 },
  refreshLabel: { color: '#1f4f46', fontWeight: '600' },
  errorText: { color: '#ad5c2b' },
  profileNudge: { backgroundColor: '#ecdfcb', borderRadius: 10, padding: 12, gap: 6 },
  profileNudgeText: { color: '#5f6773' },
  profileNudgeLink: { color: '#1f4f46', fontWeight: '700' },
  categoryRow: { gap: 8, paddingVertical: 2 },
  categoryChip: { backgroundColor: '#fffaf2' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortRow: { gap: 8, flex: 1 },
  sortChip: { backgroundColor: '#fffaf2' },
  appliedChip: { backgroundColor: '#fffaf2', flexShrink: 0 },
  resultCount: { color: '#7a6249' },
  separator: { height: 8 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#7a6249', textAlign: 'center' },
});
