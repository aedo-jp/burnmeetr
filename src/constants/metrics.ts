import { MeetingRecord, MeetingAnalytics } from '../storage/meetingStorage';

// ── Display types ─────────────────────────────────────────────────────────────

export type MetricDisplayType =
  | 'currency'        // $XX.XX
  | 'percentage'      // XX.XX%
  | 'infinity'        // ∞ or a value
  | 'always_fixed'    // always the same number regardless of input
  | 'visual_donut'    // circular chart
  | 'visual_bar'      // horizontal split bar
  | 'visual_golf'     // golf score + flag
  | 'loading'         // perpetual loading state, never resolves
  | 'pending'         // spinner, never resolves
  | 'text'            // plain text output
  | 'formula'          // typewriter formula reveal
  | 'gauge';           // speedometer gauge with flutter needle

export type MetricValue = {
  primary: string;          // The main display value
  secondary?: string;       // Optional sub-value
  footnote?: string;        // Micro type below the card
  formula?: string;         // Shown on expanded view
  displayType: MetricDisplayType;
  // For visual types
  fillPercent?: number;     // 0–100 for donut/bar
  splitLeft?: number;       // 0–100 for bar left side
  splitLeftLabel?: string;
  splitRightLabel?: string;
  // Formula graphic fields
  formulaLine?: object;
  formulaVariables?: object[];
  formulaResultLabel?: string;
};

// ── Metric definition ─────────────────────────────────────────────────────────

export type MetricDef = {
  id: string;
  acronym: string;          // Short label shown on card e.g. "CPD"
  name: string;             // Full name shown on expanded view
  unlockDay: number;        // Days since first launch before this appears
  displayType: MetricDisplayType;
  compute: (
    current: MeetingRecord,
    history: MeetingRecord[],
    analytics: MeetingAnalytics,
    symbol: string,
  ) => MetricValue;
};

// ── Helper ────────────────────────────────────────────────────────────────────

const fmt2 = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmt4 = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

// ── Metric library ────────────────────────────────────────────────────────────

export const METRICS: MetricDef[] = [

  // ── Day 0 — unlocked immediately ──────────────────────────────────────────

  {
    id: 'golf',
    acronym: 'GOLF',
    name: 'General Overhead Leverage Factor',
    unlockDay: 0,
    displayType: 'visual_golf',
    compute: (current) => {
      const par = current.allocatedMinutes;
      const actual = Math.floor(current.elapsed / 60);
      const diff = actual - par;

      const golfTerms: Record<number, { label: string; commentary: string }> = {
        [-3]: { label: 'Albatross (−3)', commentary: 'Exceptional performance. Anomalous. Under review.' },
        [-2]: { label: 'Eagle (−2)', commentary: 'Exceptional performance. Anomalous. Under review.' },
        [-1]: { label: 'Birdie (−1)', commentary: 'Ahead of par. Unlikely to be repeated.' },
        [0]:  { label: 'Par',          commentary: 'Meeting achieved baseline corporate functionality.' },
        [1]:  { label: 'Bogey (+1)',   commentary: 'Slightly over par. Consider fewer attendees next time.' },
        [2]:  { label: 'Double Bogey (+2)', commentary: 'A difficult round. Stakeholders have been notified.' },
        [3]:  { label: 'Triple Bogey (+3)', commentary: 'This meeting has been flagged for internal review.' },
      };
      const clamped = Math.max(-3, Math.min(3, diff));
      const result = golfTerms[clamped] ?? {
        label: `+${diff} (Unclassified)`,
        commentary: 'Score outside measurable parameters. Escalation pending.',
      };

      return {
        primary: result.label,
        secondary: `Par: ${par}m`,
        footnote: result.commentary,
        formula: `GOLF = (duration − par) expressed as stroke differential. Par defined as declared meeting duration. Benchmark not disclosed.`,
        displayType: 'visual_golf',
      };
    },
  },

  {
    id: 'core',
    acronym: 'CORE',
    name: 'Cost Of Real Estate',
    unlockDay: 0,
    displayType: 'formula',
    compute: (current, _h, _a, symbol) => {
      const ROOM_RATE_HR = 150;
      const minutes = Math.floor(current.elapsed / 60);
      const roomCost = (ROOM_RATE_HR / 60) * minutes;
      return {
        primary: `${symbol}${fmt2(roomCost)}`,
        footnote: 'Facilities overhead applied at standard occupancy rate.',
        displayType: 'formula',
        formulaResultLabel: 'Cᵣ',
        formulaLine: {
          type: 'fraction',
          lhs: 'Cᵣ',
          numerator: 'Rₕ',
          denominator: '60',
          suffix: '× Dₜ',
        },
        formulaVariables: [
          { symbol: 'Rₕ', label: 'Hourly room rate', value: `${symbol}${ROOM_RATE_HR}/hr` },
          { symbol: '60', label: 'Minutes per hour', value: '60', isFixed: true },
          { symbol: 'Dₜ', label: 'Duration', value: `${minutes}m` },
        ],
      };
    },
  },

  // ── Day 3 ─────────────────────────────────────────────────────────────────

  {
    id: 'circle_back',
    acronym: 'CBU',
    name: 'Circle Back Utilisation',
    unlockDay: 3,
    displayType: 'visual_donut',
    compute: () => ({
      primary: '100%',
      footnote: 'Utilisation calculated across all active workstreams.',
      displayType: 'visual_donut',
      fillPercent: 100,
    }),
  },

  // ── Day 7 ─────────────────────────────────────────────────────────────────

  {
    id: 'cpd',
    acronym: 'CPD',
    name: 'Cost Per Decision',
    unlockDay: 7,
    displayType: 'infinity',
    compute: (current, _h, _a, symbol) => {
      const decisions = current.decisionsReached;
      if (decisions === 0) {
        return {
          primary: '∞',
          footnote: 'This is not unusual.',
          formula: `${symbol}${fmt2(current.cost)} ÷ 0 decisions`,
          displayType: 'infinity',
          fillPercent: 0,
        };
      }
      const cpd = current.cost / decisions;
      return {
        primary: `${symbol}${fmt2(cpd)}`,
        footnote: 'Cost efficiency benchmarked against industry standards.',
        formula: `${symbol}${fmt2(current.cost)} ÷ ${decisions} decision${decisions > 1 ? 's' : ''}`,
        displayType: 'currency',
        fillPercent: Math.min(100, (1 / decisions) * 100),
      };
    },
  },

  // ── Day 14 ────────────────────────────────────────────────────────────────

  {
    id: 'fired',
    acronym: 'FIRED',
    name: 'Fully Integrated Resource Expenditure Determination',
    unlockDay: 14,
    displayType: 'loading',
    compute: (_c, _h, _a, symbol) => ({
      primary: `${symbol} Currently being assessed...`,
      footnote: 'Individual assessments will be reviewed. Check your email for a scheduled 1:1.',
      displayType: 'loading',
    }),
  },

  // ── Day 21 ────────────────────────────────────────────────────────────────

  {
    id: 'attendee_util',
    acronym: 'AUR',
    name: 'Attendee Utilisation Rate',
    unlockDay: 21,
    displayType: 'always_fixed',
    compute: () => ({
      primary: '34%',
      footnote: 'Estimated from industry averages. Methodology available on request.',
      displayType: 'always_fixed',
      fillPercent: 34,
    }),
  },

  // ── Day 30+ — queued for post-launch updates ──────────────────────────────

  {
    id: 'talk_listen',
    acronym: 'TLR',
    name: 'Talk:Listen Ratio',
    unlockDay: 30,
    displayType: 'visual_bar',
    compute: (current) => {
      const talkPct = Math.min(92, 60 + current.totalPeople * 3);
      const listenPct = 100 - talkPct;
      return {
        primary: `${talkPct}`,        // talk value — red
        secondary: `${listenPct}`,    // listen value — teal
        footnote: 'Passive participation not included in listen metric.',
        displayType: 'visual_bar',
        splitLeft: talkPct,
        splitLeftLabel: 'TALK',
        splitRightLabel: 'LISTEN',
      };
    },
  },

  {
    id: 'fmp',
    acronym: 'FMP',
    name: 'Follow-up Meeting Probability',
    unlockDay: 1,
    displayType: 'formula',
    compute: (current) => {
      const A = current.totalPeople;
      const D = Math.floor(current.elapsed / 60);
      const R = current.decisionsReached;
      const fmp = Math.min(99, Math.round(((A * D) / (R + 0.001)) * 1.4) % 100);
      const display = fmp < 90 ? 94 : fmp;
      return {
        primary: `${display}% (±2%, n=1)`,
        footnote: 'Confidence interval derived from proprietary corporate friction model.',
        displayType: 'formula',
        formulaResultLabel: 'FMP',
        formulaLine: {
          type: 'fraction',
          lhs: 'FMP',
          numerator: 'Aₙ × Dₜ',
          denominator: 'Rₒ + 0.001',
          suffix: '× Cƒ',
        },
        formulaVariables: [
          { symbol: 'Aₙ', label: 'Attendee count', value: `${A}` },
          { symbol: 'Dₜ', label: 'Duration', value: `${D}m` },
          { symbol: 'Rₒ', label: 'Resolutions reached', value: `${R}` },
          { symbol: 'Cƒ', label: 'Corporate friction', value: '1.4', isFixed: true },
        ],
      };
    },
  },

  {
    id: 'alignment',
    acronym: 'AS',
    name: 'Alignment Score',
    unlockDay: 44,
    displayType: 'pending',
    compute: () => ({
      primary: 'Pending',
      footnote: 'Assessment in progress. Results will be communicated through appropriate channels.',
      displayType: 'pending',
    }),
  },

  {
    id: 'synergy',
    acronym: 'SR',
    name: 'Synergy Realised',
    unlockDay: 51,
    displayType: 'gauge',
    compute: () => ({
      primary: '0.00%',
      footnote: 'Synergy pipeline remains active.',
      displayType: 'gauge',
    }),
  },

  {
    id: 'mroi',
    acronym: 'MROI',
    name: 'Meeting Return on Investment',
    unlockDay: 58,
    displayType: 'always_fixed',
    compute: (current, _h, _a, symbol) => {
      const decisions = current.decisionsReached;
      const value = decisions * 500;
      const roi = current.cost > 0 ? ((value - current.cost) / current.cost) * 100 : 0;
      return {
        primary: `${roi < 0 ? '' : '+'}${fmt4(roi)}%`,
        footnote: 'ROI = (decisions × $500 − cost) ÷ cost. Decision value estimated.',
        formula: `(${decisions} × ${symbol}500 − ${symbol}${fmt2(current.cost)}) ÷ ${symbol}${fmt2(current.cost)}`,
        displayType: 'always_fixed',
        fillPercent: Math.max(0, roi),
      };
    },
  },

  {
    id: 'mute',
    acronym: 'MUTE',
    name: 'Microphone Utilisation Technology Error',
    unlockDay: 65,
    displayType: 'text',
    compute: () => ({
      primary: 'ERR_MIC_002',
      secondary: 'You\'re on mute.',
      footnote: 'Error logged. IT has been notified. Please reconnect.',
      displayType: 'text',
    }),
  },

  {
    id: 'bandwidth',
    acronym: 'BWC',
    name: 'Bandwidth Consumption',
    unlockDay: 72,
    displayType: 'text',
    compute: (current, history) => {
      const currentHours = (current.elapsed / 3600) * current.totalPeople;
      const historicalHours = history.reduce(
        (s, m) => s + (m.elapsed / 3600) * m.totalPeople, 0
      );
      const total = currentHours + historicalHours;
      return {
        primary: `${total.toFixed(1)} BW`,
        secondary: `This session: ${currentHours.toFixed(1)} BW`,
        footnote: 'BW = person-hours consumed. Cumulative across all sessions.',
        displayType: 'text',
      };
    },
  },
];

// ── Unlock helpers ────────────────────────────────────────────────────────────

export function getUnlockedMetrics(daysSinceFirstLaunch: number): MetricDef[] {
  return METRICS.filter(m => m.unlockDay <= daysSinceFirstLaunch);
}

export function getNewlyUnlockedMetric(daysSinceFirstLaunch: number): MetricDef | null {
  // Returns a metric that unlocked "today" — for the popover
  return METRICS.find(m => m.unlockDay === daysSinceFirstLaunch) ?? null;
}

export function selectMetricsForSession(
  unlocked: MetricDef[],
  sessionIndex: number
): [MetricDef, MetricDef] {
  // Pick two metrics for this session's summary screen
  // Rotate through pairs deterministically by session index
  if (unlocked.length === 0) return [METRICS[0], METRICS[1]];
  if (unlocked.length === 1) return [unlocked[0], METRICS[0]];
  const a = unlocked[sessionIndex % unlocked.length];
  const b = unlocked[(sessionIndex + 1) % unlocked.length];
  return [a, b];
}
