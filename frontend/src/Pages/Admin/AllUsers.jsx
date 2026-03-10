import '../../App.css';
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import {
  Search,
  Filter,
  RotateCcw,
  LockOpen,
  Lock,
  MoreVertical,
  Eye,
  LogOut,
  Clock,
  Shield,
  GraduationCap,
  UserCheck,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import userService from '../../service/userService';

// Fallback data for development/demo
const getFallbackUsers = () => [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    username: "johndoe",
    role: "Admin",
    status: "active",
    lastLogin: "2 hours ago",
    joinDate: "Jan 10, 2024",
    accountLocked: false,
    failedAttempts: 0,
  },
  {
    id: 2,
    name: "Sarah Smith",
    email: "sarah@example.com",
    username: "sarahsmith",
    role: "Student",
    status: "active",
    lastLogin: "30 min ago",
    joinDate: "Feb 15, 2024",
    accountLocked: false,
    failedAttempts: 0,
  },
  {
    id: 3,
    name: "Prof. Michael",
    email: "michael@example.com",
    username: "profmichael",
    role: "Teacher",
    status: "active",
    lastLogin: "1 day ago",
    joinDate: "Jan 5, 2024",
    accountLocked: false,
    failedAttempts: 0,
  },
  {
    id: 4,
    name: "Emily Wilson",
    email: "emily@example.com",
    username: "emilyw",
    role: "Student",
    status: "disabled",
    lastLogin: "5 days ago",
    joinDate: "Mar 20, 2024",
    accountLocked: true,
    failedAttempts: 3,
  },
];

function AllUsers() {
  const [activeItem, setActiveItem] = useState("All Users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUsersInDB, setTotalUsersInDB] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all users with a large per_page to get all records
      const response = await userService.getAll({ per_page: 1000 });
      
      // Extract total count from Laravel pagination metadata
      if (response.total !== undefined) {
        setTotalUsersInDB(response.total);
      }
      
      const usersData = response.data || response || [];
      
      // Map API response to component format
      const mappedUsers = usersData.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email,
        email: user.email,
        username: user.username || user.email?.split('@')[0] || 'user',
        role: user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Student',
        status: user.status || (user.is_active ? 'active' : 'disabled'),
        lastLogin: user.last_login_at 
          ? new Date(user.last_login_at).toLocaleString()
          : 'Never',
        joinDate: user.created_at 
          ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A',
        accountLocked: user.is_locked || user.account_locked || false,
        failedAttempts: user.failed_login_attempts || 0,
      }));
      
      setUsers(mappedUsers.length > 0 ? mappedUsers : getFallbackUsers());
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
      setUsers(getFallbackUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleIcon = (role) => {
    switch (role) {
      case "Admin":
        return <Shield className="w-4 h-4 text-red-500" />;
      case "Student":
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case "Teacher":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-700";
      case "Student":
        return "bg-blue-100 text-blue-700";
      case "Teacher":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  const toggleAccountStatus = async (id) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;
      
      const newStatus = user.status === "active" ? "disabled" : "active";
      await userService.update(id, { status: newStatus });
      
      setUsers(
        users.map((u) =>
          u.id === id
            ? { ...u, status: newStatus }
            : u
        )
      );
    } catch (err) {
      console.error('Failed to update user status:', err);
      setError('Failed to update user status');
    }
  };

  const toggleAccountLock = async (id) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;
      
      if (user.accountLocked) {
        await userService.unlock(id);
      } else {
        await userService.lock(id);
      }
      
      setUsers(
        users.map((u) =>
          u.id === id
            ? { ...u, accountLocked: !u.accountLocked, failedAttempts: 0 }
            : u
        )
      );
    } catch (err) {
      console.error('Failed to toggle account lock:', err);
      setError('Failed to toggle account lock');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "joinDate") {
      const aDate = Date.parse(a.joinDate) || 0;
      const bDate = Date.parse(b.joinDate) || 0;
      return bDate - aDate;
    }
    if (sortBy === "lastLogin") {
      const aDate = Date.parse(a.lastLogin) || 0;
      const bDate = Date.parse(b.lastLogin) || 0;
      return bDate - aDate;
    }
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.ceil(sortedUsers.length / entriesPerPage);
  const paginatedUsers = sortedUsers.slice(
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
        <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and access control (Admins, Teachers, and Students)</p>
        
        {/* User Stats by Role */}
        {users.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsersInDB || users.length}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => u.role === 'Admin').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Teachers</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.role === 'Teacher').length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.role === 'Student').length}
                  </p>
                </div>
                <GraduationCap className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, username..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
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

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="joinDate">Sort by Join Date</option>
              <option value="lastLogin">Sort by Last Login</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, sortedUsers.length)} of {sortedUsers.length} users
            {sortedUsers.length !== (totalUsersInDB || users.length) && (
              <span className="text-gray-500 ml-1">(filtered from {totalUsersInDB || users.length} total)</span>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{user.lastLogin}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.joinDate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAccountStatus(user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={user.status === "active" ? "Disable" : "Activate"}
                      >
                        {user.status === "active" ? (
                          <LockOpen className="w-4 h-4 text-green-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleAccountLock(user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={user.accountLocked ? "Unlock" : "Lock"}
                      >
                        {user.accountLocked ? (
                          <Lock className="w-4 h-4 text-orange-600" />
                        ) : (
                          <LockOpen className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <RotateCcw className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedUsers.length === 0 && (
          <div className="p-8 text-center">
            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
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
      </div>
    </div>
  );
}

export default AllUsers;
