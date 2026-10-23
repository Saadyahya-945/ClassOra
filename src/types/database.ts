export type UserRole = 'professor' | 'student';

export type MedicalLeaveRule = 'credit_present' | 'exempt_denominator' | 'record_only';

export type AttendanceStatus = 'P' | 'A' | 'M' | 'DL' | 'NA';

export type SessionType = 'lecture' | 'lab' | 'double_period' | 'extra';

export type LeaveType = 'M' | 'DL';

export type AssessmentRuleType = 'sum' | 'average' | 'best_of_k';

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface Course {
  id: string;
  professor_id: string;
  course_code: string;
  course_name: string;
  semester: string;
  section?: string | null;
  join_code: string;
  min_attendance_pct: number;
  medical_leave_rule: MedicalLeaveRule;
  is_archived: boolean;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_user_id?: string | null;
  roll_number: string;
  enrollment_number: string;
  student_name: string;
  student_email?: string | null;
  effective_from_date: string; // YYYY-MM-DD
  created_at?: string;
}

export interface AttendanceSession {
  id: string;
  course_id: string;
  session_date: string; // YYYY-MM-DD
  slot_label: string; // e.g. "Lecture 1", "09:00 AM"
  session_type: SessionType;
  weight: number; // 1.0, 2.0, etc.
  topic_covered?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  enrollment_id: string;
  status: AttendanceStatus;
  original_status?: AttendanceStatus | null;
  remarks?: string | null;
  client_mutation_id?: string | null;
  updated_at?: string;
}

export interface LeaveGrant {
  id: string;
  course_id: string;
  enrollment_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string | null;
  document_url?: string | null;
  approved_by?: string | null;
  created_at?: string;
}

export interface AssessmentGroup {
  id: string;
  course_id: string;
  group_name: string;
  rule_type: AssessmentRuleType;
  best_k_count?: number;
  max_group_weight: number;
}

export interface Assessment {
  id: string;
  course_id: string;
  group_id?: string | null;
  title: string;
  max_marks: number;
  is_published: boolean;
  assessment_date: string;
  created_at?: string;
}

export interface AssessmentScore {
  id: string;
  assessment_id: string;
  enrollment_id: string;
  marks_obtained?: number | null;
  is_absent: boolean;
  remarks?: string | null;
  client_mutation_id?: string | null;
  updated_at?: string;
}

export interface CorrectionRequest {
  id: string;
  course_id: string;
  enrollment_id: string;
  target_type: 'attendance' | 'assessment';
  target_id: string;
  student_message: string;
  status: CorrectionStatus;
  professor_note?: string | null;
  created_at: string;
  resolved_at?: string | null;
  // UI helpers:
  student_name?: string;
  roll_number?: string;
  target_description?: string;
}

export interface AuditLog {
  id: string;
  course_id: string;
  actor_id?: string | null;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  created_at?: string;
}
