'use client';

import React, { useState, useMemo } from 'react';
import { Assessment, AssessmentGroup, AssessmentScore, Enrollment, AssessmentRuleType } from '@/types/database';
import { calculateStudentGroupScore } from '@/lib/calculations/marks';
import { Eye, EyeOff, Plus, Settings2, SlidersHorizontal, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

interface MarksEntryGridProps {
  enrollments: Enrollment[];
  assessments: Assessment[];
  groups: AssessmentGroup[];
  scores: AssessmentScore[];
  onUpdateScore: (assessmentId: string, enrollmentId: string, marks: number | null, isAbsent: boolean) => void;
  onTogglePublish: (assessmentId: string, isPublished: boolean) => void;
  onCreateAssessment: (groupId: string, title: string, maxMarks: number) => void;
  onUpdateAssessment?: (assessmentId: string, updates: Partial<Assessment>) => void;
  onDeleteAssessment?: (assessmentId: string) => void;
  onUpdateGroup?: (groupId: string, updates: Partial<AssessmentGroup>) => void;
  onCreateGroup?: (groupName: string, ruleType: AssessmentRuleType, maxWeight: number, bestKCount?: number) => void;
}

export function MarksEntryGrid({
  enrollments,
  assessments,
  groups,
  scores,
  onUpdateScore,
  onTogglePublish,
  onCreateAssessment,
  onUpdateAssessment,
  onDeleteAssessment,
  onUpdateGroup,
  onCreateGroup,
}: MarksEntryGridProps) {
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id || '');
  
  // Modals state
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(10);

  const [isConfiguringSection, setIsConfiguringSection] = useState(false);
  const [editSectionName, setEditSectionName] = useState('');
  const [editMaxWeight, setEditMaxWeight] = useState(20);
  const [editRuleMode, setEditRuleMode] = useState<'best_of' | 'all'>('best_of');
  const [editBestK, setEditBestK] = useState(2);
  const [editAllSubType, setEditAllSubType] = useState<'average' | 'sum'>('average');

  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionMaxWeight, setNewSectionMaxWeight] = useState(20);
  const [newSectionRuleMode, setNewSectionRuleMode] = useState<'best_of' | 'all'>('best_of');
  const [newSectionBestK, setNewSectionBestK] = useState(2);

  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [editAsmTitle, setEditAsmTitle] = useState('');
  const [editAsmMax, setEditAsmMax] = useState(10);

  const effectiveActiveGroupId = groups.some((group) => group.id === activeGroupId)
    ? activeGroupId
    : groups[0]?.id || '';
  const activeGroup = groups.find((g) => g.id === effectiveActiveGroupId) || groups[0];
  const groupAssessments = assessments.filter((a) => a.group_id === activeGroup?.id);

  // Fast score lookup map
  const scoreMap = useMemo(() => {
    const map = new Map<string, AssessmentScore>();
    scores.forEach((s) => {
      map.set(`${s.assessment_id}_${s.enrollment_id}`, s);
    });
    return map;
  }, [scores]);

  if (!activeGroup) {
    return (
      <div className="bg-white border-2 border-[#0F172A] p-6 font-mono text-sm">
        No assessment section is available for this class yet.
      </div>
    );
  }

  const openSectionConfig = () => {
    if (!activeGroup) return;
    setEditSectionName(activeGroup.group_name);
    setEditMaxWeight(activeGroup.max_group_weight);
    if (activeGroup.rule_type === 'best_of_k') {
      setEditRuleMode('best_of');
      setEditBestK(activeGroup.best_k_count || 2);
    } else {
      setEditRuleMode('all');
      setEditAllSubType(activeGroup.rule_type === 'sum' ? 'sum' : 'average');
    }
    setIsConfiguringSection(true);
  };

  const handleSaveSectionConfig = () => {
    if (!activeGroup || !onUpdateGroup) return;
    const rule_type: AssessmentRuleType = editRuleMode === 'best_of' ? 'best_of_k' : editAllSubType;
    onUpdateGroup(activeGroup.id, {
      group_name: editSectionName.trim() || activeGroup.group_name,
      max_group_weight: Number(editMaxWeight) || 20,
      rule_type,
      best_k_count: editRuleMode === 'best_of' ? Math.max(1, Number(editBestK) || 1) : undefined,
    });
    setIsConfiguringSection(false);
  };

  const handleCreateSectionSubmit = () => {
    if (!onCreateGroup || !newSectionName.trim()) return;
    const rule_type: AssessmentRuleType = newSectionRuleMode === 'best_of' ? 'best_of_k' : 'average';
    onCreateGroup(
      newSectionName.trim(),
      rule_type,
      Number(newSectionMaxWeight) || 20,
      newSectionRuleMode === 'best_of' ? Number(newSectionBestK) || 2 : undefined
    );
    setNewSectionName('');
    setIsCreatingSection(false);
  };

  const openEditAssessment = (asm: Assessment) => {
    setEditingAssessment(asm);
    setEditAsmTitle(asm.title);
    setEditAsmMax(asm.max_marks);
  };

  const handleSaveAssessmentEdit = () => {
    if (!editingAssessment || !onUpdateAssessment) return;
    onUpdateAssessment(editingAssessment.id, {
      title: editAsmTitle.trim() || editingAssessment.title,
      max_marks: Number(editAsmMax) || 10,
    });
    setEditingAssessment(null);
  };

  const handleCellChange = (asmId: string, enrollId: string, val: string) => {
    const trimmed = val.trim().toUpperCase();
    if (trimmed === 'AB') {
      onUpdateScore(asmId, enrollId, null, true);
    } else if (trimmed === '') {
      onUpdateScore(asmId, enrollId, null, false);
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        onUpdateScore(asmId, enrollId, num, false);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentAsmIdx: number,
    currentEnrollIdx: number
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextEnrollIdx = currentEnrollIdx + 1;
      if (nextEnrollIdx < enrollments.length) {
        const nextEnroll = enrollments[nextEnrollIdx];
        const nextAsm = groupAssessments[currentAsmIdx];
        const nextInput = document.getElementById(`score_${nextAsm.id}_${nextEnroll.id}`);
        nextInput?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevEnrollIdx = currentEnrollIdx - 1;
      if (prevEnrollIdx >= 0) {
        const prevEnroll = enrollments[prevEnrollIdx];
        const currentAsm = groupAssessments[currentAsmIdx];
        const prevInput = document.getElementById(`score_${currentAsm.id}_${prevEnroll.id}`);
        prevInput?.focus();
      }
    }
  };

  return (
    <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] w-full min-w-0">
      {/* Group Tabs & Assessment Actions Toolbar */}
      <div className="px-4 py-2.5 border-b-2 border-[#0F172A] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {groups.map((g) => {
            const asmCount = assessments.filter((a) => a.group_id === g.id).length;
            const isBestOf = g.rule_type === 'best_of_k';
            const ruleLabel = isBestOf ? `Best ${g.best_k_count} of ${asmCount}` : 'All Quizzes';

            return (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`px-3 py-1.5 font-bold border-2 transition-all flex items-center gap-1.5 ${
                  effectiveActiveGroupId === g.id
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
                }`}
              >
                <span>{g.group_name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-xs font-mono ${
                  effectiveActiveGroupId === g.id ? 'bg-slate-800 text-blue-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {ruleLabel} (/ {g.max_group_weight})
                </span>
              </button>
            );
          })}

          {/* Add New Custom Section */}
          <button
            onClick={() => setIsCreatingSection(true)}
            className="px-2.5 py-1.5 text-xs font-bold border-2 border-dashed border-[#0F172A] bg-white hover:bg-slate-100 text-[#0F172A] transition-all flex items-center gap-1"
            title="Create custom assessment section (e.g. Assignments, Lab Viva, etc.)"
          >
            <Plus className="w-3 h-3" />
            <span>New Section</span>
          </button>
        </div>

        {/* Section Actions: Configure Section Rules + Add Column */}
        <div className="flex items-center gap-2">
          <button
            onClick={openSectionConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0F172A] font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-slate-100 transition-all"
            title="Configure section max marks and calculation rules"
          >
            <Settings2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Rules &amp; Max Marks</span>
          </button>

          <button
            onClick={() => setIsCreatingAssessment(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test Column</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto max-h-[620px] relative">
        <table className="w-max min-w-full border-collapse text-left text-xs font-mono">
          <thead className="bg-[#0F172A] text-white sticky top-0 z-30 select-none border-b-2 border-[#0F172A]">
            <tr>
              <th className="sticky left-0 bg-[#0F172A] z-40 px-2 py-2.5 w-12 text-center border-r border-slate-700 font-bold text-[11px] uppercase tracking-wider">
                Roll
              </th>
              <th className="sticky left-12 bg-[#0F172A] z-40 px-2.5 py-2.5 w-24 text-center border-r border-slate-700 font-bold text-[11px] uppercase tracking-wider">
                Enroll No
              </th>
              <th className="sticky left-36 bg-[#0F172A] z-40 px-3 py-2.5 w-44 text-left border-r border-slate-700 font-bold text-[11px] uppercase tracking-wider">
                Student Name
              </th>

              {/* Assessment Test Columns */}
              {groupAssessments.map((asm) => (
                <th key={asm.id} className="px-2 py-2 w-28 min-w-[110px] text-center border-r border-slate-800 bg-[#0F172A]">
                  <div
                    onClick={() => openEditAssessment(asm)}
                    className="font-bold text-slate-100 text-[11px] truncate max-w-[120px] mx-auto cursor-pointer hover:underline flex items-center justify-center gap-1"
                    title="Click to edit column title or max marks"
                  >
                    <span>{asm.title}</span>
                    <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">Max: {asm.max_marks} pts</div>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => onTogglePublish(asm.id, !asm.is_published)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] uppercase font-bold border ${
                        asm.is_published
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-amber-600 text-white border-amber-400'
                      }`}
                      title={asm.is_published ? 'Visible to students' : 'Draft only — hidden from students'}
                    >
                      {asm.is_published ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                      {asm.is_published ? 'Pub' : 'Draft'}
                    </button>
                  </div>
                </th>
              ))}

              {/* Result Summary Column with 1-click configure */}
              <th
                onClick={openSectionConfig}
                className="sticky right-0 bg-[#0F172A] z-40 px-3 py-2.5 w-32 text-center border-l border-slate-700 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-800 transition-colors"
                title="Click to change Section Max Marks & Calculation Rules"
              >
                <div className="flex items-center justify-center gap-1 text-slate-100">
                  <span>RESULT (/ {activeGroup?.max_group_weight || 20})</span>
                  <Settings2 className="w-3 h-3 text-blue-300" />
                </div>
                <div className="text-[8px] text-blue-300 font-normal normal-case mt-0.5">
                  {activeGroup?.rule_type === 'best_of_k'
                    ? `Best ${activeGroup.best_k_count} of ${groupAssessments.length}`
                    : 'All Quizzes Count'}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {enrollments.map((enr, enrollIdx) => {
              const groupResult = calculateStudentGroupScore(activeGroup, assessments, scores, enr.id);
              const rowBg = enrollIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFF]';

              return (
                <tr key={enr.id} className={`hover:bg-blue-50/50 transition-colors ${rowBg}`}>
                  <td className="sticky left-0 bg-white group-hover:bg-blue-50 z-20 px-2 py-1.5 text-center font-bold text-[#0F172A] border-r border-[#E2E8F0]">
                    {enr.roll_number}
                  </td>
                  <td className="sticky left-12 bg-white group-hover:bg-blue-50 z-20 px-2.5 py-1.5 text-center text-[#475569] border-r border-[#E2E8F0] text-[11px]">
                    {enr.enrollment_number}
                  </td>
                  <td className="sticky left-36 bg-white group-hover:bg-blue-50 z-20 px-3 py-1.5 font-bold text-[#0F172A] border-r border-[#E2E8F0] truncate max-w-[176px]">
                    {enr.student_name}
                  </td>

                  {/* Individual Test Scores */}
                  {groupAssessments.map((asm, asmIdx) => {
                    const sc = scoreMap.get(`${asm.id}_${enr.id}`);
                    let displayValue = '';
                    let isAbsent = false;

                    if (sc) {
                      if (sc.is_absent) {
                        displayValue = 'AB';
                        isAbsent = true;
                      } else if (sc.marks_obtained !== null && sc.marks_obtained !== undefined) {
                        displayValue = `${sc.marks_obtained}`;
                      }
                    }

                    return (
                      <td key={asm.id} className="p-1 border-r border-[#E2E8F0] text-center">
                        <input
                          id={`score_${asm.id}_${enr.id}`}
                          type="text"
                          defaultValue={displayValue}
                          onBlur={(e) => handleCellChange(asm.id, enr.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, asmIdx, enrollIdx)}
                          placeholder="-"
                          className={`w-14 text-center py-1 font-mono text-xs font-bold border-2 transition-all ${
                            isAbsent
                              ? 'bg-rose-100 text-[#9F1239] border-[#9F1239]'
                              : 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#0F172A]'
                          }`}
                        />
                      </td>
                    );
                  })}

                  {/* Final Scaled Section Result */}
                  <td className="sticky right-0 bg-white z-20 px-3 py-1.5 text-center font-black text-[#0F172A] border-l border-[#E2E8F0] tabular-numbers whitespace-nowrap">
                    {groupResult.obtainedScaled} / {groupResult.maxScaled}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Quick Legend Footer */}
      <div className="px-4 py-2 bg-[#F8FAFC] border-t-2 border-[#0F172A] text-[11px] font-mono text-[#64748B] flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <span>💡 Keyboard navigation: Press <strong>Enter</strong> or <strong>↓</strong> to move down. Type <strong>AB</strong> for Absent.</span>
        </div>
        <div className="text-[10px]">
          Current Section: <strong>{activeGroup?.group_name}</strong> • Max: <strong>{activeGroup?.max_group_weight} pts</strong>
        </div>
      </div>

      {/* 1. Modal: Section Configuration (Section Max Marks & Quiz Rules) */}
      {isConfiguringSection && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] space-y-5">
            <div className="border-b-2 border-[#0F172A] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                <span>Configure Section: {activeGroup?.group_name}</span>
              </h3>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">
                Set section max marks and choose quiz evaluation rule
              </p>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Section Name */}
              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Section Title</label>
                <input
                  type="text"
                  value={editSectionName}
                  onChange={(e) => setEditSectionName(e.target.value)}
                  placeholder="e.g. Quizzes, Mid-Sem Exam, Assignments"
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC] text-xs font-bold"
                />
              </div>

              {/* Section Max Marks (Result Max Weight) */}
              <div>
                <label className="block text-[#0F172A] font-bold mb-1">
                  Section Max Marks / Result Weight (e.g. 20, 30, 50, 100)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={editMaxWeight}
                    onChange={(e) => setEditMaxWeight(parseFloat(e.target.value) || 20)}
                    className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC] text-sm font-black text-[#0F172A]"
                  />
                  <span className="text-xs text-[#64748B] font-bold shrink-0">pts total</span>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1">
                  The Result column will scale scores to this maximum (/ {editMaxWeight}).
                </p>
              </div>

              {/* Quiz Calculation Rule Selector */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <label className="block text-[#0F172A] font-bold">
                  Calculation Mode: How should quizzes/tests be evaluated?
                </label>

                {/* Option 1: Best of K */}
                <div
                  onClick={() => setEditRuleMode('best_of')}
                  className={`p-3 border-2 cursor-pointer transition-all ${
                    editRuleMode === 'best_of'
                      ? 'bg-blue-50 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                      : 'bg-white border-[#CBD5E1] hover:border-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-[#0F172A] flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={editRuleMode === 'best_of'}
                        onChange={() => setEditRuleMode('best_of')}
                        className="accent-[#0F172A]"
                      />
                      <span>1) &ldquo;Best of _&rdquo; Quizzes</span>
                    </label>

                    {editRuleMode === 'best_of' && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[11px] text-[#475569]">Best</span>
                        <input
                          type="number"
                          min="1"
                          max={Math.max(1, groupAssessments.length)}
                          value={editBestK}
                          onChange={(e) => setEditBestK(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 text-center p-1 border-2 border-[#0F172A] bg-white font-black text-xs"
                        />
                        <span className="text-[11px] text-[#475569]">of {groupAssessments.length || 'N'}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1.5 ml-5">
                    Automatically picks the top {editBestK} highest marks for each student and drops the lower scores.
                  </p>
                </div>

                {/* Option 2: All Quiz */}
                <div
                  onClick={() => setEditRuleMode('all')}
                  className={`p-3 border-2 cursor-pointer transition-all ${
                    editRuleMode === 'all'
                      ? 'bg-blue-50 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                      : 'bg-white border-[#CBD5E1] hover:border-[#0F172A]'
                  }`}
                >
                  <label className="font-bold text-xs text-[#0F172A] flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editRuleMode === 'all'}
                      onChange={() => setEditRuleMode('all')}
                      className="accent-[#0F172A]"
                    />
                    <span>2) &ldquo;All Quiz&rdquo; (Every Quiz Counts)</span>
                  </label>
                  <p className="text-[10px] text-[#64748B] mt-1.5 ml-5">
                    Every quiz is considered towards the result without dropping any quiz scores.
                  </p>

                  {editRuleMode === 'all' && (
                    <div className="mt-2 ml-5 pt-2 border-t border-blue-200 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="allSubType"
                          checked={editAllSubType === 'average'}
                          onChange={() => setEditAllSubType('average')}
                          className="accent-[#0F172A]"
                        />
                        Average scaled to {editMaxWeight}
                      </label>
                      <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="allSubType"
                          checked={editAllSubType === 'sum'}
                          onChange={() => setEditAllSubType('sum')}
                          className="accent-[#0F172A]"
                        />
                        Direct Sum
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsConfiguringSection(false)}
                className="px-4 py-2 border-2 border-[#0F172A] text-[#0F172A] bg-white font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSectionConfig}
                className="px-5 py-2 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Apply &amp; Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Add New Custom Section */}
      {isCreatingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] space-y-4">
            <div className="border-b-2 border-[#0F172A] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] font-display">Create New Assessment Section</h3>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">
                Add custom evaluation section (e.g. Assignments, Lab Viva, Attendance)
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Section Name</label>
                <input
                  type="text"
                  placeholder="e.g. Assignments, Lab Viva, Surprise Tests"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Section Max Marks</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newSectionMaxWeight}
                  onChange={(e) => setNewSectionMaxWeight(parseFloat(e.target.value) || 20)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC] font-bold"
                />
              </div>

              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Calculation Rule</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSectionRuleMode('best_of')}
                    className={`py-2 text-xs font-bold border-2 ${
                      newSectionRuleMode === 'best_of'
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-slate-700 border-[#CBD5E1]'
                    }`}
                  >
                    Best of K
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSectionRuleMode('all')}
                    className={`py-2 text-xs font-bold border-2 ${
                      newSectionRuleMode === 'all'
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-slate-700 border-[#CBD5E1]'
                    }`}
                  >
                    All Tests
                  </button>
                </div>
              </div>

              {newSectionRuleMode === 'best_of' && (
                <div>
                  <label className="block text-[#0F172A] font-bold mb-1">Best K Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSectionBestK}
                    onChange={(e) => setNewSectionBestK(parseInt(e.target.value) || 2)}
                    className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsCreatingSection(false)}
                className="px-4 py-2 border-2 border-[#0F172A] text-[#0F172A] bg-white font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSectionSubmit}
                disabled={!newSectionName.trim()}
                className="px-5 py-2 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 transition-all"
              >
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Add New Test Column */}
      {isCreatingAssessment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A]">
            <h3 className="text-base font-bold text-[#0F172A] mb-3 font-display">Add Assessment Column</h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Assessment Title</label>
                <input
                  type="text"
                  placeholder={`e.g. Quiz ${groupAssessments.length + 1}`}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Max Marks</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newMaxMarks}
                  onChange={(e) => setNewMaxMarks(parseInt(e.target.value) || 10)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsCreatingAssessment(false)}
                className="px-3 py-1.5 border-2 border-[#0F172A] text-[#0F172A] bg-white font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newTitle.trim()) {
                    onCreateAssessment(effectiveActiveGroupId, newTitle.trim(), newMaxMarks);
                    setNewTitle('');
                    setIsCreatingAssessment(false);
                  }
                }}
                className="px-4 py-1.5 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Create Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Edit Assessment Column (Title / Max Marks / Delete) */}
      {editingAssessment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] space-y-3">
            <h3 className="text-base font-bold text-[#0F172A] font-display">Edit Column Details</h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Title</label>
                <input
                  type="text"
                  value={editAsmTitle}
                  onChange={(e) => setEditAsmTitle(e.target.value)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[#0F172A] font-bold mb-1">Max Marks</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={editAsmMax}
                  onChange={(e) => setEditAsmMax(parseFloat(e.target.value) || 10)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] font-mono text-xs">
              {onDeleteAssessment ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete ${editingAssessment.title}?`)) {
                      onDeleteAssessment(editingAssessment.id);
                      setEditingAssessment(null);
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAssessment(null)}
                  className="px-3 py-1.5 border-2 border-[#0F172A] text-[#0F172A] bg-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssessmentEdit}
                  className="px-4 py-1.5 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
