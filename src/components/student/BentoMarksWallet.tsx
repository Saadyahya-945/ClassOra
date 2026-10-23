'use client';

import React from 'react';
import { Assessment, AssessmentGroup, AssessmentScore } from '@/types/database';
import { calculateStudentGroupScore } from '@/lib/calculations/marks';
import { Trophy, Star } from 'lucide-react';

interface BentoMarksWalletProps {
  enrollmentId: string;
  groups: AssessmentGroup[];
  assessments: Assessment[];
  scores: AssessmentScore[];
}

export function BentoMarksWallet({
  enrollmentId,
  groups,
  assessments,
  scores,
}: BentoMarksWalletProps) {
  const publishedAssessments = assessments.filter((a) => a.is_published);

  return (
    <div className="space-y-4 w-full min-w-0">
      <div>
        <h3 className="text-base sm:text-lg font-bold font-display text-[#0F172A] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          <span>Sessional Marks Wallet</span>
        </h3>
        <p className="text-xs text-[#64748B] font-mono">
          Official verified scores and automated Best-of-N breakdowns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => {
          const groupResult = calculateStudentGroupScore(
            group,
            publishedAssessments,
            scores,
            enrollmentId
          );

          const groupPublishedCount = publishedAssessments.filter((a) => a.group_id === group.id).length;

          return (
            <div
              key={group.id}
              className="p-5 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-[#0F172A] font-display break-words">
                      {group.group_name}
                    </h4>
                    <span className="text-[10px] font-mono uppercase text-blue-700 font-bold bg-blue-50 px-2 py-0.5 border border-blue-200 inline-block mt-1">
                      {group.rule_type === 'best_of_k'
                        ? `Best ${group.best_k_count} count`
                        : group.rule_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black font-display text-[#0F172A] tabular-numbers">
                      {groupResult.obtainedScaled}
                    </span>
                    <span className="text-xs font-mono text-[#64748B] ml-1">/ {groupResult.maxScaled}</span>
                    <div className="text-[9px] text-emerald-700 font-mono font-bold uppercase">Scaled Final</div>
                  </div>
                </div>

                {/* Individual Assessment Pills */}
                {groupPublishedCount === 0 ? (
                  <div className="text-xs font-mono text-slate-400 py-3 italic">
                    Marks currently in evaluation (draft mode).
                  </div>
                ) : (
                  <div className="space-y-2 mt-3 pt-3 border-t-2 border-[#E2E8F0] font-mono text-xs">
                    {groupResult.includedAssessments.map((item) => (
                      <div
                        key={item.assessmentId}
                        className={`p-2.5 border-2 flex items-center justify-between gap-2 ${
                          item.isIncludedInBest
                            ? 'bg-blue-50 border-[#0F172A] text-blue-950 shadow-[2px_2px_0px_#0F172A]'
                            : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.isIncludedInBest ? (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 border border-[#CBD5E1] inline-block shrink-0" />
                          )}
                          <span className="font-bold truncate">{item.title}</span>
                        </div>

                        <div className="flex items-center gap-2 font-bold shrink-0">
                          <span>
                            {item.score === 'AB' ? (
                              <span className="text-rose-700 bg-rose-100 px-1.5 py-0.5 border border-rose-300 text-[10px]">
                                ABSENT
                              </span>
                            ) : item.score === '-' ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <span>
                                {item.score} <span className="text-slate-400 font-normal">/ {item.maxMarks}</span>
                              </span>
                            )}
                          </span>

                          {item.isIncludedInBest && (
                            <span className="text-[9px] bg-[#0F172A] text-white px-1.5 py-0.5 font-bold uppercase">
                              Counted
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Rule: Institutional Formula</span>
                <span>Max: {group.max_group_weight} pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
