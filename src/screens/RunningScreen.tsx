import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Fonts, TypeScale } from '../constants/theme';
import { OdometerConfig } from '../constants/theme';
import { Odometer } from '../components/Odometer';
import { InfoBar } from '../components/InfoBar';
import { PanicButton } from '../components/PanicButton';
import { OdometerLens } from '../components/OdometerLens';
import { AttendeeGroup } from '../hooks/useMeeting';
import { StatContext } from '../constants/stats';

const fmt2 = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtTime = (s: number) => {
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

type Props = {
  currency: string;
  attendees: AttendeeGroup[];
  cost: number;
  elapsed: number;
  allocatedMinutes: number;
  isOverrun: boolean;
  overrunSeconds: number;
  perMinute: number;
  totalPeople: number;
  isIdle: boolean;
  onStart: () => void;
  onEnd: () => void;
  onBackToSetup: () => void;
};

export const RunningScreen: React.FC<Props> = ({
  currency, attendees, cost, elapsed,
  allocatedMinutes, isOverrun, overrunSeconds,
  perMinute, totalPeople, isIdle, onStart, onEnd, onBackToSetup,
}) => {
  const { width, height } = useWindowDimensions();
  // Keep screen awake during active meeting
  useKeepAwake(isIdle ? undefined : 'meeting-running');
  const isLandscape = width > height;
  const [backdropSize, setBackdropSize] = React.useState({ width: 0, height: 0 });
  const config = OdometerConfig[currency] ?? OdometerConfig['USD'];
  const displayCost = isIdle ? 0 : cost;
  const displayElapsed = isIdle ? 0 : elapsed;
  const sym = config.symbol;

  // Live dot pulse
  const dotOpacity = useSharedValue(1);
  React.useEffect(() => {
    dotOpacity.value = withRepeat(
      withTiming(0.15, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  // Overrun label pulse — slower, more ominous
  const overrunOpacity = useSharedValue(1);
  React.useEffect(() => {
    if (isOverrun) {
      overrunOpacity.value = withRepeat(
        withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      overrunOpacity.value = 1;
    }
  }, [isOverrun]);
  const overrunStyle = useAnimatedStyle(() => ({ opacity: overrunOpacity.value }));

  // Group cost breakdown
  const totalRate = useMemo(() =>
    attendees.reduce((s, a) => s + a.role.ratePerHour * a.count, 0),
    [attendees]
  );

  const statContext: StatContext = {
    cost,
    elapsed,
    allocated: allocatedMinutes,
    totalPeople,
    costPerPerson: totalPeople > 0 ? cost / totalPeople : 0,
    perMinute,
    currency,
    symbol: sym,
    isOverrun,
    overrunSeconds,
    isIdle,
  };

  const allocatedSeconds = allocatedMinutes * 60;
  const progress = Math.min(1, elapsed / allocatedSeconds);

  return (
    <SafeAreaView
      style={[styles.safe, isOverrun && styles.safeOverrun]}
      edges={['top', 'bottom']}
    >
      {/* Status bar */}
      <View style={[styles.statusBar, isLandscape && styles.statusBarLandscape]}>
        <View style={styles.liveRow}>
          <Animated.View style={[
            styles.liveDot,
            dotStyle,
            isOverrun && styles.liveDotOverrun,
          ]} />
          {isOverrun ? (
            <Animated.Text style={[styles.liveText, styles.liveTextOverrun, overrunStyle]}>
              OVERRUN
            </Animated.Text>
          ) : (
            <Text style={[styles.liveText, isIdle && styles.liveTextReady]}>
              {isIdle ? 'READY' : 'LIVE'}
            </Text>
          )}
        </View>
        <Text style={styles.timeText}>{fmtTime(displayElapsed)}</Text>
        <Text style={[styles.allocText, isOverrun && styles.allocTextOverrun]}>
          {isOverrun
            ? `+${fmtTime(overrunSeconds)}`
            : `/ ${allocatedMinutes}m`
          }
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[
          styles.progressFill,
          { width: `${progress * 100}%` },
          isOverrun && styles.progressFillOverrun,
        ]} />
      </View>

      {/* Odometer — centred hero */}
      <View style={styles.meterSection}>
        <Text style={[styles.meterLabel, isOverrun && styles.meterLabelOverrun]}>
          TOTAL COST
        </Text>
        <View
          style={[styles.odometerBackdrop, isOverrun && styles.odometerBackdropOverrun]}
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout;
            setBackdropSize({ width: w, height: h });
          }}
        >
          <Odometer
            value={displayCost}
            currency={currency}
            digitHeight={isLandscape ? 88 : 68}
            fontSize={isLandscape ? 72 : 56}
            isOverrun={isOverrun}
          />
          {/* Glass lens overlay — sized to actual backdrop */}
          {backdropSize.width > 0 && (
            <OdometerLens
              width={backdropSize.width}
              height={backdropSize.height}
              isOverrun={isOverrun}
            />
          )}
        </View>
        <Text style={[styles.rateSubtext, isOverrun && styles.rateSubtextOverrun]}>
          {isIdle ? `${sym}0.0000/sec` : `${sym}${(cost / (elapsed || 1)).toFixed(4)}/sec`}
        </Text>
      </View>

      {/* Group cost strip — always shown so layout is stable pre/post start */}
      {!isLandscape && <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.groupStrip}
        contentContainerStyle={styles.groupStripContent}
      >
        {attendees
          .filter(a => a.count > 0)
          .map(a => {
            const share = totalRate > 0 ? (a.role.ratePerHour * a.count) / totalRate : 0;
            const groupCost = isIdle ? 0 : cost * share;
            const perPerson = a.count > 0 ? groupCost / a.count : 0;
            return (
              <View key={a.id} style={styles.groupCard}>
                <Text style={styles.groupTitle} numberOfLines={1}>
                  {a.count}× {a.role.label.split(' /')[0]}
                </Text>
                <Text style={[styles.groupCost, isOverrun && styles.groupCostOverrun]}>
                  {sym}{fmt2(groupCost)}
                </Text>
                <Text style={styles.groupPer}>
                  {sym}{fmt2(perPerson)} ea
                </Text>
              </View>
            );
          })}
      </ScrollView>}

      {/* Back to setup — space always reserved, only visible when idle */}
      <TouchableOpacity
        onPress={isIdle ? onBackToSetup : undefined}
        style={[styles.backLink, !isIdle && styles.backLinkHidden]}
      >
        <Text style={styles.backLinkText}>← EDIT SETUP</Text>
      </TouchableOpacity>

      {/* Panic button */}
      <View style={styles.endWrapper}>
        <PanicButton mode={isIdle ? "start" : "end"} onPress={isIdle ? onStart : onEnd} />
      </View>

      {/* Info bar — pinned to bottom, hidden in landscape */}
      {!isLandscape && <InfoBar context={statContext} isOverrun={isOverrun} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeOverrun: {
    backgroundColor: '#0E0000',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
  },
  liveDotOverrun: {
    backgroundColor: Colors.redBright,
  },
  liveText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  liveTextOverrun: {
    color: Colors.redBright,
  },
  liveTextReady: {
    color: Colors.textMuted,
  },
  timeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  allocText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
  },
  allocTextOverrun: {
    color: Colors.red,
  },
  progressTrack: {
    height: 1,
    backgroundColor: Colors.surfaceRaised,
  },
  progressFill: {
    height: 1,
    backgroundColor: Colors.teal,
  },
  progressFillOverrun: {
    backgroundColor: Colors.red,
    width: '100%',
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  meterSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statusBarLandscape: {
    paddingVertical: Spacing.xs,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  backLinkText: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  backLinkHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  meterLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 2.5,
    color: Colors.textMuted,
  },
  meterLabelOverrun: {
    color: Colors.red,
  },
  odometerBackdrop: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
    // Shadow to lift it off the pure black
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  },
  odometerBackdropOverrun: {
    backgroundColor: '#0A0000',
    shadowColor: Colors.red,
    shadowOpacity: 0.15,
  },
  rateSubtext: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  rateSubtextOverrun: {
    color: Colors.red,
  },
  groupStrip: {
    flexGrow: 0,
    borderTopWidth: 0.5,
    borderTopColor: Colors.rule,
  },
  groupStripContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 120,
    gap: 3,
  },
  groupTitle: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
  },
  groupCost: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.teal,
  },
  groupCostOverrun: {
    color: Colors.redBright,
  },
  groupPer: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
  },
  endWrapper: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
