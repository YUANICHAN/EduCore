import '../../App.css';
import { useMemo, useState, useEffect, useCallback } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import authService from '../../service/authService';
import studentService from '../../service/studentService';
import academicYearService from '../../service/academicYearService';
import { GraduationCap, CheckCircle2, AlertCircle, Lock, Loader2, ChevronRight, Home, BookOpen, ArrowLeft } from 'lucide-react';

const TERM_ORDER = ['prelim', 'midterm', 'prefinal', 'finals'];

const TERM_LABELS = {
  prelim: 'Prelim',
  midterm: 'Midterm',
  prefinal: 'Prefinal',
  finals: 'Finals',
};

function normalizeTerm(period) {
  const value = String(period || '').trim().toLowerCase();
  if (value === 'final') return 'finals';
  if (TERM_ORDER.includes(value)) return value;
  return null;
}

function asGradeText(value) {
  if (value === null || value === undefined || value === '') return 'Pending';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(2);
}

function buildEmptyTerms() {
  return {
    prelim: { grade: 'Pending', summary: 'No grade records yet for this term.', components: [] },
    midterm: { grade: 'Pending', summary: 'No grade records yet for this term.', components: [] },
    prefinal: { grade: 'Pending', summary: 'No grade records yet for this term.', components: [] },
    finals: { grade: 'Pending', summary: 'No grade records yet for this term.', components: [] },
  };
}

function summarizeTerm(termData) {
  if (!termData || termData.components.length === 0) {
    return 'No grade records yet for this term.';
  }

  const numericScores = termData.components
    .map((c) => {
      const score = Number(c.rawScore);
      const max = Number(c.rawMaxScore);
      if (Number.isNaN(score) || Number.isNaN(max) || max <= 0) return null;
      return (score / max) * 100;
    })
    .filter((v) => v !== null);

  if (numericScores.length === 0) {
    return 'Grade components are recorded without complete score values.';
  }

  const avg = numericScores.reduce((sum, v) => sum + v, 0) / numericScores.length;
  return `Average component score: ${avg.toFixed(1)}%.`;
}

function mapGradesToSubjects(grades) {
  const bySubject = new Map();

  grades.forEach((g) => {
    const classId = g.class_id || g.class?.id || 'unknown';
    const code = g.class?.subject?.subject_code || g.subject_code || `CLASS-${classId}`;
    const subject = g.class?.subject?.subject_name || g.subject_name || 'Unknown Subject';
    const instructor = g.class?.teacher?.name || g.teacher_name || 'TBA';
    const mapKey = `${classId}-${code}`;

    if (!bySubject.has(mapKey)) {
      bySubject.set(mapKey, {
        code,
        classId,
        subject,
        instructor,
        prelim: 'Pending',
        midterm: 'Pending',
        prefinal: 'Pending',
        finals: 'Pending',
        status: 'Pending',
        terms: buildEmptyTerms(),
      });
    }

    const row = bySubject.get(mapKey);
    const term = normalizeTerm(g.grading_period || g.term);
    if (!term) return;

    const componentLabel = g.component_name || g.component_type || 'Component';
    const scoreValue = g.score ?? 0;
    const maxScoreValue = g.max_score ?? 0;
    const weightValue = g.percentage_weight;

    row.terms[term].components.push({
      label: componentLabel,
      score: `${scoreValue}/${maxScoreValue}`,
      weight: weightValue !== null && weightValue !== undefined ? `${weightValue}%` : 'N/A',
      rawScore: scoreValue,
      rawMaxScore: maxScoreValue,
      remarks: g.remarks || '',
    });

    if (row.terms[term].grade === 'Pending') {
      row.terms[term].grade = g.enrollment?.[`${term === 'finals' ? 'final' : term}_grade`]
        ? asGradeText(g.enrollment[`${term === 'finals' ? 'final' : term}_grade`])
        : 'Pending';
    }

    if (term === 'midterm' && g.enrollment?.midterm_grade !== null && g.enrollment?.midterm_grade !== undefined) {
      row.midterm = asGradeText(g.enrollment.midterm_grade);
      row.terms.midterm.grade = asGradeText(g.enrollment.midterm_grade);
    }

    if (term === 'finals' && g.enrollment?.final_grade !== null && g.enrollment?.final_grade !== undefined) {
      row.finals = asGradeText(g.enrollment.final_grade);
      row.terms.finals.grade = asGradeText(g.enrollment.final_grade);
    }

    if (row.status !== 'Submitted') {
      row.status = g.is_locked ? 'Submitted' : 'Pending';
    }
  });

  const result = Array.from(bySubject.values()).map((row) => {
    TERM_ORDER.forEach((term) => {
      if (row.terms[term].grade === 'Pending' && row.terms[term].components.length > 0) {
        const numericScores = row.terms[term].components
          .map((c) => {
            const score = Number(c.rawScore);
            const max = Number(c.rawMaxScore);
            if (Number.isNaN(score) || Number.isNaN(max) || max <= 0) return null;
            return (score / max) * 100;
          })
          .filter((v) => v !== null);

        if (numericScores.length > 0) {
          const avg = numericScores.reduce((sum, v) => sum + v, 0) / numericScores.length;
          row.terms[term].grade = `${avg.toFixed(1)}%`;
        }
      }

      row.terms[term].summary = summarizeTerm(row.terms[term]);
      row[term] = row.terms[term].grade;
    });

    if (TERM_ORDER.every((term) => row[term] === 'Pending')) {
      row.status = 'Pending';
    }

    return row;
  });

  return result;
}

function Grades() {
  const [activeItem, setActiveItem] = useState('Grades');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [gradeRows, setGradeRows] = useState([]);
  const [gpaPerTerm, setGpaPerTerm] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('prelim');

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const profileResponse = await authService.getProfile();
      const profileUser = profileResponse?.data || profileResponse || {};
      const student = profileUser.student || profileUser;
      const studentId = student?.id || profileUser.student_id || profileUser.id;

      if (!studentId) {
        setGradeRows([]);
        setGpaPerTerm([]);
        setError('Student profile is missing an ID.');
        return;
      }

      const response = await studentService.getGrades(studentId);
      const gradesPayload = response?.grades?.data || response?.grades || response?.data || [];
      const grades = Array.isArray(gradesPayload) ? gradesPayload : [];

      const mappedRows = mapGradesToSubjects(grades);
      setGradeRows(mappedRows);

      const termGpa = TERM_ORDER
        .map((term) => {
          const values = mappedRows
            .map((row) => Number.parseFloat(row[term]))
            .filter((v) => !Number.isNaN(v));

          if (values.length === 0) return null;
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          return { term: TERM_LABELS[term], gpa: Number.parseFloat(avg.toFixed(2)) };
        })
        .filter(Boolean);

      setGpaPerTerm(termGpa);

      if (mappedRows.length === 0) {
        setSelectedSubject(null);
      } else if (selectedSubject && !mappedRows.some((row) => row.code === selectedSubject.code)) {
        setSelectedSubject(null);
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Failed to load grades from the database.');
      setGradeRows([]);
      setGpaPerTerm([]);
      setSelectedSubject(null);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await academicYearService.getAll();
        const years = (response?.data || response || []).map((ay) => ay.year || `${ay.start_year}-${ay.end_year}`);
        setAcademicYears(years.length > 0 ? years : ['2024-2025']);
      } catch (err) {
        console.error('Error fetching academic years:', err);
        setAcademicYears(['2024-2025']);
      }
    };

    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades, selectedYear]);

  const overallGPA = useMemo(() => {
    const submitted = gpaPerTerm.map((t) => t.gpa);
    if (submitted.length === 0) return '—';
    const avg = submitted.reduce((a, b) => a + b, 0) / submitted.length;
    return avg.toFixed(2);
  }, [gpaPerTerm]);

  const statusBadge = (status) => {
    const base = 'px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1';
    if (status === 'Submitted') return `${base} bg-green-50 text-green-700 border-green-200`;
    return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  };

  const selectedSubjectData = useMemo(
    () => gradeRows.find((row) => row.code === selectedSubject?.code) || null,
    [gradeRows, selectedSubject]
  );

  const currentTermLabel = TERM_LABELS[selectedTerm] || 'Prelim';

  const openSubject = (row) => {
    setSelectedSubject(row);
    setSelectedTerm('prelim');
  };

  const renderTermValue = (row, term) => {
    if (row.terms?.[term]?.grade) return row.terms[term].grade;
    return row[term] || 'Pending';
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading grades...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grades</h1>
            <p className="text-gray-600 mt-1">Academic performance tracking. Visible after teacher submission; locked after finalization.</p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {academicYears.map((year) => (
              <option key={year} value={year}>AY {year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Overall GPA</p>
            <p className="text-3xl font-bold text-gray-900">{overallGPA}</p>
            <p className="text-xs text-gray-500 mt-1">Calculated from available term records</p>
          </div>
          {gpaPerTerm.map((term) => (
            <div key={term.term} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600">{term.term}</p>
              <p className="text-2xl font-bold text-gray-900">{term.gpa.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Average across subjects</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Grades per Subject</h2>
            <span className="text-xs text-gray-500">Prelim / Midterm / Prefinal / Finals</span>
          </div>

          {selectedSubjectData ? (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-blue-900">
                <span className="font-semibold">Breadcrumbs</span>
                <span className="flex items-center gap-1"><Home className="w-4 h-4" />Grades</span>
                <ChevronRight className="w-4 h-4" />
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{selectedSubjectData.subject}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold">{currentTermLabel}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-950">{selectedSubjectData.code}</p>
                  <p className="text-xs text-blue-800">{selectedSubjectData.instructor}</p>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-blue-200 bg-white text-blue-700 hover:bg-blue-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to list
                </button>
              </div>
            </div>
          ) : null}

          {gradeRows.length > 0 ? (
            selectedSubjectData ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TERM_ORDER.map((term) => (
                    <button
                      key={term}
                      onClick={() => setSelectedTerm(term)}
                      className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                        selectedTerm === term
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500">{TERM_LABELS[term]}</p>
                      <p className="text-lg font-semibold text-gray-900">{renderTermValue(selectedSubjectData, term)}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">{currentTermLabel}</p>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedSubjectData.subject}</h3>
                    </div>
                    <span className={statusBadge(selectedSubjectData.status)}>{selectedSubjectData.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{selectedSubjectData.terms?.[selectedTerm]?.summary || 'Read-only grade details from the selected term.'}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(selectedSubjectData.terms?.[selectedTerm]?.components || []).map((component, index) => (
                      <div key={`${selectedSubjectData.code}-${selectedTerm}-${component.label}-${index}`} className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-sm font-semibold text-gray-900">{component.label}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{component.score}</p>
                        <p className="text-xs text-gray-500 mt-1">Weight: {component.weight}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Prefinal</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Finals</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {gradeRows.map((row) => (
                      <tr key={row.code} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <button
                            onClick={() => openSubject(row)}
                            className="text-left font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {row.subject}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-800">{renderTermValue(row, 'prelim')}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-800">{renderTermValue(row, 'midterm')}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-800">{renderTermValue(row, 'prefinal')}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-800">{renderTermValue(row, 'finals')}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={statusBadge(row.status)}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No grades yet from the database.</p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Read-only view from recorded grade data. Values appear after teacher submission.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Grades;
