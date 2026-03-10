import '../../App.css';
import { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { BookOpen, Clock, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import enrollmentService from '../../service/enrollmentService';

// Fallback data for development/demo
const getFallbackSubjects = () => [
  {
    code: 'CS 301',
    name: 'Data Structures & Algorithms',
    units: 3,
    teacher: 'Prof. Maria Santos',
    status: 'Ongoing',
  },
  {
    code: 'CS 302',
    name: 'Database Management Systems',
    units: 3,
    teacher: 'Prof. Juan Cruz',
    status: 'Ongoing',
  },
  {
    code: 'CS 303',
    name: 'Software Engineering',
    units: 3,
    teacher: 'Prof. Ana Reyes',
    status: 'Ongoing',
  },
  {
    code: 'CS 204',
    name: 'Discrete Mathematics',
    units: 3,
    teacher: 'Prof. Pedro Garcia',
    status: 'Completed',
  },
];

function Subjects() {
  const [activeItem, setActiveItem] = useState('Subjects');
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await enrollmentService.getAll();
      const enrollments = response.data || response || [];
      
      // Map enrollments to subject format
      const subjects = enrollments.map(enrollment => ({
        code: enrollment.subject?.code || enrollment.class?.subject?.code || enrollment.subject_code || 'N/A',
        name: enrollment.subject?.name || enrollment.class?.subject?.name || enrollment.subject_name || 'Unknown Subject',
        units: enrollment.subject?.units || enrollment.class?.subject?.units || enrollment.units || 3,
        teacher: enrollment.teacher?.name 
          || (enrollment.teacher?.first_name ? `Prof. ${enrollment.teacher.first_name} ${enrollment.teacher.last_name}` : null)
          || enrollment.class?.teacher?.name
          || (enrollment.class?.teacher?.first_name ? `Prof. ${enrollment.class.teacher.first_name} ${enrollment.class.teacher.last_name}` : null)
          || enrollment.teacher_name 
          || 'TBA',
        status: enrollment.status === 'completed' || enrollment.status === 'passed' ? 'Completed' : 'Ongoing',
      }));
      
      setEnrolledSubjects(subjects.length > 0 ? subjects : getFallbackSubjects());
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      setError('Failed to load subjects');
      setEnrolledSubjects(getFallbackSubjects());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const summary = useMemo(() => {
    const totalUnits = enrolledSubjects.reduce((sum, s) => sum + s.units, 0);
    return {
      enrolledCount: enrolledSubjects.length,
      totalUnits,
    };
  }, [enrolledSubjects]);

  const statusBadge = (status) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 border';
    if (status === 'Ongoing') {
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    }
    return `${base} bg-green-50 text-green-700 border-green-200`;
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
        <div className="flex items-center justify-between mb-8">
          <div> 
            <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
            <p className="text-gray-600 mt-1">View enrolled and available subjects with their details.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Enrolled Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{summary.enrolledCount}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalUnits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Enrolled Subjects</h2>
            </div>
            <p className="text-sm text-gray-500">Ongoing / Completed</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Units</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Teacher</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrolledSubjects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No enrolled subjects found
                    </td>
                  </tr>
                ) : (
                  enrolledSubjects.map((subject) => (
                    <tr key={subject.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{subject.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{subject.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">{subject.units}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{subject.teacher}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={statusBadge(subject.status)}>{subject.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subjects;
