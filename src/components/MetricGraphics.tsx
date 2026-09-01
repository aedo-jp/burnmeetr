import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts, TypeScale, Spacing } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── DONUT ─────────────────────────────────────────────────────────────────────
export const DonutGraphic: React.FC<{ size?: number }> = ({ size = 72 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const circumference = 2 * Math.PI * r;
  const strokeW = Math.max(6, size * 0.09);

  const progress = useSharedValue(circumference);
  const labelOpacity = useSharedValue(0);
  const labelScale = useSharedValue(0.8);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) });
    labelOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
    labelScale.value = withDelay(700, withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }));
    pulseOpacity.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ), -1
    ));
  }, []);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: progress.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ scale: labelScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const fontSize = Math.max(11, size * 0.16);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} fill="none"
          stroke={Colors.tealFaint} strokeWidth={strokeW} />
        <AnimatedCircle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={Colors.teal} strokeWidth={strokeW}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
          animatedProps={arcProps}
        />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, labelStyle]}>
        <Animated.Text style={[{ fontFamily: Fonts.monoBold, color: Colors.teal, fontSize }, pulseStyle]}>
          100%
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

// ── BAR ───────────────────────────────────────────────────────────────────────
export const BarGraphic: React.FC<{
  fillPercent: number;
  leftLabel?: string;
  rightLabel?: string;
  alwaysFixed?: boolean;
  barHeight?: number;
}> = ({ fillPercent, leftLabel, rightLabel, alwaysFixed = false, barHeight = 8 }) => {
  const width = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    width.value = withTiming(fillPercent, { duration: 800, easing: Easing.out(Easing.cubic) });
    if (alwaysFixed) {
      pulseOpacity.value = withDelay(900, withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ), -1
      ));
    }
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.barContainer}>
      <View style={[styles.barTrack, { height: barHeight }]}>
        <Animated.View style={[styles.barFill, fillStyle, { height: barHeight }]} />
      </View>
      {(leftLabel || rightLabel) && (
        <View style={styles.barLabels}>
          {leftLabel && <Text style={[styles.barLabel, { color: Colors.red }]}>{leftLabel}</Text>}
          {rightLabel && <Text style={[styles.barLabel, { color: Colors.teal }]}>{rightLabel}</Text>}
        </View>
      )}
    </View>
  );
};

// ── LOADING BAR (FIRED) ───────────────────────────────────────────────────────
export const LoadingBarGraphic: React.FC<{ barHeight?: number }> = ({ barHeight = 6 }) => {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = -100;
    translateX.value = withRepeat(
      withTiming(200, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.loadingContainer}>
      <View style={[styles.loadingTrack, { height: barHeight }]}>
        <Animated.View style={[styles.loadingShimmer, shimmerStyle, { height: barHeight }]} />
      </View>
      <Text style={styles.loadingLabel}>Assessment in progress...</Text>
    </View>
  );
};

// ── PENDING SPINNER ───────────────────────────────────────────────────────────
export const PendingGraphic: React.FC<{ ringSize?: number; compact?: boolean }> = ({ ringSize = 22, compact = true }) => {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [dotCount, setDotCount] = React.useState(1);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }), -1
    );
    if (!compact) {
      // Animated dots only in expanded view
      const interval = setInterval(() => {
        setDotCount(prev => prev >= 3 ? 1 : prev + 1);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [compact]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  const textFontSize = Math.max(13, ringSize * 0.65);
  const dots = '.'.repeat(dotCount);

  if (compact) {
    // Card: spinner + static "Pending" text
    return (
      <View style={[styles.pendingContainer, { gap: Math.max(8, ringSize * 0.4) }]}>
        <Animated.View style={[
          styles.pendingRing,
          spinStyle,
          { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
        ]} />
        <Text style={[styles.pendingLabel, { fontSize: textFontSize }]}>Pending</Text>
      </View>
    );
  }

  // Expanded: spinner + animated dots beside it, then teal "Pending" below
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.pendingContainer, { gap: Math.max(8, ringSize * 0.4) }]}>
        <Animated.View style={[
          styles.pendingRing,
          spinStyle,
          { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
        ]} />
        <Text style={[{ fontFamily: Fonts.mono, fontSize: textFontSize, color: Colors.textMuted, letterSpacing: 4 }]}>
          {dots}
        </Text>
      </View>
      <Text style={[{ fontFamily: Fonts.monoBold, fontSize: 22, color: Colors.teal, letterSpacing: -0.3 }]}>
        Pending
      </Text>
    </View>
  );
};

// ── GOLF ──────────────────────────────────────────────────────────────────────
export const GolfGraphic: React.FC<{
  score: string;
  par: string;
  flagSize?: number;
}> = ({ score, par, flagSize = 28 }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const scoreFontSize = Math.max(14, flagSize * 0.55);

  return (
    <Animated.View style={[styles.golfContainer, animStyle]}>
      <View style={{ width: flagSize + 8, height: flagSize + 8, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: flagSize, lineHeight: flagSize + 4 }}>⛳</Text>
      </View>
      <View style={styles.golfText}>
        <Text style={[styles.golfScore, { fontSize: scoreFontSize, lineHeight: scoreFontSize + 4 }]}>
          {score}
        </Text>
        <Text style={styles.golfPar}>{par}</Text>
      </View>
    </Animated.View>
  );
};

// ── INFINITY ──────────────────────────────────────────────────────────────────
export const InfinityGraphic: React.FC<{
  symbol: string;
  fontSize?: number;
}> = ({ symbol, fontSize = 42 }) => {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) });
    opacity.value = withTiming(1, { duration: 400 });
    pulseOpacity.value = withDelay(700, withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ), -1
    ));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return (
    <Animated.View style={[styles.infinityContainer, containerStyle]}>
      <Animated.Text style={[{
        fontFamily: Fonts.monoBold,
        fontSize,
        color: Colors.red,
        lineHeight: fontSize + 4,
        letterSpacing: -1,
      }, pulseStyle]}>∞</Animated.Text>
      <Text style={styles.infinitySubtext}>{symbol}0 decisions</Text>
    </Animated.View>
  );
};

// ── CURRENCY ──────────────────────────────────────────────────────────────────
export const CurrencyGraphic: React.FC<{
  value: string;
  sublabel?: string;
  fontSize?: number;
}> = ({ value, sublabel, fontSize = 26 }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Text style={[styles.currencyValue, { fontSize, lineHeight: fontSize + 4 }]}>{value}</Text>
      {sublabel && <Text style={styles.currencySubLabel}>{sublabel}</Text>}
    </Animated.View>
  );
};

// ── DOT GRID (AUR — always 34 of 100) ───────────────────────────────────────
export const DotGridGraphic: React.FC<{
  filledCount?: number;
  totalDots?: number;
  dotSize?: number;
  cols?: number;
  showLabel?: boolean;
}> = ({ filledCount = 34, totalDots = 100, dotSize = 7, cols = 10, showLabel = false }) => {
  const [revealedCount, setRevealedCount] = React.useState(0);
  const labelOpacity = useSharedValue(0);
  const rows = Math.ceil(totalDots / cols);

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setRevealedCount(count);
      if (count >= filledCount) {
        clearInterval(interval);
        // Label fades in after dots complete
        labelOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));
  const gap = Math.max(3, dotSize * 0.5);
  const labelFontSize = dotSize * 4.5;
  const gridHeight = rows * dotSize + (rows - 1) * gap;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View style={{ gap }}>
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap }}>
            {Array.from({ length: cols }, (_, col) => {
              const index = row * cols + col;
              if (index >= totalDots) return null;
              const isFilled = index < filledCount;
              const isRevealed = index < revealedCount;
              return (
                <View
                  key={col}
                  style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: isFilled && isRevealed
                      ? Colors.teal
                      : 'rgba(0, 170, 136, 0.12)',
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      {showLabel && (
        <Animated.View style={[{ justifyContent: 'center', height: gridHeight }, labelStyle]}>
          <Text style={{
            fontFamily: Fonts.monoBold,
            fontSize: labelFontSize,
            color: Colors.teal,
            letterSpacing: -1,
            lineHeight: labelFontSize + 4,
          }}>{filledCount}%</Text>
          <Text style={{
            fontFamily: Fonts.mono,
            fontSize: labelFontSize * 0.35,
            color: Colors.textMuted,
            letterSpacing: 0.5,
            marginTop: 4,
          }}>OF 100</Text>
        </Animated.View>
      )}
    </View>
  );
};

// ── VERTICAL BAR CHART (TLR — Talk vs Listen) ────────────────────────────────
export const VerticalBarGraphic: React.FC<{
  leftPercent: number;
  rightPercent: number;
  leftLabel?: string;
  rightLabel?: string;
  maxHeight?: number;
  barWidth?: number;
}> = ({ leftPercent, rightPercent, leftLabel, rightLabel, maxHeight = 80, barWidth = 72 }) => {
  const leftH = useSharedValue(0);
  const rightH = useSharedValue(0);
  const valOpacity = useSharedValue(0);

  useEffect(() => {
    leftH.value = withTiming(leftPercent, { duration: 700, easing: Easing.out(Easing.cubic) });
    rightH.value = withDelay(120, withTiming(rightPercent, { duration: 700, easing: Easing.out(Easing.cubic) }));
    // Value labels appear after bars animate
    valOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
  }, []);

  const leftBarStyle = useAnimatedStyle(() => ({
    height: (leftH.value / 100) * maxHeight,
  }));
  const rightBarStyle = useAnimatedStyle(() => ({
    height: (rightH.value / 100) * maxHeight,
  }));
  const valStyle = useAnimatedStyle(() => ({ opacity: valOpacity.value }));

  const labelFontSize = Math.max(8, barWidth * 0.12);
  const valueFontSize = Math.max(11, barWidth * 0.18);

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: maxHeight + valueFontSize + 6 }}>
        {/* Left bar + value */}
        <View style={{ alignItems: 'center', width: barWidth }}>
          <Animated.Text style={[{
            fontFamily: Fonts.monoBold,
            fontSize: valueFontSize,
            color: Colors.red,
            marginBottom: 4,
          }, valStyle]}>{leftPercent}%</Animated.Text>
          <Animated.View style={[{
            width: barWidth,
            backgroundColor: Colors.red,
          }, leftBarStyle]} />
        </View>
        {/* Right bar + value */}
        <View style={{ alignItems: 'center', width: barWidth }}>
          <Animated.Text style={[{
            fontFamily: Fonts.monoBold,
            fontSize: valueFontSize,
            color: Colors.teal,
            marginBottom: 4,
          }, valStyle]}>{rightPercent}%</Animated.Text>
          <Animated.View style={[{
            width: barWidth,
            backgroundColor: Colors.teal,
          }, rightBarStyle]} />
        </View>
      </View>
      {/* Labels */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text style={{ fontFamily: Fonts.monoBold, fontSize: labelFontSize, color: Colors.red, width: barWidth, textAlign: 'center', letterSpacing: 0.5 }}>
          {leftLabel}
        </Text>
        <Text style={{ fontFamily: Fonts.monoBold, fontSize: labelFontSize, color: Colors.teal, width: barWidth, textAlign: 'center', letterSpacing: 0.5 }}>
          {rightLabel}
        </Text>
      </View>
    </View>
  );
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  barContainer: { gap: 6, width: '100%' },
  barTrack: { backgroundColor: Colors.tealFaint, overflow: 'hidden', width: '100%' },
  barFill: { backgroundColor: Colors.teal },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1 },

  loadingContainer: { gap: 10, width: '100%' },
  loadingTrack: { backgroundColor: Colors.tealFaint, overflow: 'hidden', width: '100%' },
  loadingShimmer: { position: 'absolute', top: 0, left: 0, width: '40%', backgroundColor: Colors.teal, opacity: 0.7 },
  loadingLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textMuted, fontStyle: 'italic', letterSpacing: 0.5 },

  pendingContainer: { flexDirection: 'row', alignItems: 'center' },
  pendingRing: { borderWidth: 2, borderColor: Colors.tealDim, borderTopColor: Colors.teal },
  pendingLabel: { fontFamily: Fonts.mono, color: Colors.textMuted },

  golfContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  golfText: { gap: 3, flex: 1, flexShrink: 1 },
  golfScore: { fontFamily: Fonts.monoBold, color: Colors.textPrimary, flexShrink: 1, flexWrap: 'wrap' },
  golfPar: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textMuted },

  infinityContainer: { alignItems: 'flex-start', gap: 4 },
  infinitySubtext: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textMuted },

  currencyValue: { fontFamily: Fonts.monoBold, color: Colors.teal, letterSpacing: -0.5 },
  currencySubLabel: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textMuted, marginTop: 3 },
});
