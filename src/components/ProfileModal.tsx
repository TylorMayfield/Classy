import { useState } from 'react';
import { FlatList, Linking, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Chip, Divider, IconButton, Searchbar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfileStore } from '../hooks/useProfileStore';
import { US_STATES } from '../constants/states';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type View = 'profile' | 'statePicker';

export function ProfileModal({ visible, onClose }: Props) {
  const { profile, updateProfile } = useProfileStore();
  const [currentView, setCurrentView] = useState<View>('profile');
  const [stateQuery, setStateQuery] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const filteredStates = stateQuery.trim()
    ? US_STATES.filter((s) => s.toLowerCase().includes(stateQuery.toLowerCase()))
    : US_STATES;

  const toggleState = (s: string) => {
    const current = profile.states ?? [];
    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
    updateProfile({ states: next });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || profile.keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase())) return;
    updateProfile({ keywords: [...profile.keywords, kw] });
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    updateProfile({ keywords: profile.keywords.filter((k) => k !== kw) });
  };

  const handleClose = () => {
    setCurrentView('profile');
    setStateQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (currentView === 'statePicker') setCurrentView('profile');
        else handleClose();
      }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {currentView === 'statePicker' ? (
          // ── State picker view ──────────────────────────────────
          <>
            <View style={styles.header}>
              <IconButton icon="arrow-left" onPress={() => { setCurrentView('profile'); setStateQuery(''); }} />
              <Text variant="headlineSmall" style={styles.headerTitleCentered}>Select States</Text>
              <IconButton icon="close" onPress={handleClose} />
            </View>

            <Searchbar
              placeholder="Search states…"
              value={stateQuery}
              onChangeText={setStateQuery}
              style={styles.stateSearch}
              autoFocus
            />

            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = profile.states?.includes(item) ?? false;
                return (
                  <TouchableOpacity
                    style={[styles.stateRow, selected && styles.stateRowSelected]}
                    onPress={() => toggleState(item)}
                  >
                    <Text
                      variant="bodyLarge"
                      style={selected ? styles.stateRowTextSelected : styles.stateRowText}
                    >
                      {item}
                    </Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <Divider />}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                (profile.states?.length ?? 0) > 0 ? (
                  <TouchableOpacity style={styles.clearAllRow} onPress={() => updateProfile({ states: [] })}>
                    <Text variant="labelMedium" style={styles.clearAllText}>Clear all ({profile.states.length} selected)</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          </>
        ) : (
          // ── Profile view ───────────────────────────────────────
          <>
            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              <Text variant="headlineSmall" style={styles.headerTitleCentered}>My Profile</Text>
              <IconButton icon="close" onPress={handleClose} />
            </View>

            <FlatList
              data={[]}
              renderItem={null}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View style={styles.content}>
                  <Text variant="bodyMedium" style={styles.subtitle}>
                    Your profile powers the eligibility score on every settlement. Set it once and all scores update automatically.
                  </Text>

                  {/* States */}
                  <Text variant="labelLarge" style={styles.sectionLabel}>Your States</Text>
                  <TouchableOpacity
                    style={[styles.stateButton, (profile.states?.length ?? 0) > 0 ? styles.stateButtonFilled : null]}
                    onPress={() => setCurrentView('statePicker')}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="bodyLarge"
                      style={(profile.states?.length ?? 0) > 0 ? styles.stateText : styles.statePlaceholder}
                    >
                      {(profile.states?.length ?? 0) === 0
                        ? 'Select states…'
                        : profile.states.length === 1
                        ? profile.states[0]
                        : `${profile.states.length} states selected`}
                    </Text>
                    <Text style={styles.stateChevron}>›</Text>
                  </TouchableOpacity>
                  {(profile.states?.length ?? 0) > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.selectedStatesRow}
                    >
                      {profile.states.map((s) => (
                        <Chip key={s} compact onClose={() => toggleState(s)} style={styles.stateChip}>{s}</Chip>
                      ))}
                    </ScrollView>
                  )}

                  <Divider style={styles.divider} />

                  {/* Keywords */}
                  <Text variant="labelLarge" style={styles.sectionLabel}>Keywords</Text>
                  <Text variant="bodySmall" style={styles.sectionHint}>
                    Add companies, products, employers, or services you've used. Matched against settlement eligibility criteria.
                  </Text>

                  <View style={styles.chipRow}>
                    {profile.keywords.map((kw) => (
                      <Chip key={kw} onClose={() => removeKeyword(kw)} compact style={styles.keywordChip}>
                        {kw}
                      </Chip>
                    ))}
                    {profile.keywords.length === 0 && (
                      <Text variant="bodySmall" style={styles.noKeywords}>No keywords added yet.</Text>
                    )}
                  </View>

                  <View style={styles.keywordRow}>
                    <TextInput
                      mode="outlined"
                      label="Add keyword (e.g. Amazon, Wells Fargo)"
                      value={keywordInput}
                      onChangeText={setKeywordInput}
                      onSubmitEditing={addKeyword}
                      returnKeyType="done"
                      style={styles.keywordInput}
                    />
                    <IconButton icon="plus" mode="contained" onPress={addKeyword} />
                  </View>

                  <Button mode="contained" onPress={handleClose} style={styles.doneButton}>
                    Save & Close
                  </Button>

                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://tylor.nz/legal').catch(() => undefined)}
                    style={styles.legalLink}
                  >
                    <Text variant="bodySmall" style={styles.legalLinkText}>Legal &amp; Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6efe3' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d5c5',
  },
  headerTitleCentered: { fontWeight: '700', color: '#1f4f46', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 48 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  subtitle: { color: '#5f6773', lineHeight: 22 },
  sectionLabel: { textTransform: 'uppercase', color: '#7a6249', letterSpacing: 0.5, marginTop: 4 },
  sectionHint: { color: '#7a6249', lineHeight: 18 },
  divider: { backgroundColor: '#e0d5c5', marginVertical: 4 },
  stateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffaf2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cdbda6',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stateButtonFilled: { borderColor: '#1f4f46' },
  stateText: { color: '#1a1a1a', fontWeight: '500' },
  statePlaceholder: { color: '#aaa' },
  stateChevron: { fontSize: 20, color: '#7a6249' },
  clearState: { color: '#ad5c2b', textAlign: 'right', marginTop: -4 },
  stateSearch: { margin: 12, borderRadius: 10, backgroundColor: '#fffaf2', elevation: 0 },
  stateRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateRowSelected: { backgroundColor: '#d4ede6' },
  stateRowText: { color: '#1a1a1a' },
  stateRowTextSelected: { color: '#1f4f46', fontWeight: '700' },
  stateCheck: { color: '#1f4f46', fontSize: 18, fontWeight: '700' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#cdbda6', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#1f4f46', borderColor: '#1f4f46' },
  checkboxTick: { color: '#fff', fontSize: 14, fontWeight: '800' },
  selectedStatesRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  stateChip: { backgroundColor: '#d4ede6' },
  clearAllRow: { padding: 14, backgroundColor: '#f5ddd3', alignItems: 'center' },
  clearAllText: { color: '#ad5c2b', fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 32 },
  keywordChip: { backgroundColor: '#ecdfcb' },
  noKeywords: { color: '#aaa', fontStyle: 'italic' },
  keywordRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  keywordInput: { flex: 1, backgroundColor: '#fffaf2' },
  doneButton: { marginTop: 8 },
  legalLink: { alignItems: 'center', paddingVertical: 12 },
  legalLinkText: { color: '#1f4f46', textDecorationLine: 'underline' },
});
