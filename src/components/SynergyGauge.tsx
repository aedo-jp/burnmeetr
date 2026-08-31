import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts } from '../constants/theme';

type Props = {
  size?: number;
  expanded?: boolean;
};

// Semicircle gauge — needle flutters pathetically around 0%
// The gauge looks authoritative. The needle knows the truth.

export const SynergyGauge: React.FC<Props> = ({ size = 120, expanded = false }) => {
  const cx = size / 2;
  const cy = size * 0.62;
  const r = size * 0.42;
  const strokeW = expanded ? 6 : 3.5;
  const needleLen = r * 0.82;

  // Needle angle: -180deg = 0%, 0deg = 100%
  // Flutter between -180 and about -168 (never reaches anything meaningful)
  const needleAngle = useSharedValue(-180);
  const gaugeOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    gaugeOpacity.value = withTiming(1, { duration: 400 });

    // Initial sweep: tries to get somewhere, fails
    // Then settles into pathetic flutter around 0%
    needleAngle.value = withDelay(300,
      withSequence(
        // Hopeful initial sweep up to ~8%
        withTiming(-165, { duration: 800, easing: Easing.out(Easing.cubic) }),
        // Falls back toward 0
        withTiming(-178, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        // Tries again, less convincingly
        withTiming(-171, { duration: 500, easing: Easing.out(Easing.quad) }),
        // Gives up mostly
        withTiming(-179, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        // Settle into perpetual flutter
        withRepeat(
          withSequence(
            withTiming(-176, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(-180, { duration: 900, easing: Easing.inOut(Easing.ease) }),
            withTiming(-177, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(-179, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true
        )
      )
    );
  }, []);

  const needleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: cx,
    top: cy,
    width: needleLen,
    height: expanded ? 2.5 : 1.5,
    backgroundColor: Colors.red,
    transformOrigin: '0 50%',
    transform: [{ rotate: `${needleAngle.value}deg` }],
    marginTop: expanded ? -1.25 : -0.75,
    borderRadius: 1,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: gaugeOpacity.value,
  }));

  // SVG arc path for semicircle
  // Start: left (0%), End: right (100%)
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  const arcPath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  // Tick positions at 0%, 25%, 50%, 75%, 100%
  const ticks = [0, 50, 100].map(pct => {
    const angle = -180 + (pct / 100) * 180;
    const rad = (angle * Math.PI) / 180;
    const innerR = r * 0.88;
    const outerR = r * 1.0;
    return {
      x1: cx + innerR * Math.cos(rad),
      y1: cy + innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy + outerR * Math.sin(rad),
      labelX: cx + (r * 1.16) * Math.cos(rad),
      labelY: cy + (r * 1.16) * Math.sin(rad),
      pct,
    };
  });

  const labelFontSize = expanded ? 9 : 7;
  const centerLabelSize = expanded ? 22 : 14;

  return (
    <Animated.View style={[{ width: size, height: cy + 20 }, containerStyle]}>
      <Svg width={size} height={cy + 20}>
        {/* Track arc */}
        <Path
          d={arcPath}
          fill="none"
          stroke={Colors.tealDim}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {ticks.map(t => (
          <React.Fragment key={t.pct}>
            <Line
              x1={t.x1} y1={t.y1}
              x2={t.x2} y2={t.y2}
              stroke={Colors.textMuted}
              strokeWidth={expanded ? 1.5 : 1}
              opacity={0.4}
            />
            {/* Only show 0% label — makes the point */}
            {t.pct === 0 && (
              <SvgText
                x={t.labelX + (expanded ? -2 : -1)}
                y={t.labelY + 4}
                fontSize={labelFontSize}
                fill={Colors.textMuted}
                textAnchor="end"
                fontFamily={Fonts.mono}
              >
                0%
              </SvgText>
            )}
          </React.Fragment>
        ))}

        {/* Centre pivot */}
        <Circle
          cx={cx} cy={cy}
          r={expanded ? 4 : 3}
          fill={Colors.red}
        />
      </Svg>

      {/* Animated needle — positioned absolutely over SVG */}
      <Animated.View style={needleStyle} />

      {/* Centre value label */}
      <Text style={[styles.centreLabel, { fontSize: centerLabelSize, top: cy - (expanded ? 32 : 22) }]}>
        0.00%
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  centreLabel: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
