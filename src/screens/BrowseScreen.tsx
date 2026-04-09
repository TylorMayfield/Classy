import React from 'react';
import { View, SafeAreaView, Text as RNText } from 'react-native';
import { Searchbar, Text as PaperText, useTheme } from 'react-native-paper';

export function BrowseScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 16 }}>
        <RNText style={{ fontSize: 30 }}>STANDARD TEXT BROWSE</RNText>
        <PaperText variant="headlineMedium">PAPER TEXT BROWSE</PaperText>
        <Searchbar placeholder="Search..." value="" onChangeText={() => {}} />
        <RNText style={{ marginTop: 20 }}>STATIC UI TEST READY</RNText>
      </View>
    </SafeAreaView>
  );
}
