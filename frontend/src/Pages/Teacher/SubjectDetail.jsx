import '../../App.css'
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

// Fallback data
const getFallbackSubject = () => ({
    id: 1,
    code: 'MATH101',
    name: 'Mathematics 101',
    units: 3,
    classification: 'Major',
    description: 'Introduction to advanced mathematics.',
    prerequisites: ['None'],
    syllabus: {
        objectives: ['Understand fundamental concepts'],
        topics: [{ week: 1, topic: 'Introduction' }]
    },
    classes: 2
});

function SubjectDetail() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
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
            
            setSubject({
                id: subj.id,
                code: subj.code || 'N/A',
                name: subj.name || 'Subject',
                units: subj.units || subj.credit_units || 3,
                classification: subj.classification || subj.type || 'Major',
                description: subj.description || 'No description available.',
                prerequisites: subj.prerequisites || ['None'],
                syllabus: subj.syllabus || {
                    objectives: subj.objectives || ['To be defined'],
                    topics: subj.topics || [{ week: 1, topic: 'Introduction' }]
                },
                classes: subj.classes_count || subj.classes || 0
            });
        } catch (err) {
            console.error('Failed to fetch subject:', err);
            setError('Failed to load subject details');
            setSubject(getFallbackSubject());
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => {
        fetchSubject();
    }, [fetchSubject]);

    if (loading) {
        return (
            <div className="flex h-screen">
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
            <div className="flex h-screen">
                <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
                <div className="h-screen bg-gray-50 p-8 flex-1 overflow-y-auto">
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

                        {/* Learning Objectives */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h2>
                            <ul className="space-y-2">
                                {subject.syllabus.objectives.map((objective, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                                            {index + 1}
                                        </span>
                                        <span className="text-gray-700">{objective}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Course Outline */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Outline</h2>
                            <div className="space-y-2">
                                {subject.syllabus.topics.map((topic, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="shrink-0 w-16 text-center">
                                            <span className="text-sm font-semibold text-blue-600">Week {topic.week}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{topic.topic}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
