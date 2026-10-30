'use client';

import { FormEvent, useMemo, useState } from 'react';
import { BookOpen, Copy, Plus, UserPlus } from 'lucide-react';
import { db } from '@/lib/db/dexie';
import { syncEngine } from '@/lib/sync/syncEngine';
import { AppUser } from '@/lib/auth';
import { Course, Enrollment } from '@/types/database';

interface CourseAccessPanelProps {
  user: AppUser;
  courses: Course[];
  enrollments: Enrollment[];
  onChanged: () => Promise<void>;
  selectedCourseId?: string;
  onSelectCourse?: (courseId: string) => Promise<void>;
}

export function CourseAccessPanel({
  user,
  courses,
  enrollments,
  onChanged,
  selectedCourseId,
  onSelectCourse,
}: CourseAccessPanelProps) {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [rollNumber, setRollNumber] = useState(user.role === 'student' ? '21' : '');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [message, setMessage] = useState('');
  const visibleCourses = useMemo(
    () => user.role === 'professor'
      ? courses.filter((course) => course.professor_id === user.id && !course.is_archived)
      : courses.filter((course) => enrollments.some((enrollment) => enrollment.course_id === course.id && enrollment.student_user_id === user.id)),
    [courses, enrollments, user]
  );

  const addCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const normalizedCode = joinCode.trim().toUpperCase() || `${courseCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    if (!courseName.trim() || !courseCode.trim() || !semester.trim()) {
      setMessage('Course name, subject code, and semester are required.');
      return;
    }
    if (await db.courses.where('join_code').equals(normalizedCode).count()) {
      setMessage('That enrollment code is already in use. Choose another code.');
      return;
    }
    const course: Course = {
      id: `course-${Date.now()}`,
      professor_id: user.id,
      course_code: courseCode.trim().toUpperCase(),
      course_name: courseName.trim(),
      semester: semester.trim(),
      join_code: normalizedCode,
      min_attendance_pct: 75,
      medical_leave_rule: 'credit_present',
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    await db.courses.add(course);
    await syncEngine.queueMutation('courses', 'upsert', course as unknown as Record<string, unknown>);
    setCourseName('');
    setCourseCode('');
    setSemester('');
    setJoinCode('');
    setMessage(`Created ${course.course_code}. Share code ${course.join_code} with students.`);
    await onChanged();
  };

  const enroll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const normalizedCode = joinCode.trim().toUpperCase();
    const course = (await db.courses.toArray()).find((item) => item.join_code.toUpperCase() === normalizedCode && !item.is_archived);
    if (!course) {
      setMessage('No active class matches that enrollment code.');
      return;
    }
    if (await db.enrollments.where('course_id').equals(course.id).filter((item) => item.student_user_id === user.id).count()) {
      setMessage('You are already enrolled in this class.');
      return;
    }
    const enrollment: Enrollment = {
      id: `enroll-${user.id}-${course.id}`,
      course_id: course.id,
      student_user_id: user.id,
      roll_number: rollNumber.trim() || 'N/A',
      enrollment_number: enrollmentNumber.trim() || `${user.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      student_name: user.fullName,
      student_email: user.email,
      effective_from_date: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    };
    await db.enrollments.add(enrollment);
    await syncEngine.queueMutation('enrollments', 'upsert', enrollment as unknown as Record<string, unknown>);
    setJoinCode('');
    setMessage(`Enrolled in ${course.course_code}.`);
    await onChanged();
  };

  return (
    <section className="border-2 border-[#0F172A] bg-white p-4 sm:p-5 space-y-5">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h2 className="font-display font-black text-xl">{user.role === 'professor' ? 'Your teaching classes' : 'Your enrolled classes'}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleCourses.length === 0 && <p className="text-sm text-[#64748B] font-mono">No classes yet.</p>}
        {visibleCourses.map((course) => (
          <div
            key={course.id}
            role="button"
            tabIndex={0}
            aria-pressed={selectedCourseId === course.id}
            onClick={() => void onSelectCourse?.(course.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                void onSelectCourse?.(course.id);
              }
            }}
            className={`border-2 p-5 sm:p-6 ${
              selectedCourseId === course.id
                ? 'border-[#0F172A] bg-blue-50 shadow-none translate-x-0.5 translate-y-0.5'
                : 'border-[#0F172A] bg-white shadow-[4px_4px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
            } cursor-pointer transition-all flex flex-col justify-between min-w-0`}
          >
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-mono text-xs font-bold text-blue-700">{course.course_code}</p><p className="font-bold">{course.course_name}</p></div>
              <span className="font-mono text-[10px] bg-slate-100 px-2 py-1">{course.semester}</span>
            </div>
            <p className="mt-3 font-mono text-xs">Enrollment code: <strong>{course.join_code}</strong></p>
            {user.role === 'professor' && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void navigator.clipboard?.writeText(course.join_code);
                }}
                className="mt-2 text-xs font-mono underline inline-flex items-center gap-1 self-start"
              >
                <Copy className="w-3 h-3" /> Copy code
              </button>
            )}
          </div>
        ))}
      </div>
      {user.role === 'professor' ? (
        <form onSubmit={addCourse} className="border-t-2 border-[#E2E8F0] pt-4 space-y-3">
          <h3 className="font-mono text-sm font-bold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add a subject</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Subject name" className="border-2 border-[#0F172A] px-3 py-2 text-sm" />
            <input value={courseCode} onChange={(event) => setCourseCode(event.target.value)} placeholder="Subject code (e.g. CSE-201)" className="border-2 border-[#0F172A] px-3 py-2 text-sm" />
            <input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="Semester / section" className="border-2 border-[#0F172A] px-3 py-2 text-sm" />
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Unique enrollment code (optional)" className="border-2 border-[#0F172A] px-3 py-2 text-sm" />
          </div>
          <button className="border-2 border-[#0F172A] bg-[#0F172A] text-white px-4 py-2 font-mono text-sm font-bold">Create subject</button>
        </form>
      ) : (
        <form onSubmit={enroll} className="border-t-2 border-[#E2E8F0] pt-4 space-y-3">
          <h3 className="font-mono text-sm font-bold inline-flex items-center gap-2"><UserPlus className="w-4 h-4" /> Enroll in a new class</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Professor's code" required className="border-2 border-[#0F172A] px-3 py-2 text-sm" />
            <input value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} placeholder="Roll number" className="border-2 border-[#0F172A] px-3 py-2 text-sm" />
            <input value={enrollmentNumber} onChange={(event) => setEnrollmentNumber(event.target.value)} placeholder="Enrollment number" className="border-2 border-[#0F172A] px-3 py-2 text-sm" />
          </div>
          <button className="border-2 border-[#0F172A] bg-blue-700 text-white px-4 py-2 font-mono text-sm font-bold">Enroll</button>
        </form>
      )}
      {message && <p className="bg-blue-50 border-2 border-blue-200 p-3 text-sm font-mono">{message}</p>}
    </section>
  );
}
