'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  AttendanceStatus,
  LeaveType,
  AssessmentRuleType,
} from '@/types/database';
import { PodiumMode } from '@/components/professor/PodiumMode';
import { CabinModeGrid } from '@/components/professor/CabinModeGrid';
import { MarksEntryGrid } from '@/components/professor/MarksEntryGrid';
import { BulkLeaveDrawer } from '@/components/professor/BulkLeaveDrawer';
import { RosterImportModal } from '@/components/professor/RosterImportModal';
import { DisputeResolutionDrawer } from '@/components/professor/DisputeResolutionDrawer';
import { SyncStatusBanner, SyncPill } from '@/components/shared/SyncStatusBanner';
import { AuthGate } from '@/components/shared/AuthGate';
import { CourseAccessPanel } from '@/components/shared/CourseAccessPanel';
import { AppUser } from '@/lib/auth';
import { generateHODExcel, generateHODPDF } from '@/lib/export/exportEngine';
import {
  Bell,
  Download,
  Upload,
  Calendar,
  Table as TableIcon,
  Smartphone,
  Award,
  ArrowLeft,
} from 'lucide-react';

function ProfessorDashboard({ user }: { user: AppUser }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [groups, setGroups] = useState<AssessmentGroup[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [scores, setScores] = useState<AssessmentScore[]>([]);
  const [disputes, setDisputes] = useState<CorrectionRequest[]>([]);

  const [activeTab, setActiveTab] = useState<'podium' | 'cabin' | 'marks'>('cabin');
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  // Modals state
  const [isBulkLeaveOpen, setIsBulkLeaveOpen] = useState(false);
  const [isRosterImportOpen, setIsRosterImportOpen] = useState(false);
  const [isDisputesOpen, setIsDisputesOpen] = useState(false);

  const loadData = useCallback(async (requestedCourseId?: string) => {
    await seedDemoDataIfEmpty();

    const loadedCourses = (await db.courses.toArray()).filter(
      (course) => course.professor_id === user.id && !course.is_archived
    );
    setCourses(loadedCourses);

    const activeCourse = loadedCourses.find((course) => course.id === requestedCourseId) || loadedCourses[0];
    if (activeCourse) {
      setActiveCourseId(activeCourse.id);
      const enrs = await db.enrollments.where('course_id').equals(activeCourse.id).toArray();
      setEnrollments(enrs);

      const sess = await db.attendance_sessions.where('course_id').equals(activeCourse.id).toArray();
      setSessions(sess);
      if (sess.length > 0) {
        setActiveSessionId(sess[sess.length - 1].id);
      }

      const recs = await db.attendance_records.toArray();
      setRecords(recs);

      let grps = await db.assessment_groups.where('course_id').equals(activeCourse.id).toArray();
      if (grps.length === 0) {
        const defaultGroup: AssessmentGroup = {
          id: `grp_${activeCourse.id}_default`,
          course_id: activeCourse.id,
          group_name: 'Assessments',
          rule_type: 'sum',
          best_k_count: 2,
          max_group_weight: 20,
        };
        await db.assessment_groups.add(defaultGroup);
        await syncEngine.queueMutation(
          'assessment_groups',
          'upsert',
          defaultGroup as unknown as Record<string, unknown>
        );
        grps = [defaultGroup];
      }
      setGroups(grps);

      const asms = await db.assessments.where('course_id').equals(activeCourse.id).toArray();
      setAssessments(asms);

      const scs = await db.assessment_scores.toArray();
      setScores(scs);

      const disps = await db.correction_requests.where('course_id').equals(activeCourse.id).toArray();
      setDisputes(disps);
    }
  }, [user.id]);

  const handleSelectCourse = async (courseId: string) => {
    await loadData(courseId);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  const handleUpdateAttendanceStatus = async (
    sessionId: string,
    enrollmentId: string,
    status: AttendanceStatus
  ) => {
    const existing = records.find((r) => r.session_id === sessionId && r.enrollment_id === enrollmentId);
    const updatedRecord: AttendanceRecord = {
      id: existing ? existing.id : `rec_${sessionId}_${enrollmentId}`,
      session_id: sessionId,
      enrollment_id: enrollmentId,
      status,
      original_status: existing?.original_status || existing?.status,
      updated_at: new Date().toISOString(),
    };

    setRecords((prev) => {
      const filtered = prev.filter((r) => !(r.session_id === sessionId && r.enrollment_id === enrollmentId));
      return [...filtered, updatedRecord];
    });

    await db.attendance_records.put(updatedRecord);
    await syncEngine.queueMutation('attendance_records', 'upsert', updatedRecord as unknown as Record<string, unknown>);
  };

  const handleBatchUpdateStatus = async (
    sessionId: string,
    updates: { enrollmentId: string; status: AttendanceStatus }[]
  ) => {
    const newRecords: AttendanceRecord[] = [];

    setRecords((prev) => {
      const recordMap = new Map(prev.map((r) => [`${r.session_id}_${r.enrollment_id}`, r]));
      updates.forEach(({ enrollmentId, status }) => {
        const key = `${sessionId}_${enrollmentId}`;
        const existing = recordMap.get(key);
        const updated: AttendanceRecord = {
          id: existing ? existing.id : `rec_${sessionId}_${enrollmentId}`,
          session_id: sessionId,
          enrollment_id: enrollmentId,
          status,
          original_status: existing?.original_status || existing?.status,
          updated_at: new Date().toISOString(),
        };
        recordMap.set(key, updated);
        newRecords.push(updated);
      });
      return Array.from(recordMap.values());
    });

    await db.attendance_records.bulkPut(newRecords);
    for (const nr of newRecords) {
      await syncEngine.queueMutation('attendance_records', 'upsert', nr as unknown as Record<string, unknown>);
    }
  };

  const handleCreateSession = async (
    date: string,
    slotLabel: string,
    sessionType: 'lecture' | 'lab' | 'double_period' | 'extra',
    weight: number
  ) => {
    if (!activeCourse) return;
    const newSession: AttendanceSession = {
      id: `sess_${Date.now()}`,
      course_id: activeCourse.id,
      session_date: date,
      slot_label: slotLabel,
      session_type: sessionType,
      weight,
      created_at: new Date().toISOString(),
    };

    const initialRecords: AttendanceRecord[] = enrollments.map((enr) => ({
      id: `rec_${newSession.id}_${enr.id}`,
      session_id: newSession.id,
      enrollment_id: enr.id,
      status: 'P',
      updated_at: new Date().toISOString(),
    }));

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setRecords((prev) => [...prev, ...initialRecords]);

    await db.attendance_sessions.add(newSession);
    await db.attendance_records.bulkAdd(initialRecords);
    await syncEngine.queueMutation('attendance_sessions', 'upsert', newSession as unknown as Record<string, unknown>);
    for (const record of initialRecords) {
      await syncEngine.queueMutation('attendance_records', 'upsert', record as unknown as Record<string, unknown>);
    }
  };

  const handleApplyLeave = async (
    enrollmentId: string,
    leaveType: LeaveType,
    startDate: string,
    endDate: string,
    reason: string,
    documentUrl?: string
  ) => {
    if (!activeCourse) return;

    const leaveGrant = {
      id: `leave_${Date.now()}`,
      course_id: activeCourse.id,
      enrollment_id: enrollmentId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      document_url: documentUrl,
      created_at: new Date().toISOString(),
    };
    await db.leave_grants.add(leaveGrant);

    const matchingSessions = sessions.filter(
      (s) => s.session_date >= startDate && s.session_date <= endDate
    );

    const updatedRecords: AttendanceRecord[] = [];
    setRecords((prev) => {
      const recordMap = new Map(prev.map((r) => [`${r.session_id}_${r.enrollment_id}`, r]));
      matchingSessions.forEach((sess) => {
        const key = `${sess.id}_${enrollmentId}`;
        const existing = recordMap.get(key);
        const updated: AttendanceRecord = {
          id: existing ? existing.id : `rec_${sess.id}_${enrollmentId}`,
          session_id: sess.id,
          enrollment_id: enrollmentId,
          status: leaveType,
          original_status: existing?.original_status || existing?.status || 'A',
          remarks: reason,
          updated_at: new Date().toISOString(),
        };
        recordMap.set(key, updated);
        updatedRecords.push(updated);
      });
      return Array.from(recordMap.values());
    });

    await db.attendance_records.bulkPut(updatedRecords);
    for (const ur of updatedRecords) {
      await syncEngine.queueMutation('attendance_records', 'upsert', ur as unknown as Record<string, unknown>);
    }
  };

  const handleUpdateScore = async (
    assessmentId: string,
    enrollmentId: string,
    marks: number | null,
    isAbsent: boolean
  ) => {
    const existing = scores.find((s) => s.assessment_id === assessmentId && s.enrollment_id === enrollmentId);
    const updatedScore: AssessmentScore = {
      id: existing ? existing.id : `sc_${assessmentId}_${enrollmentId}`,
      assessment_id: assessmentId,
      enrollment_id: enrollmentId,
      marks_obtained: marks,
      is_absent: isAbsent,
      updated_at: new Date().toISOString(),
    };

    setScores((prev) => {
      const filtered = prev.filter((s) => !(s.assessment_id === assessmentId && s.enrollment_id === enrollmentId));
      return [...filtered, updatedScore];
    });

    await db.assessment_scores.put(updatedScore);
    await syncEngine.queueMutation('assessment_scores', 'upsert', updatedScore as unknown as Record<string, unknown>);
  };

  const handleTogglePublish = async (assessmentId: string, isPublished: boolean) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === assessmentId ? { ...a, is_published: isPublished } : a))
    );
    await db.assessments.update(assessmentId, { is_published: isPublished });
    await syncEngine.queueMutation('assessments', 'upsert', { id: assessmentId, is_published: isPublished });
  };

  const handleCreateAssessment = async (groupId: string, title: string, maxMarks: number) => {
    if (!activeCourse) return;
    const newAsm: Assessment = {
      id: `asm_${Date.now()}`,
      course_id: activeCourse.id,
      group_id: groupId,
      title,
      max_marks: maxMarks,
      is_published: false,
      assessment_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    setAssessments((prev) => [...prev, newAsm]);
    await db.assessments.add(newAsm);
    await syncEngine.queueMutation('assessments', 'upsert', newAsm as unknown as Record<string, unknown>);
  };

  const handleUpdateGroup = async (groupId: string, updates: Partial<AssessmentGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
    await db.assessment_groups.update(groupId, updates);
    await syncEngine.queueMutation('assessment_groups', 'upsert', { id: groupId, ...updates });
  };

  const handleCreateGroup = async (
    groupName: string,
    ruleType: AssessmentRuleType,
    maxWeight: number,
    bestKCount?: number
  ) => {
    if (!activeCourse) return;
    const newGroup: AssessmentGroup = {
      id: `grp_${Date.now()}`,
      course_id: activeCourse.id,
      group_name: groupName,
      rule_type: ruleType,
      best_k_count: bestKCount || 2,
      max_group_weight: maxWeight,
    };
    setGroups((prev) => [...prev, newGroup]);
    await db.assessment_groups.add(newGroup);
    await syncEngine.queueMutation('assessment_groups', 'upsert', newGroup as unknown as Record<string, unknown>);
  };

  const handleUpdateAssessment = async (assessmentId: string, updates: Partial<Assessment>) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === assessmentId ? { ...a, ...updates } : a))
    );
    await db.assessments.update(assessmentId, updates);
    await syncEngine.queueMutation('assessments', 'upsert', { id: assessmentId, ...updates });
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
    await db.assessments.delete(assessmentId);
    await syncEngine.queueMutation('assessments', 'delete', { id: assessmentId });
  };

  const handleImportStudents = async (newStudents: Partial<Enrollment>[]) => {
    if (!activeCourse) return;
    const fullList: Enrollment[] = newStudents.map((s, idx) => ({
      id: `enr_${Date.now()}_${idx}`,
      course_id: activeCourse.id,
      roll_number: s.roll_number || '00',
      enrollment_number: s.enrollment_number || 'ENR00',
      student_name: s.student_name || 'Student',
      student_email: s.student_email || null,
      effective_from_date: s.effective_from_date || '2026-09-01',
      created_at: new Date().toISOString(),
    }));

    setEnrollments((prev) => [...prev, ...fullList]);
    await db.enrollments.bulkAdd(fullList);
    for (const fl of fullList) {
      await syncEngine.queueMutation('enrollments', 'upsert', fl as unknown as Record<string, unknown>);
    }
  };

  const handleResolveDispute = async (disputeId: string, action: 'approve' | 'reject', note: string) => {
    const targetDisp = disputes.find((d) => d.id === disputeId);
    if (!targetDisp) return;

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: newStatus, professor_note: note, resolved_at: new Date().toISOString() } : d))
    );

    await db.correction_requests.update(disputeId, {
      status: newStatus,
      professor_note: note,
      resolved_at: new Date().toISOString(),
    });

    if (action === 'approve' && targetDisp.target_type === 'attendance') {
      await handleUpdateAttendanceStatus(targetDisp.target_id, targetDisp.enrollment_id, 'P');
    }

    await syncEngine.queueMutation('correction_requests', 'upsert', {
      id: disputeId,
      status: newStatus,
      professor_note: note,
    });
  };

  const pendingDisputesCount = disputes.filter((d) => d.status === 'pending').length;

  const exportPayload = {
    course: activeCourse,
    enrollments,
    sessions,
    records,
    assessments,
    scores,
    groups,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0F172A] selection:text-white overflow-x-hidden">
      {/* 10.2 Honest Unsynced Warning Banner */}
      <SyncStatusBanner />

      {/* Top Academic Swiss Bar */}
      <header className="bg-white border-b-2 border-[#0F172A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Identity & Course */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="p-2 bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
              title="Return Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-base sm:text-lg text-[#0F172A] truncate">ClassOra</span>
                <span className="hidden xs:inline-block text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-[#0F172A] font-bold border border-[#0F172A] shrink-0">
                  SWISS LEDGER
                </span>
              </div>
              <div className="text-xs font-mono text-[#64748B] truncate">
                <span>{activeCourse?.course_code || 'ECE-301'}: {activeCourse?.course_name}</span>
              </div>
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs shrink-0">
            {/* Sync Status Pill */}
            <SyncPill />

            {/* Dispute Notification Bell */}
            <button
              onClick={() => setIsDisputesOpen(true)}
              className="relative p-2 border-2 border-[#0F172A] bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              title="Disputes & Corrections"
            >
              <Bell className="w-4 h-4" />
              {pendingDisputesCount > 0 && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold border border-white">
                  {pendingDisputesCount}
                </span>
              )}
            </button>

            {/* Roster Import */}
            <button
              onClick={() => setIsRosterImportOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#0F172A] bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] font-bold shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </button>

            {/* Medical Leave Drawer */}
            <button
              onClick={() => setIsBulkLeaveOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#0F172A] bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] font-bold shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Bulk Leave
            </button>

            {/* Export Dropdown Group */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => generateHODExcel(exportPayload)}
                className="px-2.5 py-1.5 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1"
                title="Download HOD Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>XLSX</span>
              </button>
              <button
                onClick={() => generateHODPDF(exportPayload)}
                className="px-2.5 py-1.5 bg-blue-700 text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1"
                title="Download Official HOD Printable PDF"
              >
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4 min-w-0">
        <CourseAccessPanel
          user={user}
          courses={courses}
          enrollments={enrollments}
          onChanged={loadData}
          selectedCourseId={activeCourseId}
          onSelectCourse={handleSelectCourse}
        />
        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#0F172A] pb-3 font-mono text-xs w-full">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('cabin')}
              className={`px-3 sm:px-4 py-2 font-bold border-2 transition-all flex items-center gap-2 ${
                activeTab === 'cabin'
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[3px_3px_0px_#0F172A]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
              }`}
            >
              <TableIcon className="w-4 h-4 shrink-0" />
              <span>Cabin Mode (Spreadsheet)</span>
            </button>

            <button
              onClick={() => setActiveTab('podium')}
              className={`px-3 sm:px-4 py-2 font-bold border-2 transition-all flex items-center gap-2 ${
                activeTab === 'podium'
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[3px_3px_0px_#0F172A]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>Podium Mode (Roll Call)</span>
            </button>

            <button
              onClick={() => setActiveTab('marks')}
              className={`px-3 sm:px-4 py-2 font-bold border-2 transition-all flex items-center gap-2 ${
                activeTab === 'marks'
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[3px_3px_0px_#0F172A]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
              }`}
            >
              <Award className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Quizzes &amp; Marks</span>
            </button>
          </div>

          {/* Quick Mobile Action buttons */}
          <div className="flex sm:hidden gap-2">
            <button
              onClick={() => setIsBulkLeaveOpen(true)}
              className="px-2.5 py-1.5 bg-white border-2 border-[#0F172A] text-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A]"
            >
              + Leave
            </button>
            <button
              onClick={() => setIsRosterImportOpen(true)}
              className="px-2.5 py-1.5 bg-white border-2 border-[#0F172A] text-[#0F172A] text-xs font-bold shadow-[2px_2px_0px_#0F172A]"
            >
              + CSV
            </button>
          </div>
        </div>

        {/* Tab 1: Cabin Mode Grid */}
        {activeTab === 'cabin' && (
          <CabinModeGrid
            enrollments={enrollments}
            sessions={sessions}
            records={records}
            minAttendancePct={activeCourse?.min_attendance_pct || 75}
            onUpdateStatus={handleUpdateAttendanceStatus}
          />
        )}

        {/* Tab 2: Podium Mode */}
        {activeTab === 'podium' && (
          <PodiumMode
            courseId={activeCourse?.id || ''}
            enrollments={enrollments}
            sessions={sessions}
            records={records}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onUpdateStatus={handleUpdateAttendanceStatus}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            onCreateSession={handleCreateSession}
          />
        )}

        {/* Tab 3: Marks Entry Grid */}
        {activeTab === 'marks' && (
          <MarksEntryGrid
            enrollments={enrollments}
            assessments={assessments}
            groups={groups}
            scores={scores}
            onUpdateScore={handleUpdateScore}
            onTogglePublish={handleTogglePublish}
            onCreateAssessment={handleCreateAssessment}
            onUpdateAssessment={handleUpdateAssessment}
            onDeleteAssessment={handleDeleteAssessment}
            onUpdateGroup={handleUpdateGroup}
            onCreateGroup={handleCreateGroup}
          />
        )}
      </main>

      {/* Drawers and Modals */}
      <BulkLeaveDrawer
        isOpen={isBulkLeaveOpen}
        onClose={() => setIsBulkLeaveOpen(false)}
        enrollments={enrollments}
        onApplyLeave={handleApplyLeave}
      />

      <RosterImportModal
        isOpen={isRosterImportOpen}
        onClose={() => setIsRosterImportOpen(false)}
        existingEnrollments={enrollments}
        courseId={activeCourse?.id || ''}
        onImportStudents={handleImportStudents}
      />

      <DisputeResolutionDrawer
        isOpen={isDisputesOpen}
        onClose={() => setIsDisputesOpen(false)}
        disputes={disputes}
        onResolveDispute={handleResolveDispute}
      />
    </div>
  );
}

export default function ProfessorPage() {
  return (
    <AuthGate role="professor">
      {(user) => <ProfessorDashboard user={user} />}
    </AuthGate>
  );
}
