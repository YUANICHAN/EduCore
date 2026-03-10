import '../../App.css';
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import {
  Search,
  Edit,
  MoreVertical,
  Shield,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  Loader2,
} from 'lucide-react';
import userService from '../../service/userService';

// Fallback data
const getFallbackAdmins = () => [
  {
    id: 1,
    name: "Admin User",
    email: "admin@educore.edu",
    username: "admin",
    permissions: ["all"],
    status: "active",
    lastActive: "1 hour ago",
    joinDate: "Jan 1, 2024",
    createdBy: "System",
  },
];

function UserAdmin() {
  const [activeItem, setActiveItem] = useState("Admins");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getAll({ role: 'admin' });
      const adminsData = response.data || response || [];
      
      const mapped = adminsData.map(admin => ({
        id: admin.id,
        name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.name || 'Admin',
        email: admin.email || '',
        username: admin.username || admin.email?.split('@')[0] || 'admin',
        permissions: admin.permissions || ['all'],
        status: admin.is_active ? 'active' : 'disabled',
        lastActive: admin.last_login_at 
          ? new Date(admin.last_login_at).toLocaleString()
          : 'Never',
        joinDate: admin.created_at 
          ? new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A',
        createdBy: admin.created_by || 'System',
      }));
      
      setAdmins(mapped.length > 0 ? mapped : getFallbackAdmins());
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      setError('Failed to load admins');
      setAdmins(getFallbackAdmins());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const permissionsOptions = [
    { id: "users_manage", label: "Manage Users", category: "Users" },
    { id: "students_manage", label: "Manage Students", category: "Academic" },
    { id: "teachers_manage", label: "Manage Teachers", category: "Academic" },
    { id: "reports_view", label: "View Reports", category: "Reports" },
    { id: "settings_manage", label: "System Settings", category: "System" },
    { id: "audit_view", label: "View Audit Logs", category: "System" },
    { id: "all", label: "Full Access", category: "Special" },
  ];

  const getPermissionLabel = (permId) => {
    return permissionsOptions.find((p) => p.id === permId)?.label || permId;
  };

  const getPermissionCategory = (permId) => {
    return permissionsOptions.find((p) => p.id === permId)?.category || "Other";
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const disableAdmin = async (id) => {
    try {
      await userService.update(id, { is_active: false });
      setAdmins(
        admins.map((admin) =>
          admin.id === id ? { ...admin, status: "disabled" } : admin
        )
      );
    } catch (err) {
      console.error('Failed to disable admin:', err);
      alert('Failed to disable admin');
    }
  };

  const enableAdmin = async (id) => {
    try {
      await userService.update(id, { is_active: true });
      setAdmins(
        admins.map((admin) =>
          admin.id === id ? { ...admin, status: "active" } : admin
        )
      );
    } catch (err) {
      console.error('Failed to enable admin:', err);
      alert('Failed to enable admin');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading admins...</span>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administrators</h1>
          <p className="text-gray-600 mt-1">Manage admin accounts and permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Admins Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAdmins.map((admin) => (
          <div
            key={admin.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                  <p className="text-sm text-gray-600">@{admin.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    admin.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {admin.status === "active" ? "Active" : "Disabled"}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Email</p>
              <p className="text-sm font-medium text-gray-900">{admin.email}</p>
            </div>

            {/* Permissions */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Permissions</p>
              <div className="space-y-2">
                {admin.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center space-x-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{getPermissionLabel(perm)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Last Active</p>
                <p className="text-sm font-medium text-gray-900">{admin.lastActive}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Join Date</p>
                <p className="text-sm font-medium text-gray-900">{admin.joinDate}</p>
              </div>
            </div>

            {/* Created By */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Created By</p>
              <p className="text-sm font-medium text-gray-900">{admin.createdBy}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Reset Password</span>
              </button>
              {admin.status === "active" ? (
                <button
                  onClick={() => disableAdmin(admin.id)}
                  className="px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                  title="Disable Admin"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => enableAdmin(admin.id)}
                  className="px-3 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                  title="Enable Admin"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAdmins.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No admins found matching your search</p>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default UserAdmin;
