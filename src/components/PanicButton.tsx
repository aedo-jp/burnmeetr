import React, { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

type Props = {
  onPress: () => void;
  mode?: 'start' | 'end';
  disabled?: boolean;
};

const DOME_SIZE = 160;
const HOUSING_SIZE = 200;

export const PanicButton: React.FC<Props> = ({
  onPress,
  mode = 'start',
  disabled = false,
}) => {
  const label = mode === 'end' ? 'END' : 'START';
  const isEnd = mode === 'end';

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.94, { duration: 80, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(4, { duration: 80, easing: Easing.out(Easing.ease) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 12, stiffness: 200 });
  }, []);

  const domeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  // END mode: slightly darker dome, dimmer glow — same button, different register
  const domeColor = isEnd ? '#990000' : '#BB0000';
  const glowColor = isEnd ? '#CC0000' : '#FF0000';

  return (
    <View style={styles.wrapper}>
      {/* Housing ring */}
      <View style={[styles.housing, disabled && styles.housingDisabled]}>
        {/* Shadow plate under dome */}
        <View style={styles.shadowPlate} />

        <Pressable
          onPress={disabled ? undefined : onPress}
          onPressIn={disabled ? undefined : handlePressIn}
          onPressOut={disabled ? undefined : handlePressOut}
          style={styles.pressable}
        >
          <Animated.View style={[
            styles.dome,
            domeStyle,
            disabled && styles.domeDisabled,
            { backgroundColor: domeColor, shadowColor: glowColor },
          ]}>
            {/* Dome glint */}
            <View style={styles.glint} />
            <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
          </Animated.View>
        </Pressable>
      </View>

      <Text style={[styles.subLabel, disabled && styles.subLabelDisabled]}>
        {disabled
          ? 'ADD ATTENDEES TO BEGIN'
          : isEnd
          ? 'PRESS TO END'
          : 'PRESS TO BEGIN'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 16,
  },
  housing: {
    width: HOUSING_SIZE,
    height: HOUSING_SIZE,
    borderRadius: HOUSING_SIZE / 2,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  housingDisabled: {
    opacity: 0.4,
  },
  shadowPlate: {
    position: 'absolute',
    width: DOME_SIZE + 8,
    height: DOME_SIZE + 8,
    borderRadius: (DOME_SIZE + 8) / 2,
    backgroundColor: '#050505',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  pressable: {
    width: DOME_SIZE,
    height: DOME_SIZE,
    borderRadius: DOME_SIZE / 2,
  },
  dome: {
    width: DOME_SIZE,
    height: DOME_SIZE,
    borderRadius: DOME_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,120,120,0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  domeDisabled: {
    backgroundColor: '#333',
    shadowOpacity: 0,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  glint: {
    position: 'absolute',
    top: 18,
    left: 30,
    width: 52,
    height: 22,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.13)',
    transform: [{ rotate: '-20deg' }],
  },
  label: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  labelDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  subLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    letterSpacing: 2,
    color: '#444',
  },
  subLabelDisabled: {
    color: '#2A2A2A',
  },
});
