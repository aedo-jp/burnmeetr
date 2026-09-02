import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal, useWindowDimensions, Pressable,
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

const fmt2 = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWide = width >= 768; // tablet or landscape iPad

  const sym = OdometerConfig[currency]?.symbol ?? '$';
  const fx = fxRates[currency] ?? 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.outerRow, isLandscape && styles.outerRowLandscape]}>

        {/* Left column */}
        <View style={styles.leftCol}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            isWide && !isLandscape && styles.contentWide,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Inner container */}
          <View style={[styles.inner, isWide && !isLandscape && styles.innerWide]}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>BURNMEETR</Text>
            </View>
          </View>
          <View style={styles.rule} />

          {/* Currency selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CURRENCY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, currency === c && styles.pillActive]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[styles.pillText, currency === c && styles.pillTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.rule} />

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ALLOCATED TIME</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {MEETING_DURATIONS.map(d => {
                const isCustom = d.value === -1;
                const isActive = isCustom
                  ? showCustomDuration
                  : allocatedMinutes === d.value;
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => {
                      if (isCustom) {
                        setShowCustomDuration(true);
                      } else {
                        setAllocatedMinutes(d.value);
                        setShowCustomDuration(false);
                      }
                    }}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {showCustomDuration && (
              <View style={styles.customDurationRow}>
                <TextInput
                  style={styles.customDurationInput}
                  keyboardType="numeric"
                  placeholder="minutes"
                  placeholderTextColor={Colors.textDead}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  onBlur={() => {
                    const v = parseInt(customDuration, 10);
                    if (v > 0) setAllocatedMinutes(v);
                  }}
                  onSubmitEditing={() => {
                    const v = parseInt(customDuration, 10);
                    if (v > 0) setAllocatedMinutes(v);
                  }}
                  returnKeyType="done"
                />
                <Text style={styles.customDurationLabel}>min</Text>
              </View>
            )}
          </View>
          <View style={styles.rule} />

          {/* Attendees */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ATTENDEES</Text>
            <View style={styles.attendeeList}>
              {attendees.map(a => {
                const fxRate = fxRates[currency] ?? 1;
                const displayRate = a.role.ratePerHour * fxRate;
                return (
                  <View key={a.id} style={styles.attendeeRow}>
                    <TouchableOpacity
                      style={styles.countBtn}
                      onPress={() => setCount(a.id, Math.max(0, a.count - 1))}
                    >
                      <Text style={styles.countBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.countValue}>{a.count}</Text>
                    <TouchableOpacity
                      style={styles.countBtn}
                      onPress={() => setCount(a.id, a.count + 1)}
                    >
                      <Text style={styles.countBtnText}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.roleLabel} numberOfLines={1}>
                      {a.role.label}
                    </Text>
                    {editingRateId === a.id ? (
                      <View style={styles.rateInputRow}>
                        <Text style={styles.rateInputSuffix}>{sym}</Text>
                        <TextInput
                          style={styles.rateInput}
                          keyboardType="numeric"
                          value={editingRateValue}
                          onChangeText={setEditingRateValue}
                          autoFocus
                          onBlur={() => {
                            const v = parseFloat(editingRateValue);
                            if (!isNaN(v) && v > 0) updateRate(a.id, v, fxRate);
                            setEditingRateId(null);
                          }}
                          onSubmitEditing={() => {
                            const v = parseFloat(editingRateValue);
                            if (!isNaN(v) && v > 0) updateRate(a.id, v, fxRate);
                            setEditingRateId(null);
                          }}
                          returnKeyType="done"
                        />
                        <Text style={styles.rateInputSuffix}>/hr</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingRateId(a.id);
                          setEditingRateValue(displayRate.toFixed(0));
                        }}
                      >
                        <Text style={styles.rateDisplay}>
                          {sym}{Math.round(displayRate)}/hr
                        </Text>
                      </TouchableOpacity>
                    )}
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

          {/* Preview strip — portrait only (landscape shows in right column) */}
          {!isLandscape && <View style={[styles.previewStrip, totalPeople === 0 && styles.previewStripHidden]}>
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
          </View>}

        </View>{/* /inner */}
      </ScrollView>

        {/* Portrait: pinned button + reset — inside left column */}
        {!isLandscape && (
          <>
            <View style={[styles.buttonWrapper, isWide && styles.buttonWrapperWide]}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  pressed && styles.confirmBtnPressed,
                  totalPeople === 0 && styles.confirmBtnDisabled,
                ]}
                onPress={totalPeople === 0 ? undefined : onConfirm}
              >
                {({ pressed }) => (
                  <Text style={[
                    styles.confirmBtnText,
                    pressed && styles.confirmBtnTextPressed,
                    totalPeople === 0 && styles.confirmBtnTextDisabled,
                  ]}>
                    READY
                  </Text>
                )}
              </Pressable>
              {totalPeople === 0 && (
                <Text style={styles.confirmHint}>Add attendees to continue</Text>
              )}
            </View>
            {sessionCount > 0 && (
              <TouchableOpacity
                style={styles.resetLink}
                onPress={() => setShowReset(true)}
              >
                <Text style={styles.resetLinkText}>Reset all data</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        </View>{/* /leftCol */}

        {/* Right column — landscape only */}
      {isLandscape && (
        <View style={styles.landscapeRight}>
          <View style={styles.landscapeStats}>
            <View style={styles.landscapeStat}>
              <Text style={styles.landscapeStatNum}>{totalPeople > 0 ? totalPeople : '—'}</Text>
              <Text style={styles.landscapeStatLabel}>PEOPLE</Text>
            </View>
            <View style={styles.landscapeStatDivider} />
            <View style={styles.landscapeStat}>
              <Text style={styles.landscapeStatNum}>{totalPeople > 0 ? `${sym}${fmt2(perMinute)}` : '—'}</Text>
              <Text style={styles.landscapeStatLabel}>PER MIN</Text>
            </View>
            <View style={styles.landscapeStatDivider} />
            <View style={styles.landscapeStat}>
              <Text style={styles.landscapeStatNum}>{totalPeople > 0 ? `${sym}${fmt2(perHour)}` : '—'}</Text>
              <Text style={styles.landscapeStatLabel}>PER HOUR</Text>
            </View>
          </View>
          <View style={styles.landscapeBtnWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.landscapeReadyBtn,
                pressed && styles.landscapeReadyBtnPressed,
                totalPeople === 0 && styles.landscapeReadyBtnDisabled,
              ]}
              onPress={totalPeople === 0 ? undefined : onConfirm}
            >
              {({ pressed }) => (
                <>
                  <Text style={[
                    styles.landscapeReadyText,
                    pressed && styles.landscapeReadyTextPressed,
                    totalPeople === 0 && styles.landscapeReadyTextDisabled,
                  ]}>READY</Text>
                  {totalPeople === 0 && (
                    <Text style={styles.landscapeReadyHint}>Add attendees</Text>
                  )}
                </>
              )}
            </Pressable>
          </View>
        </View>
        )}
      </View>{/* /outerRow */}

      {/* Reset modal */}
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
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowCustomSheet(false)}
        />
        <View style={[styles.sheet, isWide && styles.sheetWide]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>ADD ROLE</Text>

          <Text style={styles.sheetSubLabel}>ROLE NAME</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="e.g. Product Manager"
            placeholderTextColor={Colors.textDead}
            value={customName}
            onChangeText={setCustomName}
          />

          <Text style={[styles.sheetSubLabel, { marginTop: Spacing.sm }]}>HOURLY RATE ({currency})</Text>
          <View style={styles.sheetRateRow}>
            <Text style={styles.sheetSym}>{sym}</Text>
            <TextInput
              style={[styles.sheetInput, { flex: 1 }]}
              placeholder="150"
              placeholderTextColor={Colors.textDead}
              keyboardType="numeric"
              value={customRate}
              onChangeText={setCustomRate}
            />
            <Text style={styles.sheetPerHr}>/hr</Text>
          </View>

          <Text style={styles.sheetSubLabel}>OR CHOOSE A PRESET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.jokeRow}>
              {JOKE_ROLES.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.jokeChip}
                  onPress={() => {
                    addCustomRole(r);
                    setShowCustomSheet(false);
                    setCustomName('');
                    setCustomRate('');
                  }}
                >
                  <Text style={styles.jokeChipText}>{r.label.split(' /')[0]}</Text>
                  <Text style={styles.jokeChipRate}>{sym}{Math.round(r.ratePerHour * (fxRates[currency] ?? 1))}/hr</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.sheetAddBtn,
              (!customName.trim() || !customRate.trim()) && styles.sheetAddBtnDisabled,
            ]}
            disabled={!customName.trim() || !customRate.trim()}
            onPress={() => {
              const rate = parseFloat(customRate);
              if (!customName.trim() || isNaN(rate) || rate <= 0) return;
              const rateUSD = rate / (fxRates[currency] ?? 1);
              addCustomRole({
                id: `custom-${Date.now()}`,
                label: customName.trim(),
                ratePerHour: rateUSD,
                isDefault: false,
              });
              setShowCustomSheet(false);
              setCustomName('');
              setCustomRate('');
            }}
          >
            <Text style={styles.sheetAddBtnText}>ADD ROLE</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  contentWide: { alignItems: 'center' },
  inner: { flex: 1 },
  innerWide: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  outerRow: { flex: 1, flexDirection: 'column' },
  leftCol: { flex: 1, flexDirection: 'column' },
  outerRowLandscape: { flexDirection: 'row' },
  landscapeRight: {
    width: 190,
    borderLeftWidth: 0.5,
    borderLeftColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
    flexDirection: 'column',
    padding: 16,
    gap: 16,
  },
  landscapeStats: {
    gap: 0,
  },
  landscapeStat: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
    gap: 4,
  },
  landscapeStatDivider: { height: 0 },
  landscapeStatNum: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 15,
    color: '#F0F0F0',
    letterSpacing: -0.3,
  },
  landscapeStatLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: 'rgba(240,240,240,0.5)',
    letterSpacing: 1.5,
  },
  landscapeBtnWrap: {
    flex: 1,
    paddingTop: 4,
    maxHeight: 160,
  },
  landscapeReadyBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#CC2200',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 2,
  },
  landscapeReadyBtnPressed: {
    backgroundColor: '#CC2200',
    borderColor: '#CC2200',
  },
  landscapeReadyBtnDisabled: {
    borderColor: '#1A1A1A',
  },
  landscapeReadyText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 20,
    letterSpacing: 4,
    color: '#FF3322',
  },
  landscapeReadyTextPressed: {
    color: '#F0F0F0',
  },
  landscapeReadyTextDisabled: {
    color: '#333',
  },
  landscapeReadyHint: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: 'rgba(240,240,240,0.5)',
    letterSpacing: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red },
  logoText: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 2.5,
    color: Colors.textMuted,
  },
  rule: { height: 0.5, backgroundColor: Colors.rule },

  section: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  sectionLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: TypeScale.label,
    letterSpacing: 2,
    color: Colors.textMuted,
  },

  pillRow: { flexDirection: 'row', gap: Spacing.xs, paddingVertical: 2 },
  pill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.rule,
  },
  pillActive: { borderColor: Colors.teal, backgroundColor: Colors.tealFaint },
  pillText: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textMuted },
  pillTextActive: { color: Colors.teal },

  customDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  customDurationInput: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.teal,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.teal,
    minWidth: 60,
    paddingVertical: 2,
  },
  customDurationLabel: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textMuted },

  attendeeList: { gap: Spacing.sm },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  countBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.rule },
  countBtnText: { fontFamily: Fonts.monoBold, fontSize: 16, color: Colors.textPrimary },
  countValue: { fontFamily: Fonts.monoBold, fontSize: 14, color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
  roleLabel: { flex: 1, fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textSecondary },
  rateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
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
  rateInputSuffix: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textMuted },
  rateDisplay: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.teal },
  removeBtn: { padding: 4 },
  removeBtnText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textDead },
  removeBtnHidden: { opacity: 0 },

  addRoleBtn: { marginTop: Spacing.sm, borderWidth: 0.5, borderColor: Colors.rule, paddingVertical: Spacing.sm, alignItems: 'center' },
  addRoleBtnText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textSecondary, letterSpacing: 0.5 },

  previewStrip: { flexDirection: 'row', paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.rule },
  previewStripHidden: { opacity: 0 },
  previewItem: { flex: 1, alignItems: 'center', gap: 4 },
  previewValue: { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.textPrimary },
  previewLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textSecondary, letterSpacing: 1.5 },
  previewDivider: { width: 0.5, backgroundColor: Colors.rule },

  buttonWrapper: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm, backgroundColor: Colors.bg },
  buttonWrapperWide: { maxWidth: 600, width: '100%', alignSelf: 'center' },
  confirmBtn: { width: '100%', borderWidth: 0.5, borderColor: Colors.red, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: 'transparent' },
  confirmBtnPressed: { backgroundColor: Colors.red, borderColor: Colors.red },
  confirmBtnDisabled: { borderColor: Colors.rule },
  confirmBtnText: { fontFamily: Fonts.monoBold, fontSize: TypeScale.label, letterSpacing: 4, color: '#FF3322' },
  confirmBtnTextPressed: { color: Colors.white },
  confirmBtnTextDisabled: { color: Colors.textDead },
  confirmHint: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textMuted, letterSpacing: 0.5 },

  resetLink: { alignItems: 'center', paddingVertical: Spacing.lg, paddingBottom: Spacing.xl },
  resetLinkText: { fontFamily: Fonts.mono, fontSize: TypeScale.footnote, color: Colors.textDead, letterSpacing: 0.5 },

  // Sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: { backgroundColor: Colors.surfaceRaised, padding: Spacing.lg, paddingBottom: 48, gap: Spacing.sm },
  sheetWide: { marginHorizontal: 'auto', width: 560, borderRadius: 4 },
  sheetHandle: { width: 36, height: 3, backgroundColor: Colors.rule, alignSelf: 'center', marginBottom: Spacing.sm },
  sheetTitle: { fontFamily: Fonts.monoBold, fontSize: TypeScale.label, letterSpacing: 2.5, color: Colors.textMuted, marginBottom: Spacing.sm },
  sheetSubLabel: { fontFamily: Fonts.monoBold, fontSize: 8, letterSpacing: 2, color: Colors.textMuted },
  jokeRow: { flexDirection: 'row', gap: 8, paddingVertical: Spacing.sm },
  jokeChip: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderWidth: 0.5, borderColor: Colors.rule, gap: 3 },
  jokeChipText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textPrimary, fontWeight: '500' },
  jokeChipRate: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textMuted },
  sheetInput: { backgroundColor: Colors.surface, padding: Spacing.sm, fontFamily: Fonts.sans, fontSize: 14, color: Colors.textPrimary, borderWidth: 0.5, borderColor: Colors.rule },
  sheetRateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetSym: { fontFamily: Fonts.monoBold, fontSize: 16, color: Colors.textSecondary },
  sheetPerHr: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textMuted },
  sheetAddBtn: { backgroundColor: Colors.red, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  sheetAddBtnDisabled: { opacity: 0.3 },
  sheetAddBtnText: { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.white, letterSpacing: 1 },
});
