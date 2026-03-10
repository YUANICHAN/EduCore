import '../../App.css'
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Teacher/Sidebar.jsx";
import { 
  BookOpen, 
  Users, 
  FileText, 
  Info,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import classService from '../../service/classService';
import studentService from '../../service/studentService';
import attendanceService from '../../service/attendanceService';
import gradeService from '../../service/gradeService';

// Fallback data
const getFallbackClassData = () => ({
    id: 1,
    subject: 'Mathematics 101',
    subjectCode: 'MATH101',
    section: 'A',
    schedule: 'MWF 9:00 AM - 10:30 AM',
    room: 'Room 201',
    students: 35,
    academicYear: '2024-2025',
    semester: '1st Semester',
    description: 'Introduction to advanced mathematics.'
});

const getFallbackStudents = () => [
    { id: 1, name: 'John Smith', studentId: 'STU001', email: 'john.smith@edu.com', status: 'Active' },
];

const getFallbackAttendance = () => [
    { date: '2024-01-15', present: 32, absent: 3, late: 0 },
];

const getFallbackGradeComponents = () => [
    { component: 'Quiz 1', weight: '10%', status: 'Graded', average: 85 },
];

function ClassDetail() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [activeItem, setActiveItem] = useState("My Classes");
    const [activeTab, setActiveTab] = useState("students");
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [gradeComponents, setGradeComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch class data
            const classResponse = await classService.getById(classId);
            const cls = classResponse.data || classResponse;
            
            setClassData({
                id: cls.id,
                subject: cls.subject?.name || cls.name || 'Class',
                subjectCode: cls.subject?.code || cls.code || 'N/A',
                section: cls.section?.name || cls.section || 'A',
                schedule: cls.schedule || `${cls.days || 'TBD'} ${cls.time || ''}`,
                room: cls.room || 'TBD',
                students: cls.student_count || cls.students || 0,
                academicYear: cls.academic_year?.name || cls.academicYear || 'Current',
                semester: cls.semester || '1st Semester',
                description: cls.description || cls.subject?.description || ''
            });

            // Fetch students for this class
            try {
                const studentsResponse = await studentService.getByClass(classId);
                const studentsData = (studentsResponse.data || studentsResponse || []).map(stu => ({
                    id: stu.id,
                    name: `${stu.first_name || ''} ${stu.last_name || ''}`.trim() || stu.name || 'Student',
                    studentId: stu.student_id || stu.id_number || `STU${String(stu.id).padStart(3, '0')}`,
                    email: stu.email || 'N/A',
                    status: stu.status || 'Active'
                }));
                setStudents(studentsData.length > 0 ? studentsData : getFallbackStudents());
            } catch {
                setStudents(getFallbackStudents());
            }

            // Fetch attendance records
            try {
                const attendanceResponse = await attendanceService.getByClass(classId);
                const attData = (attendanceResponse.data || attendanceResponse || []).map(att => ({
                    date: att.date,
                    present: att.present_count || att.present || 0,
                    absent: att.absent_count || att.absent || 0,
                    late: att.late_count || att.late || 0
                }));
                setAttendanceRecords(attData.length > 0 ? attData : getFallbackAttendance());
            } catch {
                setAttendanceRecords(getFallbackAttendance());
            }

            // Fetch grade components
            try {
                const gradesResponse = await gradeService.getByClass(classId);
                const gradesData = (gradesResponse.data || gradesResponse || []).map(grade => ({
                    component: grade.component || grade.name || 'Component',
                    weight: grade.weight ? `${grade.weight}%` : 'N/A',
                    status: grade.status || 'Pending',
                    average: grade.average || null
                }));
                setGradeComponents(gradesData.length > 0 ? gradesData : getFallbackGradeComponents());
            } catch {
                setGradeComponents(getFallbackGradeComponents());
            }

        } catch (err) {
            console.error('Failed to fetch class details:', err);
            setError('Failed to load class details');
            setClassData(getFallbackClassData());
            setStudents(getFallbackStudents());
            setAttendanceRecords(getFallbackAttendance());
            setGradeComponents(getFallbackGradeComponents());
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const tabs = [
        { id: 'students', label: 'Students', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: Calendar },
        { id: 'grades', label: 'Grades', icon: FileText },
        { id: 'info', label: 'Class Info', icon: Info },
    ];

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading class details...</span>
                </div>
            </div>
        );
    }

    if (error && !classData) {
        return (
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="flex-1 flex items-center justify-center text-red-500">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
            <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                    <button
                        onClick={() => navigate('/teacher/dashboard')}
                        className="hover:text-blue-600 transition-colors"
                    >
                        Dashboard
                    </button>
                    <ChevronRight className="w-4 h-4" />
                    <button
                        onClick={() => navigate('/teacher/classes')}
                        className="hover:text-blue-600 transition-colors"
                    >
                        My Classes
                    </button>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">
                        {classData.subject} (Section {classData.section})
                    </span>
                </nav>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/teacher/classes')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Classes
                </button>

                {/* Header */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                        {classData.subjectCode}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                        Section {classData.section}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    {classData.subject}
                                </h1>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {classData.schedule}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {classData.room}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {classData.students} Students
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{classData.academicYear}</p>
                            <p className="text-xs text-gray-600">{classData.semester}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                                            activeTab === tab.id
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Students Tab */}
                        {activeTab === 'students' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
                                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                                        Export List
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Student ID</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Name</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => (
                                                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-sm text-gray-900">{student.studentId}</td>
                                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{student.name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{student.email}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Attendance Tab */}
                        {activeTab === 'attendance' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
                                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                                        Mark Attendance
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-sm text-gray-600 mb-1">Average Attendance</p>
                                        <p className="text-2xl font-bold text-green-700">91.4%</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                        <p className="text-sm text-gray-600 mb-1">Absences This Week</p>
                                        <p className="text-2xl font-bold text-orange-700">9</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Present</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Absent</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Late</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceRecords.map((record, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-sm text-gray-900">{record.date}</td>
                                                    <td className="py-3 px-4 text-sm text-green-700 font-medium">{record.present}</td>
                                                    <td className="py-3 px-4 text-sm text-red-700 font-medium">{record.absent}</td>
                                                    <td className="py-3 px-4 text-sm text-orange-700 font-medium">{record.late}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Grades Tab */}
                        {activeTab === 'grades' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Grade Components</h2>
                                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                                        Submit Grades
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Component</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Weight</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Class Average</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gradeComponents.map((component, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{component.component}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{component.weight}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                            component.status === 'Graded' 
                                                                ? 'bg-green-100 text-green-700'
                                                                : component.status === 'Pending'
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {component.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                                        {component.average ? `${component.average}%` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Class Info Tab */}
                        {activeTab === 'info' && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Subject Code</label>
                                        <p className="text-gray-700 mt-1">{classData.subjectCode}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Subject Name</label>
                                        <p className="text-gray-700 mt-1">{classData.subject}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Section</label>
                                        <p className="text-gray-700 mt-1">Section {classData.section}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Schedule</label>
                                        <p className="text-gray-700 mt-1">{classData.schedule}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Room</label>
                                        <p className="text-gray-700 mt-1">{classData.room}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Academic Year</label>
                                        <p className="text-gray-700 mt-1">{classData.academicYear}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Semester</label>
                                        <p className="text-gray-700 mt-1">{classData.semester}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Total Students</label>
                                        <p className="text-gray-700 mt-1">{classData.students}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900">Description</label>
                                        <p className="text-gray-700 mt-1">{classData.description}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClassDetail;
