import '../../App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import studentService from '../../service/studentService';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  Users,
} from 'lucide-react';

const TERM_ORDER = ['prelim', 'midterm', 'prefinals', 'finals'];

const TERM_LABELS = {
  prelim: 'Prelim',
  midterm: 'Midterm',
  prefinals: 'Prefinals',
  finals: 'Finals',
};

function normalizeTerm(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'prefinal') return 'prefinals';
  if (token === 'final') return 'finals';
  if (TERM_ORDER.includes(token)) return token;
  return null;
}

function asText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
}

function asGradeText(value) {
  if (value === null || value === undefined || value === '') return 'Pending';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(2);
}

function buildEmptyTerms() {
  return {
    prelim: { grade: 'Pending', components: [] },
    midterm: { grade: 'Pending', components: [] },
    prefinals: { grade: 'Pending', components: [] },
    finals: { grade: 'Pending', components: [] },
  };
}

function mapGradesToSubjects(grades) {
  const bySubject = new Map();

  grades.forEach((grade) => {
    const classId = grade.class_id || grade.class?.id || 'unknown';
    const code = grade.class?.subject?.subject_code || grade.subject_code || `CLASS-${classId}`;
    const subject = grade.class?.subject?.subject_name || grade.subject_name || 'Unknown Subject';
    const instructor = grade.class?.teacher?.name || grade.teacher_name || 'TBA';
    const mapKey = `${classId}-${code}`;

    if (!bySubject.has(mapKey)) {
      bySubject.set(mapKey, {
        code,
        subject,
        instructor,
        prelim: 'Pending',
        midterm: 'Pending',
        prefinals: 'Pending',
        finals: 'Pending',
        terms: buildEmptyTerms(),
      });
    }

    const row = bySubject.get(mapKey);
    const term = normalizeTerm(grade.grading_period || grade.term);
    if (!term) return;

    const scoreValue = grade.score ?? 0;
    const maxScoreValue = grade.max_score ?? 0;
    const componentLabel = grade.component_name || grade.component_type || 'Component';

    row.terms[term].components.push({
      label: componentLabel,
      score: `${scoreValue}/${maxScoreValue}`,
      rawScore: scoreValue,
      rawMaxScore: maxScoreValue,
      remarks: grade.remarks || '',
    });

    if (row.terms[term].grade === 'Pending') {
      const enrollmentKey = term === 'finals' ? 'final_grade' : `${term}_grade`;
      row.terms[term].grade = grade.enrollment?.[enrollmentKey] !== undefined && grade.enrollment?.[enrollmentKey] !== null
        ? asGradeText(grade.enrollment[enrollmentKey])
        : 'Pending';
    }

    if (term === 'midterm' && grade.enrollment?.midterm_grade !== null && grade.enrollment?.midterm_grade !== undefined) {
      row.midterm = asGradeText(grade.enrollment.midterm_grade);
      row.terms.midterm.grade = asGradeText(grade.enrollment.midterm_grade);
    }

    if (term === 'finals' && grade.enrollment?.final_grade !== null && grade.enrollment?.final_grade !== undefined) {
      row.finals = asGradeText(grade.enrollment.final_grade);
      row.terms.finals.grade = asGradeText(grade.enrollment.final_grade);
    }
  });

  return Array.from(bySubject.values()).map((row) => {
    TERM_ORDER.forEach((term) => {
      if (row.terms[term].grade === 'Pending' && row.terms[term].components.length > 0) {
        const totals = row.terms[term].components.reduce((acc, component) => {
          const score = Number(component.rawScore);
          const max = Number(component.rawMaxScore);
          if (Number.isNaN(score) || Number.isNaN(max) || max <= 0) return acc;
          return {
            totalScore: acc.totalScore + score,
            totalMax: acc.totalMax + max,
          };
        }, { totalScore: 0, totalMax: 0 });

        if (totals.totalMax > 0) {
          const percentage = (totals.totalScore / totals.totalMax) * 100;
          row.terms[term].grade = `${percentage.toFixed(1)}%`;
        }
      }

      row[term] = row.terms[term].grade;
    });

    return row;
  });
}

function TeacherStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Students');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [gradeRows, setGradeRows] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendance_rate: 0,
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const fetchStudentDetails = useCallback(async () => {
    if (!studentId) {
      setError('Missing student ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const studentResponse = await studentService.getById(studentId);
      const studentPayload = studentResponse?.data?.data ?? studentResponse?.data ?? studentResponse ?? {};
      setStudent(studentPayload);

      const gradesResponse = await studentService.getGrades(studentId, { per_page: 5000 });
      const gradesPayload = gradesResponse?.grades?.data || gradesResponse?.grades || gradesResponse?.data || [];
      const grades = Array.isArray(gradesPayload) ? gradesPayload : [];
      setGradeRows(mapGradesToSubjects(grades));

      const attendanceResponse = await studentService.getAttendance(studentId);
      const attendancePayload = attendanceResponse?.attendance?.data || attendanceResponse?.attendance || attendanceResponse?.data || [];
      const attendanceRecords = Array.isArray(attendancePayload) ? attendancePayload : [];
      const summary = attendanceResponse?.summary || {
        total: attendanceRecords.length,
        present: attendanceRecords.filter((record) => String(record.status || '').toLowerCase() === 'present').length,
        absent: attendanceRecords.filter((record) => String(record.status || '').toLowerCase() === 'absent').length,
        late: attendanceRecords.filter((record) => String(record.status || '').toLowerCase() === 'late').length,
        excused: attendanceRecords.filter((record) => String(record.status || '').toLowerCase() === 'excused').length,
        attendance_rate: attendanceRecords.length > 0
          ? Math.round(((attendanceRecords.filter((record) => ['present', 'late'].includes(String(record.status || '').toLowerCase())).length / attendanceRecords.length) * 100) * 10) / 10
          : 0,
      };

      setAttendanceSummary(summary);
      setAttendanceHistory(
        attendanceRecords.slice(0, 8).map((record) => ({
          id: record.id,
          subject: asText(record.class?.subject?.subject_code || record.subject_code || 'N/A'),
          subjectName: asText(record.class?.subject?.subject_name || record.subject_name || 'Unknown Subject'),
          status: asText(record.status || 'Present'),
          date: record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date',
        }))
      );

    } catch (fetchError) {
      console.error('Failed to load student detail:', fetchError);
      setError('Failed to load student details.');
      setStudent(null);
      setGradeRows([]);
      setAttendanceSummary({ total: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_rate: 0 });
      setAttendanceHistory([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  const studentName = useMemo(() => {
    if (!student) return 'Student';
    return `${asText(student.first_name)} ${asText(student.last_name)}`.trim() || asText(student.name, 'Student');
  }, [student]);

  const studentInitials = useMemo(() => {
    const parts = studentName.split(' ').filter(Boolean);
    if (parts.length === 0) return 'S';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }, [studentName]);

  const termAverages = useMemo(() => {
    return TERM_ORDER.map((term) => {
      const values = gradeRows
        .map((row) => Number.parseFloat(row[term]))
        .filter((value) => !Number.isNaN(value));

      return {
        term,
        label: TERM_LABELS[term],
        value: values.length > 0 ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2) : 'Pending',
      };
    });
  }, [gradeRows]);

  const overallAverage = useMemo(() => {
    const numericValues = termAverages
      .map((term) => Number.parseFloat(term.value))
      .filter((value) => !Number.isNaN(value));

    if (numericValues.length === 0) return '—';
    return (numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length).toFixed(2);
  }, [termAverages]);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading student details...</span>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 h-full bg-gray-50 p-8 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Student not found</h3>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <button
              onClick={() => navigate('/teacher/students')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  const academicStanding = asText(student.academic_standing, 'Not set');
  const enrollmentStatus = asText(student.enrollment_status, 'Unknown');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="flex-1 h-full overflow-y-auto p-8">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/teacher/dashboard')} className="hover:text-blue-600 transition-colors">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <button onClick={() => navigate('/teacher/students')} className="hover:text-blue-600 transition-colors">
            Students
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{studentName}</span>
        </nav>

        <button
          onClick={() => navigate('/teacher/students')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                {studentInitials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">{asText(student.student_number, 'N/A')}</span>
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{asText(student.grade_level, 'Grade level unavailable')}</span>
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">{enrollmentStatus}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{studentName}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {asText(student.program?.name || student.program?.program_name || student.program_id, 'Program unavailable')}
                  {' '}•{' '}
                  {asText(student.section?.section_code || student.section?.name || student.section_id, 'Section unavailable')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Attendance</p>
                <p className="text-xl font-bold text-gray-900">{attendanceSummary.attendance_rate || 0}%</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Grades</p>
                <p className="text-xl font-bold text-gray-900">{overallAverage}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Standing</p>
                <p className="text-lg font-bold text-gray-900">{academicStanding}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                <p className="text-lg font-bold text-gray-900">{asText(student.account_status, 'Unknown')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Student number</p>
              <p className="text-base font-semibold text-gray-900">{asText(student.student_number, 'N/A')}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Program</p>
              <p className="text-base font-semibold text-gray-900">{asText(student.program?.name || student.program?.program_name || student.program_id, 'N/A')}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
              <p className="text-base font-semibold text-gray-900">{asText(student.section?.section_code || student.section?.name || student.section_id, 'N/A')}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Academic year</p>
              <p className="text-base font-semibold text-gray-900">{asText(student.academicYear?.year || student.academicYear?.name || student.academic_year_id, 'N/A')}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] mb-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Term Grades</h2>
              <span className="text-xs text-gray-500">Prelim / Midterm / Prefinals / Finals</span>
            </div>

            {gradeRows.length === 0 ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                No grade records found for this student yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Prelim</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Midterm</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Prefinals</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Finals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {gradeRows.map((row) => (
                      <tr key={`${row.code}-${row.subject}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div>
                            <p className="font-medium text-gray-900">{row.subject}</p>
                            <p className="text-xs text-gray-500">{row.instructor}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{row.prelim}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{row.midterm}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{row.prefinals}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{row.finals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Attendance Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Present</p>
                <p className="text-xl font-bold text-emerald-600">{attendanceSummary.present}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Absent</p>
                <p className="text-xl font-bold text-rose-600">{attendanceSummary.absent}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Late</p>
                <p className="text-xl font-bold text-amber-600">{attendanceSummary.late}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Excused</p>
                <p className="text-xl font-bold text-blue-600">{attendanceSummary.excused}</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Attendance rate</p>
                <p className="text-lg font-bold text-gray-900">{attendanceSummary.attendance_rate || 0}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${attendanceSummary.attendance_rate || 0}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Recent records</p>
              {attendanceHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No attendance records found.</p>
              ) : (
                attendanceHistory.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{entry.subjectName}</p>
                        <p className="text-xs text-gray-500">{entry.subject} • {entry.date}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        entry.status.toLowerCase() === 'present'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : entry.status.toLowerCase() === 'absent'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : entry.status.toLowerCase() === 'late'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}

export default TeacherStudentDetail;