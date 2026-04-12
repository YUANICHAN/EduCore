import '../../App.css'
import { Fragment, useState, useMemo, useEffect, useCallback } from 'react';
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

const DEFAULT_WEIGHTS = {
  quizzes: 20,
  exams: 50,
  projects: 20,
  attendance: 10,
  performance_task: 0,
  activity_task: 0,
};

const GRADE_COMPONENTS = [
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'exams', label: 'Exams' },
  { key: 'projects', label: 'Projects' },
  { key: 'performance_task', label: 'Performance Task' },
  { key: 'activity_task', label: 'Activity Task' },
];

const BASE_WEIGHT_COMPONENTS = [
  { key: 'quizzes', label: 'Quizzes Weight' },
  { key: 'exams', label: 'Exams Weight' },
  { key: 'projects', label: 'Projects Weight' },
  { key: 'attendance', label: 'Attendance Weight' },
  { key: 'performance_task', label: 'Performance Task Weight' },
  { key: 'activity_task', label: 'Activity Task Weight' },
];

function formatReadableDate(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue);
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function normalizeTermKey(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text.includes('prelim') || text.includes('prefi') || text === '1' || text === 'first') return 'prelim';
  if (text.includes('midterm') || text === '2' || text === 'second') return 'midterm';
  if (text.includes('final') || text === '3' || text === 'third') return 'finals';
  return text;
}

function termLabelFromKey(value) {
  const key = normalizeTermKey(value);
  if (key === 'prelim') return 'Prelim';
  if (key === 'midterm') return 'Midterm';
  if (key === 'finals') return 'Finals';
  return String(value || 'Prelim');
}

function normalizeComponentKey(value) {
  const text = String(value || '').toLowerCase();
  if (text === 'quiz' || text === 'quizzes') return 'quizzes';
  if (text === 'exam' || text === 'exams') return 'exams';
  if (text === 'project' || text === 'projects') return 'projects';
  if (text === 'performance_task' || text === 'performance' || text === 'performance task') return 'performance_task';
  if (text === 'activity_task' || text === 'activity' || text === 'activity task') return 'activity_task';
  if (text === 'assignment') return 'performance_task';
  if (text === 'participation') return 'activity_task';
  return text.replace(/\s+/g, '_');
}

function mapComponentKeyToBackendType(componentKey) {
  if (componentKey === 'quizzes') return 'quiz';
  if (componentKey === 'exams') return 'exam';
  if (componentKey === 'projects') return 'project';
  if (componentKey === 'performance_task') return 'assignment';
  if (componentKey === 'activity_task') return 'participation';
  return 'other';
}

function buildAssessmentId(componentKey, termLabel, name, maxScore) {
  return `${componentKey}|${normalizeTermKey(termLabel)}|${String(name || '').trim()}|${Number(maxScore || 0)}`;
}

function extractGradeRowFromResponse(response) {
  if (response?.data?.id) return response.data;
  if (response?.data?.data?.id) return response.data.data;
  if (response?.id) return response;
  return null;
}

function getTermKeyFromOpenPeriod(period) {
  if (!period) return '';
  const byName = normalizeTermKey(period.period_name || '');
  if (byName === 'prelim' || byName === 'midterm' || byName === 'finals') return byName;

  const number = Number(period.period_number || 0);
  if (number === 1) return 'prelim';
  if (number === 2) return 'midterm';
  if (number === 3) return 'finals';
  return '';
}

function getSemesterWindowForDate(startRaw, endRaw, dateRef = new Date()) {
  if (!startRaw || !endRaw) {
    return { open: true, message: '' };
  }

  const baseDate = dateRef instanceof Date ? dateRef : new Date(dateRef);
  const targetDate = new Date(`${baseDate.toISOString().slice(0, 10)}T00:00:00`);
  const start = new Date(`${String(startRaw).slice(0, 10)}T00:00:00`);
  const end = new Date(`${String(endRaw).slice(0, 10)}T23:59:59`);

  if (Number.isNaN(targetDate.getTime()) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { open: true, message: '' };
  }

  if (targetDate < start) {
    return {
      open: false,
      message: `Starts on ${formatReadableDate(start)}`,
    };
  }

  if (targetDate > end) {
    return {
      open: false,
      message: `Ended on ${formatReadableDate(end)}`,
    };
  }

  return { open: true, message: '' };
}

function Gradebook() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Gradebook');
  const currentYear = '2024-2025'; // Automatically set to current AY
  const termOptions = ['Prelim','Midterm','Prefi','Finals'];
  const [selectedTerm, setSelectedTerm] = useState(termOptions[0]);
  const [openGradingPeriod, setOpenGradingPeriod] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // API states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Subjects assigned to teacher
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);

  // Grading components and weights from backend (with defaults fallback)
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [weightDraft, setWeightDraft] = useState({
    quizzes: String(DEFAULT_WEIGHTS.quizzes),
    exams: String(DEFAULT_WEIGHTS.exams),
    projects: String(DEFAULT_WEIGHTS.projects),
    attendance: String(DEFAULT_WEIGHTS.attendance),
    performance_task: String(DEFAULT_WEIGHTS.performance_task),
    activity_task: String(DEFAULT_WEIGHTS.activity_task),
  });
  const [savingWeights, setSavingWeights] = useState(false);

  // Per-component assessments with max scores and term
  const [assessments, setAssessments] = useState({
    quizzes: [],
    exams: [],
    projects: [],
    performance_task: [],
    activity_task: [],
  });

  // Students with component scores
  const [students, setStudents] = useState([]);
  const [enrollmentByStudent, setEnrollmentByStudent] = useState({});
  const [gradeRecordMap, setGradeRecordMap] = useState({});
  const [cellSaveStatus, setCellSaveStatus] = useState({});
  const [customComponents, setCustomComponents] = useState([]);
  const [hiddenBaseComponents, setHiddenBaseComponents] = useState([]);

  const tableComponentDefs = useMemo(() => {
    const visibleBase = GRADE_COMPONENTS.filter((component) => !hiddenBaseComponents.includes(component.key));
    const customDefs = customComponents.map((component) => ({ key: component.key, label: component.name }));
    return [...visibleBase, ...customDefs];
  }, [customComponents, hiddenBaseComponents]);

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
        academicYearStartDate: c.academic_year?.start_date || c.academicYear?.start_date || null,
        academicYearEndDate: c.academic_year?.end_date || c.academicYear?.end_date || null,
        academicYearLabel: asText(c.academic_year?.year_code) || asText(c.academicYear?.year_code) || currentYear,
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
    // Start each selected class with empty assessment columns.
    setAssessments({ quizzes: [], exams: [], projects: [], performance_task: [], activity_task: [] });
    setCustomComponents([]);
    setHiddenBaseComponents([]);
    try {
      const [studentsRes, gradesRes, schemeRes] = await Promise.all([
        classService.getStudents(selectedSubjectId, { status: 'enrolled', per_page: 1000 }),
        gradeService.getByClass(selectedSubjectId),
        classService.getGradingScheme(selectedSubjectId).catch(() => null),
      ]);

      const studentsPayload = studentsRes?.data ?? studentsRes;
      const enrollmentRows = Array.isArray(studentsPayload)
        ? studentsPayload
        : (Array.isArray(studentsPayload?.data) ? studentsPayload.data : []);

      const enrollmentMap = {};
      const studentsData = enrollmentRows
        .map(row => {
          const student = row?.student ?? row;
          const studentId = student?.id ?? row?.student_id ?? null;
          if (!studentId) return null;

          const enrollmentId = row?.id ?? row?.enrollment_id ?? row?.enrollment?.id ?? null;
          if (enrollmentId) {
            enrollmentMap[studentId] = enrollmentId;
          }

          return {
            id: studentId,
            name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || student?.name || 'Unknown Student',
            scores: {
              quizzes: {},
              exams: {},
              projects: {},
              performance_task: {},
              activity_task: {},
            },
          };
        })
        .filter(Boolean);

      // Map grades to students + assessments and retain DB ids for reliable updates
      const grades = Array.isArray(gradesRes)
        ? gradesRes
        : (Array.isArray(gradesRes?.data) ? gradesRes.data : []);
      const assessmentsFromApi = {
        quizzes: [],
        exams: [],
        projects: [],
        performance_task: [],
        activity_task: [],
      };
      const seenAssessmentIds = new Set();
      const nextGradeRecordMap = {};

      grades.forEach((g) => {
        const student = studentsData.find((s) => Number(s.id) === Number(g.student_id));
        if (!student) return;

        const component = normalizeComponentKey(g.component || g.component_type || '');
        if (!component) return;

        if (!assessmentsFromApi[component]) {
          assessmentsFromApi[component] = [];
        }

        const maxScore = Number(g.max_score ?? 0) || 100;
        const termLabel = termLabelFromKey(g.grading_period || selectedTerm);
        const componentLabel = GRADE_COMPONENTS.find((item) => item.key === component)?.label || component;
        const componentName = String(g.component_name || `${componentLabel} 1`).trim();
        const assessmentId = buildAssessmentId(component, termLabel, componentName, maxScore);

        if (!seenAssessmentIds.has(assessmentId)) {
          assessmentsFromApi[component].push({
            id: assessmentId,
            name: componentName,
            max: maxScore,
            term: termLabel,
          });
          seenAssessmentIds.add(assessmentId);
        }

        student.scores[component] = student.scores[component] || {};
        student.scores[component][assessmentId] = Number(g.score ?? 0);

        nextGradeRecordMap[`${student.id}|${assessmentId}`] = {
          id: g.id,
          enrollmentId: g.enrollment_id || enrollmentMap[student.id] || null,
          componentKey: component,
          componentName,
          maxScore,
          gradingPeriod: normalizeTermKey(g.grading_period || selectedTerm),
        };
      });

      const schemeResponse = (schemeRes && (schemeRes.data || schemeRes)) || null;
      const apiWeights = schemeResponse?.data?.weights || schemeResponse?.weights || null;
      const apiCustomComponents = schemeResponse?.data?.custom_components || schemeResponse?.custom_components || [];
      const apiHiddenBase = schemeResponse?.data?.hidden_base_components || schemeResponse?.hidden_base_components || [];
      const normalizedCustomComponents = Array.isArray(apiCustomComponents)
        ? apiCustomComponents
            .filter((component) => component?.key && component?.name)
            .map((component) => ({
              key: String(component.key),
              name: String(component.name),
              weight: Number(component.weight || 0),
            }))
        : [];

      setCustomComponents(normalizedCustomComponents);
      setHiddenBaseComponents(Array.isArray(apiHiddenBase) ? apiHiddenBase.map((item) => String(item)) : []);

      if (apiWeights && typeof apiWeights === 'object') {
        const customWeightMap = normalizedCustomComponents.reduce((acc, component) => {
          acc[component.key] = Number(component.weight || 0);
          return acc;
        }, {});
        const normalizedWeights = {
          quizzes: Number(apiWeights.quizzes ?? DEFAULT_WEIGHTS.quizzes),
          exams: Number(apiWeights.exams ?? DEFAULT_WEIGHTS.exams),
          projects: Number(apiWeights.projects ?? DEFAULT_WEIGHTS.projects),
          attendance: Number(apiWeights.attendance ?? DEFAULT_WEIGHTS.attendance),
          performance_task: Number(apiWeights.performance_task ?? DEFAULT_WEIGHTS.performance_task),
          activity_task: Number(apiWeights.activity_task ?? DEFAULT_WEIGHTS.activity_task),
          ...customWeightMap,
        };
        setWeights(normalizedWeights);
        setWeightDraft({
          quizzes: String(normalizedWeights.quizzes),
          exams: String(normalizedWeights.exams),
          projects: String(normalizedWeights.projects),
          attendance: String(normalizedWeights.attendance),
          performance_task: String(normalizedWeights.performance_task),
          activity_task: String(normalizedWeights.activity_task),
          ...Object.fromEntries(normalizedCustomComponents.map((component) => [component.key, String(customWeightMap[component.key] ?? 0)])),
        });
      } else {
        setWeights(DEFAULT_WEIGHTS);
        setWeightDraft({
          quizzes: String(DEFAULT_WEIGHTS.quizzes),
          exams: String(DEFAULT_WEIGHTS.exams),
          projects: String(DEFAULT_WEIGHTS.projects),
          attendance: String(DEFAULT_WEIGHTS.attendance),
          performance_task: String(DEFAULT_WEIGHTS.performance_task),
          activity_task: String(DEFAULT_WEIGHTS.activity_task),
        });
      }

      normalizedCustomComponents.forEach((component) => {
        assessmentsFromApi[component.key] = assessmentsFromApi[component.key] || [];
      });

      setAssessments(assessmentsFromApi);
      setEnrollmentByStudent(enrollmentMap);
      setGradeRecordMap(nextGradeRecordMap);
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching grades:', err);
      // No fallback - show empty state
      setStudents([]);
      setEnrollmentByStudent({});
      setGradeRecordMap({});
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, selectedTerm]);

  const fetchOpenGradingPeriod = useCallback(async () => {
    try {
      const response = await gradeService.getCurrentOpenPeriod();
      const payload = response?.data || response;
      setOpenGradingPeriod(payload || null);
    } catch {
      setOpenGradingPeriod(null);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchOpenGradingPeriod();
  }, [fetchClasses, fetchOpenGradingPeriod]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchGrades();
    }
  }, [selectedSubjectId, fetchGrades]);

  const semesterEncodingStatus = useMemo(() => {
    if (!selectedSubject) {
      return { canEncode: false, message: '' };
    }

    const startRaw = selectedSubject.academicYearStartDate;
    const endRaw = selectedSubject.academicYearEndDate;
    if (!startRaw || !endRaw) {
      return { canEncode: true, message: '' };
    }

    const today = new Date();
    const todayDate = new Date(`${today.toISOString().slice(0, 10)}T00:00:00`);
    const start = new Date(`${String(startRaw).slice(0, 10)}T00:00:00`);
    const end = new Date(`${String(endRaw).slice(0, 10)}T23:59:59`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { canEncode: true, message: '' };
    }

    if (todayDate < start) {
      return {
        canEncode: false,
        message: `Grades will be available starting ${formatReadableDate(start)}.`,
      };
    }

    if (todayDate > end) {
      return {
        canEncode: false,
        message: `This semester ended on ${formatReadableDate(end)}. Grade entry is now closed.`,
      };
    }

    return { canEncode: true, message: '' };
  }, [selectedSubject]);

  const selectedTermKey = useMemo(() => normalizeTermKey(selectedTerm), [selectedTerm]);
  const openPeriodTermKey = useMemo(() => getTermKeyFromOpenPeriod(openGradingPeriod), [openGradingPeriod]);

  const periodWindowStatus = useMemo(() => {
    if (!selectedSubject) return { open: false, message: '' };
    if (!openGradingPeriod) {
      return {
        open: false,
        message: 'Grades can only be entered during an open grading period.',
      };
    }

    if (!openPeriodTermKey || openPeriodTermKey !== selectedTermKey) {
      return {
        open: false,
        message: `Grades can only be entered during ${openGradingPeriod.period_name || 'the currently open period'}.`,
      };
    }

    return { open: true, message: '' };
  }, [selectedSubject, openGradingPeriod, openPeriodTermKey, selectedTermKey]);

  const canEdit = semesterEncodingStatus.canEncode && periodWindowStatus.open && !isLocked;

  const cardStatusByClass = useMemo(() => {
    const hasOpenPeriod = Boolean(openGradingPeriod);

    return subjects.reduce((acc, subject) => {
      const semesterStatus = getSemesterWindowForDate(
        subject.academicYearStartDate,
        subject.academicYearEndDate,
        new Date()
      );

      if (!semesterStatus.open) {
        acc[subject.id] = {
          canOpen: false,
          badgeText: 'Semester Closed',
          badgeClass: 'bg-gray-100 text-gray-700',
          detail: semesterStatus.message,
        };
        return acc;
      }

      if (!hasOpenPeriod) {
        acc[subject.id] = {
          canOpen: false,
          badgeText: 'No Open Period',
          badgeClass: 'bg-orange-100 text-orange-700',
          detail: 'Grades can only be entered during an open grading period.',
        };
        return acc;
      }

      acc[subject.id] = {
        canOpen: true,
        badgeText: `Open: ${openGradingPeriod.period_name || 'Period'}`,
        badgeClass: 'bg-emerald-100 text-emerald-700',
        detail: '',
      };
      return acc;
    }, {});
  }, [subjects, openGradingPeriod]);

  const visibleAssessments = (component) =>
    (assessments[component] || []).filter(a => normalizeTermKey(a.term) === selectedTermKey);

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
    const total = tableComponentDefs.reduce((sum, component) => {
      const componentWeight = Number(weights?.[component.key] || 0);
      return sum + (componentPercent(student, component.key) * (componentWeight / 100));
    }, 0);

    return Math.round(total * 100) / 100;
  };

  const updateScore = async (studentId, component, assessmentId, value) => {
    if (!canEdit) return;
    const cellKey = `${studentId}|${assessmentId}`;
    const assessment = (assessments[component] || []).find((item) => item.id === assessmentId);
    if (!assessment) return;

    const maxScore = Number(assessment.max || 100);
    const raw = Number(value);
    const v = Number.isNaN(raw) ? 0 : Math.max(0, Math.min(maxScore, raw));
    
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

    setCellSaveStatus((prev) => ({ ...prev, [cellKey]: 'saving' }));

    // Save to API in background using real DB record ids when present.
    try {
      setError(null);
      const currentUser = authService.getCurrentUser();
      const recordedBy = currentUser?.teacher_id ?? currentUser?.id ?? null;
      const enrollmentId = enrollmentByStudent[studentId] || null;
      const gradingPeriod = selectedTermKey;
      const componentType = mapComponentKeyToBackendType(component);

      if (!recordedBy || !enrollmentId) {
        setError('Unable to save grade: missing teacher or enrollment reference.');
        setCellSaveStatus((prev) => ({ ...prev, [cellKey]: 'failed' }));
        return;
      }

      const recordKey = `${studentId}|${assessmentId}`;
      const existingRecord = gradeRecordMap[recordKey];
      const payload = {
        enrollment_id: enrollmentId,
        student_id: studentId,
        class_id: selectedSubjectId,
        grading_period: gradingPeriod,
        component_type: componentType,
        component_name: assessment.name,
        score: v,
        max_score: maxScore,
        percentage_weight: Number(weights?.[component] || 0),
        date_recorded: new Date().toISOString().slice(0, 10),
        recorded_by: recordedBy,
      };

      if (existingRecord?.id) {
        await gradeService.update(existingRecord.id, payload);
      } else {
        const createResponse = await gradeService.create(payload);
        const savedGrade = extractGradeRowFromResponse(createResponse);
        if (savedGrade?.id) {
          setGradeRecordMap((prev) => ({
            ...prev,
            [recordKey]: {
              id: savedGrade.id,
              enrollmentId,
              componentKey: component,
              componentName: assessment.name,
              maxScore,
              gradingPeriod,
            },
          }));
        }
      }

      setCellSaveStatus((prev) => ({ ...prev, [cellKey]: 'saved' }));
      window.setTimeout(() => {
        setCellSaveStatus((prev) => {
          if (prev[cellKey] !== 'saved') return prev;
          const next = { ...prev };
          delete next[cellKey];
          return next;
        });
      }, 1500);
    } catch (err) {
      console.error('Error saving grade:', err);
      setError('Failed to save grade to database. Please try again.');
      setCellSaveStatus((prev) => ({ ...prev, [cellKey]: 'failed' }));
    }
  };

  const clampTo100 = (v) => {
    if (Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(100, v));
  };

  const handleWeightChange = (key, value) => {
    setWeightDraft(prev => ({ ...prev, [key]: value }));
  };

  const weightDraftTotal = useMemo(() => {
    return Object.values(weightDraft).reduce((sum, value) => sum + Number(value || 0), 0);
  }, [weightDraft]);

  const saveWeights = async () => {
    if (!selectedSubjectId || !canEdit) return;

    const payload = {
      quizzes: clampTo100(Number(weightDraft.quizzes || 0)),
      exams: clampTo100(Number(weightDraft.exams || 0)),
      projects: clampTo100(Number(weightDraft.projects || 0)),
      attendance: clampTo100(Number(weightDraft.attendance || 0)),
      performance_task: clampTo100(Number(weightDraft.performance_task || 0)),
      activity_task: clampTo100(Number(weightDraft.activity_task || 0)),
      custom_components: customComponents.map((component) => ({
        key: component.key,
        name: component.name,
        weight: clampTo100(Number(weightDraft[component.key] ?? component.weight ?? 0)),
      })),
      hidden_base_components: hiddenBaseComponents,
    };

    const total = payload.quizzes
      + payload.exams
      + payload.projects
      + payload.attendance
      + payload.performance_task
      + payload.activity_task
      + payload.custom_components.reduce((sum, component) => sum + Number(component.weight || 0), 0);
    if (Math.abs(total - 100) > 0.001) {
      alert(`Total grading weight must equal 100%. Current total: ${total.toFixed(2)}%`);
      return;
    }

    setSavingWeights(true);
    try {
      const response = await classService.updateGradingScheme(selectedSubjectId, payload);
      const data = response?.data ?? response;
      const apiWeights = data?.weights ?? payload;
      const normalized = {
        quizzes: Number(apiWeights.quizzes ?? payload.quizzes),
        exams: Number(apiWeights.exams ?? payload.exams),
        projects: Number(apiWeights.projects ?? payload.projects),
        attendance: Number(apiWeights.attendance ?? payload.attendance),
        performance_task: Number(apiWeights.performance_task ?? payload.performance_task),
        activity_task: Number(apiWeights.activity_task ?? payload.activity_task),
        ...Object.fromEntries((data?.custom_components || payload.custom_components || []).map((component) => [component.key, Number(component.weight || 0)])),
      };
      setWeights(normalized);
      setCustomComponents((data?.custom_components || payload.custom_components || []).map((component) => ({
        key: String(component.key),
        name: String(component.name),
        weight: Number(component.weight || 0),
      })));
      setHiddenBaseComponents((data?.hidden_base_components || payload.hidden_base_components || []).map((item) => String(item)));
      setWeightDraft({
        quizzes: String(normalized.quizzes),
        exams: String(normalized.exams),
        projects: String(normalized.projects),
        attendance: String(normalized.attendance),
        performance_task: String(normalized.performance_task),
        activity_task: String(normalized.activity_task),
        ...Object.fromEntries((data?.custom_components || payload.custom_components || []).map((component) => [component.key, String(component.weight || 0)])),
      });
    } catch (err) {
      console.error('Error saving grading scheme:', err);
      alert('Failed to save grading weights. Please try again.');
    } finally {
      setSavingWeights(false);
    }
  };

  const resetWeightDraftToDefault = () => {
    setWeightDraft({
      quizzes: String(DEFAULT_WEIGHTS.quizzes),
      exams: String(DEFAULT_WEIGHTS.exams),
      projects: String(DEFAULT_WEIGHTS.projects),
      attendance: String(DEFAULT_WEIGHTS.attendance),
      performance_task: String(DEFAULT_WEIGHTS.performance_task),
      activity_task: String(DEFAULT_WEIGHTS.activity_task),
    });
  };

  const exportCSV = () => {
    const exportComponents = ['quizzes', 'exams', 'projects', 'performance_task', 'activity_task'];
    const assessmentsByComponent = exportComponents.reduce((acc, key) => {
      acc[key] = visibleAssessments(key);
      return acc;
    }, {});

    const header = [
      'Student',
      ...exportComponents.flatMap((key) => {
        const label = GRADE_COMPONENTS.find(c => c.key === key)?.label || key;
        return [`${label} %`, ...assessmentsByComponent[key].map(a => `${a.name} (${a.max})`)];
      }),
      'Final',
    ];

    const rows = students.map(s => {
      return [
        s.name,
        ...exportComponents.flatMap((key) => [
          componentPercent(s, key),
          ...assessmentsByComponent[key].map(a => s.scores?.[key]?.[a.id] ?? ''),
        ]),
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
    if (!semesterEncodingStatus.canEncode) {
      alert(semesterEncodingStatus.message || 'Grade entry is not available for this semester.');
      return;
    }

    if (!periodWindowStatus.open) {
      alert(periodWindowStatus.message || 'Grade entry is not available for this grading period.');
      return;
    }
    
    setSaving(true);
    try {
      // Lock grades for this grading period
      await gradeService.lockByPeriod({
        class_id: selectedSubjectId,
        grading_period: selectedTermKey,
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
  const [showAddForm, setShowAddForm] = useState({ quizzes: false, exams: false, projects: false, performance_task: false, activity_task: false });
  const [newAssessment, setNewAssessment] = useState({ component: '', name: '', max: 10 });

  const openAddForm = (component) => {
    const componentLabel = tableComponentDefs.find(c => c.key === component)?.label || component;
    setShowAddForm(prev => ({ ...prev, [component]: true }));
    setNewAssessment({ component, name: `${componentLabel} ${visibleAssessments(component).length + 1}`, max: 10 });
  };

  const addAssessment = () => {
    const { component, name, max } = newAssessment;
    if (!component || !name || Number(max) <= 0) return;
    const termLabel = termLabelFromKey(selectedTerm);
    const id = buildAssessmentId(component, termLabel, name, Number(max));
    setAssessments(prev => ({
      ...prev,
      [component]: [...(prev[component] || []), { id, name, max: Number(max), term: termLabel }]
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 h-full bg-gray-50 p-8 overflow-y-auto">
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
                (() => {
                  const status = cardStatusByClass[subject.id] || {
                    canOpen: true,
                    badgeText: 'Available',
                    badgeClass: 'bg-emerald-100 text-emerald-700',
                    detail: '',
                  };

                  return (
                <div
                  key={subject.id}
                  onClick={() => {
                    if (!status.canOpen) return;
                    setSelectedSubjectId(subject.id);
                  }}
                  className={`bg-white rounded-lg border shadow-sm p-6 transition-all ${status.canOpen ? 'border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer' : 'border-gray-200 opacity-80 cursor-not-allowed'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">{subject.semester}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${status.badgeClass}`}>{status.badgeText}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{subject.code}</h3>
                  <p className="text-sm text-gray-600 mb-4">{subject.name}</p>
                  {status.detail ? <p className="text-xs text-amber-700 mb-3">{status.detail}</p> : null}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Section {subject.section}</span>
                    <span className="text-gray-900 font-semibold">{subject.students} students</span>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Status chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-3 py-1 text-xs font-semibold rounded ${semesterEncodingStatus.canEncode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{semesterEncodingStatus.canEncode ? 'Semester Active' : 'Semester Closed'}</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded ${periodWindowStatus.open ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{periodWindowStatus.open ? `Open Period: ${openGradingPeriod?.period_name || selectedTerm}` : 'Period Closed'}</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded ${isLocked ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{isLocked ? 'Grades Locked' : 'Editable'}</span>
            </div>

            {!semesterEncodingStatus.canEncode && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {semesterEncodingStatus.message}
              </div>
            )}

            {semesterEncodingStatus.canEncode && !periodWindowStatus.open && (
              <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                {periodWindowStatus.message}
              </div>
            )}

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
            </div>

            {/* Weights */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {!hiddenBaseComponents.includes('quizzes') && <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quizzes Weight</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={weightDraft.quizzes}
                      onChange={(e) => handleWeightChange('quizzes', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={!canEdit || savingWeights}
                      className={`w-24 px-2 py-1 border rounded text-sm font-semibold ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    />
                    <span className="text-sm text-gray-700">%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-blue-600" />
                </div>
              </div>}
              {!hiddenBaseComponents.includes('exams') && <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exams Weight</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={weightDraft.exams}
                      onChange={(e) => handleWeightChange('exams', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={!canEdit || savingWeights}
                      className={`w-24 px-2 py-1 border rounded text-sm font-semibold ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    />
                    <span className="text-sm text-gray-700">%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-indigo-600" />
                </div>
              </div>}
              {!hiddenBaseComponents.includes('projects') && <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Projects Weight</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={weightDraft.projects}
                      onChange={(e) => handleWeightChange('projects', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={!canEdit || savingWeights}
                      className={`w-24 px-2 py-1 border rounded text-sm font-semibold ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    />
                    <span className="text-sm text-gray-700">%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-green-600" />
                </div>
              </div>}
              {!hiddenBaseComponents.includes('attendance') && <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attendance Weight</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={weightDraft.attendance}
                      onChange={(e) => handleWeightChange('attendance', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={!canEdit || savingWeights}
                      className={`w-24 px-2 py-1 border rounded text-sm font-semibold ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    />
                    <span className="text-sm text-gray-700">%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
              </div>}
              {!hiddenBaseComponents.includes('performance_task') && <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Performance Task Weight</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={weightDraft.performance_task}
                      onChange={(e) => handleWeightChange('performance_task', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={!canEdit || savingWeights}
                      className={`w-24 px-2 py-1 border rounded text-sm font-semibold ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    />
                    <span className="text-sm text-gray-700">%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-rose-600" />
                </div>
              </div>}
              {!hiddenBaseComponents.includes('activity_task') && <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activity Task Weight</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={weightDraft.activity_task}
                      onChange={(e) => handleWeightChange('activity_task', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={!canEdit || savingWeights}
                      className={`w-24 px-2 py-1 border rounded text-sm font-semibold ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    />
                    <span className="text-sm text-gray-700">%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-cyan-600" />
                </div>
              </div>}
              {customComponents.map((component) => (
                <div key={component.key} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{component.name} Weight</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={weightDraft[component.key] ?? String(component.weight ?? 0)}
                        onChange={(e) => handleWeightChange(component.key, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        disabled={!canEdit || savingWeights}
                        className={`w-24 px-2 py-1 border rounded text-sm font-semibold ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                      />
                      <span className="text-sm text-gray-700">%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-sm">
                <span className="text-gray-600">Total weight: </span>
                <span className={`font-semibold ${Math.abs(weightDraftTotal - 100) < 0.001 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {weightDraftTotal.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetWeightDraftToDefault}
                  disabled={!canEdit || savingWeights}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${canEdit && !savingWeights ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                >
                  Reset to Default
                </button>
                <button
                  onClick={saveWeights}
                  disabled={!canEdit || savingWeights || Math.abs(weightDraftTotal - 100) >= 0.001}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${canEdit && !savingWeights && Math.abs(weightDraftTotal - 100) < 0.001 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                >
                  {savingWeights ? 'Saving Weights...' : 'Save Weights'}
                </button>
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
                    {semesterEncodingStatus.canEncode ? (periodWindowStatus.open ? 'Editing disabled (grades locked)' : periodWindowStatus.message) : semesterEncodingStatus.message}
                  </div>
                )}
              </div>

              {/* Component headers with add buttons */}
              <div className="px-4 pt-4 flex flex-wrap gap-4">
                {tableComponentDefs.map(comp => (
                  <div key={comp.key} className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{comp.label}</span>
                    <span className="text-xs text-gray-600">(Max total: {componentMax(comp.key)})</span>
                    <button
                      onClick={() => openAddForm(comp.key)}
                      disabled={!canEdit}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canEdit ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                ))}
              </div>

              {/* Inline add form */}
              {Object.values(showAddForm).some(Boolean) && (
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
                    <button onClick={()=>setShowAddForm({})} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {/* Group header */}
                    <tr className="bg-gray-100 text-gray-900 text-sm">
                      <th className="text-left py-3 px-4 border-r-2 border-gray-300">Student</th>
                      {tableComponentDefs.map((component) => (
                        <th key={component.key} className="text-left py-3 px-4 border-r-2 border-gray-300" colSpan={1 + visibleAssessments(component.key).length}>
                          {component.label} ({weights[component.key] || 0}%)
                        </th>
                      ))}
                      <th className="text-left py-3 px-4">Final</th>
                    </tr>
                    {/* Sub headers: % + each assessment name */}
                    <tr className="bg-gray-50 text-gray-900 text-xs">
                      <th className="py-2 px-4 border-r-2 border-gray-300"></th>
                      {tableComponentDefs.map((component) => (
                        <Fragment key={`sub-${component.key}`}>
                          <th key={`${component.key}-pct`} className="py-2 px-4">%</th>
                          {visibleAssessments(component.key).map((a, idx) => (
                            <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments(component.key).length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.name}</th>
                          ))}
                        </Fragment>
                      ))}
                      <th className="py-2 px-4"></th>
                    </tr>
                    {/* Max row */}
                    <tr className="text-gray-600 text-xs">
                      <th className="py-2 px-4 text-left border-r-2 border-gray-300">Max</th>
                      {tableComponentDefs.map((component) => (
                        <Fragment key={`max-${component.key}`}>
                          <th key={`${component.key}-max`} className="py-2 px-4">100</th>
                          {visibleAssessments(component.key).map((a, idx) => (
                            <th key={a.id} className={`py-2 px-4 ${idx === visibleAssessments(component.key).length - 1 ? 'border-r-2 border-gray-300' : ''}`}>{a.max}</th>
                          ))}
                        </Fragment>
                      ))}
                      <th className="py-2 px-4">100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                  <tr key={s.id} className="border-t border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 border-r-2 border-gray-300">{s.name}</td>
                    {tableComponentDefs.map((component) => (
                      <Fragment key={`${s.id}-${component.key}`}>
                        <td key={`${s.id}-${component.key}-pct`} className="py-3 px-4 text-sm text-gray-900 font-semibold">{componentPercent(s,component.key)}%</td>
                        {visibleAssessments(component.key).map((a, idx) => (
                          <td key={`${s.id}-${a.id}`} className={`py-3 px-4 ${idx === visibleAssessments(component.key).length - 1 ? 'border-r-2 border-gray-300' : ''}`}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={a.max}
                                value={s.scores?.[component.key]?.[a.id] ?? ''}
                                onChange={(e) => updateScore(s.id,component.key,a.id,e.target.value)}
                                onFocus={(e) => e.target.select()}
                                disabled={!canEdit}
                                className={`w-24 px-2 py-1 border rounded text-sm ${canEdit ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                              />
                              <span className="text-xs text-gray-600">/ {a.max}</span>
                              </div>
                              {(() => {
                                const status = cellSaveStatus[`${s.id}|${a.id}`];
                                if (!status) return null;
                                if (status === 'saving') return <span className="text-[11px] text-blue-600">Saving...</span>;
                                if (status === 'saved') return <span className="text-[11px] text-emerald-600">Saved</span>;
                                return <span className="text-[11px] text-rose-600">Failed</span>;
                              })()}
                            </div>
                          </td>
                        ))}
                      </Fragment>
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
