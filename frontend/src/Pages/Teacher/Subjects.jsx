import '../../App.css'
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Teacher/Sidebar.jsx";
import { 
  BookOpen, 
  Library, 
  FileText, 
  ChevronRight,
  Search,
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react';
import teacherService from '../../service/teacherService';
import authService from '../../service/authService';
import academicYearService from '../../service/academicYearService';

function Subjects() {
    const [activeItem, setActiveItem] = useState("Subjects");
    const [selectedYear, setSelectedYear] = useState('');
    const [academicYears, setAcademicYears] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAcademicYears = async () => {
            try {
                const response = await academicYearService.getAll();
                const rows = response.data || response || [];
                setAcademicYears(rows);

                const current = rows.find((y) => y.is_current) || rows.find((y) => y.status === 'active') || rows[0];
                if (current) {
                    setSelectedYear(String(current.id));
                }
            } catch {
                setAcademicYears([]);
            }
        };

        fetchAcademicYears();
    }, []);

    const fetchSubjects = useCallback(async () => {
        if (!selectedYear) return;

        setLoading(true);
        setError(null);
        try {
            const user = authService.getCurrentUser();
            if (!user?.teacher_id) {
                setSubjects([]);
                setError('Teacher account is not linked to a teacher profile.');
                return;
            }

            const response = await teacherService.getClasses(user.teacher_id, {
                status: 'active',
                academic_year_id: selectedYear,
                per_page: 1000,
            });

            const classRows = Array.isArray(response?.data) ? response.data : [];

            const groupedBySubject = classRows.reduce((acc, cls) => {
                const subject = cls.subject || {};
                const subjectId = subject.id || cls.subject_id;

                if (!subjectId) {
                    return acc;
                }

                if (!acc[subjectId]) {
                    acc[subjectId] = {
                        id: subjectId,
                        code: subject.subject_code || subject.code || 'N/A',
                        name: subject.subject_name || subject.name || 'Subject',
                        units: Number(subject.units || subject.credit_units || 0),
                        classification: subject.subject_type || subject.classification || 'Major',
                        description: subject.description || 'No description available.',
                        prerequisites: Array.isArray(subject.prerequisites) ? subject.prerequisites : (subject.prerequisites ? [String(subject.prerequisites)] : ['None']),
                        syllabus: subject.syllabus || null,
                        classes: 0,
                    };
                }

                acc[subjectId].classes += 1;
                return acc;
            }, {});

            setSubjects(Object.values(groupedBySubject));
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
            setError('Failed to load subjects');
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    // Filter subjects based on search query
    const filteredSubjects = subjects.filter(subject => 
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.classification.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewDetails = (subjectId) => {
        navigate(`/teacher/subject/${subjectId}`, {
            state: {
                academicYearId: selectedYear,
            },
        });
    };

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
                    <span className="text-gray-900 font-medium">Subjects</span>
                </nav>

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
                        <p className="text-gray-600 mt-1">View subjects you're handling this term</p>
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {academicYears.length > 0 ? (
                                academicYears.map((ay) => (
                                    <option key={ay.id} value={String(ay.id)}>
                                        AY {ay.year_code || ay.year || `${ay.start_year}-${ay.end_year}`}
                                    </option>
                                ))
                            ) : (
                                <option value="">AY -</option>
                            )}
                        </select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                                <p className="text-sm text-gray-600">Total Subjects</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Library className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {subjects.reduce((sum, s) => sum + s.units, 0)}
                                </p>
                                <p className="text-sm text-gray-600">Total Units</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {subjects.reduce((sum, s) => sum + s.classes, 0)}
                                </p>
                                <p className="text-sm text-gray-600">Total Classes</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by subject name, code, or classification..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Subjects Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading subjects...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64 text-red-500">
                        <AlertCircle className="w-6 h-6 mr-2" />
                        {error}
                    </div>
                ) : filteredSubjects.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        No subjects found.
                    </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSubjects.map((subject) => (
                        <div 
                            key={subject.id}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                {subject.code}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                subject.classification === 'Major' 
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {subject.classification}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                                {subject.units} {subject.units === 1 ? 'Unit' : 'Units'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {subject.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {subject.description}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Library className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-start text-sm">
                                        <AlertCircle className="w-4 h-4 mr-2 text-gray-500 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-semibold text-gray-700">Prerequisites: </span>
                                            <span className="text-gray-600">{subject.prerequisites.join(', ')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Teaching {subject.classes} {subject.classes === 1 ? 'class' : 'classes'}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleViewDetails(subject.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Info className="w-4 h-4" />
                                        View Syllabus & Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
        </div>
    );
}

export default Subjects;
