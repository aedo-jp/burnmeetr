import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../constants/theme';
import { MetricDef, MetricValue } from '../constants/metrics';
import { MeetingRecord, MeetingAnalytics } from '../storage/meetingStorage';
import {
  DonutGraphic, BarGraphic, LoadingBarGraphic,
  PendingGraphic, GolfGraphic, InfinityGraphic, CurrencyGraphic,
  DotGridGraphic, VerticalBarGraphic,
} from './MetricGraphics';
import { FormulaGraphic, FormulaLine, FormulaVariable } from './FormulaGraphic';
import { SynergyGauge } from './SynergyGauge';

type Props = {
  metric: MetricDef;
  current: MeetingRecord;
  history: MeetingRecord[];
  analytics: MeetingAnalytics;
  symbol: string;
  style?: object;
};

// Graphic already shows primary value — don't render modalValue again
const GRAPHIC_SHOWS_VALUE: string[] = [
  'currency', 'percentage', 'always_fixed', 'text',
  'visual_golf', 'infinity', 'visual_donut', 'formula', 'pending',
];

function renderGraphic(value: MetricValue, symbol: string, size: 'card' | 'expanded', expandedWidth: number) {
  const isExpanded = size === 'expanded';
  const donutSize = isExpanded ? Math.min(expandedWidth * 0.75, 240) : 88;
  const barHeight = isExpanded ? 32 : 20;
  const flagSize = isExpanded ? 64 : 36;
  const infFontSize = isExpanded ? 180 : 80;
  const currFontSize = isExpanded ? 40 : 28;
  const ringSize = isExpanded ? 48 : 28;

  switch (value.displayType) {
    case 'visual_donut':
      return <DonutGraphic size={donutSize} />;

    case 'visual_bar':
      return (
        <VerticalBarGraphic
          leftPercent={value.splitLeft ?? 70}
          rightPercent={100 - (value.splitLeft ?? 70)}
          leftLabel={value.splitLeftLabel}
          rightLabel={value.splitRightLabel}
          maxHeight={isExpanded ? 140 : 80}
          barWidth={isExpanded ? 90 : 60}
        />
      );

    case 'always_fixed':
      // AUR — dot grid (34 filled). SR uses 'gauge' type now.
      return (
        <DotGridGraphic
          filledCount={value.fillPercent ?? 34}
          totalDots={100}
          dotSize={isExpanded ? 11 : 7}
          cols={10}
          showLabel={isExpanded}
        />
      );

    case 'gauge':
      return <SynergyGauge size={isExpanded ? 200 : 110} expanded={isExpanded} />;

    case 'visual_golf':
      return (
        <GolfGraphic
          score={value.primary}
          par={value.secondary ?? ''}
          flagSize={flagSize}
        />
      );

    case 'loading':
      return <LoadingBarGraphic barHeight={barHeight} />;

    case 'pending':
      return <PendingGraphic ringSize={ringSize} compact={!isExpanded} />;

    case 'infinity':
      return <InfinityGraphic symbol={symbol} fontSize={infFontSize} />;

    case 'formula':
      return (
        <FormulaGraphic
          result={value.primary}
          resultLabel={(value as any).formulaResultLabel ?? '='}
          formula={(value as any).formulaLine as FormulaLine}
          variables={((value as any).formulaVariables ?? []) as FormulaVariable[]}
          compact={!isExpanded}
        />
      );

    case 'currency':
      return (
        <CurrencyGraphic
          value={value.primary}
          sublabel={value.secondary}
          fontSize={currFontSize}
        />
      );

    case 'text':
    default:
      return (
        <CurrencyGraphic
          value={value.primary}
          sublabel={value.secondary}
          fontSize={currFontSize}
        />
      );
  }
}

export const MetricCard: React.FC<Props> = ({
  metric, current, history, analytics, symbol, style,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const modalContentWidth = width - Spacing.xl * 2 - Spacing.xl * 2; // modal padding
  const value = metric.compute(current, history, analytics, symbol);

  return (
    <>
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={() => setExpanded(true)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.acronym}>{metric.acronym}</Text>
          <Text style={styles.tapHint}>↗</Text>
        </View>

        <View style={styles.graphicArea}>
          {renderGraphic(value, symbol, 'card', 0)}
        </View>

        {value.footnote && (
          <Text style={styles.footnote} numberOfLines={2}>{value.footnote}</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={expanded}
        animationType="fade"
        transparent
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setExpanded(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setExpanded(false)}
        >
          <View style={styles.modalCard}>
            <TouchableOpacity onPress={() => setExpanded(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalAcronym}>{metric.acronym}</Text>
            <Text style={styles.modalName}>{metric.name}</Text>

            {/* Large graphic — sized to fill modal width */}
            <View style={styles.modalGraphicArea}>
              {renderGraphic(value, symbol, 'expanded', modalContentWidth)}
            </View>

            {/* Only show separate value text for types where graphic doesn't show it */}
            {!GRAPHIC_SHOWS_VALUE.includes(value.displayType) && value.primary && (
              <Text style={styles.modalValue}>{value.primary}</Text>
            )}
            {/* TLR coloured ratio */}
            {value.displayType === 'visual_bar' && value.primary && value.secondary && (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                <Text style={[styles.modalValue, { color: '#FF3322' }]}>{value.primary}</Text>
                <Text style={[styles.modalValue, { color: Colors.textMuted, fontSize: 20 }]}>:</Text>
                <Text style={[styles.modalValue, { color: Colors.teal }]}>{value.secondary}</Text>
              </View>
            )}

            {value.formula && (
              <View style={styles.formulaBlock}>
                <Text style={styles.formulaLabel}>METHODOLOGY</Text>
                <Text style={styles.formulaText}>{value.formula}</Text>
              </View>
            )}

            {value.footnote && (
              <Text style={styles.modalFootnote}>{value.footnote}</Text>
            )}

            <Text style={styles.modalDisclaimer}>
              Data sourced from session records. Methodology proprietary.{'\n'}
              Results may not reflect operational reality.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    padding: Spacing.md,
    gap: Spacing.sm,
    minHeight: 160,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  acronym: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  tapHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
  },
  graphicArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 80,
  },
  footnote: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
    lineHeight: 14,
    fontStyle: 'italic',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: Spacing.xs,
    marginBottom: -Spacing.sm,
  },
  closeBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textMuted,
  },
  modalAcronym: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  modalName: {
    fontFamily: Fonts.monoBold,
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 24,
    letterSpacing: -0.3,
    flexWrap: 'wrap',
  },
  modalGraphicArea: {
    paddingVertical: Spacing.lg,
    alignItems: 'flex-start',
    width: '100%',
  },
  modalValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 32,
    color: Colors.teal,
    letterSpacing: -0.5,
  },
  formulaBlock: {
    gap: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.rule,
    paddingTop: Spacing.sm,
  },
  formulaLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  formulaText: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalFootnote: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  modalDisclaimer: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textDead,
    letterSpacing: 0.3,
    lineHeight: 13,
    borderTopWidth: 0.5,
    borderTopColor: Colors.rule,
    paddingTop: Spacing.sm,
  },
});
