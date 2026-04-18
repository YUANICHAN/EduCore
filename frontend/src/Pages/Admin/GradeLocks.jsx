import '../../App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import Sidebar from '../../Components/Admin/Sidebar.jsx';
import classService from '../../service/classService';
import gradeService from '../../service/gradeService';
import {
  Lock,
  LockOpen,
  BookOpen,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Search,
  ShieldCheck,
} from 'lucide-react';

const TERM_OPTIONS = [
  { value: 'all', label: 'All Terms' },
  { value: 'prelim', label: 'Prelim' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'prefinals', label: 'Prefinals' },
  { value: 'finals', label: 'Finals' },
];

function normalizeTermKey(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text.includes('prelim') || text === '1' || text === 'first') return 'prelim';
  if (text.includes('midterm') || text === '2' || text === 'second') return 'midterm';
  if (text.includes('prefinal') || text.includes('pre-final') || text === '3' || text === 'third') return 'prefinals';
  if (text.includes('final') || text === '4' || text === 'fourth') return 'finals';
  return text;
}

function formatDate(value) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function GradeLocks() {
  const [activeItem, setActiveItem] = useState('Grade Locks');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [grades, setGrades] = useState([]);
  const [unlockingIds, setUnlockingIds] = useState([]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === String(selectedClassId)),
    [classes, selectedClassId]
  );

  const visibleClassOptions = useMemo(() => {
    const query = String(classSearchQuery || '').trim().toLowerCase();
    if (!query) return classes;

    return classes.filter((item) => {
      const haystack = `${item.code} ${item.name} ${item.section} ${item.semester}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [classSearchQuery, classes]);

  const loadClasses = useCallback(async () => {
    const response = await classService.getAll({ per_page: 1000 });
    const payload = response?.data ?? response;
    const classRows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);

    return classRows.map((item) => ({
      id: item.id,
      code: item.subject?.subject_code || item.subject_code || item.code || 'N/A',
      name: item.subject?.subject_name || item.subject_name || item.name || 'Class',
      section: item.section?.section_code || item.section_name || item.section || 'N/A',
      semester: item.subject?.semester || item.semester || '1st Semester',
    }));
  }, []);

  const loadGrades = useCallback(async (classId) => {
    if (!classId) {
      setGrades([]);
      return;
    }

    const response = await gradeService.getByClass(classId, { all: 1, per_page: 5000 });
    const payload = response?.data ?? response;
    const gradeRows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);

    setGrades(gradeRows.map((grade) => ({
      id: grade.id,
      studentName: grade.student ? `${grade.student.first_name || ''} ${grade.student.last_name || ''}`.trim() : `Student #${grade.student_id}`,
      studentId: grade.student_id,
      classId: grade.class_id,
      classLabel: grade.class?.subject?.subject_code || grade.class?.subject_code || 'Class',
      sectionLabel: grade.class?.section?.section_code || grade.class?.section_name || 'N/A',
      term: normalizeTermKey(grade.grading_period),
      componentName: grade.component_name || 'Assessment',
      componentType: grade.component_type || 'other',
      score: Number(grade.score || 0),
      maxScore: Number(grade.max_score || 0),
      isLocked: Boolean(grade.is_locked),
      lockedAt: grade.locked_at,
      lockedBy: grade.locker?.name || grade.locked_by || 'Unknown',
      recordedAt: grade.date_recorded,
      recorder: grade.recorder?.name || grade.recorded_by || 'Unknown',
    })));
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedClassId) return;
    setRefreshing(true);
    setError(null);
    try {
      await loadGrades(selectedClassId);
    } catch (err) {
      console.error('Failed to load locked grades:', err);
      setError('Failed to load locked grades.');
    } finally {
      setRefreshing(false);
    }
  }, [loadGrades, selectedClassId]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const classRows = await loadClasses();
      setClasses(classRows);

      if (classRows.length > 0) {
        const firstClassId = String(classRows[0].id);
        setSelectedClassId(firstClassId);
        await loadGrades(firstClassId);
      }
    } catch (err) {
      console.error('Failed to initialize grade locks page:', err);
      setError('Failed to load grade lock data.');
    } finally {
      setLoading(false);
    }
  }, [loadClasses, loadGrades]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  useEffect(() => {
    if (!selectedClassId) return;
    refresh();
  }, [selectedClassId, refresh]);

  const visibleGrades = useMemo(() => {
    const query = String(searchQuery || '').trim().toLowerCase();

    return grades.filter((grade) => {
      if (!grade.isLocked) return false;
      if (selectedTerm !== 'all' && grade.term !== selectedTerm) return false;
      if (!query) return true;

      const haystack = [
        grade.studentName,
        String(grade.studentId || ''),
        grade.componentName,
        grade.componentType,
        grade.term,
        grade.lockedBy,
        grade.sectionLabel,
        grade.classLabel,
        String(grade.score),
        String(grade.maxScore),
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [grades, searchQuery, selectedTerm]);

  const lockedCount = visibleGrades.length;
  const termLabel = TERM_OPTIONS.find((option) => option.value === selectedTerm)?.label || 'All Terms';

  const handleUnlockGrade = async (grade) => {
    const result = await Swal.fire({
      title: 'Unlock this grade?',
      text: `${grade.studentName} - ${grade.componentName} (${grade.term}) will become editable again.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, unlock it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    setUnlockingIds((prev) => [...prev, grade.id]);
    try {
      await gradeService.unlock(grade.id);
      setGrades((prev) => prev.map((item) => (item.id === grade.id ? { ...item, isLocked: false, lockedAt: null, lockedBy: null } : item)));
      await Swal.fire({
        icon: 'success',
        title: 'Grade unlocked',
        text: `${grade.studentName} can now be edited again.`,
        confirmButtonColor: '#16a34a',
      });
    } catch (err) {
      console.error('Failed to unlock grade:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Unlock failed',
        text: err?.response?.data?.message || 'Unable to unlock this grade.',
      });
    } finally {
      setUnlockingIds((prev) => prev.filter((id) => id !== grade.id));
    }
  };

  const handleUnlockAllVisible = async () => {
    if (visibleGrades.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Nothing to unlock',
        text: 'There are no locked grades in the current class/term filter.',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Unlock all visible grades?',
      text: `This will unlock ${visibleGrades.length} grade record(s) for ${selectedClass?.code || 'the selected class'} in ${termLabel}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, unlock all',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    setUnlockingIds(visibleGrades.map((grade) => grade.id));
    try {
      const unlockResults = await Promise.allSettled(visibleGrades.map((grade) => gradeService.unlock(grade.id)));
      const failed = unlockResults.filter((resultItem) => resultItem.status === 'rejected').length;
      setGrades((prev) => prev.map((item) => (visibleGrades.some((grade) => grade.id === item.id) ? { ...item, isLocked: false, lockedAt: null, lockedBy: null } : item)));

      await Swal.fire({
        icon: failed > 0 ? 'warning' : 'success',
        title: failed > 0 ? 'Unlock completed with issues' : 'Grades unlocked',
        text: failed > 0
          ? `${visibleGrades.length - failed} unlocked successfully, ${failed} failed.`
          : `All ${visibleGrades.length} visible locked grades were unlocked.`,
        confirmButtonColor: '#16a34a',
      });
      await refresh();
    } catch (err) {
      console.error('Failed to unlock all grades:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Unlock failed',
        text: 'Unable to unlock all visible grades.',
      });
    } finally {
      setUnlockingIds([]);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 h-full overflow-y-auto p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grade Locks</h1>
            <p className="text-gray-600 mt-1">Review locked grade rows and unlock them when corrections are needed.</p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing || !selectedClassId}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${refreshing ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Selected Class</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{selectedClass?.code || 'N/A'}</p>
            <p className="text-sm text-gray-600">{selectedClass?.name || 'Choose a class'}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Visible Locked</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{lockedCount}</p>
            <p className="text-sm text-gray-600">{termLabel}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Available Classes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{classes.length}</p>
            <p className="text-sm text-gray-600">Classes with grade records</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Action</p>
            <button
              onClick={handleUnlockAllVisible}
              disabled={lockedCount === 0 || unlockingIds.length > 0}
              className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${lockedCount > 0 && unlockingIds.length === 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Unlock All Visible
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-fit">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
              <Filter className="w-4 h-4 text-blue-600" />
              Filters
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <div className="mb-4 border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="relative border-b border-gray-200">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  placeholder="Search class code, name, section..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white"
                />
              </div>
              <div className="max-h-44 overflow-y-auto p-2 space-y-1">
                {visibleClassOptions.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-gray-500">No matching classes.</div>
                ) : (
                  visibleClassOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedClassId(String(item.id))}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${String(selectedClassId) === String(item.id) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      <div className="font-medium">{item.code} - {item.section}</div>
                      <div className="text-xs text-gray-500 truncate">{item.name}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <div className="space-y-2">
              {TERM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedTerm(option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${selectedTerm === option.value ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Student, assessment, term, locker..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Locked Grades</h2>
                  <p className="text-xs text-gray-600">{selectedClass?.code || 'Select a class'} • {termLabel}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {lockedCount} records
              </div>
            </div>

            {visibleGrades.length === 0 ? (
              <div className="p-10 text-center text-gray-600">
                <LockOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                No locked grades found for the selected class and term.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Student</th>
                      <th className="text-left px-4 py-3 font-semibold">Assessment</th>
                      <th className="text-left px-4 py-3 font-semibold">Score</th>
                      <th className="text-left px-4 py-3 font-semibold">Locked</th>
                      <th className="text-left px-4 py-3 font-semibold">By</th>
                      <th className="text-left px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleGrades.map((grade) => (
                      <tr key={grade.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{grade.studentName}</div>
                          <div className="text-xs text-gray-500">Student ID: {grade.studentId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{grade.componentName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{grade.term}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-semibold">{grade.score} / {grade.maxScore}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(grade.lockedAt)}</td>
                        <td className="px-4 py-3 text-gray-700">{grade.lockedBy || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleUnlockGrade(grade)}
                            disabled={unlockingIds.includes(grade.id)}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${unlockingIds.includes(grade.id) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                          >
                            {unlockingIds.includes(grade.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockOpen className="w-4 h-4" />}
                            {unlockingIds.includes(grade.id) ? 'Unlocking...' : 'Unlock'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradeLocks;