import '../../App.css';
import { useState, useMemo } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import teacherService from "../../service/teacherService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Users,
  Mail,
  Briefcase,
  BookOpen,
  Loader2,
  Filter,
  X,
  RefreshCw,
} from 'lucide-react';

function TeachersList() {
  const [activeItem, setActiveItem] = useState("Teachers List");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("employee_number");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all teachers
  const teachersQuery = useQuery({
    queryKey: ['teachers', 'list', { page: currentPage, per_page: 1000 }],
    queryFn: () => teacherService.getAll({
      per_page: 1000,
    }),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  const teachers = useMemo(() => {
    const data = teachersQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    return [];
  }, [teachersQuery.data]);

  // Get total count from API pagination metadata
  const totalTeachersInDB = useMemo(() => {
    return teachersQuery.data?.total || teachers.length;
  }, [teachersQuery.data, teachers.length]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set();
    teachers.forEach(teacher => {
      if (teacher.department?.name) {
        depts.add(teacher.department.name);
      }
    });
    return Array.from(depts).sort();
  }, [teachers]);

  // Filter teachers based on search and filters
  const filteredTeachers = useMemo(() => {
    let filtered = teachers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((teacher) => {
        const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.toLowerCase();
        const employeeNumber = (teacher.employee_number || '').toLowerCase();
        const email = (teacher.email || '').toLowerCase();
        const department = (teacher.department?.name || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return (
          fullName.includes(search) ||
          employeeNumber.includes(search) ||
          email.includes(search) ||
          department.includes(search)
        );
      });
    }

    // Department filter
    if (filterDepartment) {
      filtered = filtered.filter((teacher) => {
        return teacher.department?.name === filterDepartment;
      });
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((teacher) => {
        return teacher.employment_status === filterStatus || teacher.status === filterStatus;
      });
    }

    return filtered;
  }, [teachers, searchTerm, filterDepartment, filterStatus]);

  // Sort teachers
  const sortedTeachers = useMemo(() => {
    const sorted = [...filteredTeachers];

    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "employee_number":
          aValue = a.employee_number || "";
          bValue = b.employee_number || "";
          break;
        case "name":
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "department":
          aValue = a.department || "";
          bValue = b.department || "";
          break;
        case "load":
          aValue = a.total_load || a.current_load || 0;
          bValue = b.total_load || b.current_load || 0;
          break;
        default:
          aValue = "";
          bValue = "";
      }

      // Compare values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredTeachers, sortField, sortDirection]);

  // Pagination
  const totalTeachers = sortedTeachers.length;
  const totalPages = Math.ceil(totalTeachers / entriesPerPage);
  const paginatedTeachers = sortedTeachers.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
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
    setFilterDepartment("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const loading = teachersQuery.isLoading || teachersQuery.isFetching;

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teachers List</h1>
                <p className="text-gray-600 mt-1">Complete list of all teachers with search and filters</p>
              </div>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['teachers'] })}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
            
            {/* Stats Cards */}
            {teachers.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Teachers</p>
                      <p className="text-2xl font-bold text-gray-900">{totalTeachersInDB}</p>
                    </div>
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Filtered Results</p>
                      <p className="text-2xl font-bold text-green-600">{totalTeachers}</p>
                    </div>
                    <Filter className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Teachers</p>
                      <p className="text-2xl font-bold text-green-600">
                        {teachers.filter(t => t.employment_status === 'active' || t.status === 'active').length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">from loaded data</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Departments</p>
                      <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-400" />
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
                    placeholder="Search by name, employee number, email, or department..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={filterDepartment}
                      onChange={(e) => {
                        setFilterDepartment(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Status
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
                      <option value="on_leave">On Leave</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {(searchTerm || filterDepartment || filterStatus !== "all") && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Showing {totalTeachers} result{totalTeachers !== 1 ? 's' : ''}
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
                <span className="ml-3 text-gray-600">Loading teachers...</span>
              </div>
            ) : paginatedTeachers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No teachers found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm || filterDepartment || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "No teachers have been added yet"}
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
                    {Math.min(currentPage * entriesPerPage, totalTeachers)} of {totalTeachers} teachers
                    {totalTeachers !== totalTeachersInDB && (
                      <span className="text-gray-500 ml-1">(filtered from {totalTeachersInDB} total)</span>
                    )}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Photo
                        </th>
                        <th
                          onClick={() => handleSort("employee_number")}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            Employee Number
                            {renderSortIcon("employee_number")}
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
                          onClick={() => handleSort("department")}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            Department
                            {renderSortIcon("department")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("load")}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            Current Load
                            {renderSortIcon("load")}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedTeachers.map((teacher) => (
                        <tr
                          key={teacher.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-600 font-semibold text-sm">
                                  {`${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {teacher.employee_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate max-w-xs">{teacher.email || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <span>{teacher.department?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span>
                                {teacher.total_load || teacher.current_load || 0} / {teacher.max_load || 24} units
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (teacher.employment_status || teacher.status) === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : (teacher.employment_status || teacher.status) === 'on_leave'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {teacher.employment_status === 'active' ? 'Active' 
                                : teacher.employment_status === 'on_leave' ? 'On Leave'
                                : teacher.employment_status === 'inactive' ? 'Inactive'
                                : teacher.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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
      </div>
    </div>
  );
}

export default TeachersList;
