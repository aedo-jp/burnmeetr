import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText, Rect } from 'react-native-svg';
import { Colors, Fonts, Spacing, TypeScale } from '../constants/theme';
import { MeetingRecord } from '../storage/meetingStorage';

type Props = {
  history: MeetingRecord[];
  currentCost: number;
  currentCurrency: string;
  symbol: string;
  fxRate: number;
  width: number;
  height?: number;
};

type Period = 'ALL' | '1W' | '1M' | '3M';

const GRAPH_HEIGHT = 130;
const AXIS_LEFT = 36;
const AXIS_BOTTOM = 20;
const AXIS_RIGHT = 12;   // right padding so last dot has breathing room
const DOT_RADIUS = 3.5;
const DOT_RADIUS_CURRENT = 5;
const DOT_TAP_RADIUS = 14; // invisible tap target

function fmtAxisCost(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toString();
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDuration(elapsed: number): string {
  const m = Math.floor(elapsed / 60);
  const s = Math.floor(elapsed % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function filterByPeriod(records: MeetingRecord[], period: Period): MeetingRecord[] {
  if (period === 'ALL') return records;
  const now = new Date();
  if (period === '1W') {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return records.filter(r => new Date(r.date) >= cutoff);
  }
  const months = period === '1M' ? 1 : 3;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  return records.filter(r => new Date(r.date) >= cutoff);
}

export const MeetAXGraph: React.FC<Props> = ({
  history,
  currentCost,
  currentCurrency,
  symbol,
  fxRate,
  width,
  height = GRAPH_HEIGHT,
}) => {
  const [period, setPeriod] = useState<Period>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const plotWidth = width - AXIS_LEFT - AXIS_RIGHT;
  const plotHeight = height - AXIS_BOTTOM;

  // Filter history by period, always include current meeting
  const filteredHistory = useMemo(
    () => filterByPeriod(history, period),
    [history, period]
  );

  // All data points: filtered history + current
  const allRecords = useMemo(() => {
    const currentRecord: Partial<MeetingRecord> = {
      cost: currentCost,
      date: new Date().toISOString(),
      elapsed: 0,
    };
    return [...filteredHistory, currentRecord as MeetingRecord];
  }, [filteredHistory, currentCost]);

  const allCosts = allRecords.map(r => r.cost);
  const totalPoints = allCosts.length;

  const maxCost = Math.max(...allCosts, 1);
  const yMax = maxCost * 1.18;
  const yMin = 0;

  const points = useMemo(() => {
    return allCosts.map((cost, i) => {
      const x = AXIS_LEFT + (totalPoints === 1
        ? plotWidth / 2
        : (i / (totalPoints - 1)) * plotWidth);
      const y = plotHeight - ((cost - yMin) / (yMax - yMin)) * plotHeight;
      const sessionNum = history.length - filteredHistory.length + i + 1;
      return { x, y, cost, index: i, sessionNum };
    });
  }, [allCosts, totalPoints, plotWidth, plotHeight, yMin, yMax]);

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const yTicks = [0, Math.round(yMax / 2), Math.round(yMax)];

  // X axis labels
  const xLabels = totalPoints <= 3
    ? points.map(p => ({ x: p.x, label: `${p.sessionNum}` }))
    : [
        { x: points[0].x, label: `${points[0].sessionNum}` },
        { x: points[Math.floor(totalPoints / 2)].x, label: `${points[Math.floor(totalPoints / 2)].sessionNum}` },
        { x: points[totalPoints - 1].x, label: `${points[totalPoints - 1].sessionNum}` },
      ];

  const runningTotal = history.reduce((s, r) => s + r.cost * fxRate, 0) + currentCost;
  const tickerDir = currentCost > (history[history.length - 1]?.cost ?? 0) ? '▲' : '▼';
  const tickerPct = history.length > 0
    ? Math.abs(((currentCost - (history[history.length - 1]?.cost ?? currentCost)) / (history[history.length - 1]?.cost ?? 1)) * 100).toFixed(1)
    : '0.0';
  const tickerVal = (runningTotal / (history.length + 1) * 0.024).toFixed(1);

  // Selected point info
  const selected = selectedIndex !== null ? allRecords[selectedIndex] : null;
  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;

  const handleDotPress = (i: number) => {
    setSelectedIndex(prev => prev === i ? null : i);
  };

  const isCurrentMeeting = (i: number) => i === allRecords.length - 1;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.tickerLabel}>MEET:AX</Text>
        <Text style={[styles.tickerValue, tickerDir === '▲' ? styles.tickerUp : styles.tickerDown]}>
          {tickerVal} {tickerDir}{tickerPct}%
        </Text>
        <View style={styles.headerSpacer} />
        {/* Period pills */}
        <View style={styles.periodRow}>
          {(['ALL', '1W', '1M', '3M'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => { setPeriod(p); setSelectedIndex(null); }}
              style={[styles.periodPill, period === p && styles.periodPillActive]}
            >
              <Text style={[styles.periodPillText, period === p && styles.periodPillTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL EXPENDITURE</Text>
        <Text style={styles.totalValue}>
          {symbol}{runningTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      {/* Graph SVG */}
      <Pressable onPress={() => setSelectedIndex(null)}>
        <Svg width={width} height={height}>
          {/* Grid lines + Y labels */}
          {yTicks.map((tick, i) => {
            const y = plotHeight - ((tick - yMin) / (yMax - yMin)) * plotHeight;
            return (
              <React.Fragment key={`yt-${i}`}>
                <Line x1={AXIS_LEFT} y1={y} x2={width - AXIS_RIGHT} y2={y}
                  stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                <SvgText x={AXIS_LEFT - 4} y={y + 3} fontSize={7}
                  fill={Colors.textMuted} textAnchor="end" fontFamily={Fonts.mono}>
                  {fmtAxisCost(tick)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* X axis labels */}
          {xLabels.map((lbl, i) => (
            <SvgText key={`xl-${i}`} x={lbl.x} y={height - 4} fontSize={7}
              fill={Colors.textMuted} textAnchor="middle" fontFamily={Fonts.mono}>
              {lbl.label}
            </SvgText>
          ))}

          {/* Axis lines */}
          <Line x1={AXIS_LEFT} y1={0} x2={AXIS_LEFT} y2={plotHeight}
            stroke={Colors.rule} strokeWidth={0.5} />
          <Line x1={AXIS_LEFT} y1={plotHeight} x2={width - AXIS_RIGHT} y2={plotHeight}
            stroke={Colors.rule} strokeWidth={0.5} />

          {/* Selected dot vertical guide */}
          {selectedPoint && (
            <Line
              x1={selectedPoint.x} y1={0}
              x2={selectedPoint.x} y2={plotHeight}
              stroke={Colors.teal} strokeWidth={0.5}
              strokeOpacity={0.3}
              strokeDasharray="3,3"
            />
          )}

          {/* Connecting line */}
          {points.length > 1 && (
            <Polyline points={polylinePoints} fill="none"
              stroke={Colors.teal} strokeWidth={1} strokeOpacity={0.7} />
          )}

          {/* Dots */}
          {points.map((p, i) => {
            const isCurrent = isCurrentMeeting(i);
            const isSelected = selectedIndex === i;
            return (
              <React.Fragment key={`dot-${i}`}>
                {/* Invisible tap target */}
                <Circle
                  cx={p.x} cy={p.y} r={DOT_TAP_RADIUS}
                  fill="transparent"
                  onPress={(e) => { e.stopPropagation(); handleDotPress(i); }}
                />
                {/* Visible dot */}
                {isSelected && (
                  <Circle cx={p.x} cy={p.y} r={DOT_RADIUS + 4}
                    fill={Colors.teal} opacity={0.15} />
                )}
                <Circle
                  cx={p.x} cy={p.y}
                  r={isCurrent ? DOT_RADIUS_CURRENT : DOT_RADIUS}
                  fill={isCurrent || isSelected ? Colors.teal : Colors.bg}
                  stroke={Colors.teal}
                  strokeWidth={isSelected ? 1.5 : 1}
                  strokeOpacity={isSelected ? 1 : 0.7}
                  onPress={(e) => { e.stopPropagation(); handleDotPress(i); }}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </Pressable>

      {/* Axis labels */}
      <View style={styles.axisLabels}>
        <Text style={styles.axisLabel}>SESSION</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.axisLabel}>COST ({currentCurrency})</Text>
      </View>

      {/* Fixed info strip — shows selected dot data or prompt */}
      <View style={styles.infoStrip}>
        {selected && selectedPoint ? (
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>SESSION</Text>
              <Text style={styles.infoValue}>#{points[selectedIndex!].sessionNum}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>DATE</Text>
              <Text style={styles.infoValue}>{fmtDate(selected.date)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>COST</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {symbol}{selected.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>DURATION</Text>
              <Text style={styles.infoValue}>{fmtDuration(selected.elapsed)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.infoPrompt}>Tap a point to inspect session</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: 4,
    gap: 6,
  },
  tickerLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.graphTicker,
    color: Colors.teal,
    letterSpacing: 1.5,
  },
  tickerValue: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.graphLabel,
    letterSpacing: 0.5,
  },
  tickerUp: { color: Colors.teal },
  tickerDown: { color: Colors.red },
  headerSpacer: { flex: 1 },

  periodRow: {
    flexDirection: 'row',
    gap: 4,
  },
  periodPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: Colors.rule,
    borderRadius: 0,
  },
  periodPillActive: {
    backgroundColor: Colors.tealFaint,
    borderColor: Colors.teal,
  },
  periodPillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  periodPillTextActive: {
    color: Colors.teal,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.md,
    paddingBottom: 6,
    gap: 8,
  },
  totalLabel: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.graphLabel,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  totalValue: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.graphTicker,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },

  axisLabels: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: 2,
  },
  axisLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  // Info strip
  infoStrip: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.rule,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  infoDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: Colors.rule,
  },
  infoLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  infoValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.textPrimary,
  },
  infoValueAccent: {
    color: Colors.teal,
  },
  infoPrompt: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
