// Cascading average: term 1 = raw score. Term 2 = average(term1, term2).
// Term 3 = average(term2's cascade value, term3) — NOT a flat average of
// all three raw scores. This means later terms are weighted more heavily,
// since each new term is folded against the *previous cascade result*,
// not against the original raw scores directly.
//
// Example: term1=60, term2=80, term3=100
//   cascade after term1 = 60
//   cascade after term2 = avg(60, 80) = 70
//   cascade after term3 = avg(70, 100) = 85
// (compare to a flat mean of all three, which would be 80 — noticeably
// different, which is why this needed to be a deliberate, confirmed choice)

export interface CascadeResult {
  // the cascade value BEFORE folding in the most recent term — this is
  // what gets displayed as the "prior period" column (e.g. term 2's
  // report shows term 1's raw total here; term 3's report shows term
  // 1+2's cascade value here)
  priorPeriodValue: number | null;
  // the cascade value AFTER folding in the most recent term — this is
  // the final "Average marks" / cumulative value used for grading
  finalValue: number | null;
}

// rawScoresAscending: raw totals in chronological term order, skipping
// any term where no score was entered (missing terms are simply not
// counted, rather than treated as zero).
export const foldCascade = (rawScoresAscending: number[]): CascadeResult => {
  const scores = rawScoresAscending.filter((s) => s !== null && s !== undefined);

  if (scores.length === 0) {
    return { priorPeriodValue: null, finalValue: null };
  }

  let priorPeriodValue: number | null = null;
  let running = scores[0];

  for (let i = 1; i < scores.length; i++) {
    priorPeriodValue = running;
    running = (running + scores[i]) / 2;
  }

  return {
    priorPeriodValue: scores.length > 1 ? priorPeriodValue : null,
    finalValue: running,
  };
};