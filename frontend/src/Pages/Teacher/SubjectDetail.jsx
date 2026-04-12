import '../../App.css'
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../Components/Teacher/Sidebar.jsx";
import { 
  Library, 
  ChevronRight,
  AlertCircle,
  BookOpen,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import subjectService from '../../service/subjectService';
import teacherService from '../../service/teacherService';
import authService from '../../service/authService';

// No fallback data - use real data only

function SubjectDetail() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeItem, setActiveItem] = useState("Subjects");
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubject = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await subjectService.getById(subjectId);
            const subj = response.data || response;

            const safeText = (value, fallback = '') => {
                if (value === null || value === undefined) return fallback;
                if (typeof value === 'string' || typeof value === 'number') return String(value);
                return fallback;
            };

            const normalizePrerequisites = (value) => {
                if (Array.isArray(value)) {
                    return value.length > 0 ? value.map((item) => safeText(item, 'None')).filter(Boolean) : ['None'];
                }
                if (value && typeof value === 'string') {
                    return [value];
                }
                return ['None'];
            };

            let classesCount =
                typeof subj.classes_count === 'number'
                    ? subj.classes_count
                    : Array.isArray(subj.classes)
                        ? subj.classes.length
                        : typeof subj.classes === 'number'
                            ? subj.classes
                            : 0;

            const currentUser = authService.getCurrentUser();
            const selectedAcademicYearId = location.state?.academicYearId;

            if (currentUser?.teacher_id) {
                try {
                    const teacherClassesRes = await teacherService.getClasses(currentUser.teacher_id, {
                        status: 'active',
                        subject_id: subjectId,
                        ...(selectedAcademicYearId ? { academic_year_id: selectedAcademicYearId } : {}),
                        per_page: 1000,
                    });

                    const teacherClasses = Array.isArray(teacherClassesRes?.data)
                        ? teacherClassesRes.data
                        : [];

                    classesCount = teacherClasses.length;
                } catch {
                    // Keep previously computed classes count if teacher-specific request fails.
                }
            }

            const syllabusObjectives = Array.isArray(subj.syllabus?.objectives)
                ? subj.syllabus.objectives.map((objective) => safeText(objective, '')).filter(Boolean)
                : Array.isArray(subj.objectives)
                    ? subj.objectives.map((objective) => safeText(objective, '')).filter(Boolean)
                    : ['To be defined'];

            const syllabusTopics = Array.isArray(subj.syllabus?.topics)
                ? subj.syllabus.topics
                : Array.isArray(subj.topics)
                    ? subj.topics
                    : [{ week: 1, topic: 'Introduction' }];
            
            setSubject({
                id: subj.id,
                code: safeText(subj.subject_code) || safeText(subj.code) || 'N/A',
                name: safeText(subj.subject_name) || safeText(subj.name) || 'Subject',
                units: subj.units || subj.credit_units || 3,
                classification: safeText(subj.subject_type) || safeText(subj.classification) || safeText(subj.type) || 'Major',
                description: safeText(subj.description) || 'No description available.',
                prerequisites: normalizePrerequisites(subj.prerequisites),
                syllabus: {
                    objectives: syllabusObjectives,
                    topics: syllabusTopics,
                },
                classes: classesCount,
            });
        } catch (err) {
            console.error('Failed to fetch subject:', err);
            setError('Failed to load subject details');
            // Keep null if fetch fails
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => {
        fetchSubject();
    }, [fetchSubject]);

    if (loading) {
        return (
            <div className="flex h-screen overflow-hidden bg-gray-50">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading subject details...</span>
                </div>
            </div>
        );
    }

    if (!subject) {
        return (
            <div className="flex h-screen overflow-hidden bg-gray-50">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="flex-1 h-full bg-gray-50 p-8 overflow-y-auto">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                        <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Subject not found</h3>
                        <button
                            onClick={() => navigate('/teacher/subjects')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                        >
                            Back to Subjects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
            <div className="flex-1 h-full bg-gray-50 p-8 overflow-y-auto">
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
                        onClick={() => navigate('/teacher/subjects')}
                        className="hover:text-blue-600 transition-colors"
                    >
                        Subjects
                    </button>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">
                        {subject.name}
                    </span>
                </nav>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/teacher/subjects')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Subjects
                </button>

                {/* Header */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Library className="w-8 h-8 text-blue-600" />
                        </div>
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
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {subject.name}
                            </h1>
                            <div className="flex items-center text-sm text-gray-600">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Teaching {subject.classes} {subject.classes === 1 ? 'class' : 'classes'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                            <p className="text-gray-700 leading-relaxed">{subject.description}</p>
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Prerequisites */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Prerequisites</h2>
                            </div>
                            <ul className="space-y-2">
                                {subject.prerequisites.map((prereq, index) => (
                                    <li key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                                        {prereq}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Subject Info */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Code</label>
                                    <p className="text-sm text-gray-900 mt-1">{subject.code}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Units</label>
                                    <p className="text-sm text-gray-900 mt-1">{subject.units} {subject.units === 1 ? 'Unit' : 'Units'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Classification</label>
                                    <p className="text-sm text-gray-900 mt-1">{subject.classification}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Classes Teaching</label>
                                    <p className="text-sm text-gray-900 mt-1">{subject.classes} {subject.classes === 1 ? 'Class' : 'Classes'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubjectDetail;
