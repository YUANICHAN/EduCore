import '../../App.css'
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import gradeService from '../../service/gradeService';
import classService from '../../service/classService';
import authService from '../../service/authService';
import {
  BookOpen,
  Calculator,
  Lock,
  Unlock,
  Download,
  Printer,
  ChevronRight,
  AlertTriangle,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

function Gradebook() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Gradebook');
  const currentYear = '2024-2025'; // Automatically set to current AY
  const termOptions = ['Prelim','Midterm','Prefi','Finals'];
  const [selectedTerm, setSelectedTerm] = useState(termOptions[0]);
  const [submissionWindowOpen, setSubmissionWindowOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // API states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Subjects assigned to teacher
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);

  // Grading components and weights (read-only config)
  const weights = { quizzes: 20, exams: 50, projects: 20, attendance: 10 }; // total 100

  // Per-component assessments with max scores and term
  const [assessments, setAssessments] = useState({
    quizzes: [],
    exams: [],
    projects: [],
  });

  // Students with component scores
  const [students, setStudents] = useState([]);

  // Fetch teacher's classes/subjects
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getCurrentUser();
      const response = await classService.getAll({
        per_page: 1000,
        status: 'active',
        ...(user?.teacher_id ? { teacher_id: user.teacher_id } : {}),
      });

      const payload = response?.data ?? response;
      const classRows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);

      const asText = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return fallback;
      };

      const classes = classRows.map(c => ({
        id: c.id,
        code: asText(c.subject?.subject_code) || asText(c.subject_code) || asText(c.code) || 'N/A',
        name: asText(c.subject?.subject_name) || asText(c.subject_name) || asText(c.name) || 'Class',
        section: asText(c.section?.section_code) || asText(c.section_name) || asText(c.section) || 'N/A',
        semester: asText(c.subject?.semester) || asText(c.semester) || asText(c.academic_year?.semester) || '1st Semester',
        students: Number(c.enrolled_students_count ?? c.enrollments_count ?? c.students_count ?? c.enrolled_count ?? 0),
      }));
      setSubjects(classes);
    } catch (err) {
      console.error('Error fetching classes:', err);
      // Set empty array on error - no fallback
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students and grades for selected subject
  const fetchGrades = useCallback(async () => {
    if (!selectedSubjectId) return;
    
    setLoading(true);
    try {
      const [studentsRes, gradesRes] = await Promise.all([
        classService.getStudents(selectedSubjectId),
        gradeService.getByClass(selectedSubjectId)
      ]);

      const studentsData = (studentsRes.data || studentsRes || []).map(s => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Unknown',
        scores: {
          quizzes: {},
          exams: {},
          projects: {},
        },
      }));

      // Map grades to students
      const grades = gradesRes.data || gradesRes || [];
      grades.forEach(g => {
        const student = studentsData.find(s => s.id === g.student_id);
        if (student) {
          const component = g.component || 'quizzes';
          const assessmentId = g.assessment_id || g.id;
          student.scores[component] = student.scores[component] || {};
          student.scores[component][assessmentId] = g.score || 0;
        }
      });

      setStudents(studentsData);

      // Set default assessments if none
      if (assessments.quizzes.length === 0) {
        setAssessments({
          quizzes: [
            { id: 'q1', name: 'Quiz 1', max: 30, term: 'Prelim' },
            { id: 'q2', name: 'Quiz 2', max: 20, term: 'Midterm' },
          ],
          exams: [
            { id: 'e1', name: 'Midterm Exam', max: 100, term: 'Midterm' },
            { id: 'e2', name: 'Final Exam', max: 100, term: 'Finals' },
          ],
          projects: [
            { id: 'p1', name: 'Project 1', max: 50, term: 'Prefi' },
          ],
        });
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      // No fallback - show empty state
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, assessments.quizzes.length]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchGrades();
    }
  }, [selectedSubjectId, fetchGrades]);

  const ayIsActive = currentYear === '2024-2025';
  const canEdit = ayIsActive && submissionWindowOpen && !isLocked;

  const visibleAssessments = (component) =>
    assessments[component].filter(a => a.term === selectedTerm);

  const componentMax = (component) => {
    const items = visibleAssessments(component);
    return items.reduce((sum, a) => sum + a.max, 0);
  };

  const componentTotal = (student, component) => {
    const items = visibleAssessments(component);
    return items.reduce((sum, a) => sum + (student.scores?.[component]?.[a.id] || 0), 0);
  };

  const componentPercent = (student, component) => {
    const max = componentMax(component);
    if (max <= 0) return 0;
    return Math.round((componentTotal(student, component) / max) * 10000) / 100; // 2 decimals
  };

  const computeFinal = (student) => {
    const q = componentPercent(student, 'quizzes') * (weights.quizzes / 100);
    const e = componentPercent(student, 'exams') * (weights.exams / 100);
    const p = componentPercent(student, 'projects') * (weights.projects / 100);
    return Math.round((q + e + p) * 100) / 100;
  };

  const updateScore = async (studentId, component, assessmentId, value) => {
    if (!canEdit) return;
    const v = clampTo100(Number(value));
    
    // Update local state immediately for responsiveness
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        scores: {
          ...s.scores,
          [component]: {
            ...(s.scores?.[component] || {}),
            [assessmentId]: v,
          }
        }
      };
    }));

    // Save to API in background
    try {
      await gradeService.update(assessmentId, {
        student_id: studentId,
        class_id: selectedSubjectId,
        component,
        score: v,
        grading_period: selectedTerm,
      });
    } catch (err) {
      console.error('Error saving grade:', err);
      // Don't revert - let user try again if needed
    }
  };

  const clampTo100 = (v) => {
    if (Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(100, v));
  };

  const exportCSV = () => {
    const qa = visibleAssessments('quizzes');
    const ea = visibleAssessments('exams');
    const pa = visibleAssessments('projects');
    const header = [
      'Student',
      'Quizzes %',
      ...qa.map(a => `${a.name} (${a.max})`),
      'Exams %',
      ...ea.map(a => `${a.name} (${a.max})`),
      'Projects %',
      ...pa.map(a => `${a.name} (${a.max})`),
      'Final',
    ];
    const rows = students.map(s => {
      return [
        s.name,
        componentPercent(s,'quizzes'),
        ...qa.map(a => s.scores?.quizzes?.[a.id] ?? ''),
        componentPercent(s,'exams'),
        ...ea.map(a => s.scores?.exams?.[a.id] ?? ''),
        componentPercent(s,'projects'),
        ...pa.map(a => s.scores?.projects?.[a.id] ?? ''),
        computeFinal(s),
      ];
    });
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedSubject?.code}-${selectedSubject?.section}-gradebook.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const printContent = document.getElementById('gradebook-print-area');
    const win = window.open('', 'PRINT', 'height=800,width=1000');
    if (!win || !printContent) return;
    win.document.write(`<!doctype html><html><head><title>Gradebook</title>`);
    win.document.write(`<style>body{font-family:system-ui,Segoe UI,Arial} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f3f4f6} h1{margin:0 0 12px} .meta{margin-bottom:12px;color:#374151}</style>`);
    win.document.write(`</head><body>`);
    win.document.write(`<h1>${selectedSubject?.name} - Section ${selectedSubject?.section}</h1>`);
    win.document.write(`<div class="meta">AY ${currentYear} • ${selectedSubject?.semester}</div>`);
    win.document.write(printContent.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const submitGrades = async () => {
    if (!ayIsActive) return;
    if (!submissionWindowOpen) return;
    
    setSaving(true);
    try {
      // Lock grades for this grading period
      await gradeService.lockByPeriod({
        class_id: selectedSubjectId,
        grading_period: selectedTerm,
      });
      setIsLocked(true);
    } catch (err) {
      console.error('Error locking grades:', err);
      alert('Failed to submit grades. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Add assessment per component for current term
  const [showAddForm, setShowAddForm] = useState({ quizzes: false, exams: false, projects: false });
  const [newAssessment, setNewAssessment] = useState({ component: '', name: '', max: 10 });

  const openAddForm = (component) => {
    setShowAddForm(prev => ({ ...prev, [component]: true }));
    setNewAssessment({ component, name: `${component[0].toUpperCase()+component.slice(1)} ${visibleAssessments(component).length + 1}`, max: 10 });
  };

  const addAssessment = () => {
    const { component, name, max } = newAssessment;
    if (!component || !name || Number(max) <= 0) return;
    const id = `${component}-${Date.now()}`;
    setAssessments(prev => ({
      ...prev,
      [component]: [...prev[component], { id, name, max: Number(max), term: selectedTerm }]
    }));
    // initialize student scores for new assessment
    setStudents(prev => prev.map(s => ({
      ...s,
      scores: {
        ...s.scores,
        [component]: { ...(s.scores?.[component] || {}), [id]: 0 }
      }
    })));
    setShowAddForm(prev => ({ ...prev, [component]: false }));
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
        {/* Breadcrumbs only when a subject is selected */}
        {selectedSubject && (
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <button onClick={() => navigate('/teacher/dashboard')} className="hover:text-blue-600 transition-colors">Dashboard</button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => setSelectedSubjectId(null)}
              className="hover:text-blue-600 transition-colors"
            >
              Gradebook
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{selectedSubject.code} • Section {selectedSubject.section}</span>
          </nav>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
            <p className="text-gray-600 mt-1">{selectedSubjectId ? 'Enter, compute, and submit grades for the selected class.' : 'Pick a class or section first to load its assessments, students, and grade computations.'}</p>
          </div>
          {selectedSubjectId && (
            <div className="flex gap-3 items-center">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {termOptions.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
          )}
        </div>

        {/* Subject Selection */}
        {!selectedSubjectId ? (
          <div className="space-y-6">
            <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex items-start gap-4 text-sm text-gray-700">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900">Choose a class to open its gradebook</p>
                <p>Each card below represents a section you handle. Selecting one reveals assessments, weights, and student scores for that class.</p>
              </div>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">{subject.semester}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{subject.code}</h3>
                  <p className="text-sm text-gray-600 mb-4">{subject.name}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Section {subject.section}</span>
                    <span className="text-gray-900 font-semibold">{subject.students} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Status chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-3 py-1 text-xs font-semibold rounded ${ayIsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{ayIsActive ? 'AY Active' : 'AY Inactive'}</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded ${submissionWindowOpen ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{submissionWindowOpen ? 'Submission Window Open' : 'Submission Window Closed'}</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded ${isLocked ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{isLocked ? 'Grades Locked' : 'Editable'}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={submitGrades}
                disabled={!canEdit}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${canEdit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {isLocked ? 'Locked' : 'Submit & Lock Grades'}
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <Printer className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={() => setSubmissionWindowOpen(s => !s)} className="ml-auto px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                Toggle Submission Window
              </button>
            </div>

            {/* Weights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quizzes Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{weights.quizzes}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exams Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{weights.exams}%</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Projects Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{weights.projects}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attendance Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{weights.attendance}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Gradebook Table with per-assessment columns */}
            <div id="gradebook-print-area" className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedSubject?.code} • {selectedSubject?.name}</p>
                    <p className="text-xs text-gray-600">Section {selectedSubject?.section} • AY {currentYear} • {selectedSubject?.semester} • {selectedTerm}</p>
                  </div>
                </div>
                {!canEdit && (
                  <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded">
                    <AlertTriangle className="w-4 h-4" />
                    Editing disabled (AY inactive, window closed, or locked)
                  </div>
                )}
              </div>

              {/* Component headers with add buttons */}
              <div className="px-4 pt-4 flex flex-wrap gap-4">
                {['quizzes','exams','projects'].map(comp => (
                  <div key={comp} className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 capitalize">{comp}</span>
                    <span className="text-xs text-gray-600">(Max total: {componentMax(comp)})</span>
                    <button
                      onClick={() => openAddForm(comp)}
                      disabled={!canEdit}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canEdit ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                ))}
              </div>

              {/* Inline add form */}
              {(showAddForm.quizzes || showAddForm.exams || showAddForm.projects) && (
                <div className="px-4 pt-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-xs text-gray-700">New {newAssessment.component} for {selectedTerm}</span>
                    <input
                      type="text"
                      value={newAssessment.name}
                      onChange={(e)=>setNewAssessment(prev=>({...prev,name:e.target.value}))}
                      placeholder="Name"
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      min={1}
                      value={newAssessment.max}
                      onChange={(e)=>setNewAssessment(prev=>({...prev,max:Number(e.target.value)}))}
                      placeholder="Max"
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <button onClick={addAssessment} className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">Add Assessment</button>
                    <button onClick={()=>setShowAddForm({quizzes:false,exams:false,projects:false})} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {/* Group header */}
                    <tr className="bg-gray-100 text-gray-900 text-sm">
                      <th className="text-left py-3 px-4 border-r-2 border-gray-300">Student</th>
                      {/* Quizzes group */}
                      <th className="text-left py-3 px-4 border-r-2 border-gray-300" colSpan={1 + visibleAssessments('quizzes').length}>Quizzes ({weights.quizzes}%)</th>
                      {/* Exams group */}
                      <th className="text-left py-3 px-4 border-r-2 border-gray-300" colSpan={1 + visibleAssessments('exams').length}>Exams ({weights.exams}%)</th>
                      {/* Projects group */}
                      <th className="text-left py-3 px-4 border-r-2 border-gray-300" colSpan={1 + visibleAssessments('projects').length}>Projects ({weights.projects}%)</th>
                      <th className="text-left py-3 px-4">Final</th>
                    </tr>
                    {/* Sub headers: % + each assessment name */}
                    <tr className="bg-gray-50 text-gray-900 text-xs">
                      <th className="py-2 px-4 border-r-2 border-gray-300"></th>
                      <th className="py-2 px-4">%</th>
                      {visibleAssessments('quizzes').map((a, idx) => (
                        <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments('quizzes').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.name}</th>
                      ))}
                      <th className="py-2 px-4">%</th>
                      {visibleAssessments('exams').map((a, idx) => (
                        <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments('exams').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.name}</th>
                      ))}
                      <th className="py-2 px-4">%</th>
                      {visibleAssessments('projects').map((a, idx) => (
                        <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments('projects').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.name}</th>
                      ))}
                      <th className="py-2 px-4"></th>
                    </tr>
                    {/* Max row */}
                    <tr className="text-gray-600 text-xs">
                      <th className="py-2 px-4 text-left border-r-2 border-gray-300">Max</th>
                      <th className="py-2 px-4">100</th>
                      {visibleAssessments('quizzes').map((a, idx) => (
                        <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments('quizzes').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.max}</th>
                      ))}
                      <th className="py-2 px-4">100</th>
                      {visibleAssessments('exams').map((a, idx) => (
                        <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments('exams').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.max}</th>
                      ))}
                      <th className="py-2 px-4">100</th>
                      {visibleAssessments('projects').map((a, idx) => (
                        <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments('projects').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.max}</th>
                      ))}
                      <th className="py-2 px-4">100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                  <tr key={s.id} className="border-t border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 border-r-2 border-gray-300">{s.name}</td>
                    {/* Quizzes percent */}
                    <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{componentPercent(s,'quizzes')}%</td>
                    {/* Quizzes assessments */}
                    {visibleAssessments('quizzes').map((a, idx) => (
                      <td key={a.id} className={`py-3 px-4 ${idx === visibleAssessments('quizzes').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={a.max}
                            value={s.scores?.quizzes?.[a.id] ?? 0}
                            onChange={(e) => updateScore(s.id,'quizzes',a.id,e.target.value)}
                            disabled={!canEdit}
                            className={`w-24 px-2 py-1 border rounded text-sm ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                          />
                          <span className="text-xs text-gray-600">/ {a.max}</span>
                        </div>
                      </td>
                    ))}
                    {/* Exams percent */}
                    <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{componentPercent(s,'exams')}%</td>
                    {/* Exams assessments */}
                    {visibleAssessments('exams').map((a, idx) => (
                      <td key={a.id} className={`py-3 px-4 ${idx === visibleAssessments('exams').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={a.max}
                            value={s.scores?.exams?.[a.id] ?? 0}
                            onChange={(e) => updateScore(s.id,'exams',a.id,e.target.value)}
                            disabled={!canEdit}
                            className={`w-24 px-2 py-1 border rounded text-sm ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                          />
                          <span className="text-xs text-gray-600">/ {a.max}</span>
                        </div>
                      </td>
                    ))}
                    {/* Projects percent */}
                    <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{componentPercent(s,'projects')}%</td>
                    {/* Projects assessments */}
                    {visibleAssessments('projects').map((a, idx) => (
                      <td key={a.id} className={`py-3 px-4 ${idx === visibleAssessments('projects').length - 1 ? 'border-r-2 border-gray-300' : ''}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={a.max}
                            value={s.scores?.projects?.[a.id] ?? 0}
                            onChange={(e) => updateScore(s.id,'projects',a.id,e.target.value)}
                            disabled={!canEdit}
                            className={`w-24 px-2 py-1 border rounded text-sm ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                          />
                          <span className="text-xs text-gray-600">/ {a.max}</span>
                        </div>
                      </td>
                    ))}
                    {/* Final */}
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{computeFinal(s)}%</td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Gradebook;
