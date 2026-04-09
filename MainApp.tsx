import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { BrowseScreen } from './src/screens/BrowseScreen';

export default function App() {
  console.log('--- MOCKED BROWSE WITH PAPER TEST EVALUATING ---');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <NavigationContainer>
          <BrowseScreen />
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
