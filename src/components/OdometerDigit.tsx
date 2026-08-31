import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

const DIGIT_COUNT = 10;
// Use 4 sets so we have plenty of runway before needing to reset
const STRIP_SETS = 4;
const TOTAL_DIGITS = DIGIT_COUNT * STRIP_SETS;
// Start in set 1 (index 10) so we have one full set above as buffer
const START_SET = 1;

type Props = {
  value: number; // 0–9
  digitHeight: number;
  fontSize: number;
  color?: string;
  isOverrun?: boolean;
  isCents?: boolean;
};

export const OdometerDigit: React.FC<Props> = ({
  value,
  digitHeight,
  fontSize,
  color,
  isOverrun = false,
  isCents = false,
}) => {
  // currentPosition tracks which absolute index in the strip we're at
  // Starts at START_SET * DIGIT_COUNT + value
  const currentPos = useRef(START_SET * DIGIT_COUNT + value);
  const translateY = useSharedValue(-(START_SET * DIGIT_COUNT + value) * digitHeight);

  useEffect(() => {
    const currentValue = currentPos.current % DIGIT_COUNT;
    const nextValue = value;

    // How many steps forward to roll (always forward)
    let steps = nextValue - currentValue;
    if (steps <= 0) steps += DIGIT_COUNT;

    const nextPos = currentPos.current + steps;

    // If we're getting close to the end of the strip, 
    // snap back to equivalent position in an earlier set
    // This is invisible because same digit appears every 10 positions
    let adjustedPos = nextPos;
    if (adjustedPos >= DIGIT_COUNT * (STRIP_SETS - 1)) {
      // Snap back by one full set (10 digits) — same visual position
      const snapBack = DIGIT_COUNT;
      currentPos.current = currentPos.current - snapBack;
      translateY.value = translateY.value + snapBack * digitHeight;
      adjustedPos = adjustedPos - snapBack;
    }

    currentPos.current = adjustedPos;

    translateY.value = withTiming(
      -adjustedPos * digitHeight,
      { duration: 130, easing: Easing.out(Easing.cubic) }
    );
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  let activeColor: string;
  if (isOverrun) {
    activeColor = Colors.redBright;
  } else if (isCents) {
    activeColor = Colors.red;
  } else {
    activeColor = color ?? Colors.textPrimary;
  }

  // Build digit strip: STRIP_SETS repetitions of 0–9
  const digits = Array.from({ length: TOTAL_DIGITS }, (_, i) => i % DIGIT_COUNT);

  return (
    <View
      style={[
        styles.window,
        { width: fontSize * 0.65, height: digitHeight },
      ]}
    >
      <Animated.View style={animatedStyle}>
        {digits.map((d, i) => {
          const posInSet = i % DIGIT_COUNT;
          const distFromCurrent = Math.abs(posInSet - value);
          const wrappedDist = Math.min(distFromCurrent, DIGIT_COUNT - distFromCurrent);
          const opacity = wrappedDist === 0 ? 1 : wrappedDist === 1 ? 0.18 : 0;

          return (
            <View
              key={i}
              style={[
                styles.digitCell,
                { height: digitHeight, width: fontSize * 0.65 },
              ]}
            >
              <Animated.Text
                style={[
                  styles.digitText,
                  {
                    fontSize,
                    lineHeight: digitHeight,
                    color: activeColor,
                    opacity,
                  },
                ]}
              >
                {d}
              </Animated.Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  window: {
    overflow: 'hidden',
  },
  digitCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontFamily: 'JetBrainsMono-Bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
