import '../../App.css'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Admin/Sidebar.jsx";
import dashboardService from "../../service/dashboardService";
import academicYearService from "../../service/academicYearService";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  Library, 
  Grid, 
  UserPlus, 
  TrendingUp,
  AlertCircle,
  Plus,
  FileText,
  Activity,
  Clock,
  HardDrive,
  Shield,
  ChevronDown,
  PieChart,
  Loader2
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

function Dashboard() {
    const navigate = useNavigate();
    const [activeItem, setActiveItem] = useState("Dashboard");
    const [selectedYear, setSelectedYear] = useState('');
    const academicYearsQuery = useQuery({
        queryKey: ['academicYears'],
        queryFn: () => academicYearService.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    const academicYears = academicYearsQuery.data?.data || academicYearsQuery.data || [];

    useEffect(() => {
        if (!selectedYear && academicYears.length > 0) {
            const currentYear = academicYears.find(y => y.is_current) || academicYears[0];
            if (currentYear) {
                setSelectedYear(currentYear.id.toString());
            }
        }
    }, [academicYears, selectedYear]);

    const dashboardQuery = useQuery({
        queryKey: ['dashboard', selectedYear],
        queryFn: () => dashboardService.getAdminDashboard(selectedYear),
        enabled: !!selectedYear,
        keepPreviousData: true,
        staleTime: 2 * 60 * 1000,
    });

    const dashboardData = dashboardQuery.data || null;
    const loading = academicYearsQuery.isLoading || dashboardQuery.isLoading || dashboardQuery.isFetching;
    const error = academicYearsQuery.isError
        ? 'Failed to load academic years. Please try again.'
        : dashboardQuery.isError
            ? 'Failed to load dashboard data. Please try again.'
            : null;

    // Format numbers with commas
    const formatNumber = (num) => {
        return num?.toLocaleString() || '0';
    };

    // Build KPI data from API response (stats are nested in 'stats' object)
    const stats = dashboardData?.stats || {};
    const kpiData = dashboardData ? [
        { label: 'Total Students', value: formatNumber(stats.total_students), icon: GraduationCap, color: 'bg-blue-500' },
        { label: 'Total Teachers', value: formatNumber(stats.total_teachers), icon: UserCheck, color: 'bg-green-500' },
        { label: 'Total Programs', value: formatNumber(stats.total_programs), icon: BookOpen, color: 'bg-purple-500' },
        { label: 'Total Subjects', value: formatNumber(stats.total_subjects), icon: Library, color: 'bg-orange-500' },
        { label: 'Active Sections', value: formatNumber(stats.total_sections), icon: Grid, color: 'bg-pink-500' },
    ] : [];

    // Enrollment data from API
    const enrollmentData = dashboardData?.enrollment_by_program || [];

    // Recent activity from API (use recent_enrollments from backend)
    const recentActivity = dashboardData?.recent_enrollments || [];

    const quickActions = [
        { label: 'Add Student', icon: GraduationCap, color: 'bg-blue-600 hover:bg-blue-700', path: '/admin/students' },
        { label: 'Add Teacher', icon: UserCheck, color: 'bg-green-600 hover:bg-green-700', path: '/admin/teachers' },
        { label: 'Create Subject', icon: Library, color: 'bg-purple-600 hover:bg-purple-700', path: '/admin/subjects' },
        { label: 'Open Enrollment', icon: UserPlus, color: 'bg-orange-600 hover:bg-orange-700', path: '/admin/academic-year' },
        { label: 'View Reports', icon: FileText, color: 'bg-indigo-600 hover:bg-indigo-700', path: '/admin/reports' },
    ];

    // Loading state
    if (loading && !dashboardData) {
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

    // Error state
    if (error && !dashboardData) {
        return (
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-900 font-medium mb-2">Failed to load dashboard</p>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
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
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today</p>
                    </div>
                    
                    <div className="relative">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {academicYears.map((year) => (
                            <option key={year.id} value={year.id}>
                                AY {year.name} {year.is_current ? '(Current)' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                    {kpiData.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Enrollment Status */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Enrollment Status Overview</h2>
                        <PieChart className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div style={{ height: '300px' }}>
                      <Bar
                        data={{
                          labels: enrollmentData.map(c => c.program_code || c.course),
                          datasets: [
                            {
                              label: 'Enrolled',
                              data: enrollmentData.map(c => c.enrolled || 0),
                              backgroundColor: '#3b82f6',
                              borderRadius: 6,
                            },
                            {
                              label: 'Capacity',
                              data: enrollmentData.map(c => c.capacity || 0),
                              backgroundColor: '#e5e7eb',
                              borderRadius: 6,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                        <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatNumber(dashboardData?.enrolled_count)}</div>
                        <div className="text-xs text-gray-600 mt-1">Enrolled</div>
                        </div>
                        <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatNumber(dashboardData?.not_enrolled_count)}</div>
                        <div className="text-xs text-gray-600 mt-1">Not Enrolled</div>
                        </div>
                    </div>
                    </div>

                    {/* Academic Progress Snapshot */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Academic Health</h2>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>

                    <div className="space-y-6">
                        <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Student Retention Rate</span>
                            <span className="text-sm font-semibold text-green-600">{dashboardData?.retention_rate || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${dashboardData?.retention_rate || 0}%` }} />
                        </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600">At-Risk Students</span>
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="text-3xl font-bold text-orange-600">{dashboardData?.at_risk_students || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-600 mb-2">Average Grade</div>
                        <div className="text-3xl font-bold text-blue-600">{dashboardData?.average_grade?.toFixed(1) || 'N/A'}</div>
                        <p className="text-xs text-gray-500 mt-1">Across all courses</p>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        <Clock className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="space-y-4">
                        {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.action || activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time || activity.created_at}</p>
                            </div>
                        </div>
                        )) : (
                        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                        )}
                    </div>
                    </div>

                    {/* Teacher Workload */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Teacher Workload</h2>
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>

                    <div style={{ height: '250px' }}>
                      <Bar
                        data={{
                          labels: ['Balanced Load', 'Overloaded'],
                          datasets: [
                            {
                              label: 'Teacher Count',
                              data: [dashboardData?.teachers_balanced || 0, dashboardData?.teachers_overloaded || 0],
                              backgroundColor: ['#10b981', '#f97316'],
                              borderRadius: 6,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-3 mt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg. Subjects/Teacher</span>
                            <span className="font-semibold text-gray-900">{dashboardData?.avg_subjects_per_teacher?.toFixed(1) || '0'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg. Sections/Teacher</span>
                            <span className="font-semibold text-gray-900">{dashboardData?.avg_sections_per_teacher?.toFixed(1) || '0'}</span>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Quick Actions & System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                            key={index}
                            onClick={() => navigate(action.path)}
                            className={`${action.color} text-white p-4 rounded-lg transition-colors flex flex-col items-center justify-center space-y-2`}
                            >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium text-center">{action.label}</span>
                            </button>
                        );
                        })}
                    </div>
                    </div>

                    {/* Enrollment Overview */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Enrollment Overview</h2>
                        <Activity className="w-5 h-5 text-blue-500" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-gray-700">Enrollment Status</span>
                        </div>
                        <span className="text-xs font-medium text-green-600">Open</span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">Deadline</span>
                        </div>
                        <span className="text-xs text-gray-600">{dashboardData?.enrollment_deadline || 'Not set'}</span>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                            <UserPlus className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">Enrollment Progress</span>
                            </div>
                            <span className="text-xs text-gray-600">{dashboardData?.enrollment_progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${dashboardData?.enrollment_progress || 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatNumber(dashboardData?.enrolled_count)} of {formatNumber(dashboardData?.total_students)} enrolled</p>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard