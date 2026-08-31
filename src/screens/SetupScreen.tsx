import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Fonts, TypeScale } from '../constants/theme';
import { MEETING_DURATIONS, SUPPORTED_CURRENCIES, JOKE_ROLES, Role } from '../constants/roles';
import { AttendeeGroup } from '../hooks/useMeeting';
import { OdometerConfig } from '../constants/theme';
import { ResetModal } from '../components/ResetModal';

type Props = {
  currency: string;
  setCurrency: (c: string) => void;
  fxRates: Record<string, number>;
  fxLoading: boolean;
  allocatedMinutes: number;
  setAllocatedMinutes: (m: number) => void;
  attendees: AttendeeGroup[];
  setCount: (id: string, count: number) => void;
  updateRate: (id: string, rateInCurrency: number, fx: number) => void;
  addCustomRole: (role: Role) => void;
  removeAttendee: (id: string) => void;
  totalPeople: number;
  perMinute: number;
  perHour: number;
  onConfirm: () => void;
  onResetAll: () => void;
  sessionCount: number;
  totalCostUSD: number;
};

export const SetupScreen: React.FC<Props> = ({
  currency, setCurrency, fxRates, fxLoading,
  allocatedMinutes, setAllocatedMinutes,
  attendees, setCount, updateRate, addCustomRole, removeAttendee,
  totalPeople, perMinute, perHour,
  onConfirm, onResetAll, sessionCount, totalCostUSD,
}) => {
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [customDuration, setCustomDuration] = useState('');

  const sym = OdometerConfig[currency]?.symbol ?? '$';
  const fx = fxRates[currency] ?? 1;

  const fmt2 = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAddJokeRole = (role: Role) => {
    addCustomRole(role);
    setShowCustomSheet(false);
  };

  const handleAddCustom = () => {
    if (!customName.trim() || !customRate.trim()) return;
    const rate = parseFloat(customRate);
    if (isNaN(rate) || rate <= 0) return;
    addCustomRole({
      id: `custom-${Date.now()}`,
      label: customName.trim(),
      ratePerHour: rate / fx,
      isDefault: false,
    });
    setCustomName('');
    setCustomRate('');
    setShowCustomSheet(false);
  };

  const handleDurationSelect = (val: number) => {
    if (val === -1) {
      setShowCustomDuration(true);
    } else {
      setAllocatedMinutes(val);
      setShowCustomDuration(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>BURNMEETR</Text>
          </View>
          <Text style={styles.tagline}>How much is this room costing?</Text>
        </View>

        <View style={styles.rule} />

        {/* Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CURRENCY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillRow}>
              {SUPPORTED_CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[styles.pill, currency === c && styles.pillActive]}
                >
                  <Text style={[styles.pillText, currency === c && styles.pillTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {!fxLoading && currency !== 'USD' && fxRates[currency] && (
            <Text style={styles.fxNote}>
              1 USD = {fxRates[currency]?.toFixed(3)} {currency} · live
            </Text>
          )}
        </View>

        <View style={styles.rule} />

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALLOCATED TIME</Text>
          <View style={styles.pillRow}>
            {MEETING_DURATIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                onPress={() => handleDurationSelect(d.value)}
                style={[
                  styles.pill,
                  (allocatedMinutes === d.value || (d.value === -1 && showCustomDuration)) && styles.pillActive,
                ]}
              >
                <Text style={[
                  styles.pillText,
                  allocatedMinutes === d.value && styles.pillTextActive,
                ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {showCustomDuration && (
            <View style={styles.customDurationRow}>
              <TextInput
                style={styles.input}
                placeholder="Minutes"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={customDuration}
                onChangeText={setCustomDuration}
                onBlur={() => {
                  const m = parseInt(customDuration, 10);
                  if (!isNaN(m) && m > 0) {
                    setAllocatedMinutes(m);
                    setShowCustomDuration(false);
                  }
                }}
                onSubmitEditing={() => {
                  const m = parseInt(customDuration, 10);
                  if (!isNaN(m) && m > 0) {
                    setAllocatedMinutes(m);
                    setShowCustomDuration(false);
                  }
                }}
              />
              <Text style={styles.inputSuffix}>min</Text>
            </View>
          )}
        </View>

        <View style={styles.rule} />

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ATTENDEES</Text>
          <View style={styles.attendeeList}>
            {attendees.map(a => {
              const displayRate = (a.role.ratePerHour * fx).toFixed(0);
              return (
                <View key={a.id} style={styles.attendeeRow}>
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeLabel} numberOfLines={1}>
                      {a.role.emoji ? `${a.role.emoji} ` : ''}{a.role.label}
                    </Text>
                    {editingRateId === a.id ? (
                      <View style={styles.rateInputRow}>
                        <Text style={styles.rateInputSym}>{sym}</Text>
                        <TextInput
                          style={styles.rateInput}
                          value={editingRateValue}
                          onChangeText={setEditingRateValue}
                          keyboardType="decimal-pad"
                          autoFocus
                          selectTextOnFocus
                          onBlur={() => {
                            const parsed = parseFloat(editingRateValue);
                            if (!isNaN(parsed) && parsed > 0) {
                              updateRate(a.id, parsed, fx);
                            }
                            setEditingRateId(null);
                          }}
                          onSubmitEditing={() => {
                            const parsed = parseFloat(editingRateValue);
                            if (!isNaN(parsed) && parsed > 0) {
                              updateRate(a.id, parsed, fx);
                            }
                            setEditingRateId(null);
                          }}
                        />
                        <Text style={styles.rateInputSuffix}>/hr</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingRateId(a.id);
                          setEditingRateValue(displayRate);
                        }}
                      >
                        <Text style={styles.attendeeRate}>
                          {sym}{displayRate}/hr ✎
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() => setCount(a.id, a.count - 1)}
                      style={[styles.stepBtn, a.count === 0 && styles.stepBtnDisabled]}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.stepCount, a.count > 0 && styles.stepCountActive]}>
                      {a.count}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCount(a.id, a.count + 1)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={!a.role.isDefault ? () => removeAttendee(a.id) : undefined}
                    style={styles.removeBtn}
                  >
                    <Text style={[styles.removeBtnText, a.role.isDefault && styles.removeBtnHidden]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.addRoleBtn}
            onPress={() => setShowCustomSheet(true)}
          >
            <Text style={styles.addRoleBtnText}>+ Add role</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rule} />

        {/* Preview */}
        <View style={[styles.previewStrip, totalPeople === 0 && styles.previewStripHidden]}>
          <View style={styles.previewItem}>
            <Text style={styles.previewValue}>{totalPeople > 0 ? totalPeople : '—'}</Text>
            <Text style={styles.previewLabel}>PEOPLE</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewItem}>
            <Text style={styles.previewValue}>{totalPeople > 0 ? `${sym}${fmt2(perMinute)}` : '—'}</Text>
            <Text style={styles.previewLabel}>PER MIN</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewItem}>
            <Text style={styles.previewValue}>{totalPeople > 0 ? `${sym}${fmt2(perHour)}` : '—'}</Text>
            <Text style={styles.previewLabel}>PER HOUR</Text>
          </View>
        </View>

        {/* Confirm — navigate to idle/odometer screen */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.confirmBtn, totalPeople === 0 && styles.confirmBtnDisabled]}
            onPress={totalPeople === 0 ? undefined : onConfirm}
            activeOpacity={0.7}
          >
            <Text style={[styles.confirmBtnText, totalPeople === 0 && styles.confirmBtnTextDisabled]}>
              READY
            </Text>
          </TouchableOpacity>
          {totalPeople === 0 && (
            <Text style={styles.confirmHint}>Add attendees to continue</Text>
          )}
        </View>
      {/* Reset data link — recessive, bottom of screen */}
        {sessionCount > 0 && (
          <TouchableOpacity
            style={styles.resetLink}
            onPress={() => setShowReset(true)}
          >
            <Text style={styles.resetLinkText}>Reset all data</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Reset confirmation modal */}
      <ResetModal
        visible={showReset}
        sessionCount={sessionCount}
        totalCost={totalCostUSD * (fxRates[currency] ?? 1)}
        symbol={sym}
        onConfirm={() => { setShowReset(false); onResetAll(); }}
        onCancel={() => setShowReset(false)}
      />

      {/* Custom role sheet */}
      <Modal
        visible={showCustomSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCustomSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowCustomSheet(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>ADD ROLE</Text>

          <Text style={styles.sheetSubLabel}>QUICK ADD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.jokeRow}>
              {JOKE_ROLES.filter(
                r => !attendees.find(a => a.id === r.id)
              ).map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={styles.jokeChip}
                  onPress={() => handleAddJokeRole(role)}
                >
                  <Text style={styles.jokeChipText}>
                    {role.emoji} {role.label}
                  </Text>
                  <Text style={styles.jokeChipRate}>
                    {sym}{(role.ratePerHour * fx).toFixed(0)}/hr
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.sheetSubLabel, { marginTop: Spacing.lg }]}>CUSTOM</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="Role name"
            placeholderTextColor={Colors.textMuted}
            value={customName}
            onChangeText={setCustomName}
          />
          <View style={styles.sheetRateRow}>
            <Text style={styles.sheetSym}>{sym}</Text>
            <TextInput
              style={[styles.sheetInput, { flex: 1 }]}
              placeholder={`Hourly rate in ${currency}`}
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={customRate}
              onChangeText={setCustomRate}
            />
            <Text style={styles.sheetPerHr}>/hr</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sheetAddBtn,
              (!customName.trim() || !customRate.trim()) && styles.sheetAddBtnDisabled,
            ]}
            onPress={handleAddCustom}
          >
            <Text style={styles.sheetAddBtnText}>Add to meeting</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xxl },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
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
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginTop: 4,
  },

  rule: {
    height: 0.5,
    backgroundColor: Colors.rule,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  sectionLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 2,
    color: Colors.textSecondary,
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: Colors.rule,
    borderRadius: 0,
  },
  pillActive: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  pillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  pillTextActive: {
    color: Colors.white,
  },

  fxNote: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
  },

  customDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 0.5,
    borderColor: Colors.rule,
  },
  inputSuffix: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
  },

  attendeeList: { gap: 0 },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.rule,
    paddingVertical: 7,
    gap: Spacing.md,
  },
  attendeeInfo: { flex: 1, minWidth: 0 },
  attendeeLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  attendeeRate: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderWidth: 0.5,
    borderColor: Colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.25 },
  stepBtnText: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  stepCount: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  stepCountActive: { color: Colors.textPrimary },
  removeBtn: { padding: 6 },
  removeBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textDead,
  },
  removeBtnHidden: {
    opacity: 0,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rateInputSym: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.teal,
  },
  rateInput: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.teal,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.teal,
    minWidth: 40,
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
  rateInputSuffix: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
  },

  addRoleBtn: {
    marginTop: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.rule,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  addRoleBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },

  previewStrip: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.rule,
  },
  previewStripHidden: {
    opacity: 0,
  },
  previewItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  previewValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  previewLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  previewDivider: {
    width: 0.5,
    backgroundColor: Colors.rule,
  },


  // Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: Colors.surfaceRaised,
    padding: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.sm,
  },
  sheetHandle: {
    width: 36,
    height: 3,
    backgroundColor: Colors.rule,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 2.5,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  sheetSubLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  jokeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  jokeChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.rule,
    gap: 3,
  },
  jokeChipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  jokeChipRate: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
  },
  sheetInput: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 0.5,
    borderColor: Colors.rule,
  },
  sheetRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetSym: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  sheetPerHr: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
  },
  sheetAddBtn: {
    backgroundColor: Colors.red,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sheetAddBtnDisabled: { opacity: 0.3 },
  sheetAddBtnText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.white,
    letterSpacing: 1,
  },

  // Confirm button
  buttonWrapper: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  confirmBtn: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: Colors.red,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    borderColor: Colors.rule,
  },
  confirmBtnText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 4,
    color: Colors.red,
  },
  confirmBtnTextDisabled: {
    color: Colors.textDead,
  },
  confirmHint: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  resetLink: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  resetLinkText: {
    fontFamily: Fonts.mono,
    fontSize: TypeScale.footnote,
    color: Colors.textDead,
    letterSpacing: 0.5,
  },
});
