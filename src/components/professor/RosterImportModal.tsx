'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Enrollment } from '@/types/database';
import { X, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface RosterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEnrollments: Enrollment[];
  courseId: string;
  onImportStudents: (newStudents: Partial<Enrollment>[]) => void;
}

export function RosterImportModal({
  isOpen,
  onClose,
  existingEnrollments,
  courseId,
  onImportStudents,
}: RosterImportModalProps) {
  const [parsedRows, setParsedRows] = useState<{
    roll: string;
    enroll: string;
    name: string;
    email: string;
    effectiveDate: string;
    isDuplicate: boolean;
  }[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawData(results.data as Record<string, string>[]);
        },
        error: (err) => {
          setErrorMsg(`CSV parsing error: ${err.message}`);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsName = wb.SheetNames[0];
          const ws = wb.Sheets[wsName];
          const data = XLSX.utils.sheet_to_json(ws) as Record<string, string>[];
          processRawData(data);
        } catch (err: unknown) {
          setErrorMsg(`Excel reading error: ${(err as Error).message}`);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const processRawData = (rows: Record<string, string>[]) => {
    const existingRolls = new Set(existingEnrollments.map((e) => e.roll_number));
    const existingEnrolls = new Set(existingEnrollments.map((e) => e.enrollment_number));

    const processed = rows.map((r) => {
      const roll = (r['Roll No'] || r['Roll'] || r['roll_number'] || r['Roll No.'] || '').toString().trim();
      const enroll = (r['Enrollment No'] || r['Enroll No'] || r['enrollment_number'] || r['Enrollment'] || '').toString().trim();
      const name = (r['Student Name'] || r['Name'] || r['student_name'] || r['Full Name'] || '').toString().trim();
      const email = (r['Email'] || r['Student Email'] || r['student_email'] || '').toString().trim();
      const effectiveDate = (r['Effective Date'] || r['Join Date'] || r['effective_from_date'] || '2026-09-01').toString().trim();

      const isDuplicate = existingRolls.has(roll) || existingEnrolls.has(enroll);

      return {
        roll,
        enroll,
        name,
        email,
        effectiveDate,
        isDuplicate,
      };
    }).filter((item) => item.roll && item.name);

    if (processed.length === 0) {
      setErrorMsg('No valid rows found. Ensure CSV has columns: Roll No, Enrollment No, Student Name, Email');
    }

    setParsedRows(processed);
  };

  const handleConfirmImport = () => {
    const valid = parsedRows.filter((r) => !r.isDuplicate);
    const newStudents: Partial<Enrollment>[] = valid.map((v) => ({
      course_id: courseId,
      roll_number: v.roll,
      enrollment_number: v.enroll || `ENR${v.roll}`,
      student_name: v.name,
      student_email: v.email || undefined,
      effective_from_date: v.effectiveDate || '2026-09-01',
    }));

    onImportStudents(newStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] p-6 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-[#0F172A]">Zero-Typing CSV / Excel Roster Import</h2>
            <p className="text-xs text-[#64748B] font-mono">Bulk create entire batch with duplicate detection</p>
          </div>
          <button onClick={onClose} className="p-1 border border-[#0F172A] text-[#0F172A] hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border-2 border-[#0F172A] text-[#9F1239] text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Drop Zone */}
        {parsedRows.length === 0 ? (
          <div className="border-2 border-dashed border-[#0F172A] p-8 text-center bg-[#F8FAFC] my-4">
            <FileSpreadsheet className="w-12 h-12 text-[#0F172A] mx-auto mb-3" />
            <p className="font-mono text-sm font-bold text-[#0F172A] mb-1">
              Select or Drop Department CSV / Excel (.xlsx)
            </p>
            <p className="font-mono text-xs text-[#64748B] mb-4">
              Columns: Roll No, Enrollment No, Student Name, Email, Effective Join Date
            </p>
            <label className="inline-block px-5 py-2.5 bg-[#0F172A] text-white font-mono text-xs font-bold cursor-pointer border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Browse Spreadsheet File
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col my-2">
            <div className="flex justify-between items-center text-xs font-mono mb-2 text-[#0F172A] font-bold">
              <span>Loaded: {fileName} ({parsedRows.length} found)</span>
              <span>
                Duplicates: {parsedRows.filter((r) => r.isDuplicate).length} (excluded)
              </span>
            </div>

            <div className="flex-1 overflow-auto border-2 border-[#0F172A]">
              <table className="w-full text-xs font-mono">
                <thead className="bg-[#0F172A] text-white sticky top-0">
                  <tr>
                    <th className="p-2 text-center">Roll</th>
                    <th className="p-2">Enroll No</th>
                    <th className="p-2">Student Name</th>
                    <th className="p-2">Join Date</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className={r.isDuplicate ? 'bg-rose-50 text-rose-900 font-bold' : 'hover:bg-slate-50'}>
                      <td className="p-2 text-center font-bold">{r.roll}</td>
                      <td className="p-2">{r.enroll}</td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2 text-slate-500">{r.effectiveDate}</td>
                      <td className="p-2 text-center">
                        {r.isDuplicate ? (
                          <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 font-bold border border-rose-300">
                            DUPLICATE
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 font-bold border border-emerald-300">
                            VALID
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t-2 border-[#0F172A] flex justify-between items-center font-mono text-xs">
          <button
            onClick={() => setParsedRows([])}
            className="text-[#64748B] hover:text-[#0F172A] underline font-bold"
          >
            Clear / Re-upload
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={parsedRows.filter((r) => !r.isDuplicate).length === 0}
              className="px-5 py-2 bg-[#0F172A] text-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 transition-all font-bold"
            >
              Import {parsedRows.filter((r) => !r.isDuplicate).length} Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
