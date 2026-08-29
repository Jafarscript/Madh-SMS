// Shared ranking logic used by both the broadsheet (single-term) and
// report card (cumulative-average) endpoints, so position calculation
// only lives in one place.

interface Rankable {
  studentId: string;
  score: number;
}

export interface Ranked extends Rankable {
  position: number;
}

export const computePositions = (items: Rankable[]): Ranked[] => {
  const sorted = [...items].sort((a, b) => b.score - a.score);

  let currentPosition = 0;
  let lastScore: number | null = null;
  let studentsAtLastScore = 0;

  return sorted.map((item) => {
    if (item.score !== lastScore) {
      currentPosition += studentsAtLastScore || 1;
      studentsAtLastScore = 1;
      lastScore = item.score;
    } else {
      studentsAtLastScore += 1;
    }
    return { ...item, position: currentPosition };
  });
};