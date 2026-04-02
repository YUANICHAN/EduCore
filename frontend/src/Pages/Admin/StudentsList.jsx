import '../../App.css';
import { useState, useMemo, useEffect } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import Swal from 'sweetalert2';
import studentService from "../../service/studentService";
import programService from "../../service/programService";
import sectionService from "../../service/sectionService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Users,
  Mail,
  GraduationCap,
  Loader2,
  Filter,
  X,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  LayoutGrid,
  List,
  Save,
} from 'lucide-react';

function StudentsList() {
  const STUDENTS_LIST_VIEW_MODE_KEY = 'admin.studentsList.viewMode';
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

  const [activeItem, setActiveItem] = useState("Students List");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("student_number");
  const [sortDirection, setSortDirection] = useState("asc"); // asc or desc
  const [filterProgram, setFilterProgram] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEnrollmentStatus, setFilterEnrollmentStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'table';
    const savedMode = localStorage.getItem(STUDENTS_LIST_VIEW_MODE_KEY);
    return savedMode === 'grid' || savedMode === 'table' ? savedMode : 'table';
  }); // table or grid
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    section_id: '',
    profile_image: null,
    profile_image_url: null,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STUDENTS_LIST_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const queryClient = useQueryClient();

  // Fetch all students
  const studentsQuery = useQuery({
    queryKey: ['students', 'list', { page: currentPage, per_page: 1000 }],
    queryFn: () => studentService.getAll({
      per_page: 1000,
    }),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  // Fetch programs for filter
  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sections for filter
  const sectionsQuery = useQuery({
    queryKey: ['sections', 'filter-options'],
    queryFn: () => sectionService.getAll({ per_page: 'all' }),
    staleTime: 5 * 60 * 1000,
  });

  const programs = useMemo(() => {
    return programsQuery.data?.data || programsQuery.data || [];
  }, [programsQuery.data]);

  const sections = useMemo(() => {
    return sectionsQuery.data?.data || sectionsQuery.data || [];
  }, [sectionsQuery.data]);

  const students = useMemo(() => {
    return studentsQuery.data?.data || studentsQuery.data || [];
  }, [studentsQuery.data]);

  // Get total count from API pagination metadata
  const totalStudentsInDB = useMemo(() => {
    return studentsQuery.data?.total || students.length;
  }, [studentsQuery.data, students.length]);

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((student) => {
        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
        const studentNumber = (student.student_number || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return (
          fullName.includes(search) ||
          studentNumber.includes(search) ||
          email.includes(search)
        );
      });
    }

    // Program filter
    if (filterProgram) {
      filtered = filtered.filter((student) => {
        return String(student.program_id) === String(filterProgram) ||
               student.program?.id === parseInt(filterProgram);
      });
    }

    // Year level filter
    if (filterYear) {
      filtered = filtered.filter((student) => {
        return student.year_level === filterYear || student.grade_level === filterYear;
      });
    }

    // Section filter
    if (filterSection) {
      filtered = filtered.filter((student) => {
        return String(student.section_id || student.section?.id || '') === String(filterSection);
      });
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((student) => {
        return student.account_status === filterStatus;
      });
    }

    // Enrollment status filter
    if (filterEnrollmentStatus !== "all") {
      filtered = filtered.filter((student) => {
        const enrollmentStatus = student.enrollment_status || 'unassigned';
        return enrollmentStatus === filterEnrollmentStatus;
      });
    }

    return filtered;
  }, [students, searchTerm, filterProgram, filterYear, filterSection, filterStatus, filterEnrollmentStatus]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents];

    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "student_number":
          aValue = a.student_number || "";
          bValue = b.student_number || "";
          break;
        case "name":
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "program":
          aValue = a.program?.program_code || a.program?.program_name || "";
          bValue = b.program?.program_code || b.program?.program_name || "";
          break;
        case "year_level":
          aValue = a.year_level || a.grade_level || "";
          bValue = b.year_level || b.grade_level || "";
          break;
        case "section":
          aValue = a.section?.section_code || "";
          bValue = b.section?.section_code || "";
          break;
        default:
          aValue = "";
          bValue = "";
      }

      // Compare values
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredStudents, sortField, sortDirection]);

  // Pagination
  const totalStudents = sortedStudents.length;
  const totalPages = Math.ceil(totalStudents / entriesPerPage);
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with ascending order
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterProgram("");
    setFilterYear("");
    setFilterSection("");
    setFilterStatus("all");
    setFilterEnrollmentStatus("all");
    setCurrentPage(1);
  };

  // Helper function to render enrollment badge
  const renderEnrollmentBadge = (enrollmentStatus) => {
    const status = enrollmentStatus || 'unassigned';
    const badgeClass = status === 'enrolled'
      ? 'bg-blue-100 text-blue-800'
      : status === 'dropped'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-yellow-100 text-yellow-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Helper function to render account status badge
  const renderAccountBadge = (accountStatus) => {
    const badgeClass = accountStatus === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {accountStatus === 'active' ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Get profile image URL
  const getProfileImage = (student) => {
    return resolveImageUrl(student.profile_image || student.user?.profile_image);
  };

  // Open edit modal
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      section_id: student.section_id || '',
      student_number: student.student_number || '',
      program_id: student.program_id || '',
      year_level: student.year_level || student.grade_level || '',
      grade_level: student.grade_level || student.year_level || '',
      profile_image_url: resolveImageUrl(student.profile_image || student.user?.profile_image),
      profile_image: null,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Handle student delete
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
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete student',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle student update
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
        text: `Updated ${submissionData.first_name} ${submissionData.last_name} successfully`,
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

  const loading = studentsQuery.isLoading || studentsQuery.isFetching;

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Students List</h1>
                <p className="text-gray-600 mt-1">Complete list of all students with search and filters</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* View Mode Toggle */}
                <div className="bg-white border border-gray-300 rounded-lg p-1 flex items-center">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-1.5 rounded flex items-center space-x-1 transition-colors ${
                      viewMode === "table"
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span className="text-sm font-medium">Table</span>
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 rounded flex items-center space-x-1 transition-colors ${
                      viewMode === "grid"
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm font-medium">Grid</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            {students.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{totalStudentsInDB}</p>
                    </div>
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Filtered Results</p>
                      <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
                    </div>
                    <Filter className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Students</p>
                      <p className="text-2xl font-bold text-green-600">
                        {students.filter(s => s.account_status === 'active').length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">from loaded data</p>
                    </div>
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Inactive Students</p>
                      <p className="text-2xl font-bold text-red-600">
                        {students.filter(s => s.account_status !== 'active').length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">from loaded data</p>
                    </div>
                    <Users className="w-8 h-8 text-red-400" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, student number, or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`ml-4 px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors ${
                  showFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program
                    </label>
                    <select
                      value={filterProgram}
                      onChange={(e) => {
                        setFilterProgram(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Programs</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.program_code} - {program.program_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year Level
                    </label>
                    <select
                      value={filterYear}
                      onChange={(e) => {
                        setFilterYear(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Years</option>
                      {yearLevels.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <select
                      value={filterSection}
                      onChange={(e) => {
                        setFilterSection(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Sections</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.section_code || section.name || `Section ${section.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enrollment Status
                    </label>
                    <select
                      value={filterEnrollmentStatus}
                      onChange={(e) => {
                        setFilterEnrollmentStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Enrollment</option>
                      <option value="enrolled">Enrolled</option>
                      <option value="unassigned">Unassigned</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                </div>

                {(searchTerm || filterProgram || filterYear || filterSection || filterStatus !== "all" || filterEnrollmentStatus !== "all") && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Showing {totalStudents} result{totalStudents !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear all filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading students...</span>
              </div>
            ) : paginatedStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No students found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm || filterProgram || filterYear || filterSection || filterStatus !== "all" || filterEnrollmentStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "No students have been added yet"}
                </p>
              </div>
            ) : (
              <>
                {/* Top Pagination Info */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-700 flex items-center">
                      Show
                      <select
                        value={entriesPerPage}
                        onChange={(e) => {
                          setEntriesPerPage(Number(e.target.value));
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
                    {totalStudents !== totalStudentsInDB && (
                      <span className="text-gray-500 ml-1">(filtered from {totalStudentsInDB} total)</span>
                    )}
                  </span>
                </div>

                {/* Table View */}
                {viewMode === "table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Photo
                          </th>
                          <th
                            onClick={() => handleSort("student_number")}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              Student Number
                              {renderSortIcon("student_number")}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("name")}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              Name
                              {renderSortIcon("name")}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("email")}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              Email
                              {renderSortIcon("email")}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("program")}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              Program
                              {renderSortIcon("program")}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("year_level")}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              Year Level
                              {renderSortIcon("year_level")}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("section")}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              Section
                              {renderSortIcon("section")}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Enrollment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedStudents.map((student) => (
                          <tr
                            key={student.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="shrink-0 h-10 w-10">
                                {getProfileImage(student) ? (
                                  <img
                                    src={getProfileImage(student)}
                                    alt={`${student.first_name} ${student.last_name}`}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                      {`${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.student_number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate max-w-xs">{student.email || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                <span>{student.program?.program_code || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {student.year_level || student.grade_level || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {student.section?.section_code || (
                                <span className="text-yellow-600 font-medium">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderEnrollmentBadge(student.enrollment_status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderAccountBadge(student.account_status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2 sticky right-0 bg-white">
                              <button onClick={() => openEditModal(student)} className="inline-flex items-center justify-center p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Edit student"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => openDeleteModal(student)} className="inline-flex items-center justify-center p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors" title="Delete student"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                    {paginatedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Student Avatar and Name */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-12 w-12 rounded-full shrink-0 overflow-hidden">
                            {getProfileImage(student) ? (
                              <img
                                src={getProfileImage(student)}
                                alt={`${student.first_name} ${student.last_name}`}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {`${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {student.first_name} {student.last_name}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">{student.student_number || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Student Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                            <span className="truncate text-xs">{student.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <GraduationCap className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                            <span className="truncate">{student.program?.program_code || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-600">
                            <span className="text-xs">Year:</span>
                            <span className="font-medium">{student.year_level || student.grade_level || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-600">
                            <span className="text-xs">Section:</span>
                            <span className="font-medium">
                              {student.section?.section_code || (
                                <span className="text-yellow-600">Unassigned</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">Enrollment</span>
                            {renderEnrollmentBadge(student.enrollment_status)}
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <span className="text-xs text-gray-500">Account</span>
                            {renderAccountBadge(student.account_status)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center space-x-2">
                          <button onClick={() => openEditModal(student)} className="inline-flex items-center justify-center p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Edit student"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => openDeleteModal(student)} className="inline-flex items-center justify-center p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors" title="Delete student"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-center">
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
              </>
            )}
          </div>
        </div>

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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Student</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold">{selectedStudent?.first_name} {selectedStudent?.last_name}</span>? This action cannot be undone.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={formLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

export default StudentsList;


