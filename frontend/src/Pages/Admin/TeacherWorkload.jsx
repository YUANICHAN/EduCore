import '../../App.css';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sidebar from '../../Components/Admin/Sidebar.jsx';
import teacherService from '../../service/teacherService';
import classService from '../../service/classService';
import sectionService from '../../service/sectionService';
import subjectService from '../../service/subjectService';
import programService from '../../service/programService';
import academicYearService from '../../service/academicYearService';
import {
  Search,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  ArrowLeft,
  BarChart3,
  Briefcase,
  Calendar,
  GraduationCap,
  Layers,
  UserCheck,
  Filter,
  RefreshCw,
} from 'lucide-react';

function TeacherWorkload() {
  const SHOW_CANCELLED_CLASSES_KEY = 'teacherWorkload.showCancelledClasses';
  const [activeItem, setActiveItem] = useState('Teacher Workload');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── State ──
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherWorkload, setTeacherWorkload] = useState(null);
  const [unassignedClasses, setUnassignedClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  const [loading, setLoading] = useState(true);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [unassignedLoading, setUnassignedLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // class_id being acted on
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [loadFilter, setLoadFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [availableMode, setAvailableMode] = useState('all'); // 'unassigned' or 'all'
  const [showCancelledClasses, setShowCancelledClasses] = useState(() => {
    try {
      return localStorage.getItem(SHOW_CANCELLED_CLASSES_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Conflict check state
  const [conflicts, setConflicts] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Success/error banner
  const [banner, setBanner] = useState(null);

  // Create and assign modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [sectionClasses, setSectionClasses] = useState([]);
  const [sectionClassesLoading, setSectionClassesLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    section_id: '',
    subject_ids: [], // Array for multiple subjects
    academic_year_id: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [showAllSections, setShowAllSections] = useState(false);

  // Edit class modal
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editClassLoading, setEditClassLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    class_id: null,
    section_id: '',
    subject_id: '',
    academic_year_id: '',
    status: 'active',
  });

  const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const normalizeId = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const toNormalizedTokens = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return [];

    const parts = raw
      .split(/[^a-zA-Z0-9]+/)
      .map(part => normalizeText(part))
      .filter(Boolean);

    const full = normalizeText(raw);
    return Array.from(new Set([full, ...parts].filter(Boolean)));
  };

  const extractYearNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;

    const text = String(value).toLowerCase();
    const numeric = text.match(/(\d+)/);
    if (numeric) return Number(numeric[1]);

    if (text.includes('first')) return 1;
    if (text.includes('second')) return 2;
    if (text.includes('third')) return 3;
    if (text.includes('fourth')) return 4;

    return null;
  };

  // ── Data Fetching ──
  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await academicYearService.getAll();
      const data = Array.isArray(res) ? res : (res?.data || []);
      setAcademicYears(data);
      const current = data.find(ay => ay.is_current) || data[0];
      if (current) setSelectedAcademicYear(current.id);
    } catch {
      setAcademicYears([]);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherService.getAll({ per_page: 1000 });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setTeachers(data);
    } catch {
      setError('Failed to load teachers');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeacherWorkload = useCallback(async (teacherId) => {
    if (!teacherId) return;
    setWorkloadLoading(true);
    try {
      const res = await teacherService.getWorkload(teacherId, {
        academic_year_id: selectedAcademicYear || undefined,
      });
      setTeacherWorkload(res?.data || res);
    } catch {
      setTeacherWorkload(null);
    } finally {
      setWorkloadLoading(false);
    }
  }, [selectedAcademicYear]);

  const fetchUnassignedClasses = useCallback(async () => {
    setUnassignedLoading(true);
    try {
      let res;
      if (availableMode === 'all' && selectedTeacher) {
        res = await teacherService.getAvailableClasses(selectedTeacher.id, {
          academic_year_id: selectedAcademicYear || undefined,
          search: unassignedSearch || undefined,
          per_page: 200,
        });
      } else {
        res = await teacherService.getUnassignedClasses({
          academic_year_id: selectedAcademicYear || undefined,
          search: unassignedSearch || undefined,
          per_page: 200,
        });
      }
      const data = Array.isArray(res) ? res : (res?.data || []);
      setUnassignedClasses(data);
    } catch {
      setUnassignedClasses([]);
    } finally {
      setUnassignedLoading(false);
    }
  }, [selectedAcademicYear, unassignedSearch, availableMode, selectedTeacher]);

  useEffect(() => { fetchAcademicYears(); }, [fetchAcademicYears]);
  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
  useEffect(() => { fetchUnassignedClasses(); }, [fetchUnassignedClasses]);
  useEffect(() => {
    if (selectedTeacher) fetchTeacherWorkload(selectedTeacher.id);
  }, [selectedTeacher, fetchTeacherWorkload]);
  useEffect(() => {
    try {
      localStorage.setItem(SHOW_CANCELLED_CLASSES_KEY, String(showCancelledClasses));
    } catch {
      // Ignore localStorage access issues (private mode, denied storage, etc.)
    }
  }, [showCancelledClasses, SHOW_CANCELLED_CLASSES_KEY]);

  // Auto-select teacher from URL query param
  useEffect(() => {
    const teacherId = searchParams.get('teacher');
    if (teacherId && teachers.length > 0 && !selectedTeacher) {
      const found = teachers.find(t => String(t.id) === String(teacherId));
      if (found) setSelectedTeacher(found);
    }
  }, [searchParams, teachers, selectedTeacher]);

  // ── Computed ──
  const departments = useMemo(() => {
    return [...new Set(teachers.map(t => t.department?.name).filter(Boolean))];
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const name = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
      const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || (t.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = !departmentFilter || t.department?.name === departmentFilter;

      const currentLoad = t.teaching_load || 0;
      const maxLoad = t.max_load || 24;
      const pct = maxLoad > 0 ? (currentLoad / maxLoad) * 100 : 0;
      let matchLoad = true;
      if (loadFilter === 'unassigned') matchLoad = currentLoad === 0;
      else if (loadFilter === 'light') matchLoad = pct > 0 && pct < 60;
      else if (loadFilter === 'moderate') matchLoad = pct >= 60 && pct < 85;
      else if (loadFilter === 'heavy') matchLoad = pct >= 85 && pct < 100;
      else if (loadFilter === 'full') matchLoad = pct >= 100;

      return matchSearch && matchDept && matchLoad;
    });
  }, [teachers, searchTerm, departmentFilter, loadFilter]);

  const workloadSummary = useMemo(() => {
    if (!teacherWorkload?.summary) return null;
    return teacherWorkload.summary;
  }, [teacherWorkload]);

  const assignedClasses = useMemo(() => {
    if (!teacherWorkload?.classes) return [];
    return Array.isArray(teacherWorkload.classes) ? teacherWorkload.classes : [];
  }, [teacherWorkload]);

  const visibleAssignedClasses = useMemo(() => {
    if (showCancelledClasses) return assignedClasses;
    return assignedClasses.filter(cls => (cls.status || 'active') !== 'cancelled');
  }, [assignedClasses, showCancelledClasses]);

  const assignedSubjects = useMemo(() => {
    const subjectMap = new Map();
    assignedClasses.forEach(cls => {
      if (cls.subject) {
        const key = cls.subject.id || cls.subject.subject_code;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, {
            ...cls.subject,
            class_count: 1,
            total_students: cls.enrollments_count || 0,
          });
        } else {
          const existing = subjectMap.get(key);
          existing.class_count += 1;
          existing.total_students += cls.enrollments_count || 0;
        }
      }
    });
    return Array.from(subjectMap.values());
  }, [assignedClasses]);

  const assignedSections = useMemo(() => {
    const sectionMap = new Map();
    assignedClasses.forEach(cls => {
      if (cls.section) {
        const key = cls.section.id || cls.section.section_code;
        if (!sectionMap.has(key)) {
          sectionMap.set(key, {
            ...cls.section,
            name: cls.section.name || cls.section.section_code || 'Section',
            class_count: 1,
            total_students: cls.enrollments_count || 0,
            program_name: cls.section.program?.program_name || cls.section.program?.name || 'N/A',
          });
        } else {
          const existing = sectionMap.get(key);
          existing.class_count += 1;
          existing.total_students += cls.enrollments_count || 0;
        }
      }
    });
    return Array.from(sectionMap.values());
  }, [assignedClasses]);

  // Filter subjects based on selected section's program
  const filteredSubjectsForSection = useMemo(() => {
    if (!createForm.section_id) return subjects;

    const selectedSection = sections.find(s => s.id == createForm.section_id);
    const selectedProgramId = normalizeId(selectedSection?.program_id || selectedSection?.program?.id);
    const selectedYear = extractYearNumber(
      selectedSection?.grade_level || selectedSection?.year_level || selectedSection?.year
    );
    if (!selectedSection || !selectedProgramId) return subjects;

    // Filter subjects that belong to the same program and year level as the selected section.
    return subjects.filter(subject => {
      const subjectProgramId = normalizeId(subject.program?.id || subject.program_id);
      const subjectYear = extractYearNumber(
        subject.grade_level || subject.year_level || subject.year || subject.level
      );

      const programMatches = !subjectProgramId || subjectProgramId === selectedProgramId;
      const yearMatches = selectedYear ? subjectYear === selectedYear : true;
      return programMatches && yearMatches;
    });
  }, [createForm.section_id, sections, subjects]);

  const assignedSubjectIdsForSection = useMemo(() => {
    const ids = new Set();
    sectionClasses.forEach(cls => {
      const subjectId = cls.subject_id || cls.subject?.id;
      if (subjectId) ids.add(subjectId);
    });
    return ids;
  }, [sectionClasses]);

  const visibleSubjectsForSection = useMemo(() => {
    const search = subjectSearch.trim().toLowerCase();
    return filteredSubjectsForSection.filter(subject => {
      if (!search) return true;
      const name = `${subject.subject_code || ''} ${subject.subject_name || ''}`.toLowerCase();
      return name.includes(search);
    });
  }, [filteredSubjectsForSection, subjectSearch]);

  const filteredSubjectsForEdit = useMemo(() => {
    if (!editForm.section_id) return subjects;

    const selectedSection = sections.find(s => String(s.id) === String(editForm.section_id));
    const selectedProgramId = normalizeId(selectedSection?.program_id || selectedSection?.program?.id);
    const selectedYear = extractYearNumber(
      selectedSection?.grade_level || selectedSection?.year_level || selectedSection?.year
    );

    return subjects.filter(subject => {
      const subjectProgramId = normalizeId(subject.program?.id || subject.program_id);
      const subjectYear = extractYearNumber(
        subject.grade_level || subject.year_level || subject.year || subject.level
      );

      const programMatches = !selectedProgramId || !subjectProgramId || subjectProgramId === selectedProgramId;
      const yearMatches = selectedYear ? subjectYear === selectedYear : true;
      const selectedSubject = String(subject.id) === String(editForm.subject_id);

      return selectedSubject || (programMatches && yearMatches);
    });
  }, [editForm.section_id, editForm.subject_id, sections, subjects]);

  const teacherMatchedProgramIds = useMemo(() => {
    if (!selectedTeacher || !programs.length) return new Set();

    const teacherSpecializationTokens = toNormalizedTokens(selectedTeacher.specialization);
    const teacherDeptId = normalizeId(selectedTeacher.department_id || selectedTeacher.department?.id);

    const buildProgramKeys = (program) => [
      program.program_code,
      program.code,
      program.program_name,
      program.name,
    ].map(normalizeText).filter(Boolean);

    const getProgramDeptId = (program) => normalizeId(program.department_id || program.department?.id);

    const programMatchesSpecialization = (program) => {
      if (!teacherSpecializationTokens.length) return false;
      const programKeys = buildProgramKeys(program);
      if (!programKeys.length) return false;

      return teacherSpecializationTokens.some(token => {
        if (!token) return false;
        return programKeys.some(key => {
          if (key === token) return true;
          if (token.length >= 4 && key.startsWith(token)) return true;
          return false;
        });
      });
    };

    // 1) Primary rule: use department ID when available (most reliable)
    const deptPrograms = teacherDeptId
      ? programs.filter(program => {
          const programId = normalizeId(program.id);
          const programDeptId = getProgramDeptId(program);
          return Boolean(programId && programDeptId && programDeptId === teacherDeptId);
        })
      : [];

    // 2) Within the teacher department, refine by specialization when possible
    if (deptPrograms.length > 0) {
      const refined = deptPrograms.filter(programMatchesSpecialization);
      const source = refined.length > 0 ? refined : deptPrograms;
      return new Set(source.map(program => normalizeId(program.id)).filter(Boolean));
    }

    // 3) No department mapping: use specialization-only strict match
    const specializationMatches = programs.filter(program => {
      const programId = normalizeId(program.id);
      return Boolean(programId && programMatchesSpecialization(program));
    });

    return new Set(specializationMatches.map(program => normalizeId(program.id)).filter(Boolean));
  }, [selectedTeacher, programs]);

  // Filter sections by teacher's specialization
  const filteredSectionsForTeacher = useMemo(() => {
    if (!sections.length || !selectedTeacher) return sections;
    
    // If showAllSections is true, show all sections
    if (showAllSections) return sections;

    // Otherwise, filter to show only sections matching teacher's specialization/department
    if (teacherMatchedProgramIds.size > 0) {
      return sections.filter(section => {
        const sectionProgramId = normalizeId(section.program_id || section.program?.id);
        return sectionProgramId && teacherMatchedProgramIds.has(sectionProgramId);
      });
    }

    // If no program mapping exists, keep list empty instead of leaking unrelated sections.
    return [];
  }, [sections, selectedTeacher, showAllSections, teacherMatchedProgramIds]);

  const teacherScopeCodeLabel = useMemo(() => {
    if (!selectedTeacher) return 'My Dept';

    // Prefer explicit department code from teacher profile.
    const deptCode = selectedTeacher.department?.code || selectedTeacher.department_code;
    if (deptCode) return String(deptCode).toUpperCase();

    // Fallback: if exactly one matched program, show that program code.
    if (teacherMatchedProgramIds.size === 1) {
      const matchedProgramId = Array.from(teacherMatchedProgramIds)[0];
      const matchedProgram = programs.find((p) => normalizeId(p.id) === matchedProgramId);
      const programCode = matchedProgram?.program_code || matchedProgram?.code;
      if (programCode) return String(programCode).toUpperCase();
    }

    // Last fallback: specialization text token.
    if (selectedTeacher.specialization) {
      const token = String(selectedTeacher.specialization)
        .split(/[^a-zA-Z0-9]+/)
        .find((part) => part && part.length >= 3);
      if (token) return token.toUpperCase();
    }

    return 'My Dept';
  }, [selectedTeacher, teacherMatchedProgramIds, programs]);

  // ── Actions ──
  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassIds([]);
    setConflicts(null);
  };

  const handleBackToList = () => {
    setSelectedTeacher(null);
    setTeacherWorkload(null);
    setSelectedClassIds([]);
    setConflicts(null);
  };

  const handleAssignClass = async (classId) => {
    if (!selectedTeacher) return;
    setActionLoading(classId);
    try {
      const res = await teacherService.assignClass(selectedTeacher.id, classId);
      showBanner('success', res?.message || 'Class assigned successfully');
      await Promise.all([
        fetchTeacherWorkload(selectedTeacher.id),
        fetchUnassignedClasses(),
        fetchTeachers(),
      ]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to assign class';
      showBanner('error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnassignClass = async (classId) => {
    if (!selectedTeacher) return;

    const confirmResult = await Swal.fire({
      icon: 'question',
      title: 'Choose Unassign Action',
      text: 'You can either unassign only, or unassign and cancel this class.',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Unassign Only',
      denyButtonText: 'Unassign + Cancel Class',
      cancelButtonText: 'Keep Assigned',
      confirmButtonColor: '#2563EB',
      denyButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
    });

    if (!confirmResult.isConfirmed && !confirmResult.isDenied) return;

    const shouldCancelClass = confirmResult.isDenied;

    setActionLoading(classId);
    try {
      const res = await teacherService.unassignClass(selectedTeacher.id, classId, {
        cancel_class: shouldCancelClass,
      });
      showBanner('success', res?.message || 'Class unassigned successfully');
      await Swal.fire({
        icon: 'success',
        title: shouldCancelClass ? 'Unassigned and Cancelled' : 'Unassigned',
        text: res?.message || 'Class unassigned from teacher successfully.',
        timer: 1800,
        showConfirmButton: false,
      });
      await Promise.all([
        fetchTeacherWorkload(selectedTeacher.id),
        fetchUnassignedClasses(),
        fetchTeachers(),
      ]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to unassign class';
      showBanner('error', msg);
      await Swal.fire({
        icon: 'error',
        title: 'Unassign Failed',
        text: msg,
        confirmButtonColor: '#2563EB',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClass = async (cls) => {
    if (!selectedTeacher || !cls?.id) return;

    const classLabel = cls.class_code || `Class #${cls.id}`;
    const firstConfirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete Class Permanently?',
      html: `This will permanently remove <strong>${classLabel}</strong> if no academic records exist. This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Continue',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#B91C1C',
      cancelButtonColor: '#6B7280',
    });

    if (!firstConfirm.isConfirmed) return;

    const secondConfirm = await Swal.fire({
      icon: 'question',
      title: 'Type DELETE to Confirm',
      text: `Enter DELETE to permanently remove ${classLabel}.`,
      input: 'text',
      inputPlaceholder: 'Type DELETE',
      showCancelButton: true,
      confirmButtonText: 'Delete Permanently',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#991B1B',
      cancelButtonColor: '#6B7280',
      preConfirm: (value) => {
        if ((value || '').trim() !== 'DELETE') {
          Swal.showValidationMessage('Please type DELETE exactly to continue.');
        }
      },
    });

    if (!secondConfirm.isConfirmed) return;

    setActionLoading(cls.id);
    try {
      const res = await teacherService.deleteClass(selectedTeacher.id, cls.id);
      showBanner('success', res?.message || 'Class deleted permanently');
      await Swal.fire({
        icon: 'success',
        title: 'Class Deleted',
        text: res?.message || 'Class deleted permanently.',
        timer: 1800,
        showConfirmButton: false,
      });
      await Promise.all([
        fetchTeacherWorkload(selectedTeacher.id),
        fetchUnassignedClasses(),
        fetchTeachers(),
      ]);
    } catch (err) {
      const msg = err?.response?.data?.data?.summary
        ? `${err?.response?.data?.message || 'Delete failed'} (${err.response.data.data.summary})`
        : (err?.response?.data?.message || 'Failed to delete class');
      showBanner('error', msg);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Blocked',
        text: msg,
        confirmButtonColor: '#2563EB',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleClassSelection = (classId) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleCheckConflicts = async () => {
    if (!selectedTeacher || selectedClassIds.length === 0) return;
    setActionLoading('check');
    try {
      const res = await teacherService.checkWorkloadConflicts(selectedTeacher.id, selectedClassIds);
      setConflicts(res);
      if (res?.has_conflicts) {
        setShowConflictModal(true);
      } else {
        // No conflicts, proceed with assignment
        await handleBulkAssign();
      }
    } catch (err) {
      showBanner('error', 'Failed to check conflicts');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedTeacher || selectedClassIds.length === 0) return;
    setBulkAssigning(true);
    setShowConflictModal(false);
    try {
      const res = await teacherService.bulkAssignClasses(selectedTeacher.id, selectedClassIds);
      const msg = res?.message || `${selectedClassIds.length} classes assigned`;
      if (res?.data?.failed?.length > 0) {
        const failedReasons = res.data.failed.map(f => f.reason).join('; ');
        showBanner('error', `${msg}. Failures: ${failedReasons}`);
      } else {
        showBanner('success', msg);
      }
      setSelectedClassIds([]);
      setConflicts(null);
      await Promise.all([
        fetchTeacherWorkload(selectedTeacher.id),
        fetchUnassignedClasses(),
        fetchTeachers(),
      ]);
    } catch (err) {
      showBanner('error', err?.response?.data?.message || 'Bulk assignment failed');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    setShowAllSections(false); // Reset to show only teacher's specialization by default
    setCreateForm({
      section_id: '',
      subject_ids: [],
      academic_year_id: selectedAcademicYear || '',
    });
    setSubjectSearch('');
    setSectionClasses([]);
    // Fetch sections and subjects
    try {
      const [sectionsRes, subjectsRes, programsRes] = await Promise.all([
        sectionService.getAll({ per_page: 200 }),
        subjectService.getAll({ per_page: 200 }),
        programService.getAll({ per_page: 'all' }),
      ]);
      setSections(Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.data || []));
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []));
      setPrograms(Array.isArray(programsRes) ? programsRes : (programsRes?.data || []));
    } catch {
      setSections([]);
      setSubjects([]);
      setPrograms([]);
    }
  };

  const fetchSectionClasses = useCallback(async () => {
    if (!createForm.section_id || !createForm.academic_year_id) {
      setSectionClasses([]);
      return;
    }
    setSectionClassesLoading(true);
    try {
      const res = await classService.getAll({
        per_page: 500,
        section_id: createForm.section_id,
        academic_year_id: createForm.academic_year_id,
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setSectionClasses(data);
    } catch {
      setSectionClasses([]);
    } finally {
      setSectionClassesLoading(false);
    }
  }, [createForm.section_id, createForm.academic_year_id]);

  useEffect(() => {
    if (showCreateModal) fetchSectionClasses();
  }, [showCreateModal, fetchSectionClasses]);

  const handleCreateAndAssign = async () => {
    if (!selectedTeacher || !createForm.section_id || createForm.subject_ids.length === 0 || !createForm.academic_year_id) {
      showBanner('error', 'Please select section, at least one subject, and academic year');
      return;
    }
    setCreateLoading(true);
    try {
      // Create class for each selected subject
      const results = { success: 0, failed: 0, errors: [] };
      for (const subject_id of createForm.subject_ids) {
        try {
          await teacherService.createAndAssignClass(selectedTeacher.id, {
            section_id: createForm.section_id,
            subject_id: subject_id,
            academic_year_id: createForm.academic_year_id,
          });
          results.success += 1;
        } catch (err) {
          const subjectName = subjects.find(s => s.id == subject_id)?.subject_name || 'Unknown';
          results.failed += 1;
          results.errors.push(subjectName);
        }
      }
      
      if (results.failed === 0) {
        showBanner('success', `${results.success} class(es) created and assigned successfully`);
      } else {
        showBanner('error', `Created ${results.success} class(es), failed: ${results.errors.join(', ')}`);
      }
      
      setShowCreateModal(false);
      await Promise.all([
        fetchTeacherWorkload(selectedTeacher.id),
        fetchUnassignedClasses(),
        fetchTeachers(),
      ]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create and assign classes';
      showBanner('error', msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEditClassModal = async (cls) => {
    if (!cls) return;

    if (!sections.length || !subjects.length) {
      try {
        const [sectionsRes, subjectsRes] = await Promise.all([
          sectionService.getAll({ per_page: 200 }),
          subjectService.getAll({ per_page: 200 }),
        ]);
        setSections(Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.data || []));
        setSubjects(Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []));
      } catch {
        setSections([]);
        setSubjects([]);
      }
    }

    setEditForm({
      class_id: cls.id,
      section_id: cls.section_id || cls.section?.id || '',
      subject_id: cls.subject_id || cls.subject?.id || '',
      academic_year_id: cls.academic_year_id || cls.academicYear?.id || selectedAcademicYear || '',
      status: cls.status || 'active',
    });
    setShowEditClassModal(true);
  };

  const handleSaveClassEdit = async () => {
    if (!selectedTeacher || !editForm.class_id) return;
    if (!editForm.section_id || !editForm.subject_id || !editForm.academic_year_id) {
      showBanner('error', 'Please select section, subject, and academic year');
      return;
    }

    setEditClassLoading(true);
    try {
      await classService.update(editForm.class_id, {
        section_id: editForm.section_id,
        subject_id: editForm.subject_id,
        academic_year_id: editForm.academic_year_id,
        status: editForm.status || 'active',
        teacher_id: selectedTeacher.id,
      });

      showBanner('success', 'Class updated successfully');
      setShowEditClassModal(false);
      await Promise.all([
        fetchTeacherWorkload(selectedTeacher.id),
        fetchUnassignedClasses(),
        fetchTeachers(),
      ]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update class';
      showBanner('error', msg);
    } finally {
      setEditClassLoading(false);
    }
  };

  const handleUnassignFromEditModal = async () => {
    if (!editForm.class_id) return;
    await handleUnassignClass(editForm.class_id);
    setShowEditClassModal(false);
  };

  // ── Helpers ──
  const getLoadColor = (pct) => {
    if (pct >= 100) return 'text-red-600';
    if (pct >= 85) return 'text-amber-600';
    if (pct >= 60) return 'text-blue-600';
    return 'text-emerald-600';
  };
  const getLoadBg = (pct) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 85) return 'bg-amber-500';
    if (pct >= 60) return 'bg-blue-500';
    return 'bg-emerald-500';
  };
  const getLoadBadge = (pct) => {
    if (pct >= 100) return { text: 'Full', bg: 'bg-red-100 text-red-700 border-red-200' };
    if (pct >= 85) return { text: 'Heavy', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (pct >= 60) return { text: 'Moderate', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (pct > 0) return { text: 'Light', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    return { text: 'Unassigned', bg: 'bg-gray-100 text-gray-600 border-gray-200' };
  };

  const getInitials = (first, last) => {
    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'T';
  };

  // ── Overview stats ──
  const overviewStats = useMemo(() => {
    const total = teachers.length;
    const withClasses = teachers.filter(t => (t.teaching_load || 0) > 0).length;
    const unassignedCount = total - withClasses;
    const fullyLoaded = teachers.filter(t => {
      const pct = ((t.teaching_load || 0) / (t.max_load || 24)) * 100;
      return pct >= 100;
    }).length;
    const overloaded = teachers.filter(t => {
      const pct = ((t.teaching_load || 0) / (t.max_load || 24)) * 100;
      return pct > 100;
    }).length;
    return { total, withClasses, unassignedCount, fullyLoaded, overloaded, unassignedClassCount: unassignedClasses.length };
  }, [teachers, unassignedClasses]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 flex-1 overflow-y-auto">
        <div className="p-6">

          {/* Banner */}
          {banner && (
            <div className={`mb-4 px-4 py-3 rounded-lg flex items-center justify-between ${
              banner.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {banner.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">{banner.message}</span>
              </div>
              <button onClick={() => setBanner(null)} className="text-current opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>Admin</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              {selectedTeacher ? (
                <>
                  <button onClick={handleBackToList} className="hover:text-blue-600 transition-colors">Teacher Workload</button>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className="text-gray-900 font-medium">{selectedTeacher.first_name} {selectedTeacher.last_name}</span>
                </>
              ) : (
                <span className="text-gray-900 font-medium">Teacher Workload</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : 'Teacher Workload Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedTeacher ? 'Manage class assignments and teaching load' : 'Assign classes to teachers and monitor workload distribution'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedTeacher && (
                  <button onClick={handleBackToList} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Back to List
                  </button>
                )}
                <select
                  value={selectedAcademicYear}
                  onChange={e => setSelectedAcademicYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Academic Years</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>
                      {ay.year || ay.school_year || ay.name || `AY ${ay.id}`}
                      {ay.semester ? ` - Semester ${ay.semester}` : ''}
                      {ay.is_current ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ═══════════════ TEACHER LIST VIEW ═══════════════ */}
          {!selectedTeacher ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{overviewStats.total}</div>
                      <div className="text-xs text-gray-500">Total Teachers</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{overviewStats.withClasses}</div>
                      <div className="text-xs text-gray-500">With Classes</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg"><Users className="w-5 h-5 text-gray-500" /></div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{overviewStats.unassignedCount}</div>
                      <div className="text-xs text-gray-500">No Classes</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">{overviewStats.fullyLoaded}</div>
                      <div className="text-xs text-gray-500">Fully Loaded</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{overviewStats.overloaded}</div>
                      <div className="text-xs text-gray-500">Overloaded</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><BookOpen className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{overviewStats.unassignedClassCount}</div>
                      <div className="text-xs text-gray-500">Unassigned Classes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={departmentFilter}
                    onChange={e => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={loadFilter}
                    onChange={e => setLoadFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Load Levels</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="light">Light (&lt;60%)</option>
                    <option value="moderate">Moderate (60-84%)</option>
                    <option value="heavy">Heavy (85-99%)</option>
                    <option value="full">Full (100%+)</option>
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />{error}
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading teachers...</p>
                </div>
              ) : (
                /* Teacher Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTeachers.map(teacher => {
                    const currentLoad = teacher.teaching_load || 0;
                    const maxLoad = teacher.max_load || 24;
                    const pct = maxLoad > 0 ? Math.round((currentLoad / maxLoad) * 100) : 0;
                    const badge = getLoadBadge(pct);

                    return (
                      <button
                        key={teacher.id}
                        onClick={() => handleSelectTeacher(teacher)}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                              {getInitials(teacher.first_name, teacher.last_name)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {teacher.first_name} {teacher.last_name}
                              </h3>
                              <p className="text-xs text-gray-500">{teacher.department?.name || 'No Department'}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.text}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Teaching Load</span>
                            <span className={`font-semibold ${getLoadColor(pct)}`}>{currentLoad}/{maxLoad} units</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getLoadBg(pct)}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {teacher.classes_count || 0} classes
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {(teacher.subjects || []).length} subjects
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!loading && filteredTeachers.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No teachers match your filters</p>
                </div>
              )}
            </>
          ) : (
            /* ═══════════════ TEACHER DETAIL VIEW ═══════════════ */
            <>
              {workloadLoading && !teacherWorkload ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading workload data...</p>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* Workload Summary Cards */}
                  {workloadSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg"><Briefcase className="w-5 h-5 text-blue-600" /></div>
                          <div>
                            <div className={`text-2xl font-bold ${getLoadColor(workloadSummary.load_percentage)}`}>
                              {workloadSummary.total_units}/{workloadSummary.max_load}
                            </div>
                            <div className="text-xs text-gray-500">Units Load</div>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${getLoadBg(workloadSummary.load_percentage)}`} style={{ width: `${Math.min(workloadSummary.load_percentage, 100)}%` }} />
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg"><BarChart3 className="w-5 h-5 text-indigo-600" /></div>
                          <div>
                            <div className={`text-2xl font-bold ${getLoadColor(workloadSummary.load_percentage)}`}>{workloadSummary.load_percentage}%</div>
                            <div className="text-xs text-gray-500">Load Percentage</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
                          <div>
                            <div className="text-2xl font-bold text-emerald-600">{workloadSummary.total_classes}</div>
                            <div className="text-xs text-gray-500">Total Classes</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{workloadSummary.active_classes}</div>
                            <div className="text-xs text-gray-500">Active Classes</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg"><Layers className="w-5 h-5 text-purple-600" /></div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{workloadSummary.unique_subjects}</div>
                            <div className="text-xs text-gray-500">Unique Subjects</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-100 rounded-lg"><GraduationCap className="w-5 h-5 text-cyan-600" /></div>
                          <div>
                            <div className="text-2xl font-bold text-cyan-600">{workloadSummary.total_students}</div>
                            <div className="text-xs text-gray-500">Total Students</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search & Create Control */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search subjects and sections..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleOpenCreateModal}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      New Class
                    </button>
                  </div>

                  {/* Two Column Grid: Subjects & Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left: Assigned Subjects */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            Assigned Subjects
                          </h2>
                          <span className="text-sm text-gray-500">{assignedSubjects.length} subject(s)</span>
                        </div>
                      </div>
                      {assignedSubjects.length === 0 ? (
                        <div className="p-8 text-center">
                          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No subjects assigned yet</p>
                          <p className="text-gray-400 text-xs mt-2">Create or assign classes to add subjects</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {assignedSubjects.map(subject => (
                            <div key={subject.id || subject.subject_code} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-gray-900">{subject.subject_name}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">{subject.subject_code}</p>
                                </div>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap ml-2">
                                  {subject.units || 0} units
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {subject.class_count || 0} class{(subject.class_count || 0) !== 1 ? 'es' : ''}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {subject.total_students || 0} student{(subject.total_students || 0) !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Assigned Sections */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                            Assigned Sections
                          </h2>
                          <span className="text-sm text-gray-500">{assignedSections.length} section(s)</span>
                        </div>
                      </div>
                      {assignedSections.length === 0 ? (
                        <div className="p-8 text-center">
                          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No sections assigned yet</p>
                          <p className="text-gray-400 text-xs mt-2">Create or assign classes to add sections</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {assignedSections.map(section => (
                            <div key={section.id || section.name} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-gray-900">{section.name}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">{section.program_name}</p>
                                </div>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap ml-2">
                                  Grade {section.grade_level || '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {section.class_count || 0} class{(section.class_count || 0) !== 1 ? 'es' : ''}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {section.total_students || 0} student{(section.total_students || 0) !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Classes with Edit Actions */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-600" />
                          Assigned Classes
                        </h2>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 text-xs text-gray-600 select-none">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              checked={showCancelledClasses}
                              onChange={(e) => setShowCancelledClasses(e.target.checked)}
                            />
                            Show cancelled
                          </label>
                          <span className="text-sm text-gray-500">{visibleAssignedClasses.length} class(es)</span>
                        </div>
                      </div>
                    </div>
                    {visibleAssignedClasses.length === 0 ? (
                      <div className="p-8 text-center">
                        <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                          {assignedClasses.length > 0 && !showCancelledClasses
                            ? 'Only cancelled classes are assigned. Enable "Show cancelled" to view them.'
                            : 'No classes assigned yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Class</th>
                              <th className="px-4 py-3 text-left font-semibold">Subject</th>
                              <th className="px-4 py-3 text-left font-semibold">Section</th>
                              <th className="px-4 py-3 text-left font-semibold">Students</th>
                              <th className="px-4 py-3 text-left font-semibold">Status</th>
                              <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {visibleAssignedClasses.map(cls => (
                              <tr key={cls.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-900 font-medium">{cls.class_code || `Class #${cls.id}`}</td>
                                <td className="px-4 py-3 text-gray-700">
                                  <div className="font-medium">{cls.subject?.subject_name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{cls.subject?.subject_code || ''}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  <div className="font-medium">{cls.section?.name || cls.section?.section_code || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{cls.section?.program?.program_name || cls.section?.program?.name || ''}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{cls.enrollments_count || 0}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                    cls.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : cls.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}>
                                    {cls.status || 'active'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditClassModal(cls)}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleUnassignClass(cls.id)}
                                      disabled={actionLoading === cls.id}
                                      className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium disabled:opacity-50"
                                    >
                                      {actionLoading === cls.id ? 'Removing...' : 'Unassign'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClass(cls)}
                                      disabled={actionLoading === cls.id}
                                      className="px-3 py-1.5 bg-rose-800 text-white rounded-md hover:bg-rose-900 text-xs font-medium disabled:opacity-50"
                                    >
                                      {actionLoading === cls.id ? 'Processing...' : 'Delete'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Schedule by Day */}
                  {teacherWorkload?.schedule_by_day && Object.keys(teacherWorkload.schedule_by_day).length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          Weekly Schedule
                        </h2>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                            const daySchedules = teacherWorkload.schedule_by_day[day] || [];
                            if (daySchedules.length === 0) return null;
                            return (
                              <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                                  <h3 className="text-sm font-semibold text-indigo-800">{day}</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {daySchedules.map((s, i) => (
                                    <div key={i} className="px-4 py-2.5 text-sm">
                                      <div className="font-medium text-gray-900">{s.subject || 'N/A'}</div>
                                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {s.time_start} - {s.time_end}
                                        <span>•</span>
                                        {s.section}
                                        {s.room && <><span>•</span>{s.room}</>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Conflict Modal */}
        {showConflictModal && conflicts && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Conflicts Detected</h3>
                </div>
                <button onClick={() => setShowConflictModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
                {conflicts.conflicts?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Blocking Conflicts
                    </h4>
                    <div className="space-y-2">
                      {conflicts.conflicts.map((c, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                          <span className="font-medium capitalize">{c.type?.replace('_', ' ')}:</span> {c.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {conflicts.warnings?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Warnings
                    </h4>
                    <div className="space-y-2">
                      {conflicts.warnings.map((w, i) => (
                        <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                          {w.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                {!conflicts.has_conflicts && (
                  <button
                    onClick={handleBulkAssign}
                    disabled={bulkAssigning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {bulkAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                    Proceed with Assignment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create and Assign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Assign Classes</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Select 1 section → Multiple subjects → Create classes</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4">
                {/* Academic Year */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.academic_year_id}
                    onChange={e => setCreateForm(prev => ({ ...prev, academic_year_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>
                        {ay.year || ay.school_year || ay.name || `AY ${ay.id}`}
                        {ay.semester ? ` - Semester ${ay.semester}` : ''}
                        {ay.is_current ? ' (Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Section Selection */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex text-sm font-semibold text-gray-900 items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        SELECT SECTION <span className="text-red-500">*</span>
                      </label>
                      <button
                        onClick={() => setShowAllSections(!showAllSections)}
                        className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                          showAllSections
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                        }`}
                      >
                        {showAllSections ? 'All Departments' : teacherScopeCodeLabel}
                      </button>
                    </div>
                    
                    {!createForm.section_id ? (
                      <div className="space-y-2">
                        {filteredSectionsForTeacher.map(section => {
                          const programName = section.program?.name || section.program?.program_name || 'N/A';
                          const sectionProgramId = normalizeId(section.program_id || section.program?.id);
                          const isMatchingTeacherDept = !showAllSections && sectionProgramId && teacherMatchedProgramIds.has(sectionProgramId);
                          return (
                            <button
                              key={section.id}
                              onClick={() => setCreateForm(prev => ({ ...prev, section_id: section.id, subject_ids: [] }))}
                              className="w-full p-3 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{section.name || section.section_code}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{programName}</div>
                                  {section.grade_level && <div className="text-xs text-gray-500">Grade {section.grade_level}</div>}
                                </div>
                                {isMatchingTeacherDept && (
                                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                    ✓ Your Program
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {filteredSectionsForTeacher.length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-8">
                            {showAllSections ? 'No sections available' : `No sections in ${selectedTeacher?.specialization || 'your department'}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const selectedSection = sections.find(s => s.id == createForm.section_id);
                          if (!selectedSection) return null;
                          const programName = selectedSection.program?.name || selectedSection.program?.program_name || 'N/A';
                          return (
                            <div className="p-3 border border-emerald-300 rounded-lg bg-emerald-50">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{selectedSection.name || selectedSection.section_code}</div>
                                  <div className="text-sm text-gray-600 mt-1">{programName}</div>
                                  {selectedSection.grade_level && <div className="text-sm text-gray-600">Grade {selectedSection.grade_level}</div>}
                                </div>
                                <button
                                  onClick={() => setCreateForm(prev => ({ ...prev, section_id: '', subject_ids: [] }))}
                                  className="text-emerald-600 hover:text-emerald-700 font-medium text-xs"
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Right: Subjects Selection */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="flex text-sm font-semibold text-gray-900 mb-3 items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      SELECT SUBJECTS <span className="text-red-500">*</span>
                    </label>

                    {createForm.section_id && (
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search subjects..."
                          value={subjectSearch}
                          onChange={e => setSubjectSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    {!createForm.section_id ? (
                      <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        Select a section first to see available subjects
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {sectionClassesLoading && (
                          <div className="text-xs text-gray-500">Loading assigned subjects...</div>
                        )}
                        {visibleSubjectsForSection.length > 0 ? (
                          visibleSubjectsForSection.map(subject => {
                            const isAssigned = assignedSubjectIdsForSection.has(subject.id);
                            const isChecked = createForm.subject_ids.includes(subject.id);
                            return (
                              <label
                                key={subject.id}
                                className={`flex items-start gap-3 p-2.5 border rounded-lg transition-colors ${
                                  isAssigned
                                    ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-70'
                                    : 'border-gray-200 cursor-pointer hover:border-purple-300 hover:bg-purple-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isAssigned}
                                  onChange={e => {
                                    const newSubjectIds = e.target.checked
                                      ? [...createForm.subject_ids, subject.id]
                                      : createForm.subject_ids.filter(id => id !== subject.id);
                                    setCreateForm(prev => ({ ...prev, subject_ids: newSubjectIds }));
                                  }}
                                  className="mt-0.5 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:cursor-not-allowed"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-medium text-gray-900">{subject.subject_code}</div>
                                    {isAssigned && (
                                      <span className="text-[10px] px-2 py-0.5 bg-gray-300 text-gray-700 rounded-full">Assigned</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-0.5">{subject.subject_name}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                                      {subject.units} units
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                            {subjectSearch.trim() ? 'No subjects match your search' : 'No subjects available for this program'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {createForm.subject_ids.length > 0 && (
                      <div className="mt-3 p-2 bg-purple-100 border border-purple-300 rounded-lg text-xs text-purple-700 font-medium">
                        ✓ {createForm.subject_ids.length} subject(s) selected
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p className="font-semibold mb-2">How it works:</p>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li><strong>Step 1:</strong> Pick a section (e.g., BSIT-1A)</li>
                    <li><strong>Step 2:</strong> Select multiple subjects for that section</li>
                    <li><strong>Step 3:</strong> Creates one class per subject (all same section)</li>
                    <li><strong>Result:</strong> All classes assigned to {selectedTeacher?.first_name} {selectedTeacher?.last_name}</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndAssign}
                  disabled={createLoading || !createForm.section_id || createForm.subject_ids.length === 0 || !createForm.academic_year_id}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create & Assign {createForm.subject_ids.length > 0 ? `(${createForm.subject_ids.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Class Modal */}
        {showEditClassModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Change section, subject, year, or status</p>
                </div>
                <button onClick={() => setShowEditClassModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
                  <select
                    value={editForm.section_id}
                    onChange={e => setEditForm(prev => ({ ...prev, section_id: e.target.value, subject_id: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name || section.section_code}
                        {section.grade_level ? ` - Year ${section.grade_level}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <select
                    value={editForm.subject_id}
                    onChange={e => setEditForm(prev => ({ ...prev, subject_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjectsForEdit.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subject_code} - {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
                    <select
                      value={editForm.academic_year_id}
                      onChange={e => setEditForm(prev => ({ ...prev, academic_year_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map(ay => (
                        <option key={ay.id} value={ay.id}>
                          {ay.year || ay.school_year || ay.name || `AY ${ay.id}`}
                          {ay.semester ? ` - Semester ${ay.semester}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  Delete is permanent and may be blocked if the class already has enrollments.
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between gap-2">
                <button
                  onClick={() => {
                    const targetClass = assignedClasses.find(c => String(c.id) === String(editForm.class_id));
                    handleDeleteClass(targetClass || { id: editForm.class_id, class_code: `Class #${editForm.class_id}` });
                  }}
                  disabled={editClassLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  Delete Class
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUnassignFromEditModal}
                    disabled={editClassLoading || actionLoading === editForm.class_id}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                  >
                    Unassign
                  </button>
                  <button
                    onClick={() => setShowEditClassModal(false)}
                    disabled={editClassLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClassEdit}
                    disabled={editClassLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {editClassLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherWorkload;
