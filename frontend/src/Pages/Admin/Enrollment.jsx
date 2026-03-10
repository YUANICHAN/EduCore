import '../../App.css';
import { useMemo, useState } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import programService from "../../service/programService";
import sectionService from "../../service/sectionService";
import classService from "../../service/classService";
import enrollmentService from "../../service/enrollmentService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  GraduationCap,
  Home,
  UserPlus,
} from 'lucide-react';

function Enrollment() {
  const [activeItem, setActiveItem] = useState("Enrollment");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const queryClient = useQueryClient();

  // Drill-down navigation state
  const [drillDownLevel, setDrillDownLevel] = useState("programs");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [savingEnrollment, setSavingEnrollment] = useState(false);
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
  const [bulkEnrolling, setBulkEnrolling] = useState(false);

  // Year level options
  const yearLevels = [1, 2, 3, 4];

  // Convert year number to grade_level string
  const getGradeLevelString = (yearNum) => {
    if (!yearNum) return null;
    const suffixes = ['st', 'nd', 'rd', 'th'];
    const suffix = suffixes[yearNum - 1] || 'th';
    return `${yearNum}${suffix} Year`;
  };

  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const programs = useMemo(() => {
    return programsQuery.data?.data || programsQuery.data || [];
  }, [programsQuery.data]);

  const sectionsQuery = useQuery({
    queryKey: ['sections', { program_id: selectedProgram?.id, year_level: selectedYear }],
    queryFn: () => sectionService.getAll({
      program_id: selectedProgram?.id,
      year_level: getGradeLevelString(selectedYear),
    }),
    enabled: !!selectedProgram && !!selectedYear,
    staleTime: 30 * 1000,
    refetchOnMount: true,
  });

  const sections = useMemo(() => {
    return sectionsQuery.data?.data || sectionsQuery.data || [];
  }, [sectionsQuery.data]);

  const classesQuery = useQuery({
    queryKey: ['classes', { section_id: selectedSection?.id }],
    queryFn: () => classService.getAll({ section_id: selectedSection?.id }),
    enabled: !!selectedSection,
    staleTime: 5 * 60 * 1000,
  });

  const classes = useMemo(() => {
    return classesQuery.data?.data || classesQuery.data || [];
  }, [classesQuery.data]);

  const enrolledStudentsQuery = useQuery({
    queryKey: ['classStudents', selectedClass?.id],
    queryFn: () => classService.getStudents(selectedClass?.id),
    enabled: !!selectedClass,
    staleTime: 30 * 1000,
  });

  const sectionStudentsQuery = useQuery({
    queryKey: ['sectionStudents', selectedSection?.id],
    queryFn: () => sectionService.getStudents(selectedSection?.id),
    enabled: !!selectedSection,
    staleTime: 30 * 1000,
  });

  const enrolledStudents = useMemo(() => {
    const data = enrolledStudentsQuery.data?.data || enrolledStudentsQuery.data || [];
    // Extract student data from enrollment records
    return data.map(enrollment => enrollment.student || enrollment).filter(s => s);
  }, [enrolledStudentsQuery.data]);

  const availableStudents = useMemo(() => {
    const allStudents = sectionStudentsQuery.data?.data || sectionStudentsQuery.data || [];
    const enrolledIds = new Set(enrolledStudents.map(s => s.id));
    return allStudents.filter(s => !enrolledIds.has(s.id));
  }, [sectionStudentsQuery.data, enrolledStudents]);

  const loading = programsQuery.isLoading
    || sectionsQuery.isLoading
    || classesQuery.isLoading
    || enrolledStudentsQuery.isLoading
    || sectionStudentsQuery.isLoading;

  const fetchError = programsQuery.isError
    ? 'Failed to load programs'
    : sectionsQuery.isError
      ? 'Failed to load sections'
      : classesQuery.isError
        ? 'Failed to load classes'
        : enrolledStudentsQuery.isError || sectionStudentsQuery.isError
          ? 'Failed to load students'
          : null;

  const displayError = error || fetchError;

  // Navigation handlers
  const navigateToYears = (program) => {
    setDrillDownLevel("years");
    setSelectedProgram(program);
    setSelectedYear(null);
    setSelectedSection(null);
    setSelectedClass(null);
  };

  const navigateToSections = (year) => {
    setDrillDownLevel("sections");
    setSelectedYear(year);
    setSelectedSection(null);
    setSelectedClass(null);
  };

  const navigateToClasses = (section) => {
    setDrillDownLevel("classes");
    setSelectedSection(section);
    setSelectedClass(null);
  };

  const navigateToStudents = (cls) => {
    setDrillDownLevel("students");
    setSelectedClass(cls);
  };

  const goBack = () => {
    if (drillDownLevel === "years") {
      setDrillDownLevel("programs");
      setSelectedProgram(null);
    } else if (drillDownLevel === "sections") {
      setDrillDownLevel("years");
      setSelectedYear(null);
    } else if (drillDownLevel === "classes") {
      setDrillDownLevel("sections");
      setSelectedSection(null);
    } else if (drillDownLevel === "students") {
      setDrillDownLevel("classes");
      setSelectedClass(null);
    }
  };

  const handleEnrollStudents = async () => {
    if (!selectedClass || selectedStudents.size === 0) {
      setError('Please select students to enroll');
      return;
    }

    setSavingEnrollment(true);
    setError(null);
    setSuccess(null);

    try {
      const studentIds = Array.from(selectedStudents);
      await enrollmentService.bulkEnroll({
        class_id: selectedClass.id,
        student_ids: studentIds,
      });

      setSuccess(`Successfully enrolled ${studentIds.length} student(s)`);
      setSelectedStudents(new Set());
      setShowEnrollModal(false);

      await queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClass?.id] });
      await queryClient.invalidateQueries({ queryKey: ['sectionStudents', selectedSection?.id] });

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll students');
    } finally {
      setSavingEnrollment(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClass) return;

    try {
      await enrollmentService.remove(studentId, selectedClass.id);
      setSuccess('Student removed from class');

      await queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClass?.id] });
      await queryClient.invalidateQueries({ queryKey: ['sectionStudents', selectedSection?.id] });

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to remove student');
    }
  };

  const toggleStudentSelection = (studentId) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudents(newSet);
  };

  const selectAllAvailableStudents = () => {
    if (selectedStudents.size === availableStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(availableStudents.map(s => s.id)));
    }
  };

  const handleBulkEnrollAllSectionStudents = async () => {
    if (!selectedClass || !selectedSection) return;

    setBulkEnrolling(true);
    setError(null);
    setSuccess(null);

    try {
      const sectionStudents = sectionStudentsQuery.data?.data || sectionStudentsQuery.data || [];
      const enrolledIds = new Set(enrolledStudents.map(s => s.id));
      const studentsToEnroll = sectionStudents.filter(s => !enrolledIds.has(s.id));

      if (studentsToEnroll.length === 0) {
        setError('All section students are already enrolled in this class');
        setShowBulkEnrollModal(false);
        setBulkEnrolling(false);
        return;
      }

      await enrollmentService.bulkEnroll({
        class_id: selectedClass.id,
        student_ids: studentsToEnroll.map(s => s.id),
      });

      setSuccess(`Successfully enrolled ${studentsToEnroll.length} student(s) from section`);
      setShowBulkEnrollModal(false);

      await queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClass?.id] });
      await queryClient.invalidateQueries({ queryKey: ['sectionStudents', selectedSection?.id] });

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bulk enroll students');
    } finally {
      setBulkEnrolling(false);
    }
  };

  const filteredAvailableStudents = availableStudents.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const capacityPercentage = selectedClass
    ? Math.round((enrolledStudents.length / selectedClass.capacity) * 100)
    : 0;

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Enrollment</h1>
            <p className="text-gray-600 mt-1">Manage student enrollments in classes</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">How Enrollment Works</h3>
                <p className="text-sm text-blue-800">
                  <strong>Student → Section → Class</strong> hierarchy: Students are first assigned to a section in the Students page, 
                  then individually enrolled in each class within that section. Use the "Bulk Enroll All Section Students" button 
                  to quickly enroll all section students at once.
                </p>
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => {
                setDrillDownLevel("programs");
                setSelectedProgram(null);
                setSelectedYear(null);
                setSelectedSection(null);
                setSelectedClass(null);
              }}
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Enrollment
            </button>
            {selectedProgram && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-lg">
                  {selectedProgram.program_name}
                </span>
              </>
            )}
            {selectedYear && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 font-semibold rounded-lg">
                  Year {selectedYear}
                </span>
              </>
            )}
            {selectedSection && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1.5 bg-green-100 text-green-700 font-semibold rounded-lg">
                  {selectedSection.section_code}
                </span>
              </>
            )}
            {selectedClass && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 font-semibold rounded-lg">
                  {selectedClass.class_code}
                </span>
              </>
            )}
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">{success}</h3>
              </div>
            </div>
          )}

          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">{displayError}</h3>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* PROGRAMS VIEW */}
              {drillDownLevel === "programs" && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Select a Program</h2>
                    <span className="text-sm text-gray-600">{programs.length} programs available</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.map((program) => (
                      <button
                        key={program.id}
                        onClick={() => navigateToYears(program)}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{program.program_code}</h3>
                        <p className="text-sm text-gray-600 mb-4">{program.program_name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* YEAR LEVELS VIEW */}
              {drillDownLevel === "years" && selectedProgram && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={goBack}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Select Year Level - {selectedProgram.program_name}
                    </h2>
                    <span className="text-sm text-gray-600">{yearLevels.length} year levels</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {yearLevels.map((year) => (
                      <button
                        key={year}
                        onClick={() => navigateToSections(year)}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-purple-300 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl font-bold text-purple-600 group-hover:bg-purple-200 transition-colors">
                            {year}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Year {year}</h3>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTIONS VIEW */}
              {drillDownLevel === "sections" && selectedProgram && selectedYear && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={goBack}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Select Section - Year {selectedYear}
                    </h2>
                    <span className="text-sm text-gray-600">{sections.length} sections available</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => navigateToClasses(section)}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-green-300 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{section.section_code}</h3>
                        <p className="text-sm text-gray-600">{section.section_name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CLASSES VIEW */}
              {drillDownLevel === "classes" && selectedSection && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={goBack}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Select Class - {selectedSection.section_code}
                    </h2>
                    <span className="text-sm text-gray-600">{classes.length} classes available</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => navigateToStudents(cls)}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-orange-300 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                            <BookOpen className="w-6 h-6 text-orange-600" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{cls.class_code}</h3>
                        <p className="text-sm text-gray-600 mb-4">{cls.subject?.subject_name}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-600">Capacity</span>
                          <span className="text-lg font-bold text-orange-600">{cls.enrollments_count || 0}/{cls.capacity || 30}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDENT ENROLLMENT VIEW */}
              {drillDownLevel === "students" && selectedClass && (
                <div className="space-y-6">
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={goBack}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Manage Students - {selectedClass.class_code}
                    </h2>
                  </div>

                  {/* Class Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Subject</h3>
                      </div>
                      <p className="text-lg text-gray-900">{selectedClass.subject?.subject_name}</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">Capacity</h3>
                      </div>
                      <p className="text-lg text-gray-900">{enrolledStudents.length}/{selectedClass.capacity}</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${capacityPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{capacityPercentage}% Full</p>
                    </div>
                  </div>

                  {/* Bulk Enroll Button */}
                  {availableStudents.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowBulkEnrollModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        <UserPlus className="w-4 h-4" />
                        Bulk Enroll All Section Students ({availableStudents.length})
                      </button>
                    </div>
                  )}

                  {/* Two Column Layout: Available and Enrolled Students */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Available Students */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Available Students ({filteredAvailableStudents.length})
                        </h3>
                        <button
                          onClick={selectAllAvailableStudents}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {selectedStudents.size === availableStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredAvailableStudents.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">No available students</p>
                        ) : (
                          filteredAvailableStudents.map((student) => (
                            <label key={student.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                                <p className="text-sm text-gray-600">{student.student_number}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>

                      {selectedStudents.size > 0 && (
                        <button
                          onClick={() => setShowEnrollModal(true)}
                          className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Enroll Selected ({selectedStudents.size})</span>
                        </button>
                      )}
                    </div>

                    {/* Enrolled Students */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Enrolled Students ({enrolledStudents.length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {enrolledStudents.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">No enrolled students</p>
                        ) : (
                          enrolledStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                                <p className="text-sm text-gray-600">{student.student_number}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="text-red-600 hover:text-red-700 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bulk Enroll Modal */}
          {showBulkEnrollModal && (
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Bulk Enroll Section Students</h3>
                  <button onClick={() => setShowBulkEnrollModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      This will enroll <strong>all {availableStudents.length} available students</strong> from section <strong>{selectedSection?.section_code}</strong> into class <strong>{selectedClass?.class_code}</strong>.
                    </p>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Students already enrolled will be skipped. This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowBulkEnrollModal(false)}
                      disabled={bulkEnrolling}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkEnrollAllSectionStudents}
                      disabled={bulkEnrolling}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {bulkEnrolling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Enroll All ({availableStudents.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enrollment Modal */}
          {showEnrollModal && (
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Enrollment</h3>
                  <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-gray-600">
                    Enroll <strong>{selectedStudents.size}</strong> student(s) to <strong>{selectedClass.class_code}</strong>?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEnrollModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEnrollStudents}
                      disabled={savingEnrollment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {savingEnrollment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <span>Enroll</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Enrollment;
