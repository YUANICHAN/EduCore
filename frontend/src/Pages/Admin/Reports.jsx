import '../../App.css'
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import reportService from "../../service/reportService";
import academicYearService from "../../service/academicYearService";
import programService from "../../service/programService";
import sectionService from "../../service/sectionService";
import subjectService from "../../service/subjectService";
import studentService from "../../service/studentService";
import { 
  FileText,
  Printer,
  Filter,
  Calendar,
  Users,
  BookOpen,
  UserCheck,
  GraduationCap,
  BarChart3,
  PieChart,
  Download,
  Save,
  Play,
  X,
  ChevronDown,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';

function Reports() {
    const [activeItem, setActiveItem] = useState("Reports");
    
    // Report Selection State
    const [selectedReportType, setSelectedReportType] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('academic');
    
    // Filter State
    const [filters, setFilters] = useState({
        academicYear: '',
        term: '',
        course: '',
        section: '',
        subject: '',
        status: 'all'
    });
    
    // UI State
    const [showFilters, setShowFilters] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [error, setError] = useState(null);
    
    // API Data State
    const [academicYears, setAcademicYears] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [allSections, setAllSections] = useState([]); // Keep original data
    const [allSubjects, setAllSubjects] = useState([]); // Keep original data
    const [termOptions, setTermOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [savedReports, setSavedReports] = useState([]);
    
    // Sample Report Data (would come from API)
    const [reportData, setReportData] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [ayRes, progRes, secRes, subRes, stuRes] = await Promise.allSettled([
                    academicYearService.getAll(),
                    programService.getAll({ per_page: 'all' }),
                    sectionService.getAll({ per_page: 'all' }),
                    subjectService.getAll({ per_page: 'all' }),
                    studentService.getAll({ per_page: 1000 }),
                ]);

                const ayRows = ayRes.status === 'fulfilled' ? (ayRes.value.data || ayRes.value || []) : [];
                const mappedYears = ayRows.map((ay) => ({
                    id: ay.id,
                    label: ay.year_code || ay.year || `${ay.start_year || ''}-${ay.end_year || ''}`,
                }));
                setAcademicYears(mappedYears);
                if (mappedYears.length > 0) {
                    setFilters((prev) => ({ ...prev, academicYear: String(mappedYears[0].id) }));
                }

                const progRows = progRes.status === 'fulfilled' ? (progRes.value.data || progRes.value || []) : [];
                setPrograms(
                    progRows.map((p) => ({
                        id: p.id,
                        code: p.program_code || p.code || `Program ${p.id}`,
                        name: p.program_name || p.name || p.program_code || p.code || `Program ${p.id}`,
                    }))
                );

                const sectionRows = secRes.status === 'fulfilled' ? (secRes.value.data || secRes.value || []) : [];
                const mappedSections = sectionRows.map((s) => ({
                    id: s.id,
                    code: s.section_code || s.name || `Section ${s.id}`,
                    program_id: s.program_id ?? s.course_id ?? s.program?.id ?? null,
                }));
                setAllSections(mappedSections);
                setSections(mappedSections);

                const subjectRows = subRes.status === 'fulfilled' ? (subRes.value.data || subRes.value || []) : [];
                const mappedSubjects = subjectRows.map((s) => ({
                    id: s.id,
                    code: s.subject_code || s.code || `Subject ${s.id}`,
                    name: s.subject_name || s.name || s.subject_code || s.code || `Subject ${s.id}`,
                    semester: s.semester || null,
                    program_id: s.program_id ?? s.course_id ?? s.program?.id ?? null,
                }));
                setAllSubjects(mappedSubjects);
                setSubjects(mappedSubjects);

                const semesters = [...new Set(mappedSubjects.map((s) => s.semester).filter(Boolean))];
                setTermOptions(semesters);

                const studentRows = stuRes.status === 'fulfilled' ? (stuRes.value.data || stuRes.value || []) : [];
                const statuses = [...new Set(
                    studentRows
                        .map((s) => s.enrollment_status || s.account_status)
                        .filter(Boolean)
                )];
                setStatusOptions(statuses);
            } catch (err) {
                console.error('Error fetching filter options:', err);
                setError('Failed to load report filter options.');
            }
        };
        fetchFilterOptions();
    }, []);

    // Fetch saved reports
    useEffect(() => {
        const fetchSavedReports = async () => {
            try {
                const response = await reportService.getAll();
                setSavedReports(response.data || response || []);
            } catch (err) {
                console.error('Error fetching saved reports:', err);
            }
        };
        fetchSavedReports();
    }, []);

    // Fetch sections and subjects filtered by selected program
    useEffect(() => {
        if (!filters.course) {
            // If no program selected, show all sections/subjects
            setSections(allSections);
            setSubjects(allSubjects);
            // Reset term options
            const semesters = [...new Set(allSubjects.map((s) => s.semester).filter(Boolean))];
            setTermOptions(semesters);
            setFilters((prev) => ({
                ...prev,
                section: '',
                subject: '',
                term: prev.term && semesters.includes(prev.term) ? prev.term : '',
            }));
            return;
        }

        // Filter sections and subjects by selected program
        const filteredSections = allSections.filter((s) => String(s.program_id) === String(filters.course));
        const filteredSubjects = allSubjects.filter((s) => String(s.program_id) === String(filters.course));
        
        setSections(filteredSections);
        setSubjects(filteredSubjects);

        // Update term options based on filtered subjects (from selected program only)
        const semesters = [...new Set(filteredSubjects.map((s) => s.semester).filter(Boolean))];
        setTermOptions(semesters);

        // Clear dependent selections but keep term if valid for the selected program.
        setFilters((prev) => ({
            ...prev,
            section: '',
            subject: '',
            term: prev.term && semesters.includes(prev.term) ? prev.term : '',
        }));
    }, [filters.course, allSections, allSubjects]);

    // Clear subject selection when term changes (since available subjects may change)
    useEffect(() => {
        if (!filters.term) {
            return;
        }

        // Clear subject selection when term changes since available subjects for the new term may differ
        if (filters.subject) {
            const availableSubjectsForTerm = subjects.filter(s => s.semester === filters.term);
            if (!availableSubjectsForTerm.find(s => String(s.id) === String(filters.subject))) {
                setFilters(prev => ({ ...prev, subject: '' }));
            }
        }
    }, [filters.term, subjects]);

    // Report Categories
    const reportCategories = [
        { id: 'academic', label: 'Academic Reports', icon: GraduationCap, color: 'text-blue-600' },
        { id: 'faculty', label: 'Faculty Reports', icon: UserCheck, color: 'text-green-600' },
        { id: 'student', label: 'Student Reports', icon: Users, color: 'text-purple-600' },
        { id: 'administrative', label: 'Administrative Reports', icon: BarChart3, color: 'text-orange-600' },
    ];

    // Report Types by Category
    const reportTypes = {
        academic: [
            { id: 'enrollment', label: 'Enrollment Report', description: 'View enrollment statistics by course and section' },
            { id: 'student-list', label: 'Student List by Course/Section', description: 'Detailed student roster with filters' },
            { id: 'subject-offerings', label: 'Subject Offerings per AY', description: 'All subjects offered in academic year' },
            { id: 'grade-distribution', label: 'Grade Distribution Report', description: 'Grade analysis across courses' },
            { id: 'pass-fail', label: 'Pass/Fail Rate', description: 'Success rate analysis per subject' },
            { id: 'honor-students', label: 'Honor Students', description: 'Dean\'s list and academic achievers' },
        ],
        faculty: [
            { id: 'teacher-load', label: 'Teacher Load Report', description: 'Teaching assignments and workload' },
            { id: 'subjects-handled', label: 'Subjects Handled per Teacher', description: 'Subject distribution among faculty' },
            { id: 'teaching-hours', label: 'Teaching Hours Summary', description: 'Total teaching hours per faculty' },
        ],
        student: [
            { id: 'student-master-list', label: 'Student Master List', description: 'Complete student database' },
            { id: 'enrollment-history', label: 'Student Enrollment History', description: 'Historical enrollment data per student' },
            { id: 'academic-record', label: 'Student Academic Record', description: 'Complete academic performance records' },
            { id: 'grade-card', label: 'Grade Card/Transcript (Basic)', description: 'Student grades and transcripts' },
        ],
        administrative: [
            { id: 'enrollment-stats', label: 'Enrollment Statistics', description: 'Comprehensive enrollment analytics' },
            { id: 'course-popularity', label: 'Course Popularity', description: 'Most in-demand programs' },
            { id: 'section-capacity', label: 'Section Capacity Usage', description: 'Space utilization analysis' },
            { id: 'year-over-year', label: 'Year-over-Year Growth', description: 'Trends and growth patterns' },
        ],
    };

    const extractRowsFromReportContent = (content) => {
        if (!content || typeof content !== 'object') return [];
        if (Array.isArray(content.data)) return content.data;
        if (Array.isArray(content.subjects)) return content.subjects;
        if (Array.isArray(content.records)) return content.records;
        if (Array.isArray(content.students)) return content.students;
        if (Array.isArray(content.by_subject)) return content.by_subject;
        if (Array.isArray(content.top_performers)) return content.top_performers;
        if (content.gpa_distribution && typeof content.gpa_distribution === 'object') {
            return Object.entries(content.gpa_distribution).map(([range, count]) => ({ range, count }));
        }
        return [];
    };

    // Handle Report Generation
    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            let academicYearValue = filters.academicYear;

            // Backward compatibility: resolve label values to IDs when needed.
            if (academicYearValue && Number.isNaN(Number(academicYearValue))) {
                const matched = academicYears.find((ay) => ay.label === academicYearValue);
                academicYearValue = matched?.id ? String(matched.id) : '';
            }

            // Fallback to first available academic year if the filter is temporarily empty.
            if (!academicYearValue && academicYears[0]?.id) {
                academicYearValue = String(academicYears[0].id);
                setFilters((prev) => ({ ...prev, academicYear: academicYearValue }));
            }

            if (!academicYearValue) {
                throw new Error('Please select an academic year.');
            }

            let response;
            const params = {
                academic_year_id: Number(academicYearValue),
                term: filters.term || undefined,
                program_id: filters.course ? Number(filters.course) : undefined,
                section_id: filters.section ? Number(filters.section) : undefined,
                subject_id: filters.subject ? Number(filters.subject) : undefined,
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
            };

            // Use backend report generators only (no hardcoded sample data)
            switch(selectedReportType) {
                case 'grade-distribution':
                case 'pass-fail':
                case 'honor-students':
                case 'enrollment':
                case 'student-list':
                case 'student-master-list':
                case 'teacher-load':
                case 'subjects-handled':
                case 'teaching-hours':
                case 'enrollment-stats':
                case 'course-popularity':
                case 'section-capacity':
                case 'year-over-year':
                case 'academic-record':
                case 'grade-card':
                    response = await reportService.generatePerformanceReport(params);
                    break;
                default:
                    response = await reportService.generatePerformanceReport(params);
            }
            
            const payload = response.data || response;
            const reportContent = payload.report_content || payload?.data?.data || payload?.data || null;
            const rows = extractRowsFromReportContent(reportContent);
            const summary = reportContent?.summary || reportContent?.statistics || null;

            setReportData(rows);
            setReportSummary(summary);
            setReportGenerated(true);
        } catch (err) {
            console.error('Error generating report:', err);
            setReportGenerated(false);
            setReportData([]);
            setReportSummary(null);
            setError(err.response?.data?.message || err.message || 'Failed to generate report.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle Export
    const handleExport = async (format) => {
        if (!reportGenerated || !selectedReportType) {
            setError('Generate a report first before exporting.');
            return;
        }

        try {
            const reportLabel = reportTypes[selectedCategory]?.find(r => r.id === selectedReportType)?.label || 'Generated Report';
            const payload = {
                report_title: reportLabel,
                report_type: selectedReportType,
                filters,
                summary: reportSummary || {},
                data: reportData || [],
            };

            const response = await reportService.exportGeneratedReport(format, payload);
            const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });

            const disposition = response.headers['content-disposition'] || '';
            const filenameMatch = disposition.match(/filename="?([^\";]+)"?/i);
            const defaultExt = format === 'excel' ? 'xls' : format;
            const filename = filenameMatch?.[1] || `report_${Date.now()}.${defaultExt}`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            setError('Failed to export report. Please try again.');
        }
    };

    // Handle Print
    const handlePrint = () => {
        console.log('Printing report...');
        window.print();
    };

    // Reset Filters
    const resetFilters = () => {
        setFilters({
            academicYear: academicYears[0]?.id ? String(academicYears[0].id) : '',
            term: '',
            course: '',
            section: '',
            subject: '',
            status: 'all'
        });
        setReportGenerated(false);
        setReportData([]);
    };

    const getFilterDisplayValue = (key, value) => {
        if (key === 'academicYear') {
            return academicYears.find((ay) => String(ay.id) === String(value))?.label || value;
        }
        if (key === 'course') {
            const program = programs.find((p) => String(p.id) === String(value));
            return program ? `${program.code} - ${program.name}` : value;
        }
        if (key === 'section') {
            return sections.find((s) => String(s.id) === String(value))?.code || value;
        }
        if (key === 'subject') {
            const subject = subjects.find((s) => String(s.id) === String(value));
            return subject ? `${subject.code} - ${subject.name}` : value;
        }
        return value;
    };

    return (
        <div className="flex h-screen">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
            
            <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">📊 Reports & Analytics</h1>
                            <p className="text-gray-600 mt-1">Generate comprehensive academic and administrative reports</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowSaveModal(true)}
                                disabled={!reportGenerated}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                <span className="font-medium">Save Report</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-blue-900 font-medium">Reports are READ-ONLY</p>
                        <p className="text-xs text-blue-700 mt-1">Reports do not modify data. They provide detailed, filter-driven, and exportable academic data for formal analysis and documentation.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Panel - Report Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Report Category Selection */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Report Category</h2>
                            <div className="space-y-2">
                                {reportCategories.map((category) => {
                                    const Icon = category.icon;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => {
                                                setSelectedCategory(category.id);
                                                setSelectedReportType('');
                                                setReportGenerated(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                                selectedCategory === category.id
                                                    ? 'bg-blue-50 border-2 border-blue-500'
                                                    : 'bg-white border border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 ${selectedCategory === category.id ? 'text-blue-600' : category.color}`} />
                                            <span className={`text-sm font-medium ${selectedCategory === category.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                                {category.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Report Type Selection */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Report Type</h2>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {reportTypes[selectedCategory]?.map((report) => (
                                    <button
                                        key={report.id}
                                        onClick={() => {
                                            setSelectedReportType(report.id);
                                            setReportGenerated(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                                            selectedReportType === report.id
                                                ? 'bg-green-50 border-2 border-green-500'
                                                : 'bg-white border border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`text-sm font-medium ${selectedReportType === report.id ? 'text-green-900' : 'text-gray-900'}`}>
                                            {report.label}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">{report.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Filters and Report Display */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Filters Panel */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div 
                                className="flex items-center justify-between p-5 border-b border-gray-200 cursor-pointer"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <div className="flex items-center gap-3">
                                    <Filter className="w-5 h-5 text-gray-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </div>

                            {showFilters && (
                                <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Academic Year */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                Academic Year
                                            </label>
                                            <select
                                                value={filters.academicYear}
                                                onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Select Academic Year</option>
                                                {academicYears.map((ay) => (
                                                    <option key={ay.id} value={String(ay.id)}>{ay.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Term/Semester */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Term/Semester</label>
                                            <select
                                                value={filters.term}
                                                onChange={(e) => setFilters({...filters, term: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Terms</option>
                                                {termOptions.map((term) => (
                                                    <option key={term} value={term}>{term}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Course */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <GraduationCap className="w-4 h-4 inline mr-1" />
                                                Course/Program
                                            </label>
                                            <select
                                                value={filters.course}
                                                onChange={(e) => setFilters({...filters, course: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Courses</option>
                                                {programs.map((program) => (
                                                    <option key={program.id} value={String(program.id)}>{program.code} - {program.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Section */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${!filters.term || !filters.course ? 'text-gray-400' : 'text-gray-700'}`}>
                                                Section
                                                {(!filters.term || !filters.course) && <span className="text-xs text-gray-400"> (Select Term & Course first)</span>}
                                            </label>
                                            <select
                                                disabled={!filters.term || !filters.course}
                                                value={filters.section}
                                                onChange={(e) => setFilters({...filters, section: e.target.value})}
                                                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                                                    !filters.term || !filters.course
                                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                                }`}
                                            >
                                                <option value="">All Sections</option>
                                                {sections.map((section) => (
                                                    <option key={section.id} value={String(section.id)}>{section.code}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${!filters.term || !filters.course ? 'text-gray-400' : 'text-gray-700'}`}>
                                                <BookOpen className="w-4 h-4 inline mr-1" />
                                                Subject
                                                {(!filters.term || !filters.course) && <span className="text-xs text-gray-400"> (Select Term & Course first)</span>}
                                            </label>
                                            <select
                                                disabled={!filters.term || !filters.course}
                                                value={filters.subject}
                                                onChange={(e) => setFilters({...filters, subject: e.target.value})}
                                                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                                                    !filters.term || !filters.course
                                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                                }`}
                                            >
                                                <option value="">All Subjects</option>
                                                {subjects
                                                    .filter(subject => !filters.term || subject.semester === filters.term)
                                                    .map((subject) => (
                                                        <option key={subject.id} value={String(subject.id)}>{subject.code} - {subject.name}</option>
                                                    ))}
                                            </select>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${!filters.term || !filters.course ? 'text-gray-400' : 'text-gray-700'}`}>
                                                Status
                                                {(!filters.term || !filters.course) && <span className="text-xs text-gray-400"> (Select Term & Course first)</span>}
                                            </label>
                                            <select
                                                disabled={!filters.term || !filters.course}
                                                value={filters.status}
                                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                                                    !filters.term || !filters.course
                                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                                }`}
                                            >
                                                <option value="all">All Status</option>
                                                {statusOptions.map((status) => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={handleGenerateReport}
                                            disabled={!selectedReportType || isGenerating}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    <span>Generate Report</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Reset</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Report Display Area */}
                        {reportGenerated ? (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                {/* Report Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {reportTypes[selectedCategory]?.find(r => r.id === selectedReportType)?.label}
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Academic Year: {academicYears.find((ay) => String(ay.id) === String(filters.academicYear))?.label || 'N/A'} {filters.term && `• ${filters.term}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleExport('pdf')}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-sm font-medium">PDF</span>
                                            </button>
                                            <button
                                                onClick={() => handleExport('excel')}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-sm font-medium">Excel</span>
                                            </button>
                                            <button
                                                onClick={() => handleExport('csv')}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-sm font-medium">CSV</span>
                                            </button>
                                            <button
                                                onClick={handlePrint}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                            >
                                                <Printer className="w-4 h-4" />
                                                <span className="text-sm font-medium">Print</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Applied Filters Display */}
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(filters).map(([key, value]) => {
                                            if (value && value !== 'all') {
                                                return (
                                                    <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                                        <span>{getFilterDisplayValue(key, value)}</span>
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>

                                {/* Report Summary Cards */}
                                {reportSummary && (
                                    <div className="p-6 bg-gray-50 border-b border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {Object.entries(reportSummary).map(([key, value], index) => (
                                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <div className="text-sm text-gray-600 capitalize mb-1">
                                                        {key.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900">
                                                        {typeof value === 'number' ? value.toLocaleString() : value}
                                                        {key.includes('percentage') || key.includes('rate') || key.includes('utilization') ? '%' : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Report Data Table */}
                                <div className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    {reportData[0] && Object.keys(reportData[0]).map((key) => {
                                                        if (key !== 'id') {
                                                            return (
                                                                <th key={key} className="text-left py-3 px-4 text-sm font-semibold text-gray-700 capitalize">
                                                                    {key.replace(/_/g, ' ')}
                                                                </th>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.map((row, index) => (
                                                    <tr key={row.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        {Object.entries(row).map(([key, value]) => {
                                                            if (key !== 'id') {
                                                                return (
                                                                    <td key={key} className="py-3 px-4 text-sm text-gray-900">
                                                                        {key === 'percentage' || key.includes('percentage') 
                                                                            ? `${value}%` 
                                                                            : value}
                                                                    </td>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {reportData.length === 0 && (
                                        <div className="text-center py-12">
                                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600">No data available for the selected filters</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Empty State
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
                                <div className="text-center">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
                                    <p className="text-gray-600 mb-6">
                                        Select a report type, configure your filters, and click "Generate Report" to view data
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg">
                                        <Info className="w-5 h-5" />
                                        <span className="text-sm">
                                            {!selectedReportType 
                                                ? 'Please select a report type from the left panel' 
                                                : 'Click "Generate Report" to view data'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Report Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Save Report Configuration</h3>
                            <button 
                                onClick={() => setShowSaveModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Monthly Enrollment Report"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                                <textarea
                                    placeholder="Add notes about this report configuration..."
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-900">
                                    <Info className="w-4 h-4 inline mr-1" />
                                    Saved reports can be re-run later with the same filter configuration
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    alert('Report configuration saved!\n\n(Implementation pending)');
                                    setShowSaveModal(false);
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Save Configuration
                            </button>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reports;
