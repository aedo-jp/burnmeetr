import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing, TypeScale } from '../constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FormulaVariable = {
  symbol: string;    // e.g. "Rₕ"
  label: string;     // e.g. "Hourly room rate"
  value: string;     // e.g. "$150/hr"
  isFixed?: boolean; // shows "(fixed)" suffix
};

export type FormulaLine =
  | { type: 'simple'; lhs: string; rhs: string }           // Cᵣ = Rₕ/60 × Dₜ
  | { type: 'fraction'; lhs: string; numerator: string; denominator: string; suffix?: string }; // fraction form

export type FormulaProps = {
  result: string;        // e.g. "$57.50"
  resultLabel: string;   // e.g. "Cᵣ"
  formula: FormulaLine;
  variables: FormulaVariable[];
  compact?: boolean;     // card vs expanded
};

// ── Timing ────────────────────────────────────────────────────────────────────
const FORMULA_DELAY = 100;
const VAR_STAGGER = 220;
const RESULT_DELAY_AFTER_VARS = 300;

// ── FormulaGraphic ────────────────────────────────────────────────────────────
export const FormulaGraphic: React.FC<FormulaProps> = ({
  result, resultLabel, formula, variables, compact = false,
}) => {
  const formulaOpacity = useSharedValue(0);
  const formulaY = useSharedValue(6);
  const resultOpacity = useSharedValue(0);
  const resultScale = useSharedValue(0.85);
  const [varVisible, setVarVisible] = useState<boolean[]>(
    variables.map(() => false)
  );

  const totalVarDelay = FORMULA_DELAY + 400 + variables.length * VAR_STAGGER;

  useEffect(() => {
    // Formula appears first
    formulaOpacity.value = withDelay(
      FORMULA_DELAY,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );
    formulaY.value = withDelay(
      FORMULA_DELAY,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );

    // Variables appear one by one
    variables.forEach((_, i) => {
      const delay = FORMULA_DELAY + 400 + i * VAR_STAGGER;
      setTimeout(() => {
        setVarVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, delay);
    });

    // Result appears after all variables
    resultOpacity.value = withDelay(
      totalVarDelay + RESULT_DELAY_AFTER_VARS,
      withTiming(1, { duration: 300 })
    );
    resultScale.value = withDelay(
      totalVarDelay + RESULT_DELAY_AFTER_VARS,
      withSequence(
        withTiming(1.08, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) }),
      )
    );
  }, []);

  const formulaStyle = useAnimatedStyle(() => ({
    opacity: formulaOpacity.value,
    transform: [{ translateY: formulaY.value }],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ scale: resultScale.value }],
  }));

  const sz = compact
    ? { label: 7, formula: 12, varSymbol: 11, varLabel: 9, varValue: 10, result: 14 }
    : { label: 8, formula: 15, varSymbol: 13, varLabel: 11, varValue: 12, result: 22 };

  return (
    <View style={styles.container}>

      {/* Formula block */}
      <Animated.View style={[styles.formulaBlock, formulaStyle]}>
        <Text style={[styles.sectionLabel, { fontSize: sz.label }]}>FORMULA</Text>
        {formula.type === 'simple' ? (
          <Text style={[styles.formulaText, { fontSize: sz.formula }]}>
            {formula.lhs} = {formula.rhs}
          </Text>
        ) : (
          /* Fraction rendering */
          <View style={styles.fractionRow}>
            <Text style={[styles.formulaText, { fontSize: sz.formula }]}>{formula.lhs} = </Text>
            <View style={styles.fractionBlock}>
              <Text style={[styles.formulaText, { fontSize: sz.formula }, styles.fractionNum]}>
                {formula.numerator}
              </Text>
              <View style={styles.fractionLine} />
              <Text style={[styles.formulaText, { fontSize: sz.formula }, styles.fractionDen]}>
                {formula.denominator}
              </Text>
            </View>
            {formula.suffix ? (
              <Text style={[styles.formulaText, { fontSize: sz.formula }]}> {formula.suffix}</Text>
            ) : null}
          </View>
        )}
      </Animated.View>

      {/* WHERE block — only shown in expanded modal */}
      {!compact && (
        <View style={styles.whereBlock}>
          <Text style={[styles.sectionLabel, { fontSize: sz.label }]}>WHERE</Text>
          {variables.map((v, i) => (
            <Animated.View
              key={v.symbol}
              style={[
                styles.varRow,
                { opacity: varVisible[i] ? 1 : 0 },
              ]}
            >
              <Text style={[styles.varSymbol, { fontSize: sz.varSymbol }]}>{v.symbol}</Text>
              <Text style={[styles.varLabel, { fontSize: sz.varLabel }]}>
                {v.label}{v.isFixed ? ' (fixed)' : ''}
              </Text>
              <Text style={[styles.varValue, { fontSize: sz.varValue }]}>{v.value}</Text>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Result */}
      <Animated.View style={[styles.resultBlock, resultStyle]}>
        <Text style={[styles.sectionLabel, { fontSize: sz.label }]}>RESULT</Text>
        <Text style={[styles.resultText, { fontSize: sz.result }]}>
          {resultLabel} = {result}
        </Text>
      </Animated.View>

    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    width: '100%',
  },
  sectionLabel: {
    fontFamily: Fonts.monoBold,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  formulaBlock: { gap: 4 },
  formulaText: {
    fontFamily: Fonts.mono,
    color: Colors.textPrimary,
  },
  fractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fractionBlock: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  fractionNum: {
    paddingBottom: 2,
  },
  fractionLine: {
    height: 1,
    backgroundColor: Colors.textPrimary,
    alignSelf: 'stretch',
    marginVertical: 2,
  },
  fractionDen: {
    paddingTop: 2,
  },
  whereBlock: { gap: 6 },
  varRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  varSymbol: {
    fontFamily: Fonts.monoBold,
    color: Colors.teal,
    width: 32,
  },
  varLabel: {
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    flex: 1,
  },
  varValue: {
    fontFamily: Fonts.monoBold,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  resultBlock: { gap: 4 },
  resultText: {
    fontFamily: Fonts.monoBold,
    color: Colors.teal,
  },

});
