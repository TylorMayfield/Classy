import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

export default function App() {
  console.log('--- PAPER TEST EVALUATING ---');
  
  useEffect(() => {
    console.log('--- PAPER TEST MOUNTED ---');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <View style={{ flex: 1, backgroundColor: 'purple', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 32 }}>PAPER READY</Text>
        </View>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
