import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OdometerDigit } from './OdometerDigit';
import { OdometerConfig } from '../constants/theme';
import { Colors } from '../constants/theme';

type Props = {
  value: number;
  currency: string;
  digitHeight?: number;
  fontSize?: number;
  isOverrun?: boolean;
};

// Format value into a fixed-width digit array with separator positions
function formatOdometer(
  value: number,
  intDigits: number,
  decimals: number
): { chars: Array<{ type: 'digit'; value: number; isCents: boolean } | { type: 'sep'; char: string }> } {
  const factor = Math.pow(10, decimals);
  const total = Math.round(Math.abs(value) * factor);

  // Split into integer and decimal parts
  const decPart = total % factor;
  const intPart = Math.floor(total / factor);

  // Pad integer part to fixed width
  const intStr = String(intPart).padStart(intDigits, '0').slice(-intDigits);

  const chars: Array<{ type: 'digit'; value: number; isCents: boolean } | { type: 'sep'; char: string }> = [];

  // Integer digits with comma separators
  for (let i = 0; i < intStr.length; i++) {
    chars.push({ type: 'digit', value: parseInt(intStr[i], 10), isCents: false });
    // Insert comma after every 3rd digit from right (but not at end)
    const fromRight = intStr.length - 1 - i;
    if (fromRight > 0 && fromRight % 3 === 0) {
      chars.push({ type: 'sep', char: ',' });
    }
  }

  // Decimal part — marked as cents
  if (decimals > 0) {
    chars.push({ type: 'sep', char: '.' });
    const decStr = String(decPart).padStart(decimals, '0');
    for (const d of decStr) {
      chars.push({ type: 'digit', value: parseInt(d, 10), isCents: true });
    }
  }

  return { chars };
}

export const Odometer: React.FC<Props> = ({
  value,
  currency,
  digitHeight = 72,
  fontSize = 60,
  isOverrun = false,
}) => {
  const config = OdometerConfig[currency] ?? OdometerConfig['USD'];
  const { chars } = useMemo(
    () => formatOdometer(value, config.digits, config.decimals),
    [value, config.digits, config.decimals]
  );

  const activeColor = isOverrun ? Colors.redBright : Colors.textPrimary;
  const sepFontSize = fontSize * 0.55;

  return (
    <View style={styles.container}>
      {/* Currency symbol */}
      <Text
        style={[
          styles.symbol,
          {
            fontSize: fontSize * 0.38,
            color: activeColor,
            marginTop: digitHeight * 0.08,
            opacity: 0.6,
          },
        ]}
      >
        {config.symbol}
      </Text>

      {/* Digit drums and separators */}
      <View style={styles.drumsRow}>
        {chars.map((ch, i) => {
          if (ch.type === 'sep') {
            return (
              <Text
                key={`sep-${i}`}
                style={[
                  styles.separator,
                  {
                    fontSize: sepFontSize,
                    color: activeColor,
                    opacity: 0.35,
                    height: digitHeight,
                    lineHeight: digitHeight,
                    marginBottom: ch.char === '.' ? 2 : 0,
                  },
                ]}
              >
                {ch.char}
              </Text>
            );
          }
          return (
            <OdometerDigit
              key={`d-${i}`}
              value={ch.value}
              digitHeight={digitHeight}
              fontSize={fontSize}
              isOverrun={isOverrun}
              isCents={ch.isCents}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  drumsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbol: {
    fontFamily: 'JetBrainsMono-Bold',
    marginRight: 2,
    includeFontPadding: false,
  },
  separator: {
    fontFamily: 'JetBrainsMono-Bold',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
