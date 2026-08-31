// BURNMEETR — Theme Constants
// Colour system: CGA-adjacent terminal palette
// Black ground / near-white text / CGA red accent / CGA green-teal data

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: '#000000',              // True black — the ground everything sits on
  surface: '#0D0D0D',         // Barely distinguishable from bg — card surfaces
  surfaceRaised: '#111111',   // One step above surface — elevated elements

  // ── Hairline rules ────────────────────────────────────────────────────────
  // Use rgba on any background — not a fixed hex
  rule: 'rgba(255, 255, 255, 0.12)',      // Standard hairline
  ruleSubtle: 'rgba(255, 255, 255, 0.06)', // Very subtle zone separator

  // ── CGA Red — the single accent colour ───────────────────────────────────
  // Panic button / cents digits / critical data / stop button
  // CGA palette red dialled to ~60% saturation for sophistication
  red: '#CC2200',             // Primary red — panic button dome, stop button
  redBright: '#FF3322',       // Bright red — cents digits, critical values
  redDim: 'rgba(204, 34, 0, 0.25)',      // Dimmed red — subtle backgrounds
  redFaint: 'rgba(204, 34, 0, 0.08)',    // Very faint — overrun tint on surface

  // ── CGA Green-teal — neutral data colour ─────────────────────────────────
  // Graph lines / active metric values / ANALYTICS label / LIVE dot
  // CGA teal dialled to ~60% saturation
  teal: '#00AA88',            // Primary teal — graph lines, metric values
  tealBright: '#00DDAA',      // Bright teal — active/highlighted values
  tealDim: 'rgba(0, 170, 136, 0.25)',    // Dimmed teal — subtle backgrounds
  tealFaint: 'rgba(0, 170, 136, 0.08)',  // Very faint — card tint

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary: '#F0F0F0',     // Near-white — primary numbers and content
  textSecondary: 'rgba(240, 240, 240, 0.72)', // Mid — secondary labels — WCAG AA compliant
  textMuted: 'rgba(240, 240, 240, 0.50)',     // Recessed — metadata, footnotes
  textDead: 'rgba(240, 240, 240, 0.28)',      // Very recessed — decorative structure

  // ── Pure values ──────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Fonts = {
  mono: 'JetBrainsMono',
  monoBold: 'JetBrainsMono-Bold',
  sans: 'Inter',
  sansMedium: 'Inter-Medium',
  sansBold: 'Inter-Bold',
} as const;

// Base unit: 8pt. All spacing is a multiple of 8.
export const Spacing = {
  xs: 4,   // Half unit — use sparingly
  sm: 8,   // 1 unit
  md: 16,  // 2 units
  lg: 24,  // 3 units
  xl: 32,  // 4 units
  xxl: 48, // 6 units
  xxxl: 64, // 8 units
} as const;

// Odometer display config per currency
// digits = integer drums shown (leading zeros always present)
// decimals = decimal drums (0 for JPY)
export const OdometerConfig: Record<string, {
  digits: number;
  decimals: number;
  symbol: string;
}> = {
  USD: { digits: 6, decimals: 2, symbol: '$' },
  GBP: { digits: 6, decimals: 2, symbol: '£' },
  EUR: { digits: 6, decimals: 2, symbol: '€' },
  AUD: { digits: 6, decimals: 2, symbol: 'A$' },
  JPY: { digits: 8, decimals: 0, symbol: '¥' },
  SGD: { digits: 6, decimals: 2, symbol: 'S$' },
  CAD: { digits: 6, decimals: 2, symbol: 'C$' },
};

// Typography scale — all in pt, multiples of base 8pt grid where possible
export const TypeScale = {
  // Odometer hero
  odometerLg: 56,   // Main digit size — full portrait
  odometerSm: 40,   // Landscape / compact
  odometerSym: 22,  // Currency symbol alongside odometer

  // Metric card values
  metricHero: 36,   // Primary metric value — large
  metricSub: 14,    // Secondary / footnote on metric card

  // Graph
  graphLabel: 9,    // Axis labels, ticker readout
  graphTicker: 11,  // MEET:AX ticker value

  // UI chrome
  label: 9,         // ALL CAPS MONO labels — recessive
  body: 13,         // Standard body copy
  footnote: 10,     // Footnotes, micro type
  verdict: 11,      // Verdict line at bottom of summary

  // Info bar
  infoBarLabel: 8,  // ANALYTICS / OVERRUN label
  infoBarText: 12,  // Rotating stat text
} as const;
