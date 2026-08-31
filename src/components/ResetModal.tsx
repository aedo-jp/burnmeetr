import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
} from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../constants/theme';

type Props = {
  visible: boolean;
  sessionCount: number;
  totalCost: number;
  symbol: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ResetModal: React.FC<Props> = ({
  visible, sessionCount, totalCost, symbol, onConfirm, onCancel,
}) => {
  const [confirmArmed, setConfirmArmed] = useState(false);

  const handleDeletePress = () => {
    if (!confirmArmed) {
      setConfirmArmed(true);
      // Disarm after 4 seconds if not tapped again
      setTimeout(() => setConfirmArmed(false), 4000);
    } else {
      onConfirm();
      setConfirmArmed(false);
    }
  };

  const fmt2 = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.title}>RESET ALL DATA</Text>

          {/* Warning */}
          <Text style={styles.body}>
            This will permanently delete all session records.
          </Text>

          {/* Stats to be deleted */}
          <View style={styles.statsBlock}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statValue}>{sessionCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total expenditure</Text>
              <Text style={styles.statValue}>{symbol}{fmt2(totalCost)}</Text>
            </View>
          </View>

          <Text style={styles.warning}>This action cannot be undone.</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, confirmArmed && styles.deleteBtnArmed]}
              onPress={handleDeletePress}
            >
              <Text style={styles.deleteBtnText}>
                {confirmArmed ? 'TAP AGAIN TO CONFIRM' : 'DELETE ALL DATA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceRaised,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  body: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsBlock: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
  },
  statValue: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.footnote,
    color: Colors.textSecondary,
  },
  warning: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.red,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: Colors.rule,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  deleteBtn: {
    flex: 2,
    borderWidth: 0.5,
    borderColor: Colors.red,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  deleteBtnArmed: {
    backgroundColor: Colors.redFaint,
  },
  deleteBtnText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: Colors.red,
    letterSpacing: 1,
  },
});
