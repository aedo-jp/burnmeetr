import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useMeeting } from './src/hooks/useMeeting';
import { SetupScreen } from './src/screens/SetupScreen';
import { RunningScreen } from './src/screens/RunningScreen';
import { ProcessingScreen } from './src/screens/ProcessingScreen';
import { BRKRScreen } from './src/screens/BRKRScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { Colors } from './src/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'JetBrainsMono': JetBrainsMono_400Regular,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
    'Inter': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  const meeting = useMeeting();

  useEffect(() => {
    if (fontsLoaded) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 2000);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      {meeting.screen === 'setup' && (
        <SetupScreen
          currency={meeting.currency}
          setCurrency={meeting.setCurrency}
          fxRates={meeting.fxRates}
          fxLoading={meeting.fxLoading}
          allocatedMinutes={meeting.allocatedMinutes}
          setAllocatedMinutes={meeting.setAllocatedMinutes}
          attendees={meeting.attendees}
          setCount={meeting.setCount}
          updateRate={meeting.updateRate}
          addCustomRole={meeting.addCustomRole}
          removeAttendee={meeting.removeAttendee}
          totalPeople={meeting.totalPeople}
          perMinute={meeting.perMinute}
          perHour={meeting.perHour}
          onConfirm={meeting.navigateToIdle}
          onResetAll={meeting.resetAllData}
          sessionCount={meeting.history.length}
          totalCostUSD={meeting.analytics.totalCost}
        />
      )}
      {(meeting.screen === 'idle' || meeting.screen === 'running') && (
        <RunningScreen
          currency={meeting.currency}
          attendees={meeting.attendees}
          cost={meeting.cost}
          elapsed={meeting.elapsed}
          allocatedMinutes={meeting.allocatedMinutes}
          isOverrun={meeting.isOverrun}
          overrunSeconds={meeting.overrunSeconds}
          perMinute={meeting.perMinute}
          totalPeople={meeting.totalPeople}
          isIdle={meeting.screen === 'idle'}
          onStart={meeting.startMeeting}
          onEnd={meeting.endMeeting}
          onBackToSetup={meeting.resetMeeting}
        />
      )}
      {meeting.screen === 'processing' && (
        <ProcessingScreen
          onComplete={meeting.completeProcessing}
          easterEgg={meeting.easterEggTriggered}
        />
      )}
      {meeting.screen === 'brkr' && (
        <BRKRScreen onComplete={meeting.navigateToSummary} />
      )}
      {meeting.screen === 'summary' && (
        <SummaryScreen
          currency={meeting.currency}
          attendees={meeting.attendees}
          cost={meeting.cost}
          elapsed={meeting.elapsed}
          allocatedMinutes={meeting.allocatedMinutes}
          isOverrun={meeting.isOverrun}
          overrunSeconds={meeting.overrunSeconds}
          fxRates={meeting.fxRates}
          history={meeting.history}
          analytics={meeting.analytics}
          daysSinceFirstLaunch={meeting.daysSinceFirstLaunch}
          onNewMeeting={meeting.resetMeeting}
          onDeleteSession={meeting.deleteSession}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
