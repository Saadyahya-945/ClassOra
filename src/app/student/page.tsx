'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/dexie';
import { seedDemoDataIfEmpty } from '@/lib/mockData';
import { syncEngine } from '@/lib/sync/syncEngine';
import {
  Course,
  Enrollment,
  AttendanceSession,
  AttendanceRecord,
  AssessmentGroup,
  Assessment,
  AssessmentScore,
  CorrectionRequest,
} from '@/types/database';
import { calculateStudentAttendance } from '@/lib/calculations/attendance';
import { AnimatedRadarRing } from '@/components/student/AnimatedRadarRing';
import { ShortageBufferBanner } from '@/components/student/ShortageBufferBanner';
import { WhatIfSimulator } from '@/components/student/WhatIfSimulator';
import { BentoMarksWallet } from '@/components/student/BentoMarksWallet';
import { LectureTimeline } from '@/components/student/LectureTimeline';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';

export default function StudentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [currentStudent, setCurrentStudent] = useState<Enrollment | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [groups, setGroups] = useState<AssessmentGroup[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [scores, setScores] = useState<AssessmentScore[]>([]);

  const loadData = async () => {
    await seedDemoDataIfEmpty();

    const loadedCourses = await db.courses.toArray();
    setCourses(loadedCourses);

    const activeCourse = loadedCourses[0];
    if (activeCourse) {
      setActiveCourseId(activeCourse.id);

      const enrolls = await db.enrollments.where('course_id').equals(activeCourse.id).toArray();
      const student = enrolls.find((e) => e.roll_number === '14') || enrolls[0];
      setCurrentStudent(student);

      const sess = await db.attendance_sessions.where('course_id').equals(activeCourse.id).toArray();
      setSessions(sess);

      const recs = await db.attendance_records.toArray();
      setRecords(recs);

      const grps = await db.assessment_groups.where('course_id').equals(activeCourse.id).toArray();
      setGroups(grps);

      const asms = await db.assessments.where('course_id').equals(activeCourse.id).toArray();
      setAssessments(asms);

      const scs = await db.assessment_scores.toArray();
      setScores(scs);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  const handleRaiseCorrection = async (
    targetType: 'attendance' | 'assessment',
    targetId: string,
    studentMessage: string
  ) => {
    if (!activeCourse || !currentStudent) return;

    const newRequest: CorrectionRequest = {
      id: `cr_${Date.now()}`,
      course_id: activeCourse.id,
      enrollment_id: currentStudent.id,
      target_type: targetType,
      target_id: targetId,
      student_message: studentMessage,
      status: 'pending',
      created_at: new Date().toISOString(),
      student_name: currentStudent.student_name,
      roll_number: currentStudent.roll_number,
      target_description: targetType === 'attendance' ? 'Session Attendance' : 'Assessment Score',
    };

    await db.correction_requests.add(newRequest);
    await syncEngine.queueMutation('correction_requests', 'upsert', newRequest as unknown as Record<string, unknown>);
  };

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center font-mono text-sm">
        Loading Student Academic Wallet...
      </div>
    );
  }

  const attendanceMetrics = calculateStudentAttendance(
    currentStudent,
    sessions,
    records,
    activeCourse?.medical_leave_rule || 'credit_present',
    activeCourse?.min_attendance_pct || 75
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0F172A] selection:text-white overflow-x-hidden">
      {/* Student App Bar - Matches Swiss Navbar */}
      <header className="border-b-2 border-[#0F172A] bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="p-2 bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
              title="Return Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-[#0F172A] text-base truncate">ClassOra</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-900 font-bold border border-[#0F172A] shrink-0">
                  STUDENT WALLET
                </span>
              </div>
              <div className="text-xs font-mono text-[#64748B] truncate">
                {currentStudent.student_name} (Roll {currentStudent.roll_number}) • {currentStudent.enrollment_number}
              </div>
            </div>
          </div>

          {/* Course Selector Dropdown */}
          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
            <div className="px-3 py-1.5 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-[#0F172A] font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeCourse?.course_code || 'ECE-301'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Student Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Module 8.1: Hero 75% Attendance Radar */}
        <AnimatedRadarRing
          percentage={attendanceMetrics.percentage}
          attended={attendanceMetrics.attendedWeightedCredits}
          total={attendanceMetrics.totalWeightedClasses}
          medicalLeaves={attendanceMetrics.leaveCount}
        />

        {/* Module 8.2: Shortage / Buffer Banner */}
        <ShortageBufferBanner
          percentage={attendanceMetrics.percentage}
          classesNeeded={attendanceMetrics.classesNeededFor75}
          bufferClasses={attendanceMetrics.bufferClassesSafeToMiss}
          threshold={activeCourse?.min_attendance_pct || 75}
        />

        {/* Module 6.4: Interactive Student What-If Simulator */}
        <WhatIfSimulator
          currentAttended={attendanceMetrics.attendedWeightedCredits}
          currentTotal={attendanceMetrics.totalWeightedClasses}
          threshold={activeCourse?.min_attendance_pct || 75}
        />

        {/* Module 8.3: Sessional Marks Wallet */}
        <BentoMarksWallet
          enrollmentId={currentStudent.id}
          groups={groups}
          assessments={assessments}
          scores={scores}
        />

        {/* Module 8.4: Lecture Transaction Timeline */}
        <LectureTimeline
          sessions={sessions}
          records={records}
          enrollmentId={currentStudent.id}
          courseId={activeCourse?.id || ''}
          onRaiseCorrection={handleRaiseCorrection}
        />
      </main>

      {/* Minimal Student Footer */}
      <footer className="border-t-2 border-[#0F172A] bg-white py-6 text-center text-xs font-mono text-[#64748B] px-4">
        <span>Verified Google Account Sync • ClassOra v1.0</span>
      </footer>
    </div>
  );
}
