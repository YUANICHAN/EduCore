import '../../App.css';
import { useMemo, useState } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import programService from "../../service/programService";
import departmentService from "../../service/departmentService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from 'sweetalert2';
import {
  BookOpen,
  Users,
  FolderKanban,
  Plus,
  Edit,
  Archive,
  CheckCircle2,
  Filter,
  Search,
  GraduationCap,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";

function Course() {
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

  const [activeItem, setActiveItem] = useState("Courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const queryClient = useQueryClient();
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: '',
    duration_years: 4,
    description: '',
    level: 'college',
    status: 'active',
    program_image: null,
    program_image_url: null,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const departments = useMemo(() => {
    const data = departmentsQuery.data?.data || departmentsQuery.data || [];
    return data.filter(d => d.status === 'active').map(d => d.name);
  }, [departmentsQuery.data]);

  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const mapProgram = (program) => ({
    id: program.id,
    code: program.code || program.program_code || '',
    name: program.name || program.program_name || '',
    description: program.description || '',
    department: program.department || '',
    image: resolveImageUrl(program.program_image || program.image) || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
    rawImage: program.program_image || null,
    durationYears: program.duration_years || program.durationYears || 4,
    level: program.level || 'college',
    status: program.status || 'active',
    years: program.years || [],
    totals: {
      students: program.students_count || program.totals?.students || 0,
      sections: program.sections_count || program.totals?.sections || 0,
      subjects: program.subjects_count || program.totals?.subjects || 0,
    },
  });

  const courses = useMemo(() => {
    const data = programsQuery.data?.data || programsQuery.data || [];
    return data.map(mapProgram);
  }, [programsQuery.data]);

  const loading = programsQuery.isLoading || programsQuery.isFetching;
  const error = programsQuery.isError ? 'Failed to load programs. Please try again.' : null;

  // CRUD handlers
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const submissionData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        department: formData.department,
        duration_years: formData.duration_years,
        level: formData.level,
        status: formData.status,
      };

      if (formData.program_image) {
        submissionData.program_image = formData.program_image;
      }

      await programService.create(submissionData);
      setShowCreateModal(false);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Added ${submissionData.name} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create program');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const submissionData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        department: formData.department,
        duration_years: formData.duration_years,
        level: formData.level,
        status: formData.status,
      };

      if (formData.program_image) {
        submissionData.program_image = formData.program_image;
      }

      await programService.update(selectedCourse.id, submissionData);
      setShowEditModal(false);
      setSelectedCourse(null);
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Updated ${submissionData.name} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update program');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    setFormLoading(true);
    try {
      await programService.delete(selectedCourse.id);
      setShowDeleteModal(false);
      setSelectedCourse(null);
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete program');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      department: '',
      duration_years: 4,
      description: '',
      level: 'college',
      status: 'active',
      program_image: null,
      program_image_url: null,
    });
    setFormError(null);
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      department: course.department,
      duration_years: course.durationYears,
      description: course.description || '',
      level: course.level || 'college',
      status: course.status || 'active',
      program_image: null,
      program_image_url: course.rawImage ? resolveImageUrl(course.rawImage) : null,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (course) => {
    setSelectedCourse(course);
    setFormError(null);
    setShowDeleteModal(true);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = departmentFilter === "all" || course.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [courses, searchTerm, departmentFilter]);

  const summary = useMemo(() => {
    const totalStudents = courses.reduce((sum, c) => sum + c.totals.students, 0);
    const totalSections = courses.reduce((sum, c) => sum + c.totals.sections, 0);
    const totalSubjects = courses.reduce((sum, c) => sum + c.totals.subjects, 0);
    return { totalStudents, totalSections, totalSubjects };
  }, [courses]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading programs...</p>
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
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Courses / Programs</h1>
              <p className="text-gray-600 mt-1">Define programs, year structure, and subject assignments.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50">
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
              <button 
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Course</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Total Students</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Total Sections</span>
                <LayoutGrid className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSections}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Total Subjects</span>
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSubjects}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Validation Rules</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>Cannot delete with enrolled students.</li>
                <li>Cannot delete with enrolled sections.</li>
                <li>Delete button shows backend validation alert.</li>
              </ul>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code or name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>{filteredCourses.length} courses</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Courses */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Course Image */}
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={course.image} 
                      alt={course.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">{course.code}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">{course.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                        {course.department}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => openEditModal(course)} className="text-gray-500 hover:text-blue-600" title="Edit program"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => openDeleteModal(course)} className="text-gray-500 hover:text-red-600" title="Delete program"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold text-gray-900">{course.durationYears} years</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Totals</span>
                      <span className="text-gray-900 font-medium">{course.totals.students} students · {course.totals.sections} sections · {course.totals.subjects} subjects</span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Year Structure</h4>
                      <div className="space-y-2">
                        {course.years.map((yr) => (
                          <div key={yr.label} className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                            <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                              <span>{yr.label}</span>
                              <span className="text-xs text-gray-500">{yr.semesters.length} term(s)</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-600 space-y-1">
                              {yr.semesters.map((sem) => (
                                <div key={sem.term} className="flex justify-between">
                                  <span>{sem.term}</span>
                                  <span>{sem.subjects.length} subject(s)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Totals</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{course.code}</span>
                          <span className="text-xs text-gray-600">{course.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{course.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{course.durationYears} years</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {course.totals.students} students · {course.totals.sections} sections · {course.totals.subjects} subjects
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEditModal(course)} className="text-gray-500 hover:text-blue-600" title="Edit program"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openDeleteModal(course)} className="text-gray-500 hover:text-red-600" title="Delete program"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Create Program</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateCourse} className="p-4">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{formError}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., BSIT"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Bachelor of Science in Information Technology"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={formData.duration_years}
                        onChange={(e) => setFormData({...formData, duration_years: parseInt(e.target.value) || 4})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                      <select
                        required
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="college">College</option>
                        <option value="senior_high">Senior High</option>
                        <option value="junior_high">Junior High</option>
                        <option value="elementary">Elementary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={6}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Image</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => setFormData({ ...formData, program_image: e.target.files?.[0] || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    {(formData.program_image || formData.program_image_url) && (
                      <div className="border rounded-lg p-3">
                        <img
                          src={formData.program_image ? URL.createObjectURL(formData.program_image) : formData.program_image_url}
                          alt="Program preview"
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, program_image: null, program_image_url: null })}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2">
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Create</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Edit Program</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateCourse} className="p-4">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{formError}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={formData.duration_years}
                        onChange={(e) => setFormData({...formData, duration_years: parseInt(e.target.value) || 4})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                      <select
                        required
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="college">College</option>
                        <option value="senior_high">Senior High</option>
                        <option value="junior_high">Junior High</option>
                        <option value="elementary">Elementary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={6}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Image</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => setFormData({ ...formData, program_image: e.target.files?.[0] || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    {(formData.program_image || formData.program_image_url) && (
                      <div className="border rounded-lg p-3">
                        <img
                          src={formData.program_image ? URL.createObjectURL(formData.program_image) : formData.program_image_url}
                          alt="Program preview"
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, program_image: null, program_image_url: null })}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Program</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete <strong>{selectedCourse?.code}</strong>? This action cannot be undone.
                </p>
                {formError && (
                  <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm text-left">
                    {formError}
                  </div>
                )}
                <div className="flex justify-center space-x-3">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={handleDeleteCourse} disabled={formLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2">
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

export default Course;
