import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing, TypeScale } from '../constants/theme';

// Each line appears sequentially with a delay
// Total duration ~4 seconds before cutting to summary

const STANDARD_LINES = [
  'Compiling attendance data...',
  'Calculating synergy variables...',
  'Rationalising expenditure...',
  'Auditing circle-back utilisation...',
  'Benchmarking against industry standards...',
  'Report ready.',
];

const EASTER_EGG_LINES = [
  'Compiling attendance data...',
  'Calculating synergy variables...',
  'Rationalising expenditure...',
  'Alignment achieved.',
  'Initialising BRKR protocol...',
];

const LINE_DELAY_MS = 560;   // delay between each line appearing
const HOLD_MS = 500;          // hold after "Report ready." before cutting

type Props = {
  onComplete: () => void;
  easterEgg?: boolean;
};

type LineState = 'hidden' | 'visible';

function ProcessingLine({
  text,
  delay,
  isLast,
}: {
  text: string;
  delay: number;
  isLast: boolean;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 80,
        easing: Easing.in(Easing.ease),
      });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text
      style={[
        styles.line,
        isLast && styles.lineLast,
        animStyle,
      ]}
    >
      {text}
    </Animated.Text>
  );
}

export const ProcessingScreen: React.FC<Props> = ({ onComplete, easterEgg = false }) => {
  const LINES = easterEgg ? EASTER_EGG_LINES : STANDARD_LINES;

  useEffect(() => {
    const totalDuration = LINES.length * LINE_DELAY_MS + HOLD_MS;
    const timer = setTimeout(onComplete, totalDuration);
    return () => clearTimeout(timer);
  }, [onComplete, LINES.length]);

  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.terminal}>
          {LINES.map((line, i) => (
            <ProcessingLine
              key={line}
              text={line}
              delay={i * LINE_DELAY_MS}
              isLast={i === LINES.length - 1}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
  },
  terminal: {
    gap: Spacing.sm,
  },
  line: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  lineLast: {
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
});
