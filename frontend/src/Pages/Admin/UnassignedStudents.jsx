import '../../App.css';
import { useState, useMemo } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import studentService from "../../service/studentService";
import programService from "../../service/programService";
import sectionService from "../../service/sectionService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  Mail,
  Filter,
  ChevronDown,
  Home,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';

function UnassignedStudents() {
  const [activeItem, setActiveItem] = useState("Unassigned Students");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const queryClient = useQueryClient();

  // Fetch programs
  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => programService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const programs = useMemo(() => {
    return programsQuery.data?.data || programsQuery.data || [];
  }, [programsQuery.data]);

  // Fetch unassigned students
  const studentsQuery = useQuery({
    queryKey: ['unassignedStudents', selectedProgram?.id, searchTerm, currentPage, entriesPerPage],
    queryFn: () => studentService.getAll({
      // Fetch unassigned students directly from backend with pagination
      ...(selectedProgram && { program_id: selectedProgram.id }),
      search: searchTerm || undefined,
      unassigned_only: true,
      page: currentPage,
      per_page: entriesPerPage,
    }),
    staleTime: 30 * 1000,
  });

  const allStudents = useMemo(() => {
    const data = studentsQuery.data?.data || [];
    return Array.isArray(data) ? data : [];
  }, [studentsQuery.data]);

  // Pagination
  const totalStudents = studentsQuery.data?.total ?? allStudents.length;
  const totalPages = studentsQuery.data?.last_page ?? Math.ceil(totalStudents / entriesPerPage);
  const paginatedStudents = allStudents;

  // Fetch sections for the selected program
  const sectionsQuery = useQuery({
    queryKey: ['sectionsForAssignment', selectedProgram?.id],
    queryFn: () => sectionService.getAll({ program_id: selectedProgram?.id }),
    enabled: !!selectedProgram,
    staleTime: 5 * 60 * 1000,
  });

  const sections = useMemo(() => {
    return sectionsQuery.data?.data || sectionsQuery.data || [];
  }, [sectionsQuery.data]);

  const loading = programsQuery.isLoading || studentsQuery.isLoading;

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudents(newSet);
  };

  // Select all students (on current page)
  const selectAllStudents = () => {
    const newSet = new Set(selectedStudents);
    const allCurrentPageSelected = paginatedStudents.every(s => newSet.has(s.id));
    
    if (allCurrentPageSelected) {
      // Deselect all on current page
      paginatedStudents.forEach(s => newSet.delete(s.id));
    } else {
      // Select all on current page
      paginatedStudents.forEach(s => newSet.add(s.id));
    }
    setSelectedStudents(newSet);
  };

  // Assign students to section
  const handleAssignToSection = async () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student');
      return;
    }

    if (!selectedSection) {
      setError('Please select a section');
      return;
    }

    setIsAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const studentIds = Array.from(selectedStudents);
      
      // Update each student with the section_id
      await Promise.all(
        studentIds.map(studentId =>
          studentService.update(studentId, { section_id: selectedSection.id })
        )
      );

      setSuccess(`Successfully assigned ${studentIds.length} student(s) to ${selectedSection.section_code}`);
      setSelectedStudents(new Set());
      
      // Refetch both unassigned and assigned students lists
      await queryClient.invalidateQueries({ queryKey: ['unassignedStudents'] });
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign students');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="h-screen bg-gray-50 flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Unassigned Students</h1>
            <p className="text-gray-600 mt-1">Students not yet assigned to a section</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Program Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Program
                </label>
                <select
                  value={selectedProgram?.id || ''}
                  onChange={(e) => {
                    const program = programs.find(p => p.id === parseInt(e.target.value));
                    setSelectedProgram(program || null);
                    setSelectedSection(null);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a program...</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.program_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Section
                </label>
                <select
                  value={selectedSection?.id || ''}
                  onChange={(e) => {
                    const section = sections.find(s => s.id === parseInt(e.target.value));
                    setSelectedSection(section || null);
                  }}
                  disabled={!selectedProgram}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a section...</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.section_code} - {section.program?.program_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-2" />
                  Search Students
                </label>
                <input
                  type="text"
                  placeholder="Search by name or student number..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : totalStudents === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No unassigned students found</p>
                <p className="text-gray-400 text-sm mt-1">All students have been assigned to sections</p>
              </div>
            ) : (
              <>
                {/* Top Pagination Bar */}
                {totalStudents > 0 && (
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
                    </span>
                  </div>
                )}

                {/* Toolbar */}
                <div className="border-b border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === paginatedStudents.length && paginatedStudents.length > 0}
                        onChange={selectAllStudents}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select All ({paginatedStudents.length})
                      </span>
                    </label>
                  </div>
                  {selectedStudents.size > 0 && (
                    <button
                      onClick={handleAssignToSection}
                      disabled={!selectedSection || isAssigning}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Assign Selected ({selectedStudents.size})</span>
                      {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={selectedStudents.size === paginatedStudents.length && paginatedStudents.length > 0}
                            onChange={selectAllStudents}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Student Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Program
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedStudents.map((student) => (
                        <tr
                          key={student.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedStudents.has(student.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.student_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{student.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.program?.program_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Unassigned
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Pagination */}
                {totalPages > 1 && (
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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnassignedStudents;
