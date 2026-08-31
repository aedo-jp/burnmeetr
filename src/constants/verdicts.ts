import { MeetingRecord, MeetingAnalytics } from '../storage/meetingStorage';

export type Verdict = {
  text: string;
  stars?: number; // 0–5, shown after 10 meetings
};

// Pick one item from an array deterministically by meeting index
function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

export function generateVerdict(
  current: MeetingRecord,
  analytics: MeetingAnalytics,
): Verdict {
  const idx = analytics.currentMeetingIndex;
  const cost = current.cost;
  const overrun = current.overrunSeconds > 0;
  const isRecord = analytics.isNewRecord;
  const totalMeetings = analytics.totalMeetings;

  // New record — always surfaces this first
  if (isRecord && totalMeetings > 1) {
    return {
      text: pick([
        'This session represents your highest cost event to date. Noted.',
        'A new expenditure benchmark has been established. Leadership has been informed.',
        'This meeting has set a new organisational cost record. The bar has been raised.',
      ], idx),
    };
  }

  // First ever meeting
  if (totalMeetings === 1) {
    return {
      text: pick([
        'Baseline established. Further data required.',
        'Initial data point recorded. Trend analysis pending.',
        'Session one complete. Insufficient data to benchmark performance at this time.',
      ], idx),
    };
  }

  // Overrun
  if (overrun) {
    return {
      text: pick([
        'Time allocation exceeded projections. A debrief has been recommended.',
        'Session extended beyond declared parameters. Stakeholders have been made aware.',
        'Duration variance noted. Root cause analysis is pending calendar availability.',
        'Projected end time was not achieved. This will be factored into future estimates.',
      ], idx),
    };
  }

  // Cost thresholds
  if (cost < 50) {
    return {
      text: pick([
        'Meeting performance was within acceptable parameters.',
        'Cost efficiency metrics indicate a satisfactory outcome.',
        'Expenditure remained within expected variance. Well within budget.',
        'This session demonstrated appropriate resource stewardship.',
      ], idx),
    };
  }

  if (cost < 150) {
    return {
      text: pick([
        'Expenditure noted. Efficiency remains a developing opportunity.',
        'Cost metrics are being monitored. Performance is within normal range.',
        'Resource allocation was consistent with similar sessions in the period.',
        'Meeting cost is on trend. No corrective action recommended at this time.',
      ], idx),
    };
  }

  if (cost < 500) {
    return {
      text: pick([
        'Cost metrics are being reviewed at leadership level.',
        'This session represents a moderate resource allocation event.',
        'Expenditure is above median. A cost-benefit review has been flagged.',
        'Resource consumption was noted. Agenda efficiency opportunities exist.',
      ], idx),
    };
  }

  if (cost < 1000) {
    return {
      text: pick([
        'This session represents a significant resource allocation event.',
        'Expenditure at this level warrants executive visibility.',
        'Cost performance is under review. Recommendations will follow.',
        'Resource deployment was substantial. Outcome documentation is advised.',
      ], idx),
    };
  }

  // $1000+
  return {
    text: pick([
      'Resource consumption at this level is being escalated for review.',
      'This meeting has entered the top quartile of organisational cost events.',
      'Expenditure has been flagged. A meeting to discuss this meeting is being scheduled.',
      'Cost at this threshold requires documented justification. Please prepare a brief.',
    ], idx),
  };
}

// Star rating — only shown after 10 meetings
// Always 1.5–2 stars. Never explained.
export function getStarRating(analytics: MeetingAnalytics): string | null {
  if (analytics.totalMeetings < 10) return null;

  const quarter = Math.ceil(new Date().getMonth() / 3);
  const year = new Date().getFullYear();

  // Always 1 or 2 stars — never 3+
  const stars = analytics.totalMeetings % 4 === 0 ? '★★☆☆☆' : '★☆☆☆☆';

  return `Q${quarter} ${year} Meeting Effectiveness: ${stars}`;
}
