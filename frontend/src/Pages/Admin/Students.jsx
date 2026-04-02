import '../../App.css';
import { useState, useMemo } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import Swal from 'sweetalert2';
import studentService from "../../service/studentService";
import programService from "../../service/programService";
import sectionService from "../../service/sectionService";
import academicYearService from "../../service/academicYearService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Grid3x3,
  List,
  Eye,
  MoreVertical,
  BookOpen,
  User,
  Mail,
  Award,
  LogOut,
  UserPlus,
  Filter,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  RefreshCw,
} from 'lucide-react';

function Students() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${backendOrigin}/${normalizedPath}`;
  };

  const [activeItem, setActiveItem] = useState("Assigned Students");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  // Drill-down navigation state
  const [drillDownLevel, setDrillDownLevel] = useState("programs");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  // Data from API
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_number: '',
    first_name: '',
    last_name: '',
    email: '',
    program_id: '',
    section_id: '',
    year_level: '',
    password: '',
    account_status: 'active',
    academic_year_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const programs = useMemo(() => {
    return programsQuery.data?.data || programsQuery.data || [];
  }, [programsQuery.data]);

  const currentAcademicYearQuery = useQuery({
    queryKey: ['academicYear', 'current'],
    queryFn: () => academicYearService.getCurrent(),
    staleTime: 5 * 60 * 1000,
  });

  const currentAcademicYear = useMemo(() => {
    return currentAcademicYearQuery.data?.data || currentAcademicYearQuery.data || null;
  }, [currentAcademicYearQuery.data]);

  const sectionsQuery = useQuery({
    queryKey: ['sections', { program_id: selectedProgram?.id, year_level: selectedYear }],
    queryFn: () => sectionService.getAll({
      program_id: selectedProgram?.id,
      year_level: selectedYear,
    }),
    enabled: !!selectedProgram && !!selectedYear,
    staleTime: 30 * 1000,
    refetchOnMount: true,
  });

  const sections = useMemo(() => {
    return sectionsQuery.data?.data || sectionsQuery.data || [];
  }, [sectionsQuery.data]);

  // Query for sections filtered by form data (for create/edit modals)
  const formSectionsQuery = useQuery({
    queryKey: ['sections', 'form', { program_id: formData.program_id, year_level: formData.year_level }],
    queryFn: () => sectionService.getAll({
      program_id: formData.program_id,
      year_level: formData.year_level,
    }),
    enabled: !!formData.program_id && !!formData.year_level,
    staleTime: 5 * 60 * 1000,
  });

  const formSections = useMemo(() => {
    return formSectionsQuery.data?.data || formSectionsQuery.data || [];
  }, [formSectionsQuery.data]);

  const studentsQuery = useQuery({
    queryKey: [
      'students',
      'assigned',
      {
        program_id: selectedProgram?.id,
        section_id: selectedSection?.id,
        search: searchTerm,
      },
    ],
    queryFn: () => studentService.getAll({
      per_page: 1000,
      ...(selectedProgram && { program_id: selectedProgram.id }),
      ...(selectedSection && { section_id: selectedSection.id }),
      ...(searchTerm && { search: searchTerm }),
    }),
    enabled: drillDownLevel === 'students' || !!searchTerm,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  const studentsData = studentsQuery.data;
  const students = useMemo(() => {
    return studentsData?.data || studentsData || [];
  }, [studentsData]);
  const normalizeYearValue = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/\d+/);
      if (match) return parseInt(match[0], 10);
      return value.trim().toLowerCase();
    }
    return value;
  };
  const filteredStudents = students.filter((student) => {
    const matchesSearch = !searchTerm
      || `${student.first_name || ''} ${student.last_name || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      || (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (student.student_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStanding =
      statusFilter === 'all'
      || (student.academic_standing || 'Good') === statusFilter;

    const matchesProgram =
      !selectedProgram
      || student.program_id === selectedProgram.id
      || student.program?.id === selectedProgram.id
      || (student.program?.program_code
        && student.program?.program_code === selectedProgram.program_code);

    const normalizedStudentYear = normalizeYearValue(student.year_level ?? student.grade_level);
    const normalizedSelectedYear = normalizeYearValue(selectedYear);
    const matchesYear =
      !selectedYear
      || normalizedStudentYear === normalizedSelectedYear
      || (typeof normalizedStudentYear === 'string'
        && typeof normalizedSelectedYear === 'string'
        && normalizedStudentYear === normalizedSelectedYear);

    const matchesSection =
      !selectedSection
      || student.section_id === selectedSection.id
      || student.section?.id === selectedSection.id
      || (student.section?.section_code
        && student.section?.section_code === selectedSection.section_code)
      || (student.section_code
        && student.section_code === selectedSection.section_code);

    return (
      matchesSearch
      && matchesStanding
      && matchesProgram
      && matchesYear
      && matchesSection
    );
  });
  const totalStudents = filteredStudents.length || 0;
  const loading = studentsQuery.isLoading || studentsQuery.isFetching;
  const error = studentsQuery.isError ? 'Failed to load students. Please try again.' : null;

  // Navigation handlers
  const navigateToPrograms = () => {
    setDrillDownLevel("programs");
    setSelectedProgram(null);
    setSelectedYear(null);
    setSelectedSection(null);
    setCurrentPage(1);
  };

  const navigateToYears = (program) => {
    setDrillDownLevel("years");
    setSelectedProgram(program);
    setSelectedYear(null);
    setSelectedSection(null);
    setCurrentPage(1);
  };

  const navigateToSections = (year) => {
    setDrillDownLevel("sections");
    setSelectedYear(year);
    setSelectedSection(null);
    setCurrentPage(1);
  };

  const navigateToStudents = (section) => {
    setDrillDownLevel("students");
    setSelectedSection(section);
    setCurrentPage(1);
  };

  // CRUD handlers
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    
    try {
      // Prepare data for submission, mapping frontend fields to backend expectations
      const submissionData = {
        ...formData,
        grade_level: formData.year_level, // Backend expects grade_level
        academic_year_id: currentAcademicYear?.id || formData.academic_year_id,
      };
      
      // Remove year_level as backend doesn't expect it
      delete submissionData.year_level;
      
      await studentService.create(submissionData);
      setShowCreateModal(false);
      setFormData({
        student_number: '',
        first_name: '',
        last_name: '',
        email: '',
        program_id: '',
        section_id: '',
        year_level: '',
        password: '',
        account_status: 'active',
        academic_year_id: '',
      });
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Student created successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create student');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    
    try {
      const submissionData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        section_id: formData.section_id,
      };

      if (formData.profile_image) {
        submissionData.profile_image = formData.profile_image;
      }

      await studentService.update(selectedStudent.id, submissionData);
      setShowEditModal(false);
      setSelectedStudent(null);
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Student updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      const firstFieldError = apiErrors
        ? Object.values(apiErrors)[0]?.[0]
        : null;
      setFormError(firstFieldError || err.response?.data?.message || 'Failed to update student');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    setFormLoading(true);
    try {
      await studentService.delete(selectedStudent.id);
      setShowDeleteModal(false);
      setSelectedStudent(null);
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Student deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      student_number: student.student_number || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      program_id: student.program_id || '',
      section_id: student.section_id || '',
      year_level: student.year_level || student.grade_level || '',
      grade_level: student.grade_level || student.year_level || '',
      academic_year: student.academic_year || student.academicYear?.year_code || '',
      profile_image_url: resolveImageUrl(student.profile_image || student.user?.profile_image),
      profile_image: null,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };
  // Year levels configuration
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const getAcademicStandingColor = (standing) => {
    switch (standing) {
      case "Excellent":
        return "bg-green-100 text-green-700";
      case "Good":
        return "bg-blue-100 text-blue-700";
      case "On Probation":
        return "bg-orange-100 text-orange-700";
      case "Dropped":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = (firstName || '').trim().charAt(0);
    const last = (lastName || '').trim().charAt(0);
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getProfileImage = (student) => {
    return resolveImageUrl(student.profile_image || student.user?.profile_image);
  };

  const totalPages = Math.ceil(totalStudents / entriesPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  // Loading state
  if (loading && drillDownLevel === 'programs' && programs.length === 0) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading students...</p>
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
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                <p className="text-gray-600 mt-1">Navigate through programs, years, and sections</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Student</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-2 flex-wrap gap-y-1">
              <span>Admin</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              {drillDownLevel === "programs" ? (
                <span className="text-gray-900 font-medium">Students</span>
              ) : (
                <button onClick={navigateToPrograms} className="hover:text-blue-600 transition-colors">Students</button>
              )}

              {selectedProgram && (
                <>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  {drillDownLevel === "years" ? (
                    <span className="text-gray-900 font-medium">{selectedProgram.program_code || selectedProgram.program_name}</span>
                  ) : (
                    <button
                      onClick={() => navigateToYears(selectedProgram)}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {selectedProgram.program_code || selectedProgram.program_name}
                    </button>
                  )}
                </>
              )}

              {selectedYear && (
                <>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  {drillDownLevel === "sections" ? (
                    <span className="text-gray-900 font-medium">{selectedYear}</span>
                  ) : (
                    <button
                      onClick={() => navigateToSections(selectedYear)}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {selectedYear}
                    </button>
                  )}
                </>
              )}

              {selectedSection && (
                <>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className="text-gray-900 font-medium">{selectedSection.section_code || 'Section'}</span>
                </>
              )}
            </div>
          </div>

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
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{program.program_code}</h3>
                      <p className="text-sm text-gray-600 mb-4">{program.program_name}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Total Students</span>
                        <span className="text-lg font-bold text-blue-600">{program.students_count || 0}</span>
                      </div>
                    </button>
                ))}
              </div>
            </div>
          )}

          {/* YEAR LEVELS VIEW */}
          {drillDownLevel === "years" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Year Level - {selectedProgram?.program_name}
                </h2>
                <span className="text-sm text-gray-600">
                  {yearLevels.length} year levels
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {yearLevels.map((year) => (
                    <button
                      key={year}
                      onClick={() => navigateToSections(year)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl font-bold text-purple-600 group-hover:bg-purple-200 transition-colors">
                          {year.charAt(0)}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{year}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                          <span className="text-gray-600">View Sections</span>
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    </button>
                ))}
              </div>
            </div>
          )}

          {/* SECTIONS VIEW */}
          {drillDownLevel === "sections" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Section - {selectedProgram?.program_code} {selectedYear}
                </h2>
                <span className="text-sm text-gray-600">
                  {sections.length} sections available
                </span>
              </div>
              {sections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => navigateToStudents(section)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{section.section_code}</h3>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Students</span>
                        <span className="text-2xl font-bold text-blue-600">{section.students_count || 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No sections found for this program and year level</p>
                </div>
              )}
            </div>
          )}

          {/* STUDENTS VIEW */}
          {drillDownLevel === "students" && (
            <div>
              {/* Search and Filters */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, student number..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  {/* Academic Standing Filter */}
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Standing</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="On Probation">On Probation</option>
                      <option value="Dropped">Dropped</option>
                    </select>
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "grid"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "table"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Table View"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Top Pagination Bar */}
              {drillDownLevel === "students" && totalStudents > 0 && (
                <div className="bg-gray-50 px-6 py-4 border border-gray-200 rounded-lg mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-700 flex items-center">
                      Show
                      <select
                        value={entriesPerPage}
                        onChange={(e) => {
                          setEntriesPerPage(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="mx-2 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      entries
                    </label>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    Showing {(currentPage - 1) * entriesPerPage + 1} to{' '}
                    {Math.min(currentPage * entriesPerPage, totalStudents)} of {totalStudents} students
                  </span>
                </div>
              )}

              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {paginatedStudents.map((student) => {
                    const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
                    const studentNumber = student.student_number || 'N/A';
                    const academicStanding = student.academic_standing || 'Good Standing';
                    const programCode = student.program?.program_code || 'N/A';
                    const sectionCode = student.section?.section_code || 'N/A';
                    const yearLevel = student.year_level || student.grade_level || 'N/A';
                    const accountStatus = student.account_status || 'active';
                    const enrollmentStatus = student.enrollment_status || 'unassigned';

                    return (
                      <div
                        key={student.id}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
                      >
                        <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
                          <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold tracking-wide">STUDENT ID</h1>
                            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-medium">{academicStanding}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            <div className="w-24 h-24 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center overflow-hidden">
                              {getProfileImage(student) ? (
                                <img
                                  src={getProfileImage(student)}
                                  alt={studentName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-12 h-12 text-white/80" />
                              )}
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold mb-1">{studentName}</h2>
                              <p className="text-blue-100 text-sm font-medium">{studentNumber}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="Program" value={programCode} />
                            <InfoItem label="Year Level" value={yearLevel} />
                            <InfoItem label="Section" value={sectionCode} />
                          </div>

                          <div className="flex gap-2 flex-wrap pt-2">
                            <div className="flex-1 min-w-fit">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Account</span>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                accountStatus === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {accountStatus === 'active' ? '✓ Active' : '✗ Inactive'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-fit">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Enrollment</span>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                enrollmentStatus !== 'unassigned' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {enrollmentStatus === 'unassigned' ? '○ Unassigned' : '● Enrolled'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm font-medium">Email</span>
                            </div>
                            <p className="text-slate-900 mt-1 text-sm break-all">
                              {student.email || 'N/A'}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4" />
                              <span>EduCore University</span>
                            </div>
                            <span>Valid 2024-2025</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(student)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(student)}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table View */}
              {viewMode === "table" && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Year Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Gender
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Section
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Standing
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Account Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Enrollment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-gray-700">
                                  {getProfileImage(student) ? (
                                    <img
                                      src={getProfileImage(student)}
                                      alt={`${student.first_name} ${student.last_name}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    getInitials(student.first_name, student.last_name)
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                                  <p className="text-xs text-gray-600">{student.student_number}</p>
                                  <p className="text-xs text-gray-500">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.program?.program_code || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.year_level || student.grade_level || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.gender || 'N/A'}</td>
                            <td className="px-6 py-4">
                              {student.section ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {student.section?.section_code || 'N/A'}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getAcademicStandingColor(
                                  student.academic_standing
                                )}`}
                              >
                                {student.academic_standing || 'Good'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  (student.account_status || 'active') === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {student.account_status === 'active' ? '✓ Active' : '✗ Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  (student.enrollment_status || 'unassigned') !== 'unassigned'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {(student.enrollment_status || 'unassigned') === 'unassigned' ? '○ Unassigned' : '● Enrolled'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => openEditModal(student)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                  <Eye className="w-4 h-4 text-purple-600" />
                                </button>
                                <button 
                                  onClick={() => openDeleteModal(student)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {totalStudents === 0 && !loading && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No students found matching your filters</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-4 border border-gray-200 rounded-lg flex items-center justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Student Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Create New Student</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateStudent} className="p-4 space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm">
                  <p className="font-medium">Workflow Note:</p>
                  <p>After creating a student account, use the <strong>Enrollment</strong> page to assign them to classes.</p>
                </div>
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{formError}</div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.student_number}
                        onChange={(e) => setFormData({...formData, student_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        minLength="6"
                        placeholder="Enter login password (min 6 characters)"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">This will be used for student login</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                      <select
                        required
                        value={formData.program_id}
                        onChange={(e) => setFormData({...formData, program_id: e.target.value, section_id: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Program</option>
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.program_code}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                      <select
                        value={formData.section_id}
                        onChange={(e) => setFormData({...formData, section_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!formData.program_id || !formData.year_level}
                      >
                        <option value="">No Section (Unassigned)</option>
                        {formSections.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.section_code || s.section_name || `Section ${s.id}`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {!formData.program_id || !formData.year_level 
                          ? 'Select program and year level first'
                          : formSections.length === 0 
                            ? 'No sections available' 
                            : `${formSections.length} section(s) available`}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                      <input
                        id="createStudentPhoto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({...formData, profile_image: e.target.files[0]})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: Upload student photo (JPG, PNG, WEBP up to 10MB)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                      <select
                        required
                        value={formData.year_level}
                        onChange={(e) => setFormData({...formData, year_level: e.target.value, section_id: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Year</option>
                        {yearLevels.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column - Picture Preview */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      {formData.profile_image ? (
                        <img 
                          src={URL.createObjectURL(formData.profile_image)} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500 mb-3">Photo Preview</p>
                          <button
                            type="button"
                            onClick={() => document.getElementById('createStudentPhoto').click()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Upload Photo
                          </button>
                          <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                    {formData.profile_image && (
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, profile_image: null})}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Create Student</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateStudent} className="p-4 space-y-4">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{formError}</div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                      <input
                        type="text"
                        value={formData.student_number || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Student number cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                      <input
                        type="text"
                        value={formData.program?.program_name || formData.program_id || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Program cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                      <input
                        type="text"
                        value={formData.academic_year || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Academic year cannot be changed</p>
                    </div>
                  </div>

                  {/* Middle Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                      <input
                        id="editStudentPhoto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({...formData, profile_image: e.target.files[0]})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: Update student photo (JPG, PNG, WEBP up to 10MB)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                      <input
                        type="text"
                        value={formData.grade_level || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Grade level cannot be changed</p>
                    </div>
                  </div>

                  {/* Right Column - Picture Preview */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      {formData.profile_image ? (
                        <img 
                          src={URL.createObjectURL(formData.profile_image)} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : formData.profile_image_url ? (
                        <img 
                          src={formData.profile_image_url} 
                          alt="Current Profile" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500 mb-3">Photo Preview</p>
                          <button
                            type="button"
                            onClick={() => document.getElementById('editStudentPhoto').click()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Upload Photo
                          </button>
                          <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                    {(formData.profile_image || formData.profile_image_url) && (
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, profile_image: null, profile_image_url: null})}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Student</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{selectedStudent?.first_name} {selectedStudent?.last_name}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStudent}
                    disabled={formLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Delete</span>
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

export default Students;

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
      <p className="text-slate-900 font-semibold">{value}</p>
    </div>
  );
}
