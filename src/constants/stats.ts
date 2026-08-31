// Stats pool for the info bar on the running screen.
// Mix of real (computed at runtime) and fabricated (deadpan corporate).
// Fabricated ones are strings; real ones are functions that receive context.

export type StatContext = {
  cost: number;
  elapsed: number; // seconds
  allocated: number; // minutes
  totalPeople: number;
  costPerPerson: number;
  perMinute: number;
  currency: string;
  symbol: string;
  isOverrun: boolean;
  overrunSeconds: number;
  isIdle: boolean;
};

export type StatItem =
  | { type: 'static'; text: string }
  | { type: 'dynamic'; fn: (ctx: StatContext) => string };

export const STATS_POOL: StatItem[] = [
  // Real data
  { type: 'dynamic', fn: (c) => `Cost per person: ${c.symbol}${c.costPerPerson.toFixed(2)}` },
  { type: 'dynamic', fn: (c) => `Burn rate: ${c.symbol}${c.perMinute.toFixed(2)} / min` },
  { type: 'dynamic', fn: (c) => `${c.totalPeople} people in this room` },
  { type: 'dynamic', fn: (c) => c.isOverrun
    ? `Overrun: ${Math.floor(c.overrunSeconds / 60)}m ${c.overrunSeconds % 60}s`
    : `Time remaining: ${Math.floor((c.allocated * 60 - c.elapsed) / 60)}m ${(c.allocated * 60 - c.elapsed) % 60}s`
  },
  { type: 'dynamic', fn: (c) => `Budget utilisation: ${Math.min(999, Math.round((c.elapsed / (c.allocated * 60)) * 100))}%` },

  // Fabricated — deadpan corporate
  { type: 'static', text: 'Decisions reached: 0' },
  { type: 'static', text: 'Action items assigned: 0' },
  { type: 'static', text: 'Agenda items completed: 0 of 1' },
  { type: 'static', text: 'Slides advanced: unknown' },
  { type: 'static', text: 'Meeting efficiency score: D−' },
  { type: 'static', text: 'ROI vs. async message: −94%' },
  { type: 'static', text: 'Probability this needed to happen: 12%' },
  { type: 'static', text: 'Follow-up meetings generated: 1 (est.)' },
  { type: 'static', text: 'Percentage who could have received an email: 83%' },
  { type: 'static', text: 'Synergies identified: 0' },
  { type: 'static', text: 'Bandwidth consumed: significant' },
  { type: 'static', text: 'Stakeholders aligned: pending' },
  { type: 'static', text: 'Leverage achieved: none' },
  { type: 'static', text: 'Deliverables: TBC' },
  { type: 'static', text: 'Coffee consumed: est. 3 cups' },
  { type: 'static', text: 'Cadence maintained: yes' },
  { type: 'static', text: 'Next steps: unclear' },
  { type: 'static', text: 'Productivity index: 0.3 (↓)' },
  { type: 'static', text: 'Parking lot items: growing' },
  { type: 'static', text: 'Circle back probability: 100%' },
  { type: 'static', text: 'Low-hanging fruit: unidentified' },
  { type: 'static', text: 'Boil the ocean risk: elevated' },
  { type: 'static', text: 'Moving the needle: not yet' },
  { type: 'static', text: 'Deep dive commenced: no' },
  { type: 'static', text: 'Thought leadership: 0 units' },
  { type: 'static', text: 'Disruption: minimal' },
  { type: 'static', text: 'Touch base frequency: excessive' },
  { type: 'static', text: 'Pivot likelihood: moderate' },
];

// Receipt kicker lines — shown at bottom of summary, scaled to cost
export const KICKER_LINES: { threshold: number; lines: string[] }[] = [
  {
    threshold: 0,
    lines: [
      'A Slack message was available.',
      'Efficient. Suspicious, but efficient.',
      'Almost justifiable.',
    ],
  },
  {
    threshold: 50,
    lines: [
      'Could have been an email.',
      'A very expensive coffee.',
      'You\'ll never get that time back.',
    ],
  },
  {
    threshold: 150,
    lines: [
      'That\'s a nice dinner for two.',
      'A round of drinks for the whole team.',
      'Three months of a streaming subscription.',
    ],
  },
  {
    threshold: 500,
    lines: [
      'That\'s someone\'s weekly salary.',
      'A return flight to somewhere nicer than this office.',
      'We\'ll send you our invoice.',
    ],
  },
  {
    threshold: 1000,
    lines: [
      'A return flight to Tokyo.',
      'A month\'s rent in most cities.',
      'An actual consultant who might have helped.',
    ],
  },
  {
    threshold: 5000,
    lines: [
      'A secondhand car.',
      'Enough to have just hired someone to fix the problem.',
      'Genuinely impressive waste. Respect.',
    ],
  },
];

export const getKickerLine = (cost: number): string => {
  const tiers = [...KICKER_LINES].reverse();
  const tier = tiers.find((t) => cost >= t.threshold) ?? KICKER_LINES[0];
  return tier.lines[Math.floor(Math.random() * tier.lines.length)];
};
