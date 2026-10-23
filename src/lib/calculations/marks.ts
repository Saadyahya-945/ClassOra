import { Assessment, AssessmentGroup, AssessmentScore } from '@/types/database';

export interface CalculatedGroupScore {
  groupId: string;
  groupName: string;
  obtainedScaled: number;
  maxScaled: number;
  includedAssessments: {
    assessmentId: string;
    title: string;
    score: number | 'AB' | '-';
    maxMarks: number;
    isIncludedInBest: boolean;
  }[];
}

export function calculateStudentGroupScore(
  group: AssessmentGroup,
  assessments: Assessment[],
  scores: AssessmentScore[],
  enrollmentId: string
): CalculatedGroupScore {
  const groupAssessments = assessments.filter(a => a.group_id === group.id);
  const scoreMap = new Map<string, AssessmentScore>();

  for (const s of scores) {
    if (s.enrollment_id === enrollmentId) {
      scoreMap.set(s.assessment_id, s);
    }
  }

  const items = groupAssessments.map(a => {
    const sc = scoreMap.get(a.id);
    let displayScore: number | 'AB' | '-' = '-';
    let numericValue = 0;
    let percentage = 0;

    if (sc) {
      if (sc.is_absent) {
        displayScore = 'AB';
        numericValue = 0;
      } else if (sc.marks_obtained !== null && sc.marks_obtained !== undefined) {
        displayScore = Number(sc.marks_obtained);
        numericValue = displayScore;
      }
    }

    if (a.max_marks > 0 && typeof displayScore === 'number') {
      percentage = (numericValue / a.max_marks) * 100;
    }

    return {
      assessmentId: a.id,
      title: a.title,
      score: displayScore,
      maxMarks: a.max_marks,
      numericValue,
      percentage,
      isIncludedInBest: false,
    };
  });

  let obtainedScaled = 0;
  const maxScaled = Number(group.max_group_weight) || 10;

  if (items.length > 0) {
    if (group.rule_type === 'best_of_k') {
      const k = Math.min(group.best_k_count || 2, items.length);
      // Sort items descending by percentage
      const sortedIndices = items
        .map((item, idx) => ({ idx, pct: item.percentage, score: item.numericValue }))
        .sort((a, b) => b.pct - a.pct);

      let totalPctSum = 0;
      for (let i = 0; i < k; i++) {
        const itemIdx = sortedIndices[i].idx;
        items[itemIdx].isIncludedInBest = true;
        totalPctSum += sortedIndices[i].pct;
      }

      const avgPct = totalPctSum / k;
      obtainedScaled = (avgPct / 100) * maxScaled;
    } else if (group.rule_type === 'average') {
      const totalPctSum = items.reduce((acc, curr) => {
        curr.isIncludedInBest = true;
        return acc + curr.percentage;
      }, 0);
      const avgPct = totalPctSum / items.length;
      obtainedScaled = (avgPct / 100) * maxScaled;
    } else {
      // Direct sum scaled
      let totalRaw = 0;
      let totalMax = 0;
      for (const item of items) {
        item.isIncludedInBest = true;
        totalRaw += item.numericValue;
        totalMax += item.maxMarks;
      }
      obtainedScaled = totalMax > 0 ? (totalRaw / totalMax) * maxScaled : 0;
    }
  }

  return {
    groupId: group.id,
    groupName: group.group_name,
    obtainedScaled: Math.round(obtainedScaled * 10) / 10,
    maxScaled,
    includedAssessments: items.map(({ assessmentId, title, score, maxMarks, isIncludedInBest }) => ({
      assessmentId,
      title,
      score,
      maxMarks,
      isIncludedInBest,
    })),
  };
}
