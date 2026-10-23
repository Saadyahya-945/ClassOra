import { db } from './db/dexie';
import {
  Course,
  Enrollment,
  AttendanceSession,
  AttendanceRecord,
  AssessmentGroup,
  Assessment,
  AssessmentScore,
  CorrectionRequest,
  LeaveGrant,
} from '@/types/database';

export const INITIAL_COURSE_ID = 'course-ece-301';
export const PROFESSOR_ID = 'prof-arman-123';
export const CURRENT_STUDENT_ROLL = '14';

export async function seedDemoDataIfEmpty() {
  const existingCourses = await db.courses.count();
  if (existingCourses > 0) return;

  const sampleCourse: Course = {
    id: INITIAL_COURSE_ID,
    professor_id: PROFESSOR_ID,
    course_code: 'ECE-301',
    course_name: 'Digital Electronics & Logic Design',
    semester: 'B.Tech ECE Sem 3 (2026)',
    section: 'A',
    join_code: 'ECE301',
    min_attendance_pct: 75.0,
    medical_leave_rule: 'credit_present',
    is_archived: false,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  const sampleStudents = [
    { roll: '01', enroll: 'GJ1041', name: 'Aarav Sharma', email: 'aarav.sharma@college.edu' },
    { roll: '02', enroll: 'GJ1042', name: 'Abhishek Verma', email: 'abhishek.v@college.edu' },
    { roll: '03', enroll: 'GJ1043', name: 'Aditi Rao', email: 'aditi.rao@college.edu' },
    { roll: '04', enroll: 'GJ1044', name: 'Aman Gupta', email: 'aman.gupta@college.edu' },
    { roll: '05', enroll: 'GJ1045', name: 'Ananya Singh', email: 'ananya.singh@college.edu' },
    { roll: '06', enroll: 'GJ1046', name: 'Bhavya Patel', email: 'bhavya.p@college.edu' },
    { roll: '07', enroll: 'GJ1047', name: 'Chetan Kumar', email: 'chetan.k@college.edu' },
    { roll: '08', enroll: 'GJ1048', name: 'Divya Nair', email: 'divya.nair@college.edu' },
    { roll: '09', enroll: 'GJ1049', name: 'Farhan Akhtar', email: 'farhan.a@college.edu' },
    { roll: '10', enroll: 'GJ1050', name: 'Ishaan Mishra', email: 'ishaan.m@college.edu' },
    { roll: '11', enroll: 'GJ1051', name: 'Kavya Pillai', email: 'kavya.p@college.edu' },
    { roll: '12', enroll: 'GJ1052', name: 'Manish Tiwari', email: 'manish.t@college.edu' },
    { roll: '13', enroll: 'GJ1053', name: 'Neha Chawla', email: 'neha.c@college.edu' },
    { roll: '14', enroll: 'GJ1054', name: 'Rahul Sharma', email: 'rahul.sharma@college.edu' }, // Demo student
    { roll: '15', enroll: 'GJ1055', name: 'Rohan Joshi', email: 'rohan.j@college.edu' },
    { roll: '16', enroll: 'GJ1056', name: 'Sanya Mirza', email: 'sanya.m@college.edu' },
    { roll: '17', enroll: 'GJ1057', name: 'Tanmay Bhatt', email: 'tanmay.b@college.edu' },
    { roll: '18', enroll: 'GJ1058', name: 'Utkarsh Saxena', email: 'utkarsh.s@college.edu' },
    { roll: '19', enroll: 'GJ1059', name: 'Vaishnavi Iyer', email: 'vaishnavi.i@college.edu' },
    { roll: '20', enroll: 'GJ1060', name: 'Yash Vardhan', email: 'yash.v@college.edu' },
  ];

  const enrollments: Enrollment[] = sampleStudents.map((s, index) => {
    // Student 20 joined late
    const isLateJoiner = s.roll === '20';
    return {
      id: `enroll-${s.roll}`,
      course_id: INITIAL_COURSE_ID,
      student_user_id: s.roll === '14' ? 'student-user-rahul' : null,
      roll_number: s.roll,
      enrollment_number: s.enroll,
      student_name: s.name,
      student_email: s.email,
      effective_from_date: isLateJoiner ? '2026-10-10' : '2026-09-01',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    };
  });

  // Create 12 historical sessions
  const sessions: AttendanceSession[] = [
    { id: 'sess-01', course_id: INITIAL_COURSE_ID, session_date: '2026-09-05', slot_label: '09:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'Number Systems & Boolean Algebra' },
    { id: 'sess-02', course_id: INITIAL_COURSE_ID, session_date: '2026-09-08', slot_label: '11:00 AM Lab', session_type: 'lab', weight: 2.0, topic_covered: 'Logic Gates IC Verification' },
    { id: 'sess-03', course_id: INITIAL_COURSE_ID, session_date: '2026-09-12', slot_label: '09:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'Karnaugh Maps (K-Maps)' },
    { id: 'sess-04', course_id: INITIAL_COURSE_ID, session_date: '2026-09-15', slot_label: '10:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'Don\'t Care Conditions & POS/SOP' },
    { id: 'sess-05', course_id: INITIAL_COURSE_ID, session_date: '2026-09-19', slot_label: '02:00 PM Double Period', session_type: 'double_period', weight: 2.0, topic_covered: 'Multiplexers & Demultiplexers' },
    { id: 'sess-06', course_id: INITIAL_COURSE_ID, session_date: '2026-09-22', slot_label: '09:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'Encoders and Priority Encoders' },
    { id: 'sess-07', course_id: INITIAL_COURSE_ID, session_date: '2026-09-26', slot_label: '11:00 AM Lab', session_type: 'lab', weight: 2.0, topic_covered: 'Adder/Subtractor Circuit Hardware' },
    { id: 'sess-08', course_id: INITIAL_COURSE_ID, session_date: '2026-09-29', slot_label: '09:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'Flip-Flops: SR and JK' },
    { id: 'sess-09', course_id: INITIAL_COURSE_ID, session_date: '2026-10-03', slot_label: '09:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'D & T Flip-Flops Timing Diagrams' },
    { id: 'sess-10', course_id: INITIAL_COURSE_ID, session_date: '2026-10-10', slot_label: '11:00 AM Lab', session_type: 'lab', weight: 2.0, topic_covered: 'Master-Slave JK Implementation' },
    { id: 'sess-11', course_id: INITIAL_COURSE_ID, session_date: '2026-10-15', slot_label: '09:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'Synchronous Counters' },
    { id: 'sess-12', course_id: INITIAL_COURSE_ID, session_date: '2026-10-22', slot_label: '09:00 AM Lecture', session_type: 'lecture', weight: 1.0, topic_covered: 'Asynchronous Decade Counters' },
  ];

  // Generate attendance records
  const records: AttendanceRecord[] = [];
  sessions.forEach((sess) => {
    enrollments.forEach((enr) => {
      // Determine pattern
      let status: 'P' | 'A' | 'M' | 'DL' | 'NA' = 'P';

      if (enr.roll_number === '04') {
        // Detained student (Aman Gupta) - misses many classes
        status = ['sess-02', 'sess-04', 'sess-05', 'sess-08', 'sess-11'].includes(sess.id) ? 'A' : 'P';
      } else if (enr.roll_number === '02') {
        // Warning zone (Abhishek Verma) ~ 71%
        status = ['sess-02', 'sess-05', 'sess-09'].includes(sess.id) ? 'A' : 'P';
      } else if (enr.roll_number === '05') {
        // Medical leave on sess-07 and sess-08
        if (sess.id === 'sess-07' || sess.id === 'sess-08') {
          status = 'M';
        }
      } else if (enr.roll_number === '14') {
        // Demo student Rahul Sharma ~ 78.4%
        if (sess.id === 'sess-03' || sess.id === 'sess-07') {
          status = 'A';
        } else if (sess.id === 'sess-10') {
          status = 'M';
        }
      } else {
        // General distribution
        const hash = (sess.id.charCodeAt(6) * 17 + enr.roll_number.charCodeAt(1) * 31) % 10;
        if (hash === 1) status = 'A';
      }

      records.push({
        id: `rec-${sess.id}-${enr.id}`,
        session_id: sess.id,
        enrollment_id: enr.id,
        status,
        original_status: status === 'M' ? 'A' : undefined,
        updated_at: new Date().toISOString(),
      });
    });
  });

  // Assessment Groups
  const groupQuizzes: AssessmentGroup = {
    id: 'grp-quizzes',
    course_id: INITIAL_COURSE_ID,
    group_name: 'Quizzes (Best 2 of 3)',
    rule_type: 'best_of_k',
    best_k_count: 2,
    max_group_weight: 20.0,
  };

  const groupMidSem: AssessmentGroup = {
    id: 'grp-midsem',
    course_id: INITIAL_COURSE_ID,
    group_name: 'Mid-Semester Exam',
    rule_type: 'sum',
    best_k_count: 1,
    max_group_weight: 30.0,
  };

  const assessments: Assessment[] = [
    { id: 'asm-q1', course_id: INITIAL_COURSE_ID, group_id: 'grp-quizzes', title: 'Quiz 1: Boolean Laws', max_marks: 10, is_published: true, assessment_date: '2026-09-15' },
    { id: 'asm-q2', course_id: INITIAL_COURSE_ID, group_id: 'grp-quizzes', title: 'Quiz 2: K-Maps & POS', max_marks: 10, is_published: true, assessment_date: '2026-09-30' },
    { id: 'asm-q3', course_id: INITIAL_COURSE_ID, group_id: 'grp-quizzes', title: 'Quiz 3: Flip-Flop Design', max_marks: 10, is_published: true, assessment_date: '2026-10-18' },
    { id: 'asm-mid', course_id: INITIAL_COURSE_ID, group_id: 'grp-midsem', title: 'Mid-Sem Exam (Units 1-3)', max_marks: 30, is_published: true, assessment_date: '2026-10-12' },
  ];

  // Assessment scores
  const scores: AssessmentScore[] = [];
  enrollments.forEach((enr) => {
    // Q1
    scores.push({
      id: `sc-q1-${enr.id}`,
      assessment_id: 'asm-q1',
      enrollment_id: enr.id,
      marks_obtained: enr.roll_number === '02' ? null : Math.min(10, Math.max(4, 7 + (parseInt(enr.roll_number) % 4))),
      is_absent: enr.roll_number === '02', // Abhishek is AB
    });

    // Q2
    scores.push({
      id: `sc-q2-${enr.id}`,
      assessment_id: 'asm-q2',
      enrollment_id: enr.id,
      marks_obtained: Math.min(10, Math.max(5, 6 + (parseInt(enr.roll_number) % 5))),
      is_absent: false,
    });

    // Q3
    scores.push({
      id: `sc-q3-${enr.id}`,
      assessment_id: 'asm-q3',
      enrollment_id: enr.id,
      marks_obtained: enr.roll_number === '04' ? null : Math.min(10, Math.max(4, 5 + (parseInt(enr.roll_number) % 6))),
      is_absent: enr.roll_number === '04', // Aman Gupta AB
    });

    // Mid-Sem
    scores.push({
      id: `sc-mid-${enr.id}`,
      assessment_id: 'asm-mid',
      enrollment_id: enr.id,
      marks_obtained: Math.min(30, Math.max(14, 18 + (parseInt(enr.roll_number) % 11))),
      is_absent: false,
    });
  });

  // Specific scores for Rahul (14):
  const rahulEnroll = enrollments.find(e => e.roll_number === '14');
  if (rahulEnroll) {
    const q1 = scores.find(s => s.assessment_id === 'asm-q1' && s.enrollment_id === rahulEnroll.id);
    if (q1) q1.marks_obtained = 8;
    const q2 = scores.find(s => s.assessment_id === 'asm-q2' && s.enrollment_id === rahulEnroll.id);
    if (q2) q2.marks_obtained = 9;
    const q3 = scores.find(s => s.assessment_id === 'asm-q3' && s.enrollment_id === rahulEnroll.id);
    if (q3) q3.marks_obtained = 6;
    const mid = scores.find(s => s.assessment_id === 'asm-mid' && s.enrollment_id === rahulEnroll.id);
    if (mid) mid.marks_obtained = 25;
  }

  // Sample Leave Grants
  const leaves: LeaveGrant[] = [
    {
      id: 'leave-1',
      course_id: INITIAL_COURSE_ID,
      enrollment_id: 'enroll-05',
      leave_type: 'M',
      start_date: '2026-09-26',
      end_date: '2026-09-30',
      reason: 'Typhoid medical certificate submitted & approved by HOD',
      approved_by: PROFESSOR_ID,
      created_at: new Date('2026-10-01').toISOString(),
    },
    {
      id: 'leave-2',
      course_id: INITIAL_COURSE_ID,
      enrollment_id: 'enroll-14',
      leave_type: 'M',
      start_date: '2026-10-10',
      end_date: '2026-10-10',
      reason: 'Hospital OPD prescription for acute viral infection',
      approved_by: PROFESSOR_ID,
      created_at: new Date('2026-10-11').toISOString(),
    },
  ];

  // Sample Correction Requests for Dispute Bell
  const corrections: CorrectionRequest[] = [
    {
      id: 'cr-1',
      course_id: INITIAL_COURSE_ID,
      enrollment_id: 'enroll-14',
      target_type: 'attendance',
      target_id: 'sess-03',
      student_message: 'Sir, I was present in the front row on 12 Sep (K-Maps lecture). Kindly verify my signed worksheet.',
      status: 'pending',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      student_name: 'Rahul Sharma',
      roll_number: '14',
      target_description: '12 Sep 2026 (09:00 AM Lecture)',
    },
    {
      id: 'cr-2',
      course_id: INITIAL_COURSE_ID,
      enrollment_id: 'enroll-04',
      target_type: 'assessment',
      target_id: 'asm-q3',
      student_message: 'Professor, I submitted Quiz 3 copy on desk, marked AB by mistake. Please cross-check paper pile.',
      status: 'pending',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      student_name: 'Aman Gupta',
      roll_number: '04',
      target_description: 'Quiz 3: Flip-Flop Design',
    },
  ];

  // Bulk add into Dexie
  await db.courses.add(sampleCourse);
  await db.enrollments.bulkAdd(enrollments);
  await db.attendance_sessions.bulkAdd(sessions);
  await db.attendance_records.bulkAdd(records);
  await db.assessment_groups.bulkAdd([groupQuizzes, groupMidSem]);
  await db.assessments.bulkAdd(assessments);
  await db.assessment_scores.bulkAdd(scores);
  await db.leave_grants.bulkAdd(leaves);
  await db.correction_requests.bulkAdd(corrections);
}
