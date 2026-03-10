import '../../App.css';
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import {
  Search,
  Plus,
  RotateCcw,
  Lock,
  LockOpen,
  Grid3x3,
  List,
  Eye,
  MoreVertical,
  Clock,
  Link2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import userService from '../../service/userService';

// Fallback data for development/demo
const getFallbackTeachers = () => [
  {
    id: 1,
    name: "Prof. Michael Chen",
    email: "michael@example.com",
    username: "prof.michael",
    employeeId: "EMP001",
    department: "Computer Science",
    status: "active",
    lastLogin: "1 hour ago",
    createdDate: "Jan 5, 2024",
  },
  {
    id: 2,
    name: "Dr. Sarah Williams",
    email: "sarah@example.com",
    username: "dr.sarah",
    employeeId: "EMP002",
    department: "Mathematics",
    status: "active",
    lastLogin: "3 hours ago",
    createdDate: "Jan 10, 2024",
  },
  {
    id: 3,
    name: "Prof. James Brown",
    email: "james@example.com",
    username: "prof.james",
    employeeId: "EMP003",
    department: "Business",
    status: "disabled",
    lastLogin: "2 weeks ago",
    createdDate: "Jan 2, 2024",
  },
];

function TeacherAccounts() {
  const [activeItem, setActiveItem] = useState("Teacher Accounts");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getAll({ role: 'teacher' });
      const usersData = response.data || response || [];
      
      const mappedTeachers = usersData.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email,
        email: user.email,
        username: user.username || user.email?.split('@')[0] || 'user',
        employeeId: user.teacher?.employee_id || user.employee_id || `EMP${String(user.id).padStart(3, '0')}`,
        department: user.teacher?.department || user.department || 'General',
        status: user.status || (user.is_active ? 'active' : 'disabled'),
        lastLogin: user.last_login_at 
          ? new Date(user.last_login_at).toLocaleString()
          : 'Never',
        createdDate: user.created_at 
          ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A',
      }));
      
      setTeachers(mappedTeachers.length > 0 ? mappedTeachers : getFallbackTeachers());
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setError('Failed to load teacher accounts');
      setTeachers(getFallbackTeachers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const toggleStatus = async (id) => {
    try {
      const teacher = teachers.find(t => t.id === id);
      if (!teacher) return;
      
      const newStatus = teacher.status === "active" ? "disabled" : "active";
      await userService.update(id, { status: newStatus });
      
      setTeachers(
        teachers.map((t) =>
          t.id === id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status');
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || teacher.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTeachers.length / entriesPerPage);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="h-screen bg-gray-50 flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teacher Accounts</h1>
                <p className="text-gray-600 mt-1">Manage teacher portal access and teaching privileges</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                <Plus className="w-5 h-5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Filters and Controls */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, username, or employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex justify-between items-center">
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

            <div className="text-sm text-gray-600 mt-4">
              Showing {paginatedTeachers.length} of {filteredTeachers.length} accounts
            </div>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{teacher.employeeId}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        teacher.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {teacher.status === "active" ? "Active" : "Disabled"}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm">
                      <p className="text-gray-600">Department</p>
                      <p className="text-gray-900 font-medium">{teacher.department?.name || 'Not Assigned'}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">Email</p>
                      <p className="text-gray-900 font-medium truncate">{teacher.email}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">Username</p>
                      <p className="text-gray-900 font-medium">@{teacher.username}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last login: {teacher.lastLogin}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleStatus(teacher.id)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                    >
                      {teacher.status === "active" ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Disable</span>
                        </>
                      ) : (
                        <>
                          <LockOpen className="w-4 h-4" />
                          <span>Enable</span>
                        </>
                      )}
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{teacher.name}</p>
                            <p className="text-xs text-gray-600">@{teacher.username}</p>
                            <p className="text-xs text-gray-500">{teacher.employeeId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{teacher.department?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              teacher.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {teacher.status === "active" ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{teacher.lastLogin}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleStatus(teacher.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {teacher.status === "active" ? (
                                <Lock className="w-4 h-4 text-red-600" />
                              ) : (
                                <LockOpen className="w-4 h-4 text-green-600" />
                              )}
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <RotateCcw className="w-4 h-4 text-blue-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Link2 className="w-4 h-4 text-purple-600" />
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

          {paginatedTeachers.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No teacher accounts found</p>
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
        </div>
      </div>
    </div>
  );
}

export default TeacherAccounts;
