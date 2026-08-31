import { useState, useRef, useCallback, useEffect } from 'react';
import { DEFAULT_ROLES, Role } from '../constants/roles';
import {
  MeetingRecord, MeetingAnalytics,
  loadMeetings, saveMeeting, buildMeetingRecord,
  loadCustomRoles, saveCustomRole, saveRateOverride, deleteCustomRole,
  clearAllData, deleteSessionById,
  getFirstLaunchDate, getDaysSinceFirstLaunch,
  computeAnalytics, StoredCustomRole,
} from '../storage/meetingStorage';

export type AttendeeGroup = {
  id: string;
  role: Role;
  count: number;
};

export type MeetingScreen = 'setup' | 'idle' | 'running' | 'processing' | 'brkr' | 'summary';

const TICK_MS = 200; // 5fps — keeps animation within budget

export function useMeeting() {
  // ── Setup state ────────────────────────────────────────────────────────────
  const [currency, setCurrency] = useState('USD');
  const [fxRates, setFxRates] = useState<Record<string, number>>({});
  const [fxLoading, setFxLoading] = useState(true);
  const [allocatedMinutes, setAllocatedMinutes] = useState(60);
  const [attendees, setAttendees] = useState<AttendeeGroup[]>(
    DEFAULT_ROLES.map(role => ({
      id: role.id,
      role,
      count: role.id === 'senior' ? 4 : 0,
    }))
  );

  // ── Running state ──────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<MeetingScreen>('setup');
  const [easterEggTriggered, setEasterEggTriggered] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cost, setCost] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateRef = useRef(0);

  // ── History & analytics ────────────────────────────────────────────────────
  const [history, setHistory] = useState<MeetingRecord[]>([]);
  const [analytics, setAnalytics] = useState<MeetingAnalytics>({
    totalMeetings: 1,
    totalCost: 0,
    averageCost: 0,
    averageDuration: 0,
    longestMeeting: 0,
    mostExpensiveMeeting: 0,
    isNewRecord: true,
    currentMeetingIndex: 1,
  });

  // ── Unlock tracking ────────────────────────────────────────────────────────
  const [daysSinceFirstLaunch, setDaysSinceFirstLaunch] = useState(0);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load history
    loadMeetings().then(meetings => {
      setHistory(meetings);
    });

    // Load first launch date
    getFirstLaunchDate().then(date => {
      setDaysSinceFirstLaunch(getDaysSinceFirstLaunch(date));
    });

    // Load custom roles and rate overrides
    loadCustomRoles().then(roles => {
      if (roles.length > 0) {
        setAttendees(prev => {
          // Apply rate overrides to existing roles (default or custom)
          const withOverrides = prev.map(a => {
            const saved = roles.find(r => r.id === a.id);
            if (saved && saved.ratePerHour > 0) {
              return { ...a, role: { ...a.role, ratePerHour: saved.ratePerHour } };
            }
            return a;
          });
          // Add new custom roles not already in the list
          const existingIds = prev.map(a => a.id);
          const newRoles = roles
            .filter(r => !existingIds.includes(r.id) && r.label)
            .map(r => ({
              id: r.id,
              role: {
                id: r.id,
                label: r.label,
                ratePerHour: r.ratePerHour,
                isDefault: false,
                emoji: r.emoji,
              },
              count: 0,
            }));
          return [...withOverrides, ...newRoles];
        });
      }
    });

    // Fetch live FX rates
    fetch('https://api.frankfurter.app/latest?base=USD')
      .then(r => r.json())
      .then(data => {
        setFxRates({ USD: 1, ...data.rates });
        setFxLoading(false);
      })
      .catch(() => {
        setFxRates({
          USD: 1, GBP: 0.79, EUR: 0.92, AUD: 1.53,
          JPY: 149.5, SGD: 1.34, CAD: 1.36,
        });
        setFxLoading(false);
      });
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const ratePerSecond = useCallback(() => {
    const fx = fxRates[currency] ?? 1;
    return attendees.reduce((sum, a) => {
      return sum + (a.role.ratePerHour * fx * a.count) / 3600;
    }, 0);
  }, [attendees, currency, fxRates]);

  const totalPeople = attendees.reduce((s, a) => s + a.count, 0);
  const perSecond = ratePerSecond();
  const perMinute = perSecond * 60;
  const perHour = perSecond * 3600;
  const allocatedSeconds = allocatedMinutes * 60;
  const isOverrun = elapsed > allocatedSeconds;
  const overrunSeconds = Math.max(0, Math.floor(elapsed) - allocatedSeconds);

  // ── Attendee management ────────────────────────────────────────────────────
  const setCount = useCallback((id: string, count: number) => {
    setAttendees(prev =>
      prev.map(a => (a.id === id ? { ...a, count: Math.max(0, count) } : a))
    );
  }, []);

  const updateRate = useCallback((id: string, rateInCurrency: number, fx: number) => {
    const rateUSD = rateInCurrency / fx;
    setAttendees(prev => {
      const updated = prev.map(a => {
        if (a.id !== id) return a;
        const newRole = { ...a.role, ratePerHour: rateUSD };
        // Persist
        saveRateOverride(id, a.role.label, rateUSD, a.role.emoji);
        return { ...a, role: newRole };
      });
      return updated;
    });
  }, []);

  const addCustomRole = useCallback((role: Role) => {
    setAttendees(prev => {
      if (prev.find(a => a.id === role.id)) return prev;
      return [...prev, { id: role.id, role, count: 1 }];
    });
    // Persist
    const stored: StoredCustomRole = {
      id: role.id,
      label: role.label,
      ratePerHour: role.ratePerHour,
      emoji: role.emoji,
    };
    saveCustomRole(stored);
  }, []);

  const removeAttendee = useCallback((id: string) => {
    setAttendees(prev => prev.filter(a => a.role.isDefault || a.id !== id));
    deleteCustomRole(id);
  }, []);

  // ── Meeting control ────────────────────────────────────────────────────────
  const navigateToIdle = useCallback(() => {
    setScreen('idle');
  }, []);

  const startMeeting = useCallback(() => {
    rateRef.current = ratePerSecond();
    setElapsed(0);
    setCost(0);
    setScreen('running');

    intervalRef.current = setInterval(() => {
      const tick = TICK_MS / 1000;
      setElapsed(e => e + tick);
      setCost(c => c + rateRef.current * tick);
    }, TICK_MS);
  }, [ratePerSecond]);

  const endMeeting = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Easter egg: hit allocated time within ±2 seconds
    const allocSecs = allocatedMinutes * 60;
    const diff = Math.abs(Math.floor(elapsed) - allocSecs);
    if (diff <= 2 && allocSecs > 0) {
      setEasterEggTriggered(true);
    } else {
      setEasterEggTriggered(false);
    }
    setScreen('processing');
  }, [elapsed, allocatedMinutes]);

  const completeProcessing = useCallback(() => {
    const fx = fxRates[currency] ?? 1;
    const record = buildMeetingRecord({
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
    });

    saveMeeting(record).then(() => {
      loadMeetings().then(updated => {
        setHistory(updated);
        const computed = computeAnalytics(updated.slice(0, -1), cost / fx);
        setAnalytics(computed);
      });
    });

    if (easterEggTriggered) {
      setScreen('brkr');
    } else {
      setScreen('summary');
    }
  }, [currency, cost, elapsed, allocatedMinutes, overrunSeconds, attendees, fxRates, easterEggTriggered]);

  const resetAllData = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await clearAllData();
    setHistory([]);
    setElapsed(0);
    setCost(0);
    setAnalytics({
      totalMeetings: 1,
      totalCost: 0,
      averageCost: 0,
      averageDuration: 0,
      longestMeeting: 0,
      mostExpensiveMeeting: 0,
      isNewRecord: true,
      currentMeetingIndex: 1,
    });
    setScreen('setup');
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    const updated = await deleteSessionById(id);
    setHistory(updated);
  }, []);

  const navigateToSummary = useCallback(() => {
    setScreen('summary');
  }, []);

  const resetMeeting = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsed(0);
    setCost(0);
    setScreen('setup');
  }, []);

  const restartMeeting = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startMeeting();
  }, [startMeeting]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    // Setup
    currency, setCurrency,
    fxRates, fxLoading,
    allocatedMinutes, setAllocatedMinutes,
    attendees, setCount, updateRate, addCustomRole, removeAttendee,
    // Derived
    totalPeople, perSecond, perMinute, perHour,
    allocatedSeconds, isOverrun, overrunSeconds,
    // Running
    screen, elapsed, cost,
    // History
    history, analytics, daysSinceFirstLaunch,
    // Actions
    navigateToIdle, navigateToSummary, startMeeting, endMeeting, completeProcessing,
    resetMeeting, restartMeeting, resetAllData, deleteSession,
    easterEggTriggered,
  };
}
