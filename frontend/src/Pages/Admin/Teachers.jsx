import '../../App.css';
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import teacherService from "../../service/teacherService";
import departmentService from "../../service/departmentService";
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
  Mail,
  Users,
  Calendar,
  Briefcase,
  GraduationCap,
  Clock,
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

function Teachers() {
  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;
    if (imagePath.startsWith('blob:')) return imagePath;
    const backendOrigin = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${backendOrigin}/${cleanPath}`;
  };

  const [activeItem, setActiveItem] = useState("Teachers");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [drillDownLevel, setDrillDownLevel] = useState("departments");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedEmployment, setSelectedEmployment] = useState(null);

  const [loadFilter, setLoadFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    employee_number: '',
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    employment_status: 'active',
    max_load: 24,
    password: '',
    status: 'active',
    profile_image_url: null,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fallbackDepartments = useMemo(() => (
    [
      { name: 'Computer Studies', color: 'blue' },
      { name: 'Business Administration', color: 'emerald' },
      { name: 'Hospitality Management', color: 'amber' },
      { name: 'General Education', color: 'purple' },
    ]
  ), []);

  const fallbackEmploymentTypes = useMemo(() => (
    [
      { type: 'active', label: 'Active', color: 'green' },
      { type: 'on_leave', label: 'On Leave', color: 'yellow' },
      { type: 'inactive', label: 'Inactive', color: 'gray' },
    ]
  ), []);

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const teachersQuery = useQuery({
    queryKey: ['teachers', { all: true }],
    queryFn: () => teacherService.getAll({ per_page: 1000 }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  const teachersData = teachersQuery.data;
  const teachers = useMemo(() => {
    if (!teachersData) return [];
    if (Array.isArray(teachersData)) return teachersData;
    if (Array.isArray(teachersData.data)) return teachersData.data;
    if (Array.isArray(teachersData?.data?.data)) return teachersData.data.data;
    return [];
  }, [teachersData]);

  const toTitle = (value) => {
    if (!value) return '';
    return value
      .toString()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const departments = useMemo(() => {
    // First try to get departments from the API
    const apiDepartments = departmentsQuery.data?.data || departmentsQuery.data || [];
    if (apiDepartments.length > 0) {
      return apiDepartments
        .filter(d => d.status === 'active')
        .map(d => ({
          id: d.id,
          name: d.name,
          color: d.color || 'blue',
        }));
    }

    // Fallback to unique departments from teachers if API empty
    const unique = [...new Set(teachers.map((teacher) => teacher.department?.name).filter(Boolean))];
    if (unique.length === 0) return fallbackDepartments;

    return unique.map((name, index) => ({
      id: null,
      name,
      color: fallbackDepartments[index % fallbackDepartments.length].color,
    }));
  }, [departmentsQuery.data, teachers, fallbackDepartments]);

  const employmentTypes = useMemo(() => {
    const unique = [...new Set(
      teachers
        .map((teacher) => teacher.employment_status || teacher.employmentStatus)
        .filter(Boolean)
    )];

    if (unique.length === 0) return fallbackEmploymentTypes;

    return unique.map((type, index) => ({
      type,
      label: toTitle(type),
      color: fallbackEmploymentTypes[index % fallbackEmploymentTypes.length].color,
    }));
  }, [teachers, fallbackEmploymentTypes]);

  const departmentCounts = useMemo(() => {
    return teachers.reduce((acc, teacher) => {
      const department = teacher.department?.name || 'Not Assigned';
      const employment = teacher.employment_status || teacher.employmentStatus || 'active';

      if (!acc[department]) {
        acc[department] = { total: 0 };
      }

      acc[department].total += 1;
      acc[department][employment] = (acc[department][employment] || 0) + 1;

      return acc;
    }, {});
  }, [teachers]);

  const loading = teachersQuery.isLoading || teachersQuery.isFetching;
  const error = teachersQuery.isError ? 'Failed to load teachers. Please try again.' : null;

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher?.id) {
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      await teacherService.delete(selectedTeacher.id);
      setShowDeleteModal(false);
      setSelectedTeacher(null);
      await queryClient.invalidateQueries({ queryKey: ['teachers'] });
      await queryClient.invalidateQueries({ queryKey: ['teachers', 'all'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Teacher deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_number: '',
      first_name: '',
      last_name: '',
      email: '',
      department_id: '',
      employment_status: 'active',
      max_load: 24,
      password: '',
      status: 'active',
      profile_image_url: null,
    });
    setFormError(null);
  };

  const handleCreateTeacher = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await teacherService.create(formData);
      setShowCreateModal(false);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['teachers'] });
      await queryClient.invalidateQueries({ queryKey: ['teachers', 'all'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Teacher created successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTeacher = async (event) => {
    event.preventDefault();
    if (!selectedTeacher?.id) {
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      // Only send editable fields
      const submissionData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        department_id: formData.department_id,
        employment_status: formData.employment_status,
        max_load: formData.max_load,
      };

      // Add profile_image only if a new file was selected
      if (formData.profile_image) {
        submissionData.profile_image = formData.profile_image;
      }

      await teacherService.update(selectedTeacher.id, submissionData);
      setShowEditModal(false);
      setSelectedTeacher(null);
      await queryClient.invalidateQueries({ queryKey: ['teachers'] });
      await queryClient.invalidateQueries({ queryKey: ['teachers', 'all'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Teacher updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      const firstFieldError = apiErrors
        ? Object.values(apiErrors)[0]?.[0]
        : null;
      setFormError(firstFieldError || err.response?.data?.message || 'Failed to update teacher');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    const imagePath = teacher.profile_image || teacher.user?.profile_image;
    setFormData({
      employee_number: teacher.employee_number || '',
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      email: teacher.email || '',
      department_id: teacher.department?.id || teacher.department_id || '',
      employment_status: teacher.employment_status || 'active',
      max_load: teacher.max_load || 24,
      profile_image_url: resolveImageUrl(imagePath),
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormError(null);
    setShowDeleteModal(true);
  };

  // Breadcrumb navigation handlers
  const navigateToDepartments = () => {
    setDrillDownLevel("departments");
    setSelectedDepartment(null);
    setSelectedEmployment(null);
    setCurrentPage(1);
  };

  const navigateToTeachers = (department) => {
    setDrillDownLevel("teachers");
    setSelectedDepartment(department);
    setSelectedEmployment(null);
    setCurrentPage(1);
  };

  // Count teachers per department (from API data)
  const getDepartmentTeacherCount = (department) => {
    return departmentCounts[department]?.total || 0;
  };


  const getEmploymentStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "on_leave":
        return "bg-yellow-100 text-yellow-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getLoadStatusColor = (current, max) => {
    const percentage = ((current || 0) / (max || 24)) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getInitials = (firstName, lastName) => {
    const first = (firstName || '').trim().charAt(0);
    const last = (lastName || '').trim().charAt(0);
    return `${first}${last}`.toUpperCase() || 'T';
  };

  const getProfileImage = (teacher) => {
    const imagePath = teacher.profile_image || teacher.user?.profile_image || null;
    return resolveImageUrl(imagePath);
  };

  // Filter teachers for display (client-side filtering for load)
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = !searchTerm
      || `${teacher.first_name || ''} ${teacher.last_name || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      || (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (teacher.employee_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !selectedDepartment || teacher.department?.name === selectedDepartment;
    const employmentValue = teacher.employment_status || teacher.employmentStatus || 'active';
    const matchesEmployment = !selectedEmployment || employmentValue === selectedEmployment;

    let matchesLoad = true;
    const current = teacher.teaching_load || teacher.teachingLoad || 0;
    const max = teacher.max_load || teacher.maxLoad || 24;
    
    if (loadFilter === "light") {
      const percentage = (current / max) * 100;
      matchesLoad = percentage < 60;
    } else if (loadFilter === "moderate") {
      const percentage = (current / max) * 100;
      matchesLoad = percentage >= 60 && percentage < 85;
    } else if (loadFilter === "heavy") {
      const percentage = (current / max) * 100;
      matchesLoad = percentage >= 85;
    }

    return matchesSearch && matchesDepartment && matchesEmployment && matchesLoad;
  });

  const totalPages = Math.ceil(filteredTeachers.length / entriesPerPage);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  // Loading state for initial load
  if (loading && teachers.length === 0 && drillDownLevel === "teachers") {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading teachers...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
                <p className="text-gray-600 mt-1">Navigate through departments and view teachers</p>
              </div>
              <button 
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Teacher</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex items-center space-x-2 text-sm flex-wrap">
              <button
                onClick={navigateToDepartments}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                  drillDownLevel === "departments"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Teachers</span>
              </button>

              {selectedDepartment && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => navigateToTeachers(selectedDepartment)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      drillDownLevel === "teachers"
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {selectedDepartment}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DEPARTMENTS VIEW */}
          {drillDownLevel === "departments" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Select a Department</h2>
                <span className="text-sm text-gray-600">{departments.length} departments available</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {departments.map((dept) => {
                  const teacherCount = getDepartmentTeacherCount(dept.name);
                  return (
                    <button
                      key={dept.name}
                      onClick={() => navigateToTeachers(dept.name)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-${dept.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${dept.color}-200 transition-colors`}>
                          <Building2 className={`w-6 h-6 text-${dept.color}-600`} />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{dept.name}</h3>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Teachers</span>
                        <span className="text-2xl font-bold text-blue-600">{teacherCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TEACHERS VIEW */}
          {drillDownLevel === "teachers" && (
            <div>
              {/* Search and Filters */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  {/* Search */}
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, employee number..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  {/* Employment Status Filter */}
                  <div>
                    <select
                      value={selectedEmployment || 'all'}
                      onChange={(e) => {
                        setSelectedEmployment(e.target.value === 'all' ? null : e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Status</option>
                      {employmentTypes.map((employment) => (
                        <option key={employment.type} value={employment.type}>{employment.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Teaching Load Filter */}
                  <div>
                    <select
                      value={loadFilter}
                      onChange={(e) => {
                        setLoadFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Load</option>
                      <option value="light">Light (&lt;60%)</option>
                      <option value="moderate">Moderate (60-85%)</option>
                      <option value="heavy">Heavy (&gt;85%)</option>
                    </select>
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <select
                      value={entriesPerPage}
                      onChange={(e) => {
                        setEntriesPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={40}>40</option>
                      <option value={80}>80</option>
                    </select>
                    <span className="text-sm text-gray-600">entries</span>
                  </div>

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
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "list"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title="List View"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mt-4">
                  Showing {paginatedTeachers.length} of {filteredTeachers.length} teachers
                  {loading && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
                </div>
              </div>

              {/* Teachers Grid/List */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {paginatedTeachers.map((teacher) => {
                    const teacherName = teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
                    const employmentStatus = teacher.employment_status || teacher.employmentStatus || 'full-time';
                    const teachingLoad = teacher.teaching_load || teacher.teachingLoad || 0;
                    const maxLoad = teacher.max_load || teacher.maxLoad || 24;
                    const subjects = teacher.subjects || [];
                    const sections = teacher.sections || [];
                    const loadPercentage = Math.min((teachingLoad / maxLoad) * 100, 100) || 0;
                    const initials = getInitials(teacher.first_name, teacher.last_name);
                    const statusLabel = employmentStatus
                      ? employmentStatus.charAt(0).toUpperCase() + employmentStatus.slice(1).replace('-', ' ')
                      : 'Active';
                    const isActive = employmentStatus === 'active' || employmentStatus === 'full-time';

                    return (
                      <div key={teacher.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 pt-6 pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                              {statusLabel}
                            </span>
                            <span className="text-xs font-medium text-gray-500">ACLC College</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="relative">
                              <div className="w-32 h-32 rounded-lg bg-linear-to-br from-blue-400 to-indigo-500 p-1">
                                <div className="w-full h-full rounded-lg bg-white flex items-center justify-center overflow-hidden">
                                  {getProfileImage(teacher) ? (
                                    <img
                                      src={getProfileImage(teacher)}
                                      alt={teacherName}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-600 rounded-lg">
                                      {initials}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <h2 className="mt-4 text-2xl font-bold text-gray-900">{teacherName}</h2>
                            <p className="text-sm font-medium text-indigo-600 mt-1">{teacher.department?.name || 'Not Assigned'}</p>
                          </div>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-gray-600 truncate">{teacher.email || 'No email provided'}</span>
                          </div>

                          <div className="border-t border-gray-100"></div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">Teaching Load</p>
                                <p className="text-sm font-semibold text-gray-900">{teachingLoad}/{maxLoad} units</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                                <span className="text-xs font-medium text-purple-900">Subjects</span>
                              </div>
                              <p className="text-2xl font-bold text-purple-900">{subjects.length}</p>
                              <p className="text-xs text-purple-600 mt-1">
                                {subjects.length === 0 ? 'No subjects assigned' : 'Assigned subjects'}
                              </p>
                            </div>

                            <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-900">Sections</span>
                              </div>
                              <p className="text-2xl font-bold text-blue-900">{sections.length}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                {sections.length === 0 ? 'No sections assigned' : 'Assigned sections'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-6">
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => navigate(`/admin/teacher-workload?teacher=${teacher.id}`)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                            >
                              <Briefcase className="w-4 h-4" />
                              Manage Workload
                            </button>
                          </div>
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(teacher)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                            <p className="text-xs text-amber-800 text-center font-medium">
                              {loadPercentage === 0 ? 'No current assignments' : 'Assignments in progress'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
            /* List View */
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teaching Load
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advisory
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTeachers.map((teacher) => {
                    const teacherName = teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
                    const employeeNumber = teacher.employee_number || teacher.employeeNumber || '';
                    const employmentStatus = teacher.employment_status || teacher.employmentStatus || 'full-time';
                    const teachingLoad = teacher.teaching_load || teacher.teachingLoad || 0;
                    const maxLoad = teacher.max_load || teacher.maxLoad || 24;
                    const subjects = teacher.subjects || [];
                    const sections = teacher.sections || [];
                    const advisoryClass = teacher.advisory_class || teacher.advisoryClass;
                    
                    return (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-gray-700">
                            {getProfileImage(teacher) ? (
                              <img
                                src={getProfileImage(teacher)}
                                alt={teacherName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(teacher.first_name, teacher.last_name)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{teacherName}</div>
                            <div className="text-sm text-gray-500">{employeeNumber}</div>
                            <div className="text-xs text-gray-400">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{teacher.department?.name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {teacher.gender || teacher.user?.gender || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getEmploymentStatusColor(
                            employmentStatus
                          )}`}
                        >
                          {employmentStatus.charAt(0).toUpperCase() + employmentStatus.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div
                            className={`text-sm font-semibold ${getLoadStatusColor(
                              teachingLoad,
                              maxLoad
                            )}`}
                          >
                            {teachingLoad}/{maxLoad} units
                          </div>
                          <div className="w-32 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                (teachingLoad / maxLoad) * 100 >= 90
                                  ? "bg-red-500"
                                  : (teachingLoad / maxLoad) * 100 >= 75
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min((teachingLoad / maxLoad) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sections.length} section{sections.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {advisoryClass ? (
                          <span className="text-sm font-medium text-blue-700">
                            {advisoryClass}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => navigate(`/admin/teacher-workload?teacher=${teacher.id}`)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                            title="Manage Workload"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(teacher)}
                            className="text-gray-600 hover:bg-gray-100 p-2 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(teacher)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTeachers.length === 0 && !loading && drillDownLevel === "teachers" && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No teachers found matching your filters</p>
            </div>
          )}
            </div>
          )}
        </div>

        {/* Create Teacher Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">Add New Teacher</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTeacher} className="p-4 space-y-4">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{formError}</div>
                )}
                <div className="grid grid-cols-3 gap-6">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., TCH001"
                        value={formData.employee_number}
                        onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        minLength="6"
                        placeholder="Enter login password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <select
                        required
                        value={formData.department_id}
                        onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id || d.name} value={d.id}>{d.name}</option>
                        ))}
                      </select>
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
                        placeholder="teacher@educore.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                      <input
                        id="createTeacherPhoto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              profile_image: file,
                              profile_image_url: URL.createObjectURL(file)
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP (Max 10MB)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select
                        value={formData.employment_status}
                        onChange={(e) => setFormData({...formData, employment_status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {employmentTypes.map(t => (
                          <option key={t.type} value={t.type}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Teaching Load</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.max_load}
                        onChange={(e) => setFormData({...formData, max_load: parseInt(e.target.value) || 24})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Units (1-30)</p>
                    </div>
                  </div>

                  {/* Right Column - Picture Preview */}
                  <div className="flex flex-col items-center justify-start space-y-4">
                    <div className="text-sm font-medium text-gray-700 text-center">Profile Picture Preview</div>
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                      {formData.profile_image_url ? (
                        <img
                          src={formData.profile_image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <button
                            type="button"
                            onClick={() => document.getElementById('createTeacherPhoto').click()}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Upload Photo
                          </button>
                        </div>
                      )}
                    </div>
                    {formData.profile_image_url && (
                      <button
                        type="button"
                        onClick={() => document.getElementById('createTeacherPhoto').click()}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Change Photo
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2">
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Add Teacher</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Teacher Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">Edit Teacher</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTeacher} className="p-4 space-y-4">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{formError}</div>
                )}
                <div className="grid grid-cols-3 gap-6">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number</label>
                      <input
                        type="text"
                        disabled
                        value={formData.employee_number}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <select
                        required
                        value={formData.department_id}
                        onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id || d.name} value={d.id}>{d.name}</option>
                        ))}
                      </select>
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
                        id="editTeacherPhoto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              profile_image: file,
                              profile_image_url: URL.createObjectURL(file)
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP (Max 10MB)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select
                        value={formData.employment_status}
                        onChange={(e) => setFormData({...formData, employment_status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {employmentTypes.map(t => (
                          <option key={t.type} value={t.type}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Teaching Load</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.max_load}
                        onChange={(e) => setFormData({...formData, max_load: parseInt(e.target.value) || 24})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Units (1-30)</p>
                    </div>
                  </div>

                  {/* Right Column - Picture Preview */}
                  <div className="flex flex-col items-center justify-start space-y-4">
                    <div className="text-sm font-medium text-gray-700 text-center">Profile Picture Preview</div>
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                      {formData.profile_image_url ? (
                        <img
                          src={formData.profile_image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <button
                            type="button"
                            onClick={() => document.getElementById('editTeacherPhoto').click()}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Upload Photo
                          </button>
                        </div>
                      )}
                    </div>
                    {formData.profile_image_url && (
                      <button
                        type="button"
                        onClick={() => document.getElementById('editTeacherPhoto').click()}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Change Photo
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Teacher</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{selectedTeacher?.first_name} {selectedTeacher?.last_name}</strong>? This action cannot be undone.
                </p>
                {formError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                )}
                <div className="flex justify-center space-x-3">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={handleDeleteTeacher} disabled={formLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2">
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

export default Teachers;
