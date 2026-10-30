-- ==============================================================================
-- CLASSORA / LECTRA LEDGER: SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('professor', 'student')) DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSES (Owned by Professor's Google Account)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  semester TEXT NOT NULL,
  section TEXT,
  join_code TEXT UNIQUE NOT NULL,
  min_attendance_pct NUMERIC(5,2) DEFAULT 75.00,
  medical_leave_rule TEXT CHECK (medical_leave_rule IN ('credit_present', 'exempt_denominator', 'record_only')) DEFAULT 'credit_present',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSE ENROLLMENTS (Student Roster per Course)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  roll_number TEXT NOT NULL,
  enrollment_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  effective_from_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, roll_number),
  UNIQUE(course_id, enrollment_number)
);

-- 4. ATTENDANCE SESSIONS (Supports multiple slots & weights per day)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  slot_label TEXT NOT NULL DEFAULT 'Lecture 1',
  session_type TEXT CHECK (session_type IN ('lecture', 'lab', 'double_period', 'extra')) DEFAULT 'lecture',
  weight NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  topic_covered TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATTENDANCE RECORDS (With Original Status & Idempotency Key)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('P', 'A', 'M', 'DL', 'NA')) DEFAULT 'P',
  original_status TEXT CHECK (original_status IN ('P', 'A', 'M', 'DL', 'NA')),
  remarks TEXT,
  client_mutation_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, enrollment_id)
);

-- 6. BULK MEDICAL & DUTY LEAVES
CREATE TABLE IF NOT EXISTS public.leave_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('M', 'DL')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  document_url TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ASSESSMENT GROUPS (For "Best K of N" or Scaled Rules)
CREATE TABLE IF NOT EXISTS public.assessment_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('sum', 'average', 'best_of_k')) DEFAULT 'sum',
  best_k_count INT DEFAULT 2,
  max_group_weight NUMERIC(5,2) NOT NULL DEFAULT 10.00
);

-- 8. ASSESSMENTS (Individual Quizzes, Tests, Assignments)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.assessment_groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  assessment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ASSESSMENT SCORES (Distinguishes 'AB' Absent from 0)
CREATE TABLE IF NOT EXISTS public.assessment_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2),
  is_absent BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  client_mutation_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, enrollment_id)
);

-- 10. CORRECTION REQUESTS (Student Dispute Tickets)
CREATE TABLE IF NOT EXISTS public.correction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('attendance', 'assessment')),
  target_id UUID NOT NULL,
  student_message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  professor_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read only their own trusted role record.
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Courses: Professor full CRUD, Students can view courses they are enrolled in
CREATE POLICY "Professors can manage their own courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

CREATE POLICY "Students can view enrolled courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = courses.id
      AND e.student_user_id = auth.uid()
    )
  );

-- Enrollments: professors manage their course rosters; students manage only themselves.
CREATE POLICY "Professors can manage their course enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = enrollments.course_id
      AND c.professor_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = enrollments.course_id
      AND c.professor_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Students can view their own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_user_id = (SELECT auth.uid()));

CREATE POLICY "Students can create their own enrollments"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = enrollments.course_id
      AND c.is_archived = FALSE
    )
  );

-- Attendance: Professors full access for their courses
CREATE POLICY "Professors can manage attendance sessions"
  ON public.attendance_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = attendance_sessions.course_id
      AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can manage attendance records"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      JOIN public.courses c ON c.id = s.course_id
      WHERE s.id = attendance_records.session_id
      AND c.professor_id = auth.uid()
    )
  );

-- Students can read only their own attendance
CREATE POLICY "Students can view their own attendance records"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = attendance_records.enrollment_id
      AND e.student_user_id = auth.uid()
    )
  );

-- Assessments: Students can only view PUBLISHED assessments
CREATE POLICY "Professors can manage assessments"
  ON public.assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = assessments.course_id
      AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "Students can view published assessments"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = assessments.course_id
      AND e.student_user_id = auth.uid()
    )
  );

-- Scores: Students can view only their own scores for published assessments
CREATE POLICY "Students can view their own published scores"
  ON public.assessment_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.assessments a ON a.id = assessment_scores.assessment_id
      WHERE e.id = assessment_scores.enrollment_id
      AND e.student_user_id = auth.uid()
      AND a.is_published = TRUE
    )
  );

-- Correction Requests: Students can insert their own requests; Professors can view/update
CREATE POLICY "Students can create correction requests"
  ON public.correction_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = correction_requests.enrollment_id
      AND e.student_user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own correction requests"
  ON public.correction_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = correction_requests.enrollment_id
      AND e.student_user_id = auth.uid()
    )
  );

CREATE POLICY "Professors can manage course correction requests"
  ON public.correction_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = correction_requests.course_id
      AND c.professor_id = auth.uid()
    )
  );
