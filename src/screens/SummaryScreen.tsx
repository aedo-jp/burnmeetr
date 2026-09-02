import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, useWindowDimensions, Animated, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, TypeScale } from '../constants/theme';
import { OdometerConfig } from '../constants/theme';
import { AttendeeGroup } from '../hooks/useMeeting';
import { MeetingRecord, MeetingAnalytics, buildMeetingRecord, saveMeeting } from '../storage/meetingStorage';
import { getUnlockedMetrics, selectMetricsForSession } from '../constants/metrics';
import { generateVerdict, getStarRating } from '../constants/verdicts';
import { MeetAXGraph } from '../components/MeetAXGraph';
import { MetricCard } from '../components/MetricCard';

const fmt2 = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtTime = (s: number) => {
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
};

type Props = {
  currency: string;
  attendees: AttendeeGroup[];
  cost: number;
  elapsed: number;
  allocatedMinutes: number;
  isOverrun: boolean;
  overrunSeconds: number;
  fxRates: Record<string, number>;
  history: MeetingRecord[];
  analytics: MeetingAnalytics;
  daysSinceFirstLaunch: number;
  onNewMeeting: () => void;
  onDeleteSession: (id: string) => void;
};

export const SummaryScreen: React.FC<Props> = ({
  currency, attendees, cost, elapsed,
  allocatedMinutes, isOverrun, overrunSeconds,
  fxRates, history, analytics, daysSinceFirstLaunch,
  onNewMeeting, onDeleteSession,
}) => {
  const { width } = useWindowDimensions();
  const config = OdometerConfig[currency] ?? OdometerConfig['USD'];
  const sym = config.symbol;
  const fx = fxRates[currency] ?? 1;

  // Build current meeting record for metric computation
  const currentRecord: MeetingRecord = useMemo(() => buildMeetingRecord({
    currency,
    cost,
    fxRate: fx,
    elapsed,
    allocatedMinutes,
    overrunSeconds,
    attendees: attendees
      .filter(a => a.count > 0)
      .map(a => ({
        roleId: a.id,
        label: a.role.label,
        count: a.count,
        ratePerHour: a.role.ratePerHour,
      })),
  }), [currency, cost, elapsed, allocatedMinutes, overrunSeconds, attendees]);

  // Select two metrics for this session
  const unlocked = useMemo(
    () => getUnlockedMetrics(daysSinceFirstLaunch),
    [daysSinceFirstLaunch]
  );
  const metricPair = useMemo(
    () => selectMetricsForSession(unlocked, analytics.currentMeetingIndex),
    [unlocked, analytics.currentMeetingIndex]
  );
  const [metricA, metricB] = metricPair;

  // Generate verdict
  const verdict = useMemo(
    () => generateVerdict(currentRecord, analytics),
    [currentRecord, analytics]
  );
  const starRating = useMemo(
    () => getStarRating(analytics),
    [analytics]
  );

  // Key stats for the data strip
  const totalPeople = attendees.reduce((s, a) => s + a.count, 0);
  const costPerPerson = totalPeople > 0 ? cost / totalPeople : 0;
  const perMinute = elapsed > 0 ? cost / (elapsed / 60) : 0;

  const graphWidth = width - Spacing.md * 2;

  const handleSendInvoice = async () => {
    const fmt2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
    };

    const activeAttendees = attendees.filter(a => a.count > 0);
    const attendeeLines = activeAttendees
      .map(a => {
        const groupCost = cost * (a.role.ratePerHour * a.count / attendees.reduce((s, b) => s + b.role.ratePerHour * b.count, 0) || 0);
        return `${a.count}× ${a.role.label.padEnd(20)} ${sym}${fmt2(groupCost)}`;
      })
      .join('\n');

    const metricA = metricPair[0];
    const metricB = metricPair[1];
    const valA = metricA.compute(currentRecord, history, analytics, sym);
    const valB = metricB.compute(currentRecord, history, analytics, sym);

    const message = [
      'BURNMEETR',
      `Meeting Invoice #${analytics.currentMeetingIndex}`,
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      `Date:       ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      `Duration:   ${fmtTime(elapsed)}`,
      `Attendees:  ${totalPeople}`,
      `Status:     ${isOverrun ? `+${fmtTime(overrunSeconds)} overrun` : 'On time'}`,
      '',
      'ATTENDEES',
      attendeeLines,
      '',
      '━━━━━━━━━━━━━━━━━━━━━',
      `TOTAL       ${sym}${fmt2(cost)}`,
      `Per person  ${sym}${fmt2(totalPeople > 0 ? cost / totalPeople : 0)}`,
      '',
      `${metricA.acronym}: ${valA.primary}`,
      `${metricB.acronym}: ${valB.primary}`,
      '',
      'Executive Summary:',
      verdict.text,
      '',
      'Every second costs.',
      '',
      'burnmeetr.com',
    ].join('\n');

    await Share.share({ message });
  };

  // Staggered entrance animations
  const graphAnim = useRef(new Animated.Value(0)).current;
  const dataStripAnim = useRef(new Animated.Value(0)).current;
  const metricsAnim = useRef(new Animated.Value(0)).current;
  const verdictAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(180, [
      Animated.timing(graphAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(dataStripAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(metricsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(verdictAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const makeEntrance = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>BURNMEETR</Text>
        </View>
        <TouchableOpacity onPress={onNewMeeting} style={styles.newMeetingBtn}>
          <Text style={styles.newMeetingText}>NEW MEETING ↑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topRule} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Zone 1: MEET:AX Graph ───────────────────────────────────────── */}
        <Animated.View style={[styles.zone, makeEntrance(graphAnim)]}>
          <MeetAXGraph
            history={history}
            currentCost={cost}
            currentCurrency={currency}
            symbol={sym}
            fxRate={fx}
            width={graphWidth}
            onDeleteSession={onDeleteSession}
          />
        </Animated.View>

        <View style={styles.zoneRule} />

        {/* ── Data strip ──────────────────────────────────────────────────── */}
        <Animated.View style={[styles.dataStrip, makeEntrance(dataStripAnim)]}>
          <View style={styles.dataItem}>
            <Text style={styles.dataValue}>{sym}{fmt2(cost)}</Text>
            <Text style={styles.dataLabel}>THIS SESSION</Text>
          </View>
          <View style={styles.dataDivider} />
          <View style={styles.dataItem}>
            <Text style={styles.dataValue}>{fmtTime(elapsed)}</Text>
            <Text style={styles.dataLabel}>DURATION</Text>
          </View>
          <View style={styles.dataDivider} />
          <View style={styles.dataItem}>
            <Text style={styles.dataValue}>{sym}{fmt2(costPerPerson)}</Text>
            <Text style={styles.dataLabel}>PER PERSON</Text>
          </View>
          <View style={styles.dataDivider} />
          <View style={styles.dataItem}>
            <Text style={[styles.dataValue, isOverrun && styles.overrunValue]}>
              {isOverrun ? `+${fmtTime(overrunSeconds)}` : 'ON TIME'}
            </Text>
            <Text style={styles.dataLabel}>STATUS</Text>
          </View>
        </Animated.View>

        <View style={styles.zoneRule} />

        {/* ── Zone 2: Metric cards ────────────────────────────────────────── */}
        <Animated.View style={[styles.metricZone, makeEntrance(metricsAnim)]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricHeaderLabel}>PERFORMANCE METRICS</Text>
          </View>
          <View style={styles.metricRow}>
            <MetricCard
              metric={metricA}
              current={currentRecord}
              history={history}
              analytics={analytics}
              symbol={sym}
              style={styles.metricCard}
            />
            <View style={styles.metricDivider} />
            <MetricCard
              metric={metricB}
              current={currentRecord}
              history={history}
              analytics={analytics}
              symbol={sym}
              style={styles.metricCard}
            />
          </View>
        </Animated.View>

        <View style={styles.zoneRule} />

        {/* ── Zone 3: Verdict ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.verdictZone, makeEntrance(verdictAnim)]}>
          <Text style={styles.verdictLabel}>EXECUTIVE SUMMARY</Text>
          <Text style={styles.verdictText}>{verdict.text}</Text>
          {starRating && (
            <Text style={styles.starRating}>{starRating}</Text>
          )}
        </Animated.View>

        <View style={styles.zoneRule} />

        {/* ── Session totals ───────────────────────────────────────────────── */}
        <View style={styles.totalsStrip}>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{analytics.totalMeetings}</Text>
            <Text style={styles.totalLabel}>TOTAL SESSIONS</Text>
          </View>
          <View style={styles.dataDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>
              {sym}{fmt2(analytics.totalCost * fx)}
            </Text>
            <Text style={styles.totalLabel}>TOTAL EXPENDITURE</Text>
          </View>
          <View style={styles.dataDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>
              {sym}{fmt2(analytics.averageCost * fx)}
            </Text>
            <Text style={styles.totalLabel}>AVERAGE COST</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.invoiceBtn} onPress={handleSendInvoice}>
            <Text style={styles.invoiceBtnText}>SEND INVOICE</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topRule: {
    height: 0.5,
    backgroundColor: Colors.rule,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
  },
  logoText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 2.5,
    color: Colors.textMuted,
  },
  newMeetingBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  newMeetingText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },

  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xxl },

  zone: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  zoneRule: {
    height: 0.5,
    backgroundColor: Colors.rule,
    marginHorizontal: 0,
  },

  // Data strip
  dataStrip: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
  },
  dataItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dataDivider: {
    width: 0.5,
    backgroundColor: Colors.rule,
  },
  dataValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  dataLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  overrunValue: {
    color: Colors.red,
  },

  // Metric zone
  metricZone: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 6,
  },
  metricHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  metricHeaderLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  metricHeaderSub: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textDead,
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: Colors.rule,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
  },
  metricDivider: {
    width: 0.5,
    backgroundColor: Colors.rule,
  },

  // Verdict zone
  verdictZone: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  verdictLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  verdictText: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.verdict,
    color: Colors.textSecondary,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  starRating: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Totals strip
  totalsStrip: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.rule,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  totalValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.teal,
    letterSpacing: -0.3,
  },
  totalLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  // Actions
  actions: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
  },
  actionBtn: {
    borderWidth: 0.5,
    borderColor: Colors.rule,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  invoiceBtn: {
    borderWidth: 0.5,
    borderColor: Colors.teal,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  invoiceBtnText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    color: Colors.teal,
    letterSpacing: 2,
  },
});
