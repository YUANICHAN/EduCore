import '../../App.css'
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Teacher/Sidebar.jsx";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import classService from '../../service/classService';
import academicYearService from '../../service/academicYearService';

// Fallback data for development/demo
const getFallbackClasses = () => [
    {
        id: 1,
        subject: 'Mathematics 101',
        subjectCode: 'MATH101',
        section: 'A',
        schedule: 'MWF 9:00 AM - 10:30 AM',
        room: 'Room 201',
        students: 35,
        academicYear: '2024-2025',
        semester: '1st Semester'
    },
    {
        id: 2,
        subject: 'Physics Laboratory',
        subjectCode: 'PHYS102',
        section: 'B',
        schedule: 'TTH 11:00 AM - 1:00 PM',
        room: 'Lab 3',
        students: 28,
        academicYear: '2024-2025',
        semester: '1st Semester'
    },
    {
        id: 3,
        subject: 'Chemistry Lecture',
        subjectCode: 'CHEM101',
        section: 'A',
        schedule: 'MWF 1:00 PM - 2:30 PM',
        room: 'Room 305',
        students: 42,
        academicYear: '2024-2025',
        semester: '1st Semester'
    },
    {
        id: 4,
        subject: 'Biology Discussion',
        subjectCode: 'BIO101',
        section: 'C',
        schedule: 'TTH 3:00 PM - 4:30 PM',
        room: 'Room 102',
        students: 30,
        academicYear: '2024-2025',
        semester: '1st Semester'
    },
    {
        id: 5,
        subject: 'Advanced Mathematics',
        subjectCode: 'MATH201',
        section: 'A',
        schedule: 'MWF 10:30 AM - 12:00 PM',
        room: 'Room 203',
        students: 25,
        academicYear: '2024-2025',
        semester: '1st Semester'
    },
];

function MyClasses() {
    const [activeItem, setActiveItem] = useState("My Classes");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState('');
    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch academic years
            const ayResponse = await academicYearService.getAll();
            const years = ayResponse.data || ayResponse || [];
            setAcademicYears(years);
            
            // Set current academic year
            const activeYear = years.find(y => y.is_active || y.status === 'active');
            if (activeYear && !selectedYear) {
                setSelectedYear(`${activeYear.start_year}-${activeYear.end_year}`);
            }
            
            // Fetch classes
            const classResponse = await classService.getAll();
            const classData = classResponse.data || classResponse || [];
            
            // Map API response to component format
            const mappedClasses = classData.map(cls => ({
                id: cls.id,
                subject: cls.subject?.name || cls.subject_name || 'Unknown Subject',
                subjectCode: cls.subject?.code || cls.subject_code || 'N/A',
                section: cls.section?.name || cls.section_name || 'A',
                schedule: cls.schedule || cls.time_slot || 'TBA',
                room: cls.room || cls.room_number || 'TBA',
                students: cls.students_count || cls.enrolled_count || cls.students?.length || 0,
                academicYear: cls.academic_year?.name 
                    || (cls.academic_year ? `${cls.academic_year.start_year}-${cls.academic_year.end_year}` : null)
                    || '2024-2025',
                semester: cls.semester || cls.academic_year?.semester || '1st Semester'
            }));
            
            setClasses(mappedClasses.length > 0 ? mappedClasses : getFallbackClasses());
        } catch (err) {
            console.error('Failed to fetch classes:', err);
            setError('Failed to load classes');
            setClasses(getFallbackClasses());
            setAcademicYears([{ id: 1, start_year: 2024, end_year: 2025 }]);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter classes based on search query
    const filteredClasses = classes.filter(classItem => 
        classItem.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classItem.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classItem.section.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEnterClass = (classId) => {
        navigate(`/teacher/class/${classId}`);
    };

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="h-screen bg-gray-50 p-8 flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
            <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
                        <p className="text-gray-600 mt-1">Manage your assigned classes</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative">
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {academicYears.length > 0 ? (
                                    academicYears.map(ay => (
                                        <option key={ay.id} value={`${ay.start_year}-${ay.end_year}`}>
                                            AY {ay.start_year}-{ay.end_year}
                                        </option>
                                    ))
                                ) : (
                                    <option value="2024-2025">AY 2024-2025</option>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                                <p className="text-sm text-gray-600">Total Classes</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {classes.reduce((sum, c) => sum + c.students, 0)}
                                </p>
                                <p className="text-sm text-gray-600">Total Students</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">1st Semester</p>
                                <p className="text-sm text-gray-600">Current Period</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by subject, code, or section..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Classes List */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((classItem) => (
                        <div 
                            key={classItem.id}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                {classItem.subjectCode}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                                Section {classItem.section}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {classItem.subject}
                                        </h3>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {classItem.schedule}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {classItem.room}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Users className="w-4 h-4 mr-2" />
                                        {classItem.students} Students
                                    </div>
                                </div>

                                <div className="lg:flex lg:items-center justify-between space-y-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-500">
                                        {classItem.academicYear} • {classItem.semester}
                                    </div>
                                    <button
                                        onClick={() => handleEnterClass(classItem.id)}
                                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Enter Class
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredClasses.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
                        <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyClasses;
