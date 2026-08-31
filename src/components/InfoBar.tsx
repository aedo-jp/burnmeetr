import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { STATS_POOL, StatContext } from '../constants/stats';

const HOLD_MS = 3800;
const FADE_MS = 120;

type Props = {
  context: StatContext;
  isOverrun: boolean;
};

// Shuffle the pool once, then cycle through it
function buildQueue(ctx: StatContext): string[] {
  // When idle, only show static/fabricated stats — no real data yet
  const pool = STATS_POOL
    .filter(s => ctx.isIdle ? s.type === 'static' : true)
    .map((s) => s.type === 'static' ? s.text : s.fn(ctx));
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export const InfoBar: React.FC<Props> = ({ context, isOverrun }) => {
  const queueRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const [currentText, setCurrentText] = useState('');
  const opacity = useSharedValue(0);

  const showNext = () => {
    if (queueRef.current.length === 0) {
      queueRef.current = buildQueue(context);
      indexRef.current = 0;
    }
    if (indexRef.current >= queueRef.current.length) {
      queueRef.current = buildQueue(context);
      indexRef.current = 0;
    }
    const text = queueRef.current[indexRef.current++];
    setCurrentText(text);
    opacity.value = withSequence(
      withTiming(1, { duration: FADE_MS, easing: Easing.in(Easing.ease) }),
    );
  };

  useEffect(() => {
    queueRef.current = buildQueue(context);
    showNext();
    const timer = setInterval(() => {
      // Snap out, update, snap in
      opacity.value = withTiming(0, { duration: FADE_MS }, (finished) => {
        if (finished) {
          // update happens on next render cycle
        }
      });
      setTimeout(() => showNext(), FADE_MS + 20);
    }, HOLD_MS);
    return () => clearInterval(timer);
  }, []); // intentionally only mount once; context updates flow through currentText

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const borderColor = isOverrun ? Colors.red : Colors.rule;
  const labelColor = isOverrun ? Colors.redBright : Colors.teal;

  return (
    <View style={[styles.container, { borderTopColor: borderColor, borderBottomColor: borderColor }]}>
      <Text style={[styles.label, { color: labelColor }]}>
        {isOverrun ? 'OVERRUN' : 'ANALYTICS'}
      </Text>
      <Animated.Text style={[styles.text, animStyle]} numberOfLines={1}>
        {currentText}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: '#111111',
    gap: 12,
  },
  label: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 8,
    letterSpacing: 1.5,
    flexShrink: 0,
  },
  text: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    letterSpacing: 0.3,
  },
});
