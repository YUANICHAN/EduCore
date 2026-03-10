import '../../App.css';
import { useMemo, useState } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import subjectService from "../../service/subjectService";
import programService from "../../service/programService";
import Swal from 'sweetalert2';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Edit,
  Archive,
  Search,
  Filter,
  LayoutGrid,
  List,
  X,
  Check,
  AlertCircle,
  Users,
  Zap,
  ChevronRight,
  Home,
  GraduationCap,
  Calendar,
  Loader2,
  Trash2,
} from "lucide-react";

function Subjects() {
  const [activeItem, setActiveItem] = useState("Subjects");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  // Drill-down navigation state
  const [drillDownLevel, setDrillDownLevel] = useState("programs"); // programs, years, semesters, subjects
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  
  // API states
  const [saving, setSaving] = useState(false);

  const years = [1, 2, 3, 4];
  const semesters = [
    { name: "1st Sem", label: "1st Semester", color: "blue" },
    { name: "2nd Sem", label: "2nd Semester", color: "green" },
  ];

  const subjectsQuery = useQuery({
    queryKey: ['subjects', { per_page: 1000 }],
    queryFn: () => subjectService.getAll({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const subjects = useMemo(() => {
    const source = subjectsQuery.data?.data || subjectsQuery.data || [];
    return source.map(s => {
      const yearLevel = s.grade_level || s.year_level || s.year;
      let yearNumber = 1;
      if (typeof yearLevel === 'number') {
        yearNumber = yearLevel;
      } else if (typeof yearLevel === 'string') {
        if (yearLevel.includes('1')) yearNumber = 1;
        else if (yearLevel.includes('2')) yearNumber = 2;
        else if (yearLevel.includes('3')) yearNumber = 3;
        else if (yearLevel.includes('4')) yearNumber = 4;
      }

      const semesterRaw = s.semester || '1st';
      let semesterLabel = semesterRaw;
      if (semesterRaw === '1st') semesterLabel = '1st Sem';
      else if (semesterRaw === '2nd') semesterLabel = '2nd Sem';
      else if (semesterRaw === 'summer') semesterLabel = 'Summer';

      const statusRaw = (s.status || 'active').toLowerCase();
      const statusLabel = statusRaw === 'active' ? 'Active' : 'Inactive';

      return {
        id: s.id,
        code: s.code || s.subject_code || '',
        name: s.name || s.subject_name || '',
        course: s.program_id?.toString() || '',
        year: yearNumber,
        semester: semesterLabel,
        units: s.units || 3,
        type: s.type || 'Lecture',
        classification: s.classification || 'Major',
        prerequisites: s.prerequisites || [],
        status: statusLabel,
        sections: s.sections_count || 0,
        teachers: s.teachers_count || 0,
        yearsUsed: s.years_used || [],
      };
    });
  }, [subjectsQuery.data]);

  const courses = useMemo(() => {
    const source = programsQuery.data?.data || programsQuery.data || [];
    const mapped = source.map(p => ({
      id: p.id,
      name: p.id.toString(), // Use ID for consistent matching with subjects.course
      code: p.program_code || p.code || '',
      fullName: p.name || p.program_name || '',
      color: ['blue', 'green', 'purple', 'orange', 'red'][p.id % 5] || 'blue',
    }));

    return mapped.length > 0 ? mapped : [
      { id: 1, name: '1', code: "BSIT", fullName: "BS in Information Technology", color: "blue" },
      { id: 2, name: '2', code: "BSBA", fullName: "BS in Business Administration", color: "green" },
      { id: 3, name: '3', code: "BSHM", fullName: "BS in Hospitality Management", color: "purple" },
    ];
  }, [programsQuery.data]);

  const loading = subjectsQuery.isLoading || programsQuery.isLoading;
  const error = subjectsQuery.isError || programsQuery.isError
    ? 'Failed to load subjects. Please try again.'
    : null;

  // Breadcrumb navigation handlers
  const navigateToPrograms = () => {
    setDrillDownLevel("programs");
    setSelectedCourse(null);
    setSelectedYear(null);
    setSelectedSemester(null);
  };

  const navigateToYears = (course) => {
    setDrillDownLevel("years");
    setSelectedCourse(course);
    setSelectedYear(null);
    setSelectedSemester(null);
  };

  const navigateToSemesters = (year) => {
    setDrillDownLevel("semesters");
    setSelectedYear(year);
    setSelectedSemester(null);
  };

  const navigateToSubjects = (semester) => {
    setDrillDownLevel("subjects");
    setSelectedSemester(semester);
  };

  // Count subjects per program
  const getCourseSubjectCount = (courseName) => {
    return subjects.filter(s => s.course === courseName && s.status === "Active").length;
  };

  // Count subjects per year level in selected program
  const getYearSubjectCount = (year) => {
    return subjects.filter(s => 
      s.course === selectedCourse && 
      s.year === year && 
      s.status === "Active"
    ).length;
  };

  // Count subjects per semester in selected year
  const getSemesterSubjectCount = (semester) => {
    return subjects.filter(s => 
      s.course === selectedCourse && 
      s.year === selectedYear && 
      s.semester === semester &&
      s.status === "Active"
    ).length;
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch =
        (subject.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse = !selectedCourse || subject.course === selectedCourse;
      const matchesYear = !selectedYear || subject.year === selectedYear;
      const matchesSemester = !selectedSemester || subject.semester === selectedSemester;

      return matchesSearch && matchesCourse && matchesYear && matchesSemester;
    });
  }, [subjects, searchTerm, selectedCourse, selectedYear, selectedSemester]);

  const summary = useMemo(() => {
    const activeCount = subjects.filter((s) => s.status === "Active").length;
    const inactiveCount = subjects.filter((s) => s.status === "Inactive").length;
    const totalUnits = subjects.reduce((sum, s) => sum + (s.units || 0), 0);
    return { activeCount, inactiveCount, totalUnits };
  }, [subjects]);

  const handleCreateSubject = async (newSubject) => {
    setSaving(true);
    try {
      // Validate required fields
      if (!newSubject.code?.trim()) {
        throw new Error('Subject code is required');
      }
      if (!newSubject.name?.trim()) {
        throw new Error('Subject name is required');
      }
      if (!newSubject.course) {
        throw new Error('Course/Program is required');
      }
      if (!newSubject.year) {
        throw new Error('Year level is required');
      }
      if (!newSubject.semester) {
        throw new Error('Semester is required');
      }
      if (!newSubject.units) {
        throw new Error('Units are required');
      }

      // Parse program ID (now stored directly in formData.course)
      const programId = parseInt(newSubject.course);
      if (!programId || isNaN(programId)) {
        throw new Error('Invalid program ID selected');
      }
      
      // Parse semester - handle both "1st Sem" and "1st Semester" formats
      let semesterCode = '1st';
      if (newSubject.semester) {
        if (newSubject.semester.includes('1st')) semesterCode = '1st';
        else if (newSubject.semester.includes('2nd')) semesterCode = '2nd';
        else if (newSubject.semester.includes('summer')) semesterCode = 'summer';
      }
      
      const subjectData = {
        subject_code: newSubject.code.trim(),
        subject_name: newSubject.name.trim(),
        description: newSubject.description?.trim() || null,
        program_id: programId,
        grade_level: String(newSubject.year),
        semester: semesterCode,
        units: parseInt(newSubject.units) || 3,
        credits: parseInt(newSubject.units) || 3,
        is_required: newSubject.classification === 'required' || newSubject.classification === 'Major',
        prerequisites: Array.isArray(newSubject.prerequisites) ? newSubject.prerequisites : [],
        status: 'active',
      };

      console.log('Submitting subject data:', subjectData);

      if (editingSubject) {
        await subjectService.update(editingSubject.id, subjectData);
        setEditingSubject(null);
      } else {
        await subjectService.create(subjectData);
      }
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowCreateModal(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: editingSubject ? 'Subject updated successfully' : 'Subject created successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error saving subject:', err);
      console.error('Response data:', err.response?.data);
      const errorMessage = err.message ||
                          err.response?.data?.message || 
                          Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 
                          'Failed to save subject. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id) => {
    try {
      const subject = subjects.find(s => s.id === id);
      if (subject) {
        await subjectService.update(id, { 
          status: subject.status === "Active" ? "Inactive" : "Active" 
        });
        await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      }
    } catch (err) {
      console.error('Error updating subject status:', err);
      alert('Failed to update subject status.');
    }
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setSaving(true);
    try {
      await subjectService.delete(subjectToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowDeleteModal(false);
      setSubjectToDelete(null);
    } catch (err) {
      console.error('Error deleting subject:', err);
      alert('Failed to delete subject. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setShowCreateModal(true);
  };

  const openDeleteModal = (subject) => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const getSubjectCountByYear = (course, year) => {
    return subjects.filter((s) => s.course === course && s.year === year).length;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading subjects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
              <button onClick={() => queryClient.invalidateQueries({ queryKey: ['subjects'] })} className="ml-auto text-red-600 hover:text-red-800 font-medium">
                Retry
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subjects Management</h1>
              <p className="text-gray-600 mt-1">Navigate through programs, years, and semesters</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50">
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Subject</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center space-x-2 text-sm flex-wrap">
              <button
                onClick={navigateToPrograms}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                  drillDownLevel === "programs"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Subjects</span>
              </button>

              {selectedCourse && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => navigateToYears(selectedCourse)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      drillDownLevel === "years"
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {selectedCourse}
                  </button>
                </>
              )}

              {selectedYear && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => navigateToSemesters(selectedYear)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      drillDownLevel === "semesters"
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    Year {selectedYear}
                  </button>
                </>
              )}

              {selectedSemester && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-lg">
                    {selectedSemester}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* PROGRAMS VIEW */}
          {drillDownLevel === "programs" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Select a Program</h2>
                <span className="text-sm text-gray-600">{courses.length} programs available</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const subjectCount = getCourseSubjectCount(course.name);
                  return (
                    <button
                      key={course.name}
                      onClick={() => navigateToYears(course.name)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-${course.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${course.color}-200 transition-colors`}>
                          <GraduationCap className={`w-6 h-6 text-${course.color}-600`} />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{course.fullName}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Active Subjects</span>
                        <span className="text-2xl font-bold text-blue-600">{subjectCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* YEAR LEVELS VIEW */}
          {drillDownLevel === "years" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Year Level - {courses.find(c => c.name === selectedCourse)?.fullName}
                </h2>
                <span className="text-sm text-gray-600">{years.length} year levels</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {years.map((year) => {
                  const subjectCount = getYearSubjectCount(year);
                  return (
                    <button
                      key={year}
                      onClick={() => navigateToSemesters(year)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl font-bold text-purple-600 group-hover:bg-purple-200 transition-colors">
                          {year}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Year {year}</h3>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Subjects</span>
                        <span className="text-2xl font-bold text-blue-600">{subjectCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEMESTERS VIEW */}
          {drillDownLevel === "semesters" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Semester - {courses.find(c => c.name === selectedCourse)?.code} Year {selectedYear}
                </h2>
                <span className="text-sm text-gray-600">{semesters.length} semesters</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {semesters.map((semester) => {
                  const subjectCount = getSemesterSubjectCount(semester.name);
                  return (
                    <button
                      key={semester.name}
                      onClick={() => navigateToSubjects(semester.name)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-${semester.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${semester.color}-200 transition-colors`}>
                          <Calendar className={`w-6 h-6 text-${semester.color}-600`} />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{semester.label}</h3>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Subjects</span>
                        <span className="text-2xl font-bold text-blue-600">{subjectCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBJECTS VIEW */}
          {drillDownLevel === "subjects" && (
            <div>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Total Subjects</span>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Active</span>
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{summary.activeCount}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Inactive</span>
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{summary.inactiveCount}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Total Units</span>
                    <Zap className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalUnits}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by code or name"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg ${
                          viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <LayoutGrid className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg ${
                          viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>{filteredSubjects.length} subjects</span>
                  </div>
                </div>
              </div>

          {/* Subjects Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSubjects.map((subject) => (
                <div key={subject.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          subject.status === "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {subject.status}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 mt-2">{subject.code}</h3>
                        <p className="text-sm text-gray-700 mt-1">{subject.name}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingSubject(subject);
                            setShowCreateModal(true);
                          }}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(subject.id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Course</span>
                        <p className="font-semibold text-gray-900">{courses.find(c => c.name === subject.course)?.code || subject.course}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Year</span>
                        <p className="font-semibold text-gray-900">Year {subject.year}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Semester</span>
                        <p className="font-semibold text-gray-900">{subject.semester}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Units</span>
                        <p className="font-semibold text-gray-900">{subject.units}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type</span>
                        <span className="font-medium text-gray-900">{subject.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Classification</span>
                        <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                          subject.classification === "Major"
                            ? "bg-blue-50 text-blue-700"
                            : subject.classification === "Minor"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-orange-50 text-orange-700"
                        }`}>
                          {subject.classification}
                        </span>
                      </div>
                    </div>

                    {subject.prerequisites.length > 0 && (
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Prerequisites</p>
                        <div className="flex flex-wrap gap-1">
                          {subject.prerequisites.map((prereq) => (
                            <span key={prereq} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {prereq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Usage</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <LayoutGrid className="w-3 h-3 text-gray-400" />
                          <span>{subject.sections} section(s)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>{subject.teachers} teacher(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Year / Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Usage</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{subject.code}</span>
                          <span className="text-xs text-gray-600">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{courses.find(c => c.name === subject.course)?.code || subject.course}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        Year {subject.year} / {subject.semester}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{subject.type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            subject.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {subject.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {subject.sections} sections · {subject.teachers} teacher(s)
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingSubject(subject);
                            setShowCreateModal(true);
                          }}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(subject.id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </div>
          )}
        </div>

        {/* Create/Edit Subject Modal */}
        {showCreateModal && (
          <CreateSubjectModal
            subject={editingSubject}
            courses={courses}
            years={years}
            semesters={semesters}
            allSubjects={subjects}
            onSave={handleCreateSubject}
            onClose={() => {
              setShowCreateModal(false);
              setEditingSubject(null);
            }}
            saving={saving}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmModal
            subject={subjectToDelete}
            onConfirm={handleDeleteSubject}
            onClose={() => {
              setShowDeleteModal(false);
              setSubjectToDelete(null);
            }}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function CreateSubjectModal({ subject, courses, years, semesters, allSubjects, onSave, onClose, saving }) {
  const [formData, setFormData] = useState(
    subject || {
      code: "",
      name: "",
      course: "",
      year: "",
      semester: "",
      units: 3,
      type: "Lecture",
      classification: "Major",
      prerequisites: [],
      sections: 0,
      teachers: 0,
      yearsUsed: [],
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const availablePrereqs = allSubjects.filter((s) => s.code !== formData.code);

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {subject ? "Edit Subject" : "Create New Subject"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., IT101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units / Credits</label>
                <input
                  type="number"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                  min="1"
                  max="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Introduction to Computing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Course & Schedule */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course & Schedule</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course / Program</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id.toString()}>
                      {course.name} - {course.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester / Term</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester.name} value={semester.name}>
                      {semester.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Subject Classification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Both">Both (Lecture & Lab)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
                <select
                  value={formData.classification}
                  onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                  <option value="Elective">Elective</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {availablePrereqs.length === 0 ? (
                <p className="text-sm text-gray-500">No other subjects available</p>
              ) : (
                availablePrereqs.map((prereq) => (
                  <label key={prereq.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.prerequisites.includes(prereq.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            prerequisites: [...formData.prerequisites, prereq.code],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            prerequisites: formData.prerequisites.filter((p) => p !== prereq.code),
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">
                      {prereq.code} - {prereq.name}
                    </span>
                  </label>
                ))
              )}
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
              {subject ? "Update Subject" : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ subject, onConfirm, onClose, saving }) {
  if (!subject) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Delete Subject</h2>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <strong>{subject.code} - {subject.name}</strong>? 
          This will remove the subject from all programs and schedules.
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
            Delete Subject
          </button>
        </div>
      </div>
    </div>
  );
}

export default Subjects;
