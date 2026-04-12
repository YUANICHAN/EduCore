import '../../App.css';
import { useState, useMemo, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import academicYearService from "../../service/academicYearService";
import gradingPeriodService from "../../service/gradingPeriodService";
import Swal from 'sweetalert2';
import {
  Calendar,
  Plus,
  Edit,
  Archive,
  Search,
  Lock,
  LockOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  MoreVertical,
  X,
  ChevronRight,
  Home,
  Zap,
  Grid3X3,
  Loader2,
  Trash2,
} from 'lucide-react';

const TERM_NAME_OPTIONS = ['1st Semester', '2nd Semester', 'Summer'];

function AcademicYear() {
  const [activeItem, setActiveItem] = useState("Academic Year");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAY, setEditingAY] = useState(null);
  const [expandedAY, setExpandedAY] = useState(null);
  const [drillDownLevel, setDrillDownLevel] = useState("list"); // list or details

  // API states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ayToDelete, setAyToDelete] = useState(null);

  // Academic Years Data from API
  const [academicYears, setAcademicYears] = useState([]);

  const toDateInputValue = (value) => {
    if (!value) return '';
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  // Fetch academic years from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await academicYearService.getAll();
      const data = Array.isArray(response)
        ? response
        : (Array.isArray(response?.data) ? response.data : []);

      const normalizeSemesterLabel = (value) => {
        const text = String(value || '').trim().toLowerCase();
        if (text === '1st' || text === 'first' || text.includes('1st')) return '1st Semester';
        if (text === '2nd' || text === 'second' || text.includes('2nd')) return '2nd Semester';
        if (text.includes('summer')) return 'Summer';
        return value || '';
      };
      
      // Map API response to component format
      const mappedData = data.map(ay => ({
        id: ay.id,
        name: ay.year_code || ay.year || ay.name || `${ay.start_year}-${ay.end_year}`,
        yearCode: ay.year_code || '',
        semester: normalizeSemesterLabel(ay.semester),
        startDate: toDateInputValue(ay.start_date || ay.startDate || ''),
        endDate: toDateInputValue(ay.end_date || ay.endDate || ''),
        isActive: ay.is_current || ay.is_active || ay.isActive || false,
        isArchived: ay.status === 'archived' || ay.is_archived || ay.isArchived || false,
        enrollmentOpen: ay.enrollment_open || ay.enrollmentOpen || false,
        enrollmentStartDate: toDateInputValue(ay.enrollment_start_date || ay.enrollmentStartDate || ''),
        enrollmentEndDate: toDateInputValue(ay.enrollment_end_date || ay.enrollmentEndDate || ''),
        enrollmentLocked: ay.enrollment_locked || ay.enrollmentLocked || false,
        gradesLocked: ay.grades_locked || ay.gradesLocked || false,
        sectionTransferLocked: ay.section_transfer_locked || ay.sectionTransferLocked || false,
        totalStudents: ay.total_students || ay.totalStudents || ay.students_count || 0,
        totalSections: ay.total_sections || ay.totalSections || ay.sections_count || 0,
        totalSubjects: ay.total_subjects || ay.totalSubjects || ay.subjects_count || 0,
        currentMode: ay.status || ay.current_mode || ay.currentMode || 'active',
        status: ay.status || 'active',
        terms: Array.isArray(ay.grading_periods)
          ? ay.grading_periods.map((period) => ({
              id: period.id,
              name: period.period_name || `Term ${period.period_number || ''}`,
              startDate: toDateInputValue(period.start_date || ''),
              endDate: toDateInputValue(period.end_date || ''),
              isCurrent: period.status === 'open',
              status: period.status || 'locked',
            }))
          : (Array.isArray(ay.terms) ? ay.terms : []),
      }));
      setAcademicYears(mappedData);
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError('Failed to load academic years. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const filteredAcademicYears = useMemo(() => {
    return academicYears.filter((ay) => {
      const matchesSearch =
        (ay.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [academicYears, searchTerm]);

  // Handlers
  const handleSetActive = async (id) => {
    try {
      await academicYearService.setActive(id);
      await fetchData();
    } catch (err) {
      console.error('Error setting active year:', err);
      // Fallback to local update
      setAcademicYears(
        academicYears.map((ay) => ({
          ...ay,
          isActive: ay.id === id,
        }))
      );
    }
  };

  const handleArchive = async (id) => {
    try {
      const ay = academicYears.find(a => a.id === id);
      await academicYearService.update(id, { is_archived: !ay.isArchived });
      await fetchData();
    } catch (err) {
      console.error('Error archiving year:', err);
      setAcademicYears(
        academicYears.map((ay) =>
          ay.id === id ? { ...ay, isArchived: !ay.isArchived } : ay
        )
      );
    }
  };

  const handleCreateAY = async (newAY) => {
    setSaving(true);
    try {
      const currentTerm = (newAY.terms || []).find((term) => term.isCurrent) || (newAY.terms || [])[0] || null;
      const inferSemester = (termName) => {
        const text = String(termName || '').toLowerCase();
        if (text.includes('1st') || text.includes('first') || text.includes('prelim')) return '1st';
        if (text.includes('2nd') || text.includes('second') || text.includes('midterm')) return '2nd';
        if (text.includes('summer')) return 'summer';
        return '1st';
      };

      const data = {
        year_code: newAY.name,
        start_date: newAY.startDate,
        end_date: newAY.endDate,
        semester: inferSemester(currentTerm?.name),
        is_current: Boolean(currentTerm?.isCurrent),
        status: 'active',
      };

      const buildPeriodPayload = (term, index, academicYearId) => ({
        academic_year_id: academicYearId,
        period_name: term.name,
        period_type: 'semester',
        period_number: index + 1,
        start_date: term.startDate,
        end_date: term.endDate,
      });

      const syncCurrentOpenPeriod = async (academicYearId, terms) => {
        const currentIndex = terms.findIndex((term) => term.isCurrent);
        const periodsResponse = await gradingPeriodService.getAll({
          academic_year_id: academicYearId,
          sort_by: 'period_number',
          sort_order: 'asc',
          per_page: 100,
        });

        const periodRows = Array.isArray(periodsResponse)
          ? periodsResponse
          : (Array.isArray(periodsResponse?.data) ? periodsResponse.data : []);

        for (const period of periodRows) {
          if (period.status !== 'locked') {
            await gradingPeriodService.update(period.id, { status: 'locked' });
          }
        }

        if (currentIndex >= 0 && periodRows[currentIndex]) {
          await gradingPeriodService.open(periodRows[currentIndex].id);
        }
      };

      if (editingAY) {
        await academicYearService.update(editingAY.id, data);

        const existingTerms = Array.isArray(editingAY.terms) ? editingAY.terms : [];
        const existingIds = existingTerms.map((term) => term.id).filter(Boolean);
        const incomingTerms = Array.isArray(newAY.terms) ? newAY.terms : [];
        const incomingIds = incomingTerms.map((term) => term.id).filter(Boolean);

        for (const term of incomingTerms) {
          if (term.id) {
            await gradingPeriodService.update(term.id, {
              period_name: term.name,
              period_number: incomingTerms.findIndex((item) => item === term) + 1,
              start_date: term.startDate,
              end_date: term.endDate,
              period_type: 'semester',
            });
          } else {
            await gradingPeriodService.create(buildPeriodPayload(term, incomingTerms.findIndex((item) => item === term), editingAY.id));
          }
        }

        for (const existingId of existingIds) {
          if (!incomingIds.includes(existingId)) {
            await gradingPeriodService.delete(existingId);
          }
        }

        await syncCurrentOpenPeriod(editingAY.id, incomingTerms);
        setEditingAY(null);
      } else {
        const createResponse = await academicYearService.create(data);
        const createdAcademicYearId = createResponse?.data?.id || createResponse?.id;

        if (createdAcademicYearId && Array.isArray(newAY.terms) && newAY.terms.length > 0) {
          await gradingPeriodService.bulkCreate({
            academic_year_id: createdAcademicYearId,
            period_type: 'semester',
            periods: newAY.terms.map((term, index) => ({
              period_name: term.name,
              period_number: index + 1,
              start_date: term.startDate,
              end_date: term.endDate,
            })),
          });

          await syncCurrentOpenPeriod(createdAcademicYearId, newAY.terms);
        }
      }
      await fetchData();
      setShowCreateModal(false);
      setSuccessMessage('Academic year and terms saved to database successfully.');
    } catch (err) {
      console.error('Error saving academic year:', err);
      alert('Failed to save academic year. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAY = async () => {
    if (!ayToDelete) return;
    setSaving(true);
    try {
      await academicYearService.delete(ayToDelete.id);
      await fetchData();
      setShowDeleteModal(false);
      setAyToDelete(null);
    } catch (err) {
      console.error('Error deleting academic year:', err);
      alert('Failed to delete academic year. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (id, lockType) => {
    try {
      const ay = academicYears.find(a => a.id === id);
      const snakeCaseLock = lockType.replace(/([A-Z])/g, '_$1').toLowerCase();
      await academicYearService.update(id, { [snakeCaseLock]: !ay[lockType] });
      await fetchData();
    } catch (err) {
      console.error('Error toggling lock:', err);
      setAcademicYears(
        academicYears.map((ay) =>
          ay.id === id
            ? { ...ay, [lockType]: !ay[lockType] }
            : ay
        )
      );
    }
  };

  const handleToggleEnrollment = async (id) => {
    try {
      const ay = academicYears.find(a => a.id === id);
      await academicYearService.update(id, { enrollment_open: !ay.enrollmentOpen });
      await fetchData();
    } catch (err) {
      console.error('Error toggling enrollment:', err);
      setAcademicYears(
        academicYears.map((ay) =>
          ay.id === id ? { ...ay, enrollmentOpen: !ay.enrollmentOpen } : ay
        )
      );
    }
  };

  const openEditModal = (ay) => {
    setEditingAY(ay);
    setShowCreateModal(true);
  };

  const openDeleteModal = (ay) => {
    setAyToDelete(ay);
    setShowDeleteModal(true);
  };

  const getEnrollmentStatus = (ay) => {
    const today = new Date();
    const startDate = new Date(ay.enrollmentStartDate);
    const endDate = new Date(ay.enrollmentEndDate);

    if (today < startDate) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
    if (today > endDate) return { label: "Closed", color: "bg-red-100 text-red-700" };
    if (ay.enrollmentOpen) return { label: "Open", color: "bg-green-100 text-green-700" };
    return { label: "Paused", color: "bg-yellow-100 text-yellow-700" };
  };

  const getSystemMode = (ay) => {
    if (ay.isArchived) return { label: "Archived", color: "gray", icon: Archive };
    if (!ay.isActive) return { label: "Inactive", color: "gray", icon: Clock };
    if (ay.enrollmentOpen) return { label: "Enrollment Period", color: "blue", icon: Users };
    if (ay.gradesLocked) return { label: "Closed", color: "red", icon: Lock };
    return { label: "Grading Period", color: "green", icon: CheckCircle };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading academic years...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
              <button onClick={fetchData} className="ml-auto text-red-600 hover:text-red-800 font-medium">
                Retry
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Academic Year Management</h1>
                <p className="text-gray-600 mt-1">Control enrollment, terms, and system-wide academic settings</p>
              </div>
              <button
                onClick={() => {
                  setEditingAY(null);
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Academic Year</span>
              </button>
            </div>
          </div>

          {/* Active Year Alert */}
          {academicYears.find((ay) => ay.isActive) && (
            <div className="bg-blue-50 border border-blue-200 roundshrink-06 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">
                  Active Academic Year: {academicYears.find((ay) => ay.isActive)?.name}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  All enrollment, sections, and grades are tied to this year. Only one academic year can be active at a time.
                </p>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search academic years..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Academic Years Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAcademicYears.map((ay) => {
              const enrollmentStatus = getEnrollmentStatus(ay);
              const systemMode = getSystemMode(ay);
              const ModeIcon = systemMode.icon;

              return (
                <div
                  key={ay.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Header */}
                  <div className={`p-4 border-b border-gray-100 ${ay.isActive ? "bg-blue-50" : "bg-gray-50"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-bold text-gray-900">{ay.name}</h3>
                          {ay.isActive && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                              Active
                            </span>
                          )}
                          {ay.isArchived && (
                            <span className="px-2 py-1 bg-gray-600 text-white text-xs font-semibold rounded-full">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {ay.startDate} to {ay.endDate}
                        </p>
                      </div>
                      <button className="text-gray-500 hover:text-gray-700">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* System Mode */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <ModeIcon className={`w-4 h-4 text-${systemMode.color}-600`} />
                      <span className={`text-sm font-medium px-2 py-1 rounded bg-${systemMode.color}-100 text-${systemMode.color}-700`}>
                        {systemMode.label}
                      </span>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="p-4 space-y-3 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Students</p>
                          <p className="text-lg font-bold text-gray-900">{ay.totalStudents}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Grid3X3 className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-600">Sections</p>
                          <p className="text-lg font-bold text-gray-900">{ay.totalSections}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Subjects Offered</p>
                        <p className="text-lg font-bold text-gray-900">{ay.totalSubjects}</p>
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Status */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Enrollment Status</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${enrollmentStatus.color}`}>
                        {enrollmentStatus.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {ay.enrollmentStartDate} to {ay.enrollmentEndDate}
                    </p>
                  </div>

                  {/* Locks */}
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Data Protection</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Enrollment Locked</span>
                        <div className="flex items-center space-x-1">
                          {ay.enrollmentLocked ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <LockOpen className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-xs font-medium">{ay.enrollmentLocked ? "Locked" : "Open"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Grades Locked</span>
                        <div className="flex items-center space-x-1">
                          {ay.gradesLocked ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <LockOpen className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-xs font-medium">{ay.gradesLocked ? "Locked" : "Open"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Transfer Locked</span>
                        <div className="flex items-center space-x-1">
                          {ay.sectionTransferLocked ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <LockOpen className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-xs font-medium">{ay.sectionTransferLocked ? "Locked" : "Open"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Terms ({ay.terms.length})</p>
                    <div className="space-y-1">
                      {ay.terms.map((term) => (
                        <div key={term.id || `${ay.id}-${term.name}-${term.startDate}`} className="flex items-start justify-between text-xs gap-2">
                          <div>
                            <p className="text-gray-700 font-medium">{term.name}</p>
                            <p className="text-gray-500">{term.startDate || 'N/A'} to {term.endDate || 'N/A'}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            term.isCurrent
                              ? "bg-blue-100 text-blue-700"
                              : term.status === 'closed'
                              ? "bg-gray-100 text-gray-700"
                              : term.status === 'open'
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {term.status || (term.isCurrent ? 'open' : 'locked')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50 flex flex-wrap gap-2">
                    {!ay.isActive && !ay.isArchived && (
                      <button
                        onClick={() => handleSetActive(ay.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                    {!ay.isArchived && (
                      <>
                        <button
                          onClick={() => {
                            setEditingAY(ay);
                            setShowCreateModal(true);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleArchive(ay.id)}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Archive</span>
                        </button>
                      </>
                    )}
                    {ay.isArchived && (
                      <button
                        onClick={() => handleArchive(ay.id)}
                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAcademicYears.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No academic years found</p>
            </div>
          )}
        </div>

        {/* Create/Edit Academic Year Modal */}
        {showCreateModal && (
          <CreateAcademicYearModal
            academicYear={editingAY}
            onSave={handleCreateAY}
            onClose={() => {
              setShowCreateModal(false);
              setEditingAY(null);
            }}
            saving={saving}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmModal
            academicYear={ayToDelete}
            onConfirm={handleDeleteAY}
            onClose={() => {
              setShowDeleteModal(false);
              setAyToDelete(null);
            }}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function CreateAcademicYearModal({ academicYear, onSave, onClose, saving }) {
  const toDateInputValue = (value) => {
    if (!value) return '';
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const buildInitialFormData = () => {
    if (!academicYear) {
      return {
        name: "",
        startDate: "",
        endDate: "",
        enrollmentStartDate: "",
        enrollmentEndDate: "",
        terms: [
          { name: "1st Semester", startDate: "", endDate: "", isCurrent: false },
          { name: "2nd Semester", startDate: "", endDate: "", isCurrent: false },
        ],
      };
    }

    const mappedTerms = Array.isArray(academicYear.terms)
      ? academicYear.terms.map((term) => ({
          ...term,
          startDate: toDateInputValue(term.startDate),
          endDate: toDateInputValue(term.endDate),
        }))
      : [];

    // If DB has no grading periods yet, seed one row based on current semester.
    const fallbackTerms = mappedTerms.length > 0
      ? mappedTerms
      : [{
          name: academicYear.semester || '1st Semester',
          startDate: toDateInputValue(academicYear.startDate),
          endDate: toDateInputValue(academicYear.endDate),
          isCurrent: Boolean(academicYear.isActive),
        }];

    return {
      ...academicYear,
      startDate: toDateInputValue(academicYear.startDate),
      endDate: toDateInputValue(academicYear.endDate),
      enrollmentStartDate: toDateInputValue(academicYear.enrollmentStartDate),
      enrollmentEndDate: toDateInputValue(academicYear.enrollmentEndDate),
      terms: fallbackTerms,
    };
  };

  const [formData, setFormData] = useState(
    buildInitialFormData()
  );
  const [validationError, setValidationError] = useState('');

  const normalizeDate = (value) => {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const validateFormData = () => {
    const ayStart = normalizeDate(formData.startDate);
    const ayEnd = normalizeDate(formData.endDate);

    if (!ayStart || !ayEnd) {
      return 'Please provide valid academic year start and end dates.';
    }
    if (ayStart > ayEnd) {
      return 'Academic year start date cannot be later than end date.';
    }

    const currentTerms = formData.terms.filter((term) => term.isCurrent);
    if (currentTerms.length > 1) {
      return 'Only one term can be marked as current.';
    }

    const normalizedTerms = [];
    for (let index = 0; index < formData.terms.length; index += 1) {
      const term = formData.terms[index];
      const name = String(term.name || '').trim();
      const termStart = normalizeDate(term.startDate);
      const termEnd = normalizeDate(term.endDate);

      if (!name) {
        return `Term #${index + 1} must have a name.`;
      }
      if (!termStart || !termEnd) {
        return `Term \"${name}\" must have valid start and end dates.`;
      }
      if (termStart > termEnd) {
        return `Term \"${name}\" start date cannot be later than end date.`;
      }
      if (termStart < ayStart || termEnd > ayEnd) {
        return `Term \"${name}\" must be within the academic year date range.`;
      }

      normalizedTerms.push({ index, name, start: termStart, end: termEnd });
    }

    const uniqueNames = new Set(normalizedTerms.map((term) => term.name.toLowerCase()));
    if (uniqueNames.size !== normalizedTerms.length) {
      return 'Each term must be unique. Please avoid duplicate semester names.';
    }

    for (let i = 0; i < normalizedTerms.length; i += 1) {
      for (let j = i + 1; j < normalizedTerms.length; j += 1) {
        const first = normalizedTerms[i];
        const second = normalizedTerms[j];
        const overlaps = first.start <= second.end && second.start <= first.end;
        if (overlaps) {
          return `Term dates overlap between \"${first.name}\" and \"${second.name}\".`;
        }
      }
    }

    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errorMessage = validateFormData();
    if (errorMessage) {
      setValidationError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Invalid Term Setup',
        text: errorMessage,
        confirmButtonColor: '#2563eb',
      });
      return;
    }
    setValidationError('');
    onSave(formData);
  };

  const handleAddTerm = () => {
    const usedNames = new Set((formData.terms || []).map((term) => String(term.name || '').trim()));
    const nextName = TERM_NAME_OPTIONS.find((name) => !usedNames.has(name)) || 'Summer';

    setFormData({
      ...formData,
      terms: [
        ...formData.terms,
        { name: nextName, startDate: "", endDate: "", isCurrent: false },
      ],
    });
  };

  const handleRemoveTerm = (index) => {
    setFormData({
      ...formData,
      terms: formData.terms.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {academicYear ? "Edit Academic Year" : "Create New Academic Year"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {validationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </div>
          ) : null}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 2025-2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms Management */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Terms / Semesters</h3>
              <button
                type="button"
                onClick={handleAddTerm}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Term</span>
              </button>
            </div>
            <div className="space-y-4">
              {formData.terms.map((term, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <select
                      value={term.name}
                      onChange={(e) => {
                        const newTerms = [...formData.terms];
                        newTerms[index].name = e.target.value;
                        setFormData({ ...formData, terms: newTerms });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    >
                      {!TERM_NAME_OPTIONS.includes(term.name) && term.name ? (
                        <option value={term.name}>{term.name}</option>
                      ) : null}
                      {TERM_NAME_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {formData.terms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTerm(index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={term.startDate}
                      onChange={(e) => {
                        const newTerms = [...formData.terms];
                        newTerms[index].startDate = e.target.value;
                        setFormData({ ...formData, terms: newTerms });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="date"
                      value={term.endDate}
                      onChange={(e) => {
                        const newTerms = [...formData.terms];
                        newTerms[index].endDate = e.target.value;
                        setFormData({ ...formData, terms: newTerms });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <label className="flex items-center space-x-2 mt-3">
                    <input
                      type="checkbox"
                      checked={term.isCurrent}
                      onChange={(e) => {
                        const newTerms = [...formData.terms];
                        newTerms[index].isCurrent = e.target.checked;
                        setFormData({ ...formData, terms: newTerms });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Mark as current term</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}                        
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {academicYear ? "Update Academic Year" : "Create Academic Year"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ academicYear, onConfirm, onClose, saving }) {
  if (!academicYear) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Delete Academic Year</h2>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          Are you sure you want to delete academic year <strong>{academicYear.name}</strong>? 
          All associated enrollments, grades, and records will be permanently removed.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Academic Year
          </button>
        </div>
      </div>
    </div>
  );
}

export default AcademicYear;
