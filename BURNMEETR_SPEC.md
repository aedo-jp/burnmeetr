# Burn Meetr — Screen Flow, Design & Build Spec
**Version 2.0 — August 2026**
**Ash Every / AEDO (aedo.jp)**

---

> *The joke is in what the numbers say, not in the presentation.*

---

## 1. App Identity

Burn Meetr is a satirical meeting cost tracker. It is not a member of the AEDO Precision Utility Suite but references the same design philosophy. The satire is dry, corporate, and never breaks character. The presentation looks exactly like a real enterprise dashboard. The audience is trusted to get it.

**Tone reference:** Wankernomics. Fluent in corporate language. Uses that fluency to expose the hollowness. Never winks at the camera.

**Tagline:** *Every second costs.*

**Name logic:** BURNMEETR — "burn" as in burn rate, "meetr" as in the app-era dropped vowel, and "meet" embedded in the word. The name contains the thing it measures.

**Bundle ID:** jp.aedo.burnmeetr
**Platform:** iOS primary (React Native / Expo SDK 57). Android architecture-ready, not yet tested.
**Model:** Free. No ads. No subscription. No account required.
**Future tier:** Meeting history export, data reporting — v2 consideration only.

---

## 2. Colour System

CGA-adjacent terminal palette. Specific values are final.

| Role | Value | Notes |
|---|---|---|
| Background | `#000000` | True black throughout |
| Primary text / numbers | `#F0F0F0` | Near-white |
| Surface | `#0D0D0D` | Card/zone backgrounds |
| Surface raised | `#111111` | Elevated cards |
| Red — primary accent | `#CC2200` | Panic button dome, stop button, critical data |
| Red bright | `#FF3322` | Cents digits, overrun state |
| Teal — data colour | `#00AA88` | Graph lines, metric values, active states |
| Teal bright | `#00DDAA` | Highlighted values |
| Text secondary | `rgba(240,240,240,0.72)` | Secondary labels |
| Text muted | `rgba(240,240,240,0.50)` | Metadata, footnotes |
| Text dead | `rgba(240,240,240,0.28)` | Decorative structure |
| Rule / hairline | `rgba(255,255,255,0.12)` | Zone separators |

**Splash / icon background:** `#FF0000` — pure red, more graphic/intense than the in-app red.

**Colour logic:**
- Red appears on the panic button and in data contexts (cents digits, overrun, critical values)
- Teal is the neutral data colour — graph lines, metric values, active states
- No gradients. No multiple accent colours per screen.

---

## 3. Typography

| Context | Typeface | Treatment |
|---|---|---|
| All numerical output | JetBrains Mono Bold | Large, high contrast, tabular figures |
| UI labels / metadata | JetBrains Mono Regular | Uppercase, tracked, ~50% opacity |
| Body / setup labels | Inter Regular | Mixed case |
| Verdict line | JetBrains Mono Regular | Full width, small |

**Type scale (pt):**
- Odometer hero: 56pt (portrait), 72pt (landscape)
- Metric hero values: 22–40pt depending on context
- Graph labels: 7–11pt
- UI labels: 9pt uppercase tracked
- Body: 13pt
- Footnote: 10pt

**Hierarchy rule:** Labels quiet down, content speaks up. ALL CAPS MONO labels recede. Primary values are large, confident, high contrast.

---

## 4. Spacing & Grid

Base unit: 8pt. All spacing is multiples of 8. Tap targets minimum 44pt. Hard edges on structural elements — no excessive border-radius softening.

---

## 5. App Icon & Splash

**Icon:** Geometric BM monogram — two reflected B forms creating an M, with a four-pointed star in the negative space where they meet. White mark on `#FF0000` red background. 1024×1024px.

**Splash:** Full lockup — mark + BURNMEETR (Helvetica Neue Bold, all caps) + *"Every second costs."* (EB Garamond italic). White on `#FF0000`. `splash-icon.png` in assets folder.

**Splash duration:** `expo-splash-screen` holds for 2 seconds then dismisses.

---

## 6. Screen Flow

```
SETUP → [READY] → IDLE (odometer at zeros) → [START] → RUNNING → [END] → PROCESSING → SUMMARY → [NEW MEETING] → SETUP

Easter egg path:
RUNNING (hit exact allocated time ±2s) → [END] → PROCESSING (special lines) → BRKR game → SUMMARY
```

---

## 7. Setup Screen

**Register:** Calm. Clinical. The straight man in the scene. Easy to complete and move on from.

**Elements top to bottom:**
- BURNMEETR wordmark + red dot — top left
- Currency selector — horizontal pill row, device locale default. Supported: USD, GBP, EUR, AUD, JPY, SGD, CAD
- Allocated time — pills: 15 / 30 / 45 / 60 / 90 / Custom. Default 60m. Custom saves on keyboard dismiss (onBlur) AND return key.
- Attendee roles — all 5 default roles visible with steppers (0–20). Count 0 = dimmed but row present.
- Custom role sheet — quick-add chips: CEO, CFO, Consultant, Intern, Janitor, Receptionist, CEO's Driver, Lawyer, PR Manager, Project Manager
- Preview strip — total people / cost per minute / cost per hour. Always reserved (shows — when zero).
- READY button — red bordered rectangle, full width. "Add attendees to continue" when disabled.
- Reset all data link — recessive, very bottom. Only visible when sessions exist. Two-step confirmation modal.

**Inline rate editing:** Tap any `$XX/hr` rate text to edit inline. Saves to device storage, persists across sessions.

**Default state:** Senior × 4, all others 0. Currency from device locale. 60 min allocated.

---

## 8. Idle / Running Screen

**Shared screen — two states.** The panic button lives here permanently.

**Layout top to bottom:**
- Status strip: READY / LIVE / OVERRUN dot + label, elapsed time, allocated time
- Progress bar: 1pt hairline, fills teal, snaps red on overrun
- Odometer hero: centred, `000,000.00` format (JPY: `00,000,000`). Leading zeros always present. Cents digits in `Colors.red`. Glass lens overlay.
- Rate subtext: `$X.XXXX/sec`
- Group cost strip: horizontal scroll, always visible. Shows $0.00 when idle.
- EDIT SETUP ← link: visible (idle) / invisible but space reserved (running)
- Panic button: red dome. START (idle) / END (running). Haptic on press.
- ANALYTICS info bar: pinned to bottom. Rotates stats every 4 seconds, hard cut. Idle state shows only static/fabricated stats.

**Odometer:** Cyclometer/odometer drum logic. Each digit on a vertical strip, rolls forward always. Carries correctly. 200ms update tick (5fps) for animation stability. Subtle glass lens overlay — edge vignettes, specular highlight, bezel border.

**Landscape:** Odometer scales up (72/88pt), info bar and group strip hide. Approaches bedside clock register.

**Overrun state:** OVERRUN label pulses slowly (1.8s). Background shifts to `#0E0000`. Progress bar glows red. No dramatic alarm — slow deterioration.

**Screen stays awake:** `expo-keep-awake` active during running state.

**Currency:** All costs stored in USD at save time (converted via live FX rate). Graph and summary display in selected currency by converting back.

---

## 9. Processing Screen

**Duration:** ~4 seconds. Black screen, mono type, sequential line reveal (560ms stagger).

**Standard lines:**
```
Compiling attendance data...
Calculating synergy variables...
Rationalising expenditure...
Auditing circle-back utilisation...
Benchmarking against industry standards...
Report ready.
```

**Easter egg lines (exact timing trigger):**
```
Compiling attendance data...
Calculating synergy variables...
Rationalising expenditure...
Alignment achieved.
Initialising BRKR protocol...
```

Last line near-white, others dimmed. Hard cut to next screen after hold.

---

## 10. BRKR Easter Egg Game

**Trigger:** End a meeting within ±2 seconds of allocated time.

**Aesthetic:** Black background. Teal bricks. White ball. Teal paddle (70% opacity). Score + lives in tiny mono top corners. "BRKR" in `Colors.textDead` — barely visible title.

**Mechanics:** Standard brick breaker. 3 lives. 4 rows × 8 cols of bricks. Ball speed 5.5. Paddle controlled by dragging anywhere on screen.

**Game over / win text:** *"Session complete. Returning to expenditure data."* in `Colors.red`, centred. Holds 2.5 seconds then cuts to summary.

**Appears once per trigger** — subsequent perfect-timing meetings get a subtle verdict note only.

---

## 11. Summary Screen

**Register:** Bloomberg terminal. Data-dense. Deadpan corporate dashboard.

**Three zones separated by hairline rules:**

### Zone 1 — MEET:AX Graph
- Dot/line graph. X = session number, Y = cost in display currency
- Period pills: ALL · 1W · 1M · 3M
- Tap dot → info strip shows: Session # / Date / Cost / Duration
- Long press dot → delete confirmation in strip: *"Delete session #X? This cannot be undone."* → CANCEL + DELETE → *"Redacted."* (holds 2s, dot removed, line redraws)
- Running total + fake MEET:AX ticker

### Zone 2 — Data Strip
Four columns: THIS SESSION cost / DURATION / PER PERSON / STATUS. Always visible, flat on black.

### Zone 3 — Performance Metrics
Two metric cards side by side. Surface `Colors.surfaceRaised`, zone surface `Colors.surface` with shadow. Cards animate in with staggered fade+slide on screen appear.

### Zone 4 — Executive Verdict
One line. McKinsey register. Never explains itself. Star rating embedded after 10 sessions (always 1–2 stars).

### Zone 5 — Session Totals
Three columns: TOTAL SESSIONS / TOTAL EXPENDITURE / AVERAGE COST. Teal values.

**Actions:**
- NEW MEETING ↑ — top right, always visible
- SEND INVOICE — bottom, full width. Opens iOS native share sheet with plain text receipt.

---

## 12. Metric Library

### v1 Launch (day 0)

**GOLF — General Overhead Leverage Factor**
Display: `visual_golf` — flag emoji + score text
Score: Par = allocated time. Under = Birdie/Eagle/Albatross. Over = Bogey/Double/Triple.
Commentary per score (shown in expanded):
- Albatross/Eagle: *"Exceptional performance. Anomalous. Under review."*
- Birdie: *"Ahead of par. Unlikely to be repeated."*
- Par: *"Meeting achieved baseline corporate functionality."*
- Bogey: *"Slightly over par. Consider fewer attendees next time."*
- Double Bogey: *"A difficult round. Stakeholders have been notified."*
- Triple Bogey+: *"This meeting has been flagged for internal review."*

**CORE — Cost Of Real Estate**
Display: `formula` — typewriter reveal
Formula: `Cᵣ = (Rₕ / 60) × Dₜ`
WHERE: Rₕ = Hourly room rate ($150/hr) / 60 = Minutes per hour (fixed) / Dₜ = Duration

### Unlock sequence (day-based from first launch)

| Day | Metric | Display type |
|---|---|---|
| 0 | GOLF, CORE | visual_golf, formula |
| 3 | CBU — Circle Back Utilisation | visual_donut (always 100%) |
| 7 | CPD — Cost Per Decision | infinity (∞ when 0 decisions) |
| 14 | FIRED — Fully Integrated Resource Expenditure Determination | loading bar (never resolves) |
| 21 | AUR — Attendee Utilisation Rate | always_fixed dot grid (34%) |
| 30 | TLR — Talk:Listen Ratio | visual_bar (vertical columns) |
| 37 | FMP — Follow-up Meeting Probability | formula (always 94%) |
| 44 | AS — Alignment Score | pending (spinner, never resolves) |
| 51 | SR — Synergy Realised | gauge (flutter needle at 0%) |
| 58 | MROI — Meeting Return on Investment | formula (always ≈ -100%) |
| 65 | MUTE — Microphone Utilisation Technology Error | text |
| 72 | BWC — Bandwidth Consumption | text (people-hours cumulative) |

**Note:** Unlock thresholds were compressed to 0/1/2/3 for testing. Restore to above schedule before App Store submission.

### Metric card behaviour
- Card: graphic is hero, ACRONYM label top-left recessive, footnote below
- Tap to expand: full-screen modal. Full name prominent (17pt), acronym small above. Graphic scales to fill modal width.
- WHERE block (formula metrics): hidden on card, shown in expanded only
- Formula graphic: typewriter reveal — FORMULA section, then WHERE variables one by one, then RESULT pulses in.

### Fabricated analytics pool (info bar rotation)
30+ items including: "Decisions reached: 0", "Synergy pipeline remains active.", "Parking lot items: growing", "Probability this needed to happen: 12%", "Follow-up meetings generated: 1 (est.)", "Bandwidth consumed: significant", etc.

---

## 13. Executive Verdict System

Generated from meeting data thresholds. Never explains itself.

| Condition | Example verdict |
|---|---|
| First meeting | "Baseline established. Further data required." |
| Cost < $50 | "Meeting performance was within acceptable parameters." |
| Cost $50–150 | "Expenditure noted. Efficiency remains a developing opportunity." |
| Cost $150–500 | "Cost metrics are being reviewed at leadership level." |
| Cost > $500 | "This session represents a significant resource allocation event." |
| Overrun | "Time allocation exceeded projections. A debrief has been recommended." |
| New record | "This meeting represents your highest cost event to date. Noted." |
| After 10 sessions | Star rating: "Q[X] Meeting Effectiveness: ★☆☆☆☆" |

---

## 14. Send Invoice — Plain Text Format

Shared via iOS native share sheet (`Share.share()`). Button labelled "SEND INVOICE".

```
BURNMEETR
Meeting Invoice #[session number]
━━━━━━━━━━━━━━━━━━━━━

Date: [date]
Duration: [elapsed]
Attendees: [total people]
Status: [On time / +Xm overrun]

ATTENDEES
[count]× [role]    [symbol][cost]
...

━━━━━━━━━━━━━━━━━━━━━
TOTAL              [symbol][cost]
Per person         [symbol][cost]

[active metric 1]: [value]
[active metric 2]: [value]

Executive Summary:
[verdict line]

Every second costs.

burnmeetr.com
```

---

## 15. Reset All Data

Two-step confirmation modal:
1. Tap "Reset all data" link (bottom of setup, only visible when sessions > 0)
2. Modal shows session count + total expenditure to be deleted
3. DELETE ALL DATA button — first tap arms it, label changes to "TAP AGAIN TO CONFIRM" (4 second window)
4. Second tap executes. App returns to setup, all data cleared.

---

## 16. Data Architecture

**Local storage only** via AsyncStorage. No account. No server sync.

**Per meeting record:**
- id, date, currency, cost (USD — always), costDisplay (original currency), elapsed, allocatedMinutes, overrunSeconds, attendees, totalPeople, decisionsReached

**Global:**
- All meetings array (MEET:AX graph)
- First launch date (unlock day tracking)
- Custom roles and rates

**Currency handling:** Cost always stored in USD. Display currency converted at read time using current FX rates from frankfurter.app (offline fallback to static rates).

---

## 17. burnmeetr.com — Website

**One-page site.** Static HTML. Hosted on GitHub Pages or Vercel. Zero backend.

### Layer 1 — Corporate facade
Loads as a legitimate-looking MEET:AX dashboard. Black background, teal scrolling line graph (algorithmically generated random walk), mono type, corporate labels. Fake statistics. App Store download link. Looks exactly like a Bloomberg terminal product page.

### Layer 2 — The unlock
The word "synergy" appears once in the body copy as a subtle hyperlink. Footer reads: *"© 2026 Burnmeetr. All synergies reserved."*
- Desktop: click "synergy" link, or type the word "synergy" (keyboard detection, no input field)
- Mobile: tap the graph 5 times in quick succession

On trigger: graph flatlines to `MEET:AX 0.00 ▼100%` for 1 second. Small white character drops onto the line from above.

### Layer 3 — The endless runner
The MEET:AX graph line becomes terrain. A white geometric character (8×16 rectangle, single red pixel as "eye") runs along the line as it scrolls left.

**Aesthetic:** Swiss grid / Teenage Engineering. Everything geometric, precise, no pixel art. Character is minimal but expressive via the single red pixel.

**Mechanics:**
- Tap/click/spacebar to jump
- Obstacles: perfectly proportioned red rectangles labelled in 5pt mono — "MTG" (narrow), "SYNC" (medium), "ALL HANDS" (wide), "STRATEGY DAY" (rare, very wide)
- Terrain undulates based on the same algorithm as the facade graph — peaks and crashes
- Speed increases gradually over time
- Volatility increases — deeper crashes, higher peaks as time goes on
- Score displayed as dollar amount: "Survived: $4,247"

**Game over:** *"The host has ended the meeting."* — appears in the same mono type, red, centred. Holds 3 seconds then fades back to the corporate facade.

**Character leaves trail:** brief teal trace behind the figure as it runs.

---

## 18. What Doesn't Belong

Consistent with AEDO design guide:
- Gradients as UI surfaces
- Onboarding carousels
- Celebration animations on meeting end
- Push notifications
- Gamification — no streaks, no badges (BRKR is an easter egg, not a feature)
- Any irony visible in navigation chrome
- The word "free" appearing anywhere in the app
- Emoji in UI contexts (emoji in joke role names on setup only)
- Ads of any kind

---

*Ash Every / AEDO — aedo.jp*
*August 2026*
