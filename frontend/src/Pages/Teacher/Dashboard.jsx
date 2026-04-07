import '../../App.css'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Teacher/Sidebar.jsx";
import dashboardService from "../../service/dashboardService";
import academicYearService from "../../service/academicYearService";
import { 
  BookOpen, 
  Users, 
  FileText, 
  Volume2,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Calendar,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Title, Tooltip, Legend);

function getSubjectDisplay(value, fallback = 'N/A') {
    if (typeof value === 'string') {
        return value;
    }

    if (value && typeof value === 'object') {
        return value.subject_name || value.subject_code || value.name || fallback;
    }

    return fallback;
}

function Dashboard() {
    const navigate = useNavigate();
    const [activeItem, setActiveItem] = useState("Dashboard");
    const [selectedYear, setSelectedYear] = useState('');
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dashboard data from API
    const [dashboardData, setDashboardData] = useState({
        todaysClasses: 0,
        totalSubjects: 0,
        studentsEnrolled: 0,
        pendingGrades: 0,
    });
    const [todayClasses, setTodayClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [pendingSubmissions, setPendingSubmissions] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

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
                    setSelectedYear(current.year_code || current.year || `${current.start_year}-${current.end_year}`);
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
                const response = await dashboardService.getTeacherDashboard({ academic_year: selectedYear });
                const data = response.data || response;
                
                setDashboardData({
                    todaysClasses: data.todays_classes || data.todaysClasses || 0,
                    totalSubjects: data.total_subjects || data.totalSubjects || 0,
                    studentsEnrolled: data.students_enrolled || data.studentsEnrolled || 0,
                    pendingGrades: data.pending_grades || data.pendingGrades || 0,
                });
                
                setTodayClasses(data.today_schedule || data.todaySchedule || []);
                setSubjects(data.subjects || []);
                setPendingSubmissions(data.pending_submissions || data.pendingSubmissions || []);
                setAnnouncements(data.announcements || []);
            } catch (err) {
                console.error('Failed to fetch dashboard:', err);
                setError('Failed to load dashboard data.');
                // Clear data on error - no fallback
                setDashboardData({
                    todaysClasses: 0,
                    totalSubjects: 0,
                    studentsEnrolled: 0,
                    pendingGrades: 0,
                });
            } finally {
                setLoading(false);
            }
        };
        
        if (selectedYear) {
            fetchDashboard();
        }
    }, [selectedYear]);

    // KPI Data - Teacher specific metrics
    const kpiData = [
        { label: "Today's Classes", value: dashboardData.todaysClasses.toString(), icon: BookOpen, color: 'bg-blue-500' },
        { label: 'Total Subjects', value: dashboardData.totalSubjects.toString(), icon: FileText, color: 'bg-green-500' },
        { label: 'Students Enrolled', value: dashboardData.studentsEnrolled.toString(), icon: Users, color: 'bg-purple-500' },
        { label: 'Pending Grades', value: dashboardData.pendingGrades.toString(), icon: AlertCircle, color: 'bg-orange-500' },
    ];

    // Quick Actions
    const quickActions = [
        { label: 'Submit Grades', icon: FileText, color: 'bg-blue-600 hover:bg-blue-700', path: '/teacher/gradebook' },
        { label: 'Mark Attendance', icon: Users, color: 'bg-green-600 hover:bg-green-700', path: '/teacher/attendance' },
        { label: 'Send Announcement', icon: Volume2, color: 'bg-purple-600 hover:bg-purple-700', path: '/teacher/announcements' },
        { label: 'View Reports', icon: BarChart3, color: 'bg-indigo-600 hover:bg-indigo-700', path: '/teacher/reports' },
    ];

    // Loading state
    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
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
                {/* Header with Filter */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back! Here's your teaching overview for today</p>
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            {academicYears.length > 0 ? (
                                academicYears.map(year => (
                                    <option key={year.id} value={year.year_code || year.year || `${year.start_year}-${year.end_year}`}>
                                        AY {year.year_code || year.year || `${year.start_year}-${year.end_year}`}
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
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => navigate(action.path)}
                                    className={`${action.color} text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Today's Class Timeline */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Today's Classes</h2>
                        </div>
                        <div className="space-y-3">
                            {todayClasses.length > 0 ? (
                                todayClasses.map((classItem, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="shrink-0">
                                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                                                <Clock className="w-6 h-6 text-green-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{getSubjectDisplay(classItem.subject, classItem.subject_name || 'N/A')}</p>
                                            <p className="text-xs text-gray-600">{classItem.room || classItem.room_number} • {classItem.students || classItem.students_count || 0} students</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{classItem.time || classItem.start_time}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No classes scheduled for today</p>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
                        </div>
                        <div className="space-y-3">
                            {pendingSubmissions.length > 0 ? (
                                pendingSubmissions.map((submission, index) => (
                                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="text-sm font-semibold text-gray-900">{getSubjectDisplay(submission.subject, submission.subject_name || 'N/A')}</p>
                                        <p className="text-xs text-orange-700 mt-1">📝 {submission.count || submission.pending_count} grades pending</p>
                                        <p className="text-xs text-gray-600 mt-1">⏰ {submission.deadline}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No pending submissions</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subjects Overview */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Subjects Overview</h2>
                        <div style={{ height: '300px' }}>
                            <Bar
                              data={{
                                labels: subjects.map(s => s.name),
                                datasets: [
                                  {
                                    label: 'Students Enrolled',
                                    data: subjects.map(s => s.students || s.students_count || 0),
                                    backgroundColor: '#10b981',
                                    borderRadius: 6,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                plugins: {
                                  legend: {
                                    display: true,
                                    position: 'top',
                                  },
                                },
                                scales: {
                                  x: {
                                    beginAtZero: true,
                                  },
                                },
                              }}
                            />
                        </div>
                    </div>

                    {/* Recent Announcements */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Announcements</h2>
                        <div className="space-y-3">
                            {announcements.length > 0 ? (
                                announcements.map((announcement, index) => (
                                    <div key={index} className="flex gap-3 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                                        <div className="shrink-0">
                                            <div className="flex items-center justify-center w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{announcement.title}</p>
                                            <p className="text-xs text-gray-600 mt-1">{announcement.date || announcement.created_at}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No recent announcements</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
