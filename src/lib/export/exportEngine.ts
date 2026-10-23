import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Course, Enrollment, AttendanceSession, AttendanceRecord, Assessment, AssessmentScore, AssessmentGroup } from '@/types/database';
import { calculateStudentAttendance } from '../calculations/attendance';
import { calculateStudentGroupScore } from '../calculations/marks';

export interface ExportDataPayload {
  course: Course;
  enrollments: Enrollment[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  assessments: Assessment[];
  scores: AssessmentScore[];
  groups: AssessmentGroup[];
}

export function generateHODExcel(payload: ExportDataPayload) {
  const { course, enrollments, sessions, records, assessments, scores, groups } = payload;

  // 1. Consolidated Marksheet Sheet
  const marksheetRows = enrollments.map((enr) => {
    const att = calculateStudentAttendance(enr, sessions, records, course.medical_leave_rule, course.min_attendance_pct);
    
    // Group scores
    const groupScores = groups.map(g => {
      const gScore = calculateStudentGroupScore(g, assessments, scores, enr.id);
      return {
        name: g.group_name,
        score: gScore.obtainedScaled,
        max: gScore.maxScaled,
      };
    });

    const totalInternal = groupScores.reduce((acc, curr) => acc + curr.score, 0);

    const rowObj: Record<string, string | number> = {
      'Roll No.': enr.roll_number,
      'Enrollment No.': enr.enrollment_number,
      'Student Name': enr.student_name,
      'Total Classes': att.totalWeightedClasses,
      'Attended': att.attendedWeightedCredits,
      'Medical Leaves': att.leaveCount,
      'Attendance %': `${att.percentage}%`,
      'Status': att.isDetained ? 'DETAINED (<75%)' : 'ELIGIBLE',
    };

    // Add individual assessments
    assessments.forEach(asm => {
      const sc = scores.find(s => s.assessment_id === asm.id && s.enrollment_id === enr.id);
      if (!sc) {
        rowObj[asm.title] = '-';
      } else if (sc.is_absent) {
        rowObj[asm.title] = 'AB';
      } else {
        rowObj[asm.title] = sc.marks_obtained !== null && sc.marks_obtained !== undefined ? sc.marks_obtained : '-';
      }
    });

    groupScores.forEach(gs => {
      rowObj[`Scaled ${gs.name} (/ ${gs.max})`] = gs.score;
    });

    rowObj['Total Internal Marks'] = Math.round(totalInternal * 10) / 10;
    return rowObj;
  });

  const wb = XLSX.utils.book_new();
  const wsMarksheet = XLSX.utils.json_to_sheet(marksheetRows);
  XLSX.utils.book_append_sheet(wb, wsMarksheet, 'Consolidated Marksheet');

  // 2. Attendance Register Sheet
  const registerRows = enrollments.map(enr => {
    const row: Record<string, string | number> = {
      'Roll No.': enr.roll_number,
      'Enrollment No.': enr.enrollment_number,
      'Student Name': enr.student_name,
    };
    sessions.forEach(sess => {
      const rec = records.find(r => r.session_id === sess.id && r.enrollment_id === enr.id);
      row[`${sess.session_date} (${sess.slot_label})`] = rec ? rec.status : 'P';
    });
    const att = calculateStudentAttendance(enr, sessions, records, course.medical_leave_rule, course.min_attendance_pct);
    row['Final Attendance %'] = `${att.percentage}%`;
    return row;
  });
  const wsRegister = XLSX.utils.json_to_sheet(registerRows);
  XLSX.utils.book_append_sheet(wb, wsRegister, 'Attendance Register');

  // 3. Detained List Sheet (<75%)
  const detainedRows = enrollments
    .map(enr => {
      const att = calculateStudentAttendance(enr, sessions, records, course.medical_leave_rule, course.min_attendance_pct);
      return { enr, att };
    })
    .filter(({ att }) => att.isDetained)
    .map(({ enr, att }) => ({
      'Roll No.': enr.roll_number,
      'Enrollment No.': enr.enrollment_number,
      'Student Name': enr.student_name,
      'Attended / Total': `${att.attendedWeightedCredits} / ${att.totalWeightedClasses}`,
      'Attendance %': `${att.percentage}%`,
      'Consecutive Classes Needed to Reach 75%': att.classesNeededFor75,
      'Medical Leaves': att.leaveCount,
    }));

  const wsDetained = XLSX.utils.json_to_sheet(detainedRows);
  XLSX.utils.book_append_sheet(wb, wsDetained, 'Detained Students');

  const fileName = `${course.course_code}_HOD_Consolidated_Report.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function generateHODPDF(payload: ExportDataPayload) {
  const { course, enrollments, sessions, records, assessments, scores, groups } = payload;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // University Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('OFFICIAL ACADEMIC INTERNAL MARKSHEET & ATTENDANCE RECORD', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Course: ${course.course_code} - ${course.course_name} | Semester: ${course.semester} | Section: ${course.section || 'All'}`, 14, 22);
  doc.text(`Total Sessions Conducted: ${sessions.length} | Threshold: ${course.min_attendance_pct}% | Generated: ${new Date().toLocaleDateString()}`, 14, 27);

  // Table Columns
  const headCols = [
    'Roll',
    'Enroll No',
    'Student Name',
    'Att/Tot',
    'Att %',
    ...assessments.slice(0, 4).map(a => a.title.split(':')[0]),
    'Internal Tot',
    'Status'
  ];

  const bodyRows = enrollments.map(enr => {
    const att = calculateStudentAttendance(enr, sessions, records, course.medical_leave_rule, course.min_attendance_pct);
    const groupScores = groups.map(g => calculateStudentGroupScore(g, assessments, scores, enr.id));
    const totalInternal = groupScores.reduce((acc, curr) => acc + curr.obtainedScaled, 0);

    const asmScores = assessments.slice(0, 4).map(a => {
      const sc = scores.find(s => s.assessment_id === a.id && s.enrollment_id === enr.id);
      if (!sc) return '-';
      if (sc.is_absent) return 'AB';
      return sc.marks_obtained !== null ? `${sc.marks_obtained}` : '-';
    });

    return [
      enr.roll_number,
      enr.enrollment_number,
      enr.student_name,
      `${att.attendedWeightedCredits}/${att.totalWeightedClasses}`,
      `${att.percentage}%`,
      ...asmScores,
      `${Math.round(totalInternal * 10) / 10}`,
      att.isDetained ? 'DETAINED' : 'ELIGIBLE'
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [headCols],
    body: bodyRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center' },
      1: { halign: 'center' },
      4: { fontStyle: 'bold' },
      7: { fontStyle: 'bold', textColor: [15, 23, 42] },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = parseFloat(data.cell.raw as string);
        if (!isNaN(val) && val < course.min_attendance_pct) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose
        }
      }
      if (data.section === 'body' && data.column.index === headCols.length - 1) {
        if (data.cell.raw === 'DETAINED') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    }
  });

  // Footer & Professor Signature Line
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.line(20, finalY, 80, finalY);
  doc.text('Course Instructor / Professor', 20, finalY + 5);

  doc.line(210, finalY, 270, finalY);
  doc.text('Head of Department (HOD) Signature', 210, finalY + 5);

  const fileName = `${course.course_code}_Official_Consolidated_Marksheet.pdf`;
  doc.save(fileName);
}
