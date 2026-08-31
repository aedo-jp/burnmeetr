import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StoredAttendeeGroup = {
  roleId: string;
  label: string;
  count: number;
  ratePerHour: number; // in USD
};

export type MeetingRecord = {
  id: string;                    // UUID
  date: string;                  // ISO string
  currency: string;
  cost: number;                  // in USD (always — convert for display)
  costDisplay: number;           // in original currency (for display only)
  elapsed: number;               // seconds
  allocatedMinutes: number;
  overrunSeconds: number;
  attendees: StoredAttendeeGroup[];
  totalPeople: number;
  decisionsReached: number;      // always 0 in v1
};

export type AppState = {
  meetings: MeetingRecord[];
  firstLaunchDate: string;       // ISO string — drives unlock mechanic
  customRoles: StoredCustomRole[];
};

export type StoredCustomRole = {
  id: string;
  label: string;
  ratePerHour: number;           // in USD
  emoji?: string;
};

// ── Keys ──────────────────────────────────────────────────────────────────────

const KEYS = {
  meetings: '@burnmeetr/meetings',
  firstLaunch: '@burnmeetr/firstLaunch',
  customRoles: '@burnmeetr/customRoles',
} as const;

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function loadMeetings(): Promise<MeetingRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.meetings);
    if (!raw) return [];
    return JSON.parse(raw) as MeetingRecord[];
  } catch {
    return [];
  }
}

export async function saveMeeting(record: MeetingRecord): Promise<void> {
  try {
    const existing = await loadMeetings();
    const updated = [...existing, record];
    await AsyncStorage.setItem(KEYS.meetings, JSON.stringify(updated));
  } catch {
    // Silent fail — don't crash the app if storage fails
  }
}

export async function clearMeetings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.meetings);
  } catch {}
}

export async function deleteSessionById(id: string): Promise<MeetingRecord[]> {
  try {
    const existing = await loadMeetings();
    const updated = existing.filter(m => m.id !== id);
    await AsyncStorage.setItem(KEYS.meetings, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.meetings);
    await AsyncStorage.removeItem(KEYS.firstLaunch);
    await AsyncStorage.removeItem(KEYS.customRoles);
  } catch {}
}

// ── First launch / unlock tracking ────────────────────────────────────────────

export async function getFirstLaunchDate(): Promise<Date> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.firstLaunch);
    if (raw) return new Date(raw);
    // First time — record now
    const now = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.firstLaunch, now);
    return new Date(now);
  } catch {
    return new Date();
  }
}

export function getDaysSinceFirstLaunch(firstLaunch: Date): number {
  const now = new Date();
  const diff = now.getTime() - firstLaunch.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ── Custom roles ──────────────────────────────────────────────────────────────

export async function loadCustomRoles(): Promise<StoredCustomRole[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.customRoles);
    if (!raw) return [];
    return JSON.parse(raw) as StoredCustomRole[];
  } catch {
    return [];
  }
}

export async function saveCustomRole(role: StoredCustomRole): Promise<void> {
  try {
    const existing = await loadCustomRoles();
    const updated = [...existing.filter(r => r.id !== role.id), role];
    await AsyncStorage.setItem(KEYS.customRoles, JSON.stringify(updated));
  } catch {}
}

// Save just the rate for any role (default or custom) — merges with existing entry
export async function saveRateOverride(id: string, label: string, ratePerHour: number, emoji?: string): Promise<void> {
  try {
    const existing = await loadCustomRoles();
    const prev = existing.find(r => r.id === id);
    const updated = [
      ...existing.filter(r => r.id !== id),
      { id, label: prev?.label || label, ratePerHour, emoji: prev?.emoji || emoji },
    ];
    await AsyncStorage.setItem(KEYS.customRoles, JSON.stringify(updated));
  } catch {}
}

export async function deleteCustomRole(id: string): Promise<void> {
  try {
    const existing = await loadCustomRoles();
    const updated = existing.filter(r => r.id !== id);
    await AsyncStorage.setItem(KEYS.customRoles, JSON.stringify(updated));
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildMeetingRecord(params: {
  currency: string;
  cost: number;          // in display currency
  fxRate: number;        // display currency per 1 USD
  elapsed: number;
  allocatedMinutes: number;
  overrunSeconds: number;
  attendees: StoredAttendeeGroup[];
}): MeetingRecord {
  const { fxRate, ...rest } = params;
  const costUSD = params.cost / (fxRate || 1);
  return {
    id: generateId(),
    date: new Date().toISOString(),
    decisionsReached: 0,
    totalPeople: params.attendees.reduce((s, a) => s + a.count, 0),
    ...rest,
    cost: costUSD,           // always USD
    costDisplay: params.cost, // original currency
  };
}

// ── Derived analytics (computed from history, used in summary) ────────────────

export type MeetingAnalytics = {
  totalMeetings: number;
  totalCost: number;           // running total in stored currency (use most recent currency)
  averageCost: number;
  averageDuration: number;     // seconds
  longestMeeting: number;      // seconds
  mostExpensiveMeeting: number;
  isNewRecord: boolean;        // current meeting is most expensive ever
  currentMeetingIndex: number; // 1-based position in history
};

export function computeAnalytics(
  meetings: MeetingRecord[],
  currentCost: number
): MeetingAnalytics {
  const total = meetings.length;
  if (total === 0) {
    return {
      totalMeetings: 1,
      totalCost: currentCost,
      averageCost: currentCost,
      averageDuration: 0,
      longestMeeting: 0,
      mostExpensiveMeeting: currentCost,
      isNewRecord: true,
      currentMeetingIndex: 1,
    };
  }

  const totalCost = meetings.reduce((s, m) => s + m.cost, 0) + currentCost;
  const avgCost = totalCost / (total + 1);
  const avgDuration = meetings.reduce((s, m) => s + m.elapsed, 0) / total;
  const longest = Math.max(...meetings.map(m => m.elapsed));
  const mostExpensive = Math.max(...meetings.map(m => m.cost));
  const isNewRecord = currentCost > mostExpensive;

  return {
    totalMeetings: total + 1,
    totalCost,
    averageCost: avgCost,
    averageDuration: avgDuration,
    longestMeeting: longest,
    mostExpensiveMeeting: isNewRecord ? currentCost : mostExpensive,
    isNewRecord,
    currentMeetingIndex: total + 1,
  };
}
