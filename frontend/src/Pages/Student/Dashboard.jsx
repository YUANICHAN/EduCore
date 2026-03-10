import '../../App.css';
import { useState, useEffect } from "react";
import Sidebar from "../../Components/Student/Sidebar.jsx";
import dashboardService from "../../service/dashboardService";
import academicYearService from "../../service/academicYearService";
import { 
  BookOpen, 
  Users, 
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Volume2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

function Dashboard() {
    const [activeItem, setActiveItem] = useState("Dashboard");
    const [selectedYear, setSelectedYear] = useState('');
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Student data from API
    const [studentData, setStudentData] = useState({
        studentId: "",
        name: "",
        program: "",
        yearLevel: "",
        section: "",
        isEnrolled: false,
        gpa: 0,
        academicStanding: "",
        enrolledSubjects: 0,
        completedUnits: 0,
        totalUnits: 0
    });

    // Academic Period
    const [academicPeriod, setAcademicPeriod] = useState({
        year: "",
        semester: "",
        status: ""
    });

    // Data from API
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [enrolledSubjects, setEnrolledSubjects] = useState([]);

    // Fetch academic years
    useEffect(() => {
        const fetchAcademicYears = async () => {
            try {
                const response = await academicYearService.getAll();
                const years = response.data || [];
                setAcademicYears(years);
                
                // Set current year as default
                const current = years.find(y => y.is_current) || years[0];
                if (current) {
                    setSelectedYear(current.year || `${current.start_year}-${current.end_year}`);
                    setAcademicPeriod({
                        year: current.year || `${current.start_year}-${current.end_year}`,
                        semester: current.current_semester || '1st Semester',
                        status: 'Ongoing'
                    });
                }
            } catch (err) {
                console.error('Failed to fetch academic years:', err);
            }
        };
        fetchAcademicYears();
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await dashboardService.getStudentDashboard({ academic_year: selectedYear });
                const data = response.data || response;
                
                // Update student data
                setStudentData({
                    studentId: data.student_id || data.studentId || '',
                    name: data.name || data.student_name || '',
                    program: data.program || data.program_name || '',
                    yearLevel: data.year_level || data.yearLevel || '',
                    section: data.section || '',
                    isEnrolled: data.is_enrolled !== undefined ? data.is_enrolled : data.isEnrolled !== undefined ? data.isEnrolled : true,
                    gpa: data.gpa || 0,
                    academicStanding: data.academic_standing || data.academicStanding || '',
                    enrolledSubjects: data.enrolled_subjects_count || data.enrolledSubjects || 0,
                    completedUnits: data.completed_units || data.completedUnits || 0,
                    totalUnits: data.total_units || data.totalUnits || 144
                });

                setTodaySchedule(data.today_schedule || data.todaySchedule || []);
                setAnnouncements(data.announcements || []);
                setEnrolledSubjects(data.enrolled_subjects || data.enrolledSubjects || []);
            } catch (err) {
                console.error('Failed to fetch dashboard:', err);
                setError('Failed to load dashboard data.');
                // Use fallback data
                setStudentData({
                    studentId: "2024-CS-001",
                    name: "Student",
                    program: "Bachelor of Science",
                    yearLevel: "1st Year",
                    section: "A",
                    isEnrolled: true,
                    gpa: 0,
                    academicStanding: "",
                    enrolledSubjects: 0,
                    completedUnits: 0,
                    totalUnits: 144
                });
            } finally {
                setLoading(false);
            }
        };
        
        if (selectedYear) {
            fetchDashboard();
        }
    }, [selectedYear]);

    // Summary KPI Cards
    const kpiData = [
        { 
            label: "GPA", 
            value: studentData.gpa ? studentData.gpa.toFixed(2) : 'N/A', 
            icon: Award, 
            color: 'bg-green-500',
            subtext: studentData.academicStanding || 'No standing yet'
        },
        { 
            label: 'Enrolled Subjects', 
            value: enrolledSubjects.length || studentData.enrolledSubjects || 0, 
            icon: BookOpen, 
            color: 'bg-blue-500',
            subtext: `${academicPeriod.semester}`
        },
        { 
            label: 'Units Completed', 
            value: `${studentData.completedUnits}/${studentData.totalUnits}`, 
            icon: TrendingUp, 
            color: 'bg-purple-500',
            subtext: studentData.totalUnits > 0 ? `${Math.round((studentData.completedUnits/studentData.totalUnits)*100)}% Complete` : '0% Complete'
        },
        { 
            label: "Today's Classes", 
            value: todaySchedule.length, 
            icon: Calendar, 
            color: 'bg-orange-500',
            subtext: 'Scheduled today'
        },
    ];

    const getAnnouncementIcon = (type) => {
        switch(type) {
            case 'exam': return AlertCircle;
            case 'deadline': return Clock;
            case 'event': return Calendar;
            default: return Volume2;
        }
    };

    const getPriorityColor = (priority) => {
        return priority === 'high' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500';
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
            <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
                {/* Header with Academic Year Filter */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {studentData.name || 'Student'}! Here's your academic overview</p>
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {academicYears.length > 0 ? (
                                academicYears.map(year => (
                                    <option key={year.id} value={year.year || `${year.start_year}-${year.end_year}`}>
                                        AY {year.year || `${year.start_year}-${year.end_year}`}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="2024-2025">AY 2024-2025</option>
                                    <option value="2023-2024">AY 2023-2024</option>
                                    <option value="2022-2023">AY 2022-2023</option>
                                </>
                            )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                {/* Enrollment Status Alert */}
                {!studentData.isEnrolled ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                            <div>
                                <h3 className="text-red-800 font-semibold">You are not enrolled</h3>
                                <p className="text-red-700 text-sm mt-1">
                                    Please contact the registrar's office to complete your enrollment for {academicPeriod.year} - {academicPeriod.semester}.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            <div>
                                <h3 className="text-green-800 font-semibold">Enrollment Status: Active</h3>
                                <p className="text-green-700 text-sm mt-1">
                                    {studentData.program} - {studentData.yearLevel} ({studentData.section}) • {academicPeriod.year} - {academicPeriod.semester}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {kpiData.map((kpi, index) => {
                        const Icon = kpi.icon;
                        return (
                            <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 ${kpi.color} rounded-lg flex items-center justify-center`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                                <div className="text-xs text-gray-600 mt-1">{kpi.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{kpi.subtext}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Today's Schedule */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                            <span className="ml-auto text-sm text-gray-500">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        
                        {todaySchedule.length > 0 ? (
                            <div className="space-y-4">
                                {todaySchedule.map((item, index) => (
                                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="shrink-0">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Clock className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900">{item.subject}</h3>
                                                    <p className="text-xs text-gray-600 mt-1">{item.code} • {item.instructor}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {item.time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    {item.room}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No classes scheduled for today</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Announcements */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Volume2 className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {announcements.slice(0, 4).map((announcement) => {
                                const Icon = getAnnouncementIcon(announcement.type);
                                return (
                                    <div 
                                        key={announcement.id} 
                                        className={`p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${getPriorityColor(announcement.priority)}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <Icon className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                                                <p className="text-xs text-gray-600 line-clamp-2">{announcement.content}</p>
                                                <span className="text-xs text-gray-500 mt-1 block">{announcement.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View All Announcements →
                        </button>
                    </div>
                </div>

                {/* Enrolled Subjects Section */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Enrolled Subjects</h2>
                        </div>
                        <span className="text-sm text-gray-600">
                            {enrolledSubjects.length} subjects • {enrolledSubjects.reduce((sum, s) => sum + (s.units || 0), 0)} units
                        </span>
                    </div>
                    
                    {enrolledSubjects.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject Name</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Units</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {enrolledSubjects.map((subject, index) => (
                                        <tr key={subject.id || index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.code || subject.subject_code || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{subject.name || subject.subject_name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 text-center">{subject.units || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{subject.grade || 'TBA'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No enrolled subjects found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
