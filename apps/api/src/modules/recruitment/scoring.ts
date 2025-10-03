// Simple, deterministic scoring service (extendable).
// Inputs: application fields + job (title, description, branch, region)
// Output: { score, decision, reasons[] }
export type ScoreResult = { score: number; decision: 'AUTO-REJECT' | 'REVIEW' | 'SHORTLIST'; reasons: string[] };

type Params = {
  applicantType: 'INTERNAL' | 'EXTERNAL';
  jobTitle: string;
  jobDescription: string;
  branch?: string;
  region?: string;
  resumeText?: string;
};

const defaultMust = ['loan', 'microfinance'];
const defaultNice = ['collections','credit','field','portfolio','kpi'];

export function scoreApplication(p: Params & { must?: string[], preferred?: string[], shortlistThreshold?: number, rejectThreshold?: number }): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const hay = `${p.jobTitle} ${p.jobDescription} ${p.resumeText || ''}`.toLowerCase();

  // Must-have gate (can auto-reject if none present)
  const hasMust = mustHaveKeywords.some(k => hay.includes(k));
  if (!hasMust) {
    reasons.push('Missing must-have domain keywords');
  } else {
    score += 20;
    reasons.push('Has must-have keywords');
  }

  // Nice to have
  const nh = niceToHave.filter(k => hay.includes(k)).length;
  score += nh * 5;
  if (nh > 0) reasons.push(`Matched ${nh} preferred keyword(s)`);

  // Internal applicant bonus
  if (p.applicantType === 'INTERNAL') {
    score += 10; reasons.push('Internal applicant bonus');
  }

  // Example: proximity bonus (placeholder)
  if ((p.region || '').toLowerCase().includes('nairobi')) {
    score += 5; reasons.push('Region match bonus');
  }

  // Decision thresholds (tune per job in future rule-set table)
  const shortlistThreshold = p.shortlistThreshold ?? 35;
  const rejectThreshold = p.rejectThreshold ?? 15;

  let decision: ScoreResult['decision'] = 'REVIEW';
  if (score >= shortlistThreshold) decision = 'SHORTLIST';
  else if (score < rejectThreshold || !hasMust) decision = 'AUTO-REJECT';

  return { score, decision, reasons };
}
