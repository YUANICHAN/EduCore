import '../../App.css';
import { useMemo, useState } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import departmentService from "../../service/departmentService";
import Swal from 'sweetalert2';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  LayoutGrid,
  List,
  X,
  AlertCircle,
  Users,
  GraduationCap,
  Loader2,
  ChevronRight,
} from "lucide-react";

function Departments() {
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

  const [activeItem, setActiveItem] = useState("Departments");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: 'blue',
    status: 'active',
    banner_image: null,
    banner_image_url: null,
  });
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const departments = useMemo(() => {
    const data = departmentsQuery.data?.data || departmentsQuery.data || [];
    return data.map(d => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      color: d.color || 'blue',
      status: d.status || 'active',
      banner_image: d.banner_image,
      programsCount: d.programs_count || 0,
      teachersCount: d.teachers_count || 0,
    }));
  }, [departmentsQuery.data]);

  const loading = departmentsQuery.isLoading || departmentsQuery.isFetching;
  const error = departmentsQuery.isError ? 'Failed to load departments. Please try again.' : null;

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [departments, searchTerm]);

  const colors = [
    { value: 'blue', label: 'Blue' },
    { value: 'emerald', label: 'Emerald' },
    { value: 'purple', label: 'Purple' },
    { value: 'amber', label: 'Amber' },
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'indigo', label: 'Indigo' },
    { value: 'pink', label: 'Pink' },
  ];

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      color: 'blue',
      status: 'active',
      banner_image: null,
      banner_image_url: null,
    });
    setEditingDepartment(null);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submissionData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        color: formData.color,
        status: formData.status,
      };

      if (formData.banner_image) {
        submissionData.banner_image = formData.banner_image;
      }

      if (editingDepartment) {
        await departmentService.update(editingDepartment.id, submissionData);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Department updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await departmentService.create(submissionData);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Department created successfully',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving department:', err);
      const errorMessage = err.response?.data?.message || 
                          Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 
                          'Failed to save department';
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      code: department.code,
      name: department.name,
      description: department.description || '',
      color: department.color,
      status: department.status,
      banner_image: null,
      banner_image_url: department.banner_image ? resolveImageUrl(department.banner_image) : null,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (department) => {
    // If department has associated records, show move options
    if (department.programsCount > 0 || department.teachersCount > 0) {
      const otherDepartments = departments.filter(d => d.id !== department.id && d.status === 'active');
      
      if (otherDepartments.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Delete',
          text: 'This is the only active department. Cannot move programs and teachers to another department.',
        });
        return;
      }

      const { value: targetDeptId } = await Swal.fire({
        title: 'Move Programs & Teachers',
        html: `
          <div class="text-left mb-4">
            <p class="mb-2">This department has:</p>
            <ul class="list-disc list-inside mb-4 text-gray-600">
              <li>${department.programsCount} program(s)</li>
              <li>${department.teachersCount} teacher(s)</li>
            </ul>
            <p class="font-semibold">Select a department to move them to:</p>
          </div>
        `,
        input: 'select',
        inputOptions: otherDepartments.reduce((acc, dept) => {
          acc[dept.id] = `${dept.name} (${dept.code})`;
          return acc;
        }, {}),
        inputPlaceholder: 'Select department',
        showCancelButton: true,
        confirmButtonText: 'Move & Delete',
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        inputValidator: (value) => {
          if (!value) {
            return 'You must select a department!';
          }
        }
      });

      if (!targetDeptId) return;

      setSaving(true);
      try {
        const response = await departmentService.delete(department.id, targetDeptId);
        await queryClient.invalidateQueries({ queryKey: ['departments'] });
        await queryClient.invalidateQueries({ queryKey: ['programs'] });
        await queryClient.invalidateQueries({ queryKey: ['teachers'] });
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          html: `Department deleted successfully.<br><br>` +
                `<small>Moved ${response.moved?.programs || 0} program(s) and ${response.moved?.teachers || 0} teacher(s) to ${response.moved?.to_department}</small>`,
          timer: 3000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Error deleting department:', err);
        const errorMessage = err.response?.data?.message || 'Failed to delete department';
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: errorMessage
        });
      } finally {
        setSaving(false);
      }
    } else {
      // Simple delete for departments with no associated records
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Delete department "${department.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;

      setSaving(true);
      try {
        await departmentService.delete(department.id);
        await queryClient.invalidateQueries({ queryKey: ['departments'] });
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Department deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Error deleting department:', err);
        const errorMessage = err.response?.data?.message || 'Failed to delete department';
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: errorMessage
        });
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading departments...</p>
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
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
              <p className="text-gray-600 mt-1">Manage academic departments</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Department</span>
            </button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Total Departments</span>
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Active</span>
                <Building2 className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {departments.filter(d => d.status === 'active').length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Total Programs</span>
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {departments.reduce((sum, d) => sum + d.programsCount, 0)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Total Teachers</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {departments.reduce((sum, d) => sum + d.teachersCount, 0)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search departments..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Departments Grid/List View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${dept.color}-100 rounded-lg flex items-center justify-center`}>
                      <Building2 className={`w-6 h-6 text-${dept.color}-600`} />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(dept)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit department"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="text-red-600 hover:text-red-800 relative"
                        title={
                          dept.programsCount > 0 || dept.teachersCount > 0
                            ? `Delete (will require moving ${dept.programsCount} program(s) and ${dept.teachersCount} teacher(s))`
                            : 'Delete department'
                        }
                      >
                        <Trash2 className="w-5 h-5" />
                        {(dept.programsCount > 0 || dept.teachersCount > 0) && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white"></span>
                        )}
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{dept.code}</h3>
                  <p className="text-sm text-gray-600 mb-4">{dept.name}</p>
                  {dept.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{dept.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-600">Programs</span>
                      <p className="text-lg font-bold text-blue-600">{dept.programsCount}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Teachers</span>
                      <p className="text-lg font-bold text-blue-600">{dept.teachersCount}</p>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          dept.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {dept.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Programs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Teachers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 bg-${dept.color}-100 rounded flex items-center justify-center mr-3`}>
                            <Building2 className={`w-4 h-4 text-${dept.color}-600`} />
                          </div>
                          <span className="font-semibold text-gray-900">{dept.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{dept.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{dept.programsCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{dept.teachersCount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            dept.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {dept.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(dept)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit department"
                        >
                          <Edit className="w-5 h-5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept)}
                          className="text-red-600 hover:text-red-800 relative inline-block"
                          title={
                            dept.programsCount > 0 || dept.teachersCount > 0
                              ? `Delete (will require moving ${dept.programsCount} program(s) and ${dept.teachersCount} teacher(s))`
                              : 'Delete department'
                          }
                        >
                          <Trash2 className="w-5 h-5 inline" />
                          {(dept.programsCount > 0 || dept.teachersCount > 0) && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white"></span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredDepartments.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No departments found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search" : "Get started by creating your first department"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Create Department
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDepartment ? "Edit Department" : "Create New Department"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {colors.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Studies"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Department description..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                <input
                  id="departmentBannerUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, banner_image: e.target.files[0]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Upload banner image (JPG, PNG, WEBP up to 10MB)</p>
              </div>

              {/* Banner Preview */}
              <div className="flex items-center justify-center">
                <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {formData.banner_image ? (
                    <img 
                      src={URL.createObjectURL(formData.banner_image)} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : formData.banner_image_url ? (
                    <img 
                      src={formData.banner_image_url} 
                      alt="Banner" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 mb-3">Banner Preview</p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('departmentBannerUpload').click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Upload Banner
                      </button>
                      <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {formData.banner_image && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, banner_image: null})}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove Banner
                </button>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </span>
                  ) : editingDepartment ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
