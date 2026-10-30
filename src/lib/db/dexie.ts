import Dexie, { Table } from 'dexie';
import {
  Course,
  Enrollment,
  AttendanceSession,
  AttendanceRecord,
  LeaveGrant,
  AssessmentGroup,
  Assessment,
  AssessmentScore,
  CorrectionRequest,
} from '@/types/database';

export interface SyncQueueItem {
  id?: number;
  table: string;
  operation: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  client_mutation_id: string;
  status: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
  createdAt: number;
}

export class ClassOraDatabase extends Dexie {
  courses!: Table<Course, string>;
  enrollments!: Table<Enrollment, string>;
  attendance_sessions!: Table<AttendanceSession, string>;
  attendance_records!: Table<AttendanceRecord, string>;
  leave_grants!: Table<LeaveGrant, string>;
  assessment_groups!: Table<AssessmentGroup, string>;
  assessments!: Table<Assessment, string>;
  assessment_scores!: Table<AssessmentScore, string>;
  correction_requests!: Table<CorrectionRequest, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('ClassOraDB');
    this.version(1).stores({
      courses: 'id, professor_id, course_code, is_archived',
      enrollments: 'id, course_id, roll_number, enrollment_number, student_user_id',
      attendance_sessions: 'id, course_id, session_date',
      attendance_records: 'id, session_id, enrollment_id, [session_id+enrollment_id]',
      leave_grants: 'id, course_id, enrollment_id, start_date, end_date',
      assessment_groups: 'id, course_id',
      assessments: 'id, course_id, group_id, is_published',
      assessment_scores: 'id, assessment_id, enrollment_id, [assessment_id+enrollment_id]',
      correction_requests: 'id, course_id, enrollment_id, status',
      syncQueue: '++id, status, client_mutation_id, createdAt',
    });
    this.version(2).stores({
      courses: 'id, professor_id, course_code, join_code, is_archived',
    });
  }
}

export const db = new ClassOraDatabase();
