import '../../App.css';
import { useMemo, useState } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import sectionService from "../../service/sectionService";
import programService from "../../service/programService";
import academicYearService from "../../service/academicYearService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  BookOpen,
  LayoutGrid,
  Calendar,
  Plus,
  Edit,
  Archive,
  Search,
  Filter,
  Gauge,
  List,
  ChevronRight,
  Home,
  GraduationCap,
  Loader2,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";

function Section() {
  const [activeItem, setActiveItem] = useState("Sections");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  // Drill-down navigation state
  const [drillDownLevel, setDrillDownLevel] = useState("programs"); // programs, years, sections
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  
  const [ayFilter, setAyFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // API states
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const sectionsQuery = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionService.getAll({ per_page: 'all' }),
    staleTime: 30 * 1000, // 30 seconds - refresh more often
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getAll({ per_page: 'all' }),
    staleTime: 5 * 60 * 1000,
  });

  const academicYearsQuery = useQuery({
    queryKey: ['academicYears'],
    queryFn: () => academicYearService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const sections = useMemo(() => {
    const source = sectionsQuery.data?.data || sectionsQuery.data || [];
    return source.map(s => ({
      id: s.id,
      name: s.section_code || s.name || s.section_name || '',
      code: s.section_code || '',
      course: s.program?.program_code || s.program_code || '',
      courseName: s.program?.program_name || s.program_name || '',
      yearLevel: s.grade_level || s.year_level || s.yearLevel || '1st Year',
      semester: s.semester || '1st Sem',
      academicYear: s.academic_year?.year_code || s.academic_year || s.academicYear || '',
      capacity: s.capacity ?? 0, // Show capacity even if 0
      students: Math.max(Number(s.enrolled_count ?? 0), Number(s.students_count ?? 0)),
      adviser: s.adviser ? `${s.adviser.first_name} ${s.adviser.last_name}` : (s.adviser_name || 'TBA'),
      adviserId: s.adviser_id || null,
      subjectTeachers: s.subject_teachers || [],
      room: s.room_number || '',
      status: s.status || 'active',
      programId: s.program_id,
      academicYearId: s.academic_year_id,
    }));
  }, [sectionsQuery.data]);

  const courses = useMemo(() => {
    const source = programsQuery.data?.data || programsQuery.data || [];
    const mapped = source.map(p => ({
      id: p.id,
      code: p.code || p.program_code || '',
      name: p.name || p.program_name || '',
      color: ['blue', 'green', 'purple', 'orange', 'red'][p.id % 5] || 'blue',
    }));

    return mapped.length > 0 ? mapped : [
      { code: "BSIT", name: "Bachelor of Science in Information Technology", color: "blue" },
      { code: "BSBA", name: "Bachelor of Science in Business Administration", color: "green" },
      { code: "BSHM", name: "Bachelor of Science in Hospitality Management", color: "purple" },
    ];
  }, [programsQuery.data]);

  const academicYears = useMemo(() => {
    const source = academicYearsQuery.data?.data || academicYearsQuery.data || [];
    const mapped = source.map(ay => ay.year_code || ay.year || `${ay.start_year}-${ay.end_year}`);
    return mapped.length > 0 ? mapped : ["2024-2025", "2023-2024"];
  }, [academicYearsQuery.data]);

  const loading = sectionsQuery.isLoading || programsQuery.isLoading || academicYearsQuery.isLoading;
  const error = sectionsQuery.isError || programsQuery.isError || academicYearsQuery.isError
    ? 'Failed to load sections. Please try again.'
    : null;

  // CRUD handlers
  const handleCreateSection = async (formData) => {
    setSaving(true);
    try {
      // Find the program ID from the course code
      const program = courses.find(c => c.code === formData.course);
      if (!program) {
        alert('Please select a valid program');
        setSaving(false);
        return;
      }

      // Find the academic year ID from the year code
      const academicYearData = academicYearsQuery.data?.data || [];
      const academicYear = academicYearData.find(ay => 
        (ay.year_code || ay.year || `${ay.start_year}-${ay.end_year}`) === formData.academicYear
      );
      if (!academicYear) {
        alert('Please select a valid academic year');
        setSaving(false);
        return;
      }

      const sectionData = {
        section_code: formData.name,
        program_id: program.id,
        grade_level: formData.yearLevel,
        academic_year_id: academicYear.id,
        capacity: parseInt(formData.capacity) || 40,
        status: 'active',
      };

      if (editingSection) {
        await sectionService.update(editingSection.id, sectionData);
        setEditingSection(null);
      } else {
        await sectionService.create(sectionData);
      }
      // Invalidate all section-related queries across the app
      await queryClient.invalidateQueries({ queryKey: ['sections'] });
      await queryClient.invalidateQueries({ queryKey: ['sectionsForAssignment'] });
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error saving section:', err);
      alert(err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : 'Failed to save section. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    setSaving(true);
    try {
      await sectionService.delete(sectionToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ['sections'] });
      setShowDeleteModal(false);
      setSectionToDelete(null);
    } catch (err) {
      console.error('Error deleting section:', err);
      alert('Failed to delete section. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (section) => {
    setEditingSection(section);
    setShowCreateModal(true);
  };

  const openDeleteModal = (section) => {
    setSectionToDelete(section);
    setShowDeleteModal(true);
  };

  // Breadcrumb navigation handlers
  const navigateToPrograms = () => {
    setDrillDownLevel("programs");
    setSelectedCourse(null);
    setSelectedYear(null);
  };

  const navigateToYears = (course) => {
    setDrillDownLevel("years");
    setSelectedCourse(course);
    setSelectedYear(null);
  };

  const navigateToSections = (year) => {
    setDrillDownLevel("sections");
    setSelectedYear(year);
  };

  // Count sections per program
  const getCourseSectionCount = (courseCode) => {
    return sections.filter(s => s.course === courseCode).length;
  };

  // Count sections per year level in selected program
  const getYearSectionCount = (year) => {
    return sections.filter(s => 
      s.course === selectedCourse && 
      s.yearLevel === year
    ).length;
  };

  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesSearch =
        (sec.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sec.course || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sec.courseName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse = !selectedCourse || sec.course === selectedCourse;
      const matchesYear = !selectedYear || sec.yearLevel === selectedYear;
      const matchesAy = ayFilter === "all" || sec.academicYear === ayFilter;

      return matchesSearch && matchesCourse && matchesYear && matchesAy;
    });
  }, [sections, searchTerm, selectedCourse, selectedYear, ayFilter]);

  const capacityUsage = (sec) => {
    if (!sec.capacity || sec.capacity === 0) return 0;
    return Math.round((sec.students / sec.capacity) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading sections...</p>
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
              <button onClick={() => queryClient.invalidateQueries({ queryKey: ['sections'] })} className="ml-auto text-red-600 hover:text-red-800 font-medium">
                Retry
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
              <p className="text-gray-600 mt-1">Navigate through programs and year levels</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50">
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
              <button 
                onClick={() => {
                  setEditingSection(null);
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Section</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center space-x-2 text-sm flex-wrap">
              <button
                onClick={navigateToPrograms}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                  drillDownLevel === "programs"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Sections</span>
              </button>

              {selectedCourse && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => navigateToYears(selectedCourse)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      drillDownLevel === "years"
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {selectedCourse}
                  </button>
                </>
              )}

              {selectedYear && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-lg">
                    {selectedYear}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* PROGRAMS VIEW */}
          {drillDownLevel === "programs" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Select a Program</h2>
                <span className="text-sm text-gray-600">{courses.length} programs available</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const sectionCount = getCourseSectionCount(course.code);
                  return (
                    <button
                      key={course.code}
                      onClick={() => navigateToYears(course.code)}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-${course.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${course.color}-200 transition-colors`}>
                          <GraduationCap className={`w-6 h-6 text-${course.color}-600`} />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.code}</h3>
                      <p className="text-sm text-gray-600 mb-4">{course.name}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Sections</span>
                        <span className="text-2xl font-bold text-blue-600">{sectionCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* YEAR LEVELS VIEW */}
          {drillDownLevel === "years" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Year Level - {courses.find(c => c.code === selectedCourse)?.name}
                </h2>
                <span className="text-sm text-gray-600">{yearLevels.length} year levels</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {yearLevels.map((year) => {
                  const sectionCount = getYearSectionCount(year);
                  return (
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
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Sections</span>
                        <span className="text-2xl font-bold text-blue-600">{sectionCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTIONS VIEW */}
          {drillDownLevel === "sections" && (
            <div>
              {/* Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Total Sections</span>
                <LayoutGrid className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Avg Capacity</span>
                <Gauge className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  sections.reduce((sum, s) => sum + capacityUsage(s), 0) /
                  (sections.length || 1)
                )}%
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Students Assigned</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {sections.reduce((sum, s) => sum + s.students, 0)}
              </p>
            </div>
          </div>

              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by section or course"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={ayFilter}
                    onChange={(e) => setAyFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Academic Years</option>
                    {academicYears.map((ay) => (
                      <option key={ay} value={ay}>{ay}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>{filteredSections.length} sections</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sections */}
              {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSections.map((sec) => (
                <div key={sec.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">{sec.name}</span>
                        <span className="text-xs text-gray-600">{sec.semester}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">{sec.courseName}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <UserCheck className="w-4 h-4 text-gray-400 mr-2" />
                        Adviser: {sec.adviser}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {sec.yearLevel} · {sec.academicYear}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                      <button className="text-gray-500 hover:text-red-600"><Archive className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-semibold text-gray-900">{sec.students}/{sec.capacity} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${Math.min(capacityUsage(sec), 100)}%` }}
                      ></div>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium">Subjects & Teachers</span>
                      </div>
                      <div className="space-y-1">
                        {sec.subjectTeachers.map((st, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1">
                            <span className="text-gray-700">{st.subject}</span>
                            <span className="text-gray-600">{st.teacher} · {st.hoursPerWeek} hrs/wk</span>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Section</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Course / Year</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Semester / AY</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Capacity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Adviser</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Subjects</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{sec.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sec.course} · {sec.yearLevel}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sec.semester} · {sec.academicYear}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sec.students}/{sec.capacity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sec.adviser}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 space-y-1">
                        {sec.subjectTeachers.map((st, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{st.subject}</span>
                            <span>{st.teacher} · {st.hoursPerWeek} hrs/wk</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEditModal(sec)} className="text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openDeleteModal(sec)} className="text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </div>
          )}

          {/* Create/Edit Section Modal */}
          {showCreateModal && (
            <CreateSectionModal
              section={editingSection}
              courses={courses}
              yearLevels={yearLevels}
              academicYears={academicYears}
              onSave={handleCreateSection}
              onClose={() => {
                setShowCreateModal(false);
                setEditingSection(null);
              }}
              saving={saving}
            />
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <DeleteConfirmModal
              section={sectionToDelete}
              onConfirm={handleDeleteSection}
              onClose={() => {
                setShowDeleteModal(false);
                setSectionToDelete(null);
              }}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Create/Edit Section Modal
function CreateSectionModal({ section, courses, yearLevels, academicYears, onSave, onClose, saving }) {
  const [formData, setFormData] = useState(
    section || {
      name: "",
      course: "",
      yearLevel: "1st Year",
      semester: "1st Sem",
      academicYear: academicYears[0] || "2024-2025",
      capacity: 40,
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {section ? "Edit Section" : "Create New Section"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., BSIT-2A"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Program</option>
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
              <select
                value={formData.yearLevel}
                onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {yearLevels.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="1st Sem">1st Semester</option>
                <option value="2nd Sem">2nd Semester</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {academicYears.map((ay) => (
                  <option key={ay} value={ay}>{ay}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {section ? "Update Section" : "Create Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ section, onConfirm, onClose, saving }) {
  if (!section) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Delete Section</h2>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <strong>{section.name}</strong>? 
          All enrolled students will be removed from this section.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Section
          </button>
        </div>
      </div>
    </div>
  );
}

export default Section;
