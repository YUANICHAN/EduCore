import '../../App.css'
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import reportService from "../../service/reportService";
import academicYearService from "../../service/academicYearService";
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
        academicYear: '2024-2025',
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
    const [savedReports, setSavedReports] = useState([]);
    
    // Sample Report Data (would come from API)
    const [reportData, setReportData] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);

    // Fetch academic years on mount
    useEffect(() => {
        const fetchAcademicYears = async () => {
            try {
                const response = await academicYearService.getAll();
                const years = (response.data || response || []).map(ay => 
                    ay.year_code || ay.year || `${ay.start_year}-${ay.end_year}`
                );
                setAcademicYears(years.length > 0 ? years : ['2024-2025', '2023-2024']);
                if (years.length > 0) {
                    setFilters(prev => ({ ...prev, academicYear: years[0] }));
                }
            } catch (err) {
                console.error('Error fetching academic years:', err);
                setAcademicYears(['2024-2025', '2023-2024']);
            }
        };
        fetchAcademicYears();
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

    // Handle Report Generation
    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            let response;
            const params = {
                academic_year: filters.academicYear,
                term: filters.term,
                course: filters.course,
                section_id: filters.section,
                subject_id: filters.subject,
            };

            // Try to use API based on report type
            switch(selectedReportType) {
                case 'grade-distribution':
                case 'pass-fail':
                case 'honor-students':
                    response = await reportService.generateGradeReport(params);
                    break;
                case 'enrollment':
                case 'student-list':
                case 'student-master-list':
                    response = await reportService.generatePerformanceReport(params);
                    break;
                case 'teacher-load':
                case 'subjects-handled':
                case 'teaching-hours':
                    response = await reportService.generateClassReport(params);
                    break;
                default:
                    // Fallback to sample data
                    response = generateSampleData(selectedReportType);
            }
            
            const data = response.data || response;
            if (data.data) {
                setReportData(data.data);
                setReportSummary(data.summary || null);
            } else {
                // Use sample data as fallback
                const sampleData = generateSampleData(selectedReportType);
                setReportData(sampleData.data);
                setReportSummary(sampleData.summary);
            }
            setReportGenerated(true);
        } catch (err) {
            console.error('Error generating report:', err);
            // Use sample data as fallback
            const sampleData = generateSampleData(selectedReportType);
            setReportData(sampleData.data);
            setReportSummary(sampleData.summary);
            setReportGenerated(true);
        } finally {
            setIsGenerating(false);
        }
    };

    // Generate sample data based on report type
    const generateSampleData = (reportType) => {
        // This is placeholder data - replace with actual API integration
        switch(reportType) {
            case 'enrollment':
                return {
                    data: [
                        { id: 1, course: 'BSIT', year_level: '1st Year', enrolled: 245, capacity: 280, percentage: 87.5 },
                        { id: 2, course: 'BSCS', year_level: '1st Year', enrolled: 198, capacity: 240, percentage: 82.5 },
                        { id: 3, course: 'BSBA', year_level: '1st Year', enrolled: 167, capacity: 200, percentage: 83.5 },
                        { id: 4, course: 'BSA', year_level: '1st Year', enrolled: 134, capacity: 180, percentage: 74.4 },
                    ],
                    summary: { total_enrolled: 744, total_capacity: 900, avg_utilization: 82.7 }
                };
            case 'student-list':
                return {
                    data: [
                        { id: 1, student_id: '2024-00001', name: 'John Dela Cruz', course: 'BSIT', section: '1-A', status: 'Enrolled' },
                        { id: 2, student_id: '2024-00002', name: 'Maria Santos', course: 'BSIT', section: '1-A', status: 'Enrolled' },
                        { id: 3, student_id: '2024-00003', name: 'Jose Garcia', course: 'BSIT', section: '1-A', status: 'Enrolled' },
                        { id: 4, student_id: '2024-00004', name: 'Ana Reyes', course: 'BSIT', section: '1-A', status: 'Enrolled' },
                        { id: 5, student_id: '2024-00005', name: 'Carlos Mendoza', course: 'BSIT', section: '1-A', status: 'Enrolled' },
                    ],
                    summary: { total_students: 5, enrolled: 5, dropped: 0 }
                };
            case 'grade-distribution':
                return {
                    data: [
                        { grade: '1.00 - 1.25', count: 45, percentage: 12.5, label: 'Excellent' },
                        { grade: '1.50 - 1.75', count: 87, percentage: 24.2, label: 'Very Good' },
                        { grade: '2.00 - 2.25', count: 123, percentage: 34.2, label: 'Good' },
                        { grade: '2.50 - 2.75', count: 78, percentage: 21.7, label: 'Satisfactory' },
                        { grade: '3.00', count: 27, percentage: 7.5, label: 'Passing' },
                    ],
                    summary: { total_grades: 360, average: 2.15, passing_rate: 92.5 }
                };
            default:
                return { data: [], summary: null };
        }
    };

    // Handle Export
    const handleExport = (format) => {
        console.log(`Exporting report as ${format}...`);
        // Implement actual export logic here
        alert(`Exporting report as ${format.toUpperCase()}...\n\nThis will generate a ${format.toUpperCase()} file with:\n- School header and logo\n- Applied filters\n- Report data\n- Summary statistics\n\n(Implementation pending)`);
    };

    // Handle Print
    const handlePrint = () => {
        console.log('Printing report...');
        window.print();
    };

    // Reset Filters
    const resetFilters = () => {
        setFilters({
            academicYear: '2024-2025',
            term: '',
            course: '',
            section: '',
            subject: '',
            status: 'all'
        });
        setReportGenerated(false);
        setReportData([]);
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
                                                <option value="2024-2025">AY 2024-2025</option>
                                                <option value="2023-2024">AY 2023-2024</option>
                                                <option value="2022-2023">AY 2022-2023</option>
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
                                                <option value="1st">1st Semester</option>
                                                <option value="2nd">2nd Semester</option>
                                                <option value="summer">Summer</option>
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
                                                <option value="BSIT">BSIT</option>
                                                <option value="BSCS">BSCS</option>
                                                <option value="BSBA">BSBA</option>
                                                <option value="BSA">BSA</option>
                                            </select>
                                        </div>

                                        {/* Section */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                                            <select
                                                value={filters.section}
                                                onChange={(e) => setFilters({...filters, section: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Sections</option>
                                                <option value="1-A">1-A</option>
                                                <option value="1-B">1-B</option>
                                                <option value="2-A">2-A</option>
                                                <option value="2-B">2-B</option>
                                            </select>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <BookOpen className="w-4 h-4 inline mr-1" />
                                                Subject
                                            </label>
                                            <select
                                                value={filters.subject}
                                                onChange={(e) => setFilters({...filters, subject: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Subjects</option>
                                                <option value="PROG1">Programming 1</option>
                                                <option value="PROG2">Programming 2</option>
                                                <option value="WEBDEV">Web Development</option>
                                                <option value="DATABASE">Database Management</option>
                                            </select>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select
                                                value={filters.status}
                                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="enrolled">Enrolled</option>
                                                <option value="dropped">Dropped</option>
                                                <option value="graduated">Graduated</option>
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
                                                Academic Year: {filters.academicYear} {filters.term && `• ${filters.term} Semester`}
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
                                                        <span>{value}</span>
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
