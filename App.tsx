import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Button,
  Card,
  Chip,
  Divider,
  List,
  MD3LightTheme,
  Modal,
  Portal,
  Provider as PaperProvider,
  Searchbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import { settlements } from './src/data';
import { useAppliedStore } from './src/hooks/useAppliedStore';
import { evaluateSettlement, type EligibilityInput } from './src/utils/eligibility';
import type { Settlement } from './src/types';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1f4f46',
    secondary: '#ad5c2b',
    tertiary: '#d78c2f',
    surface: '#fffaf2',
    surfaceVariant: '#ecdfcb',
    background: '#f6efe3',
    outline: '#cdbda6',
  },
};

const defaultProfile: EligibilityInput = {
  state: '',
  workHistory: '',
  productHistory: '',
  hasProof: false,
};

export default function App() {
  const { appliedMap, toggleApplied } = useAppliedStore();
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [appliedOnly, setAppliedOnly] = useState(false);
  const [selected, setSelected] = useState<Settlement | null>(settlements[0] ?? null);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [profile, setProfile] = useState<EligibilityInput>(defaultProfile);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedState = stateFilter.trim().toLowerCase();

    return settlements.filter((item) => {
      if (appliedOnly && !appliedMap[item.id]?.applied) {
        return false;
      }

      if (
        normalizedState &&
        !item.stateTags.some((tag) => tag.toLowerCase() === normalizedState) &&
        !item.locationSummary.toLowerCase().includes(normalizedState)
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        item.title,
        item.description,
        item.eligibilitySummary,
        item.locationSummary,
        item.keywordTags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [appliedMap, appliedOnly, query, stateFilter]);

  const selectedSettlement =
    selected && filtered.some((item) => item.id === selected.id) ? selected : filtered[0] ?? null;
  const verdict = selectedSettlement ? evaluateSettlement(selectedSettlement, profile) : null;
  const appliedCount = Object.values(appliedMap).filter((value) => value.applied).length;

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <StatusBar style="dark" />
          <Portal>
            <Modal
              visible={eligibilityOpen}
              onDismiss={() => setEligibilityOpen(false)}
              contentContainerStyle={styles.modal}
            >
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Check eligibility
              </Text>
              <TextInput
                mode="outlined"
                label="Your state"
                value={profile.state}
                onChangeText={(value) => setProfile({ ...profile, state: value })}
                style={styles.modalField}
              />
              <TextInput
                mode="outlined"
                label="Work history"
                value={profile.workHistory}
                onChangeText={(value) => setProfile({ ...profile, workHistory: value })}
                multiline
                numberOfLines={3}
                style={styles.modalField}
              />
              <TextInput
                mode="outlined"
                label="Product or account history"
                value={profile.productHistory}
                onChangeText={(value) => setProfile({ ...profile, productHistory: value })}
                multiline
                numberOfLines={3}
                style={styles.modalField}
              />
              <View style={styles.switchRow}>
                <Text variant="bodyMedium">I have proof or documentation if needed</Text>
                <Switch
                  value={profile.hasProof}
                  onValueChange={(value) => setProfile({ ...profile, hasProof: value })}
                />
              </View>
              {verdict ? (
                <Card style={styles.verdictCard} mode="contained">
                  <Card.Content>
                    <Text variant="titleMedium">{verdict.label}</Text>
                    <Text variant="bodyMedium">{verdict.reason}</Text>
                  </Card.Content>
                </Card>
              ) : null}
              <Button mode="contained" onPress={() => setEligibilityOpen(false)}>
                Done
              </Button>
            </Modal>
          </Portal>

          <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.hero} mode="contained">
              <Card.Content>
                <Text variant="labelLarge" style={styles.eyebrow}>
                  Classy
                </Text>
                <Text variant="displaySmall" style={styles.heroTitle}>
                  Open class action suits, built for a real iPhone app.
                </Text>
                <Text variant="bodyLarge" style={styles.heroBody}>
                  Browse live settlements, see likely fit based on location and history, and mark which
                  claims you already handled.
                </Text>
                <View style={styles.heroStats}>
                  <Chip icon="gavel" compact>
                    {settlements.length} tracked
                  </Chip>
                  <Chip icon="check-decagram" compact>
                    {appliedCount} applied
                  </Chip>
                </View>
              </Card.Content>
            </Card>

            <Searchbar
              placeholder="Search Amazon, data breach, subscription..."
              value={query}
              onChangeText={setQuery}
              style={styles.search}
            />

            <TextInput
              mode="outlined"
              label="Filter by state"
              value={stateFilter}
              onChangeText={setStateFilter}
            />

            <List.Item
              title="Show only applications I already filed"
              right={() => <Switch value={appliedOnly} onValueChange={setAppliedOnly} />}
              style={styles.filterRow}
            />

            {selectedSettlement ? (
              <Card style={styles.detailCard}>
                <Card.Content>
                  <Text variant="headlineSmall">{selectedSettlement.title}</Text>
                  <Text variant="bodyMedium" style={styles.muted}>
                    {selectedSettlement.description}
                  </Text>

                  <View style={styles.chipRow}>
                    <Chip compact>{selectedSettlement.category}</Chip>
                    <Chip compact icon="map-marker">
                      {selectedSettlement.locationSummary}
                    </Chip>
                  </View>

                  {verdict ? (
                    <Card style={styles.fitCard} mode="contained">
                      <Card.Content>
                        <Text variant="titleMedium">{verdict.label}</Text>
                        <Text variant="bodyMedium">{verdict.reason}</Text>
                      </Card.Content>
                    </Card>
                  ) : null}

                  <Divider style={styles.divider} />

                  <Fact label="Potential award" value={selectedSettlement.potentialAward ?? 'Varies'} />
                  <Fact label="Deadline" value={selectedSettlement.deadlineLabel ?? 'Unknown'} />
                  <Fact label="Final hearing" value={selectedSettlement.finalHearingLabel ?? 'Not listed'} />
                  <Fact label="Proof required" value={selectedSettlement.proofRequired ?? 'Unknown'} />
                  <Fact label="Eligibility" value={selectedSettlement.eligibilitySummary} />

                  <View style={styles.actionRow}>
                    <Button mode="contained" onPress={() => setEligibilityOpen(true)}>
                      Check fit
                    </Button>
                    <Button
                      mode={appliedMap[selectedSettlement.id]?.applied ? 'contained-tonal' : 'outlined'}
                      onPress={() => toggleApplied(selectedSettlement.id)}
                    >
                      {appliedMap[selectedSettlement.id]?.applied ? 'Applied' : 'Mark applied'}
                    </Button>
                  </View>

                  <Button
                    mode="text"
                    icon="open-in-new"
                    onPress={() =>
                      Linking.openURL(selectedSettlement.claimUrl ?? selectedSettlement.sourceUrl).catch(() => undefined)
                    }
                  >
                    Open claim source
                  </Button>
                </Card.Content>
              </Card>
            ) : null}

            <Text variant="titleLarge" style={styles.sectionTitle}>
              Available suits
            </Text>

            {filtered.map((item) => {
              const itemVerdict = evaluateSettlement(item, profile);

              return (
                <Card key={item.id} style={styles.listCard} onPress={() => setSelected(item)}>
                  <Card.Content>
                    <Text variant="titleLarge">{item.title}</Text>
                    <Text variant="bodyMedium" style={styles.muted}>
                      {item.description}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Chip compact>{item.deadlineLabel ?? 'Unknown deadline'}</Chip>
                      <Chip compact>{item.potentialAward ?? 'Varies'}</Chip>
                    </View>
                    <Text variant="bodyMedium" style={styles.fitText}>
                      {itemVerdict.label}: {itemVerdict.reason}
                    </Text>
                    <Button
                      mode={appliedMap[item.id]?.applied ? 'contained-tonal' : 'outlined'}
                      style={styles.cardButton}
                      onPress={() => toggleApplied(item.id)}
                    >
                      {appliedMap[item.id]?.applied ? 'Applied' : 'Mark applied'}
                    </Button>
                  </Card.Content>
                </Card>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text variant="labelLarge" style={styles.factLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6efe3',
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#1f4f46',
  },
  eyebrow: {
    color: '#f3d7b2',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fffaf2',
    fontWeight: '800',
    marginBottom: 10,
  },
  heroBody: {
    color: '#dce8e0',
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  search: {
    backgroundColor: '#fffaf2',
  },
  filterRow: {
    backgroundColor: '#fffaf2',
    borderRadius: 20,
  },
  detailCard: {
    backgroundColor: '#fffaf2',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  fitCard: {
    backgroundColor: '#ecdfcb',
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  fact: {
    marginBottom: 12,
  },
  factLabel: {
    color: '#7a6249',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 8,
  },
  listCard: {
    backgroundColor: '#fffaf2',
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  fitText: {
    color: '#4b5a5d',
  },
  cardButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  muted: {
    color: '#5f6773',
    marginTop: 8,
  },
  modal: {
    backgroundColor: '#fffaf2',
    borderRadius: 24,
    margin: 20,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 12,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  verdictCard: {
    backgroundColor: '#ecdfcb',
    marginBottom: 16,
  },
});
