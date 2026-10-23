import { AttendanceRecord, AttendanceSession, Enrollment, MedicalLeaveRule } from '@/types/database';

export interface StudentAttendanceSummary {
  enrollmentId: string;
  totalWeightedClasses: number;
  attendedWeightedCredits: number;
  percentage: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  isDetained: boolean;
  classesNeededFor75: number;
  bufferClassesSafeToMiss: number;
}

/**
 * Calculates attendance metrics for a student based on sessions and records.
 * Respects effective_from_date (late admissions) and course medical leave rules.
 */
export function calculateStudentAttendance(
  enrollment: Enrollment,
  sessions: AttendanceSession[],
  records: AttendanceRecord[],
  medicalRule: MedicalLeaveRule = 'credit_present',
  thresholdPct: number = 75
): StudentAttendanceSummary {
  let totalWeightedClasses = 0;
  let attendedWeightedCredits = 0;
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  const recordsBySessionId = new Map<string, AttendanceRecord>();
  for (const r of records) {
    if (r.enrollment_id === enrollment.id) {
      recordsBySessionId.set(r.session_id, r);
    }
  }

  for (const session of sessions) {
    // Late joiner rule: exclude sessions prior to effective_from_date
    if (enrollment.effective_from_date && session.session_date < enrollment.effective_from_date) {
      continue;
    }

    const record = recordsBySessionId.get(session.id);
    const status = record ? record.status : 'P'; // Default P if not recorded
    const weight = Number(session.weight) || 1.0;

    if (status === 'NA') {
      continue;
    }

    if (status === 'P') {
      presentCount++;
      attendedWeightedCredits += weight;
      totalWeightedClasses += weight;
    } else if (status === 'A') {
      absentCount++;
      totalWeightedClasses += weight;
    } else if (status === 'M' || status === 'DL') {
      leaveCount++;
      if (medicalRule === 'credit_present') {
        attendedWeightedCredits += weight;
        totalWeightedClasses += weight;
      } else if (medicalRule === 'exempt_denominator') {
        // Exempted from total denominator
      } else {
        // record_only: counted in denominator, but not added to numerator
        totalWeightedClasses += weight;
      }
    }
  }

  const percentage = totalWeightedClasses > 0
    ? (attendedWeightedCredits / totalWeightedClasses) * 100
    : 100.0;

  const T = thresholdPct / 100;
  const C = totalWeightedClasses;
  const A = attendedWeightedCredits;

  let classesNeededFor75 = 0;
  let bufferClassesSafeToMiss = 0;

  if (C > 0) {
    if (percentage < thresholdPct) {
      // Formula: ceil((T * C - A) / (1 - T))
      if (1 - T > 0) {
        const needed = Math.ceil((T * C - A) / (1 - T));
        classesNeededFor75 = Math.max(0, needed);
      }
    } else {
      // Formula: floor((A - T * C) / T)
      if (T > 0) {
        const buffer = Math.floor((A - T * C) / T);
        bufferClassesSafeToMiss = Math.max(0, buffer);
      }
    }
  }

  return {
    enrollmentId: enrollment.id,
    totalWeightedClasses,
    attendedWeightedCredits,
    percentage: Math.round(percentage * 10) / 10,
    presentCount,
    absentCount,
    leaveCount,
    isDetained: percentage < thresholdPct,
    classesNeededFor75,
    bufferClassesSafeToMiss,
  };
}

/**
 * Calculates "What-If" projected percentage for attendance simulation.
 */
export function simulateAttendancePercentage(
  currentAttended: number,
  currentTotal: number,
  futureCount: number,
  futureAction: 'attend' | 'miss',
  weight: number = 1.0
): number {
  const addedWeight = futureCount * weight;
  const newTotal = currentTotal + addedWeight;
  if (newTotal <= 0) return 100.0;

  const newAttended = futureAction === 'attend'
    ? currentAttended + addedWeight
    : currentAttended;

  const pct = (newAttended / newTotal) * 100;
  return Math.round(pct * 10) / 10;
}
