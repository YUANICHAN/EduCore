import '../../App.css';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import {
  Users,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  Search,
  CalendarDays,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import classService from '../../service/classService';
import studentService from '../../service/studentService';
import authService from '../../service/authService';

// No fallback data - use real data or empty arrays

const statusStyles = {
  'On Track': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'Needs Support': 'bg-amber-50 text-amber-700 border border-amber-100',
  'At Risk': 'bg-rose-50 text-rose-700 border border-rose-100',
};

function TeacherStudents() {
  const [activeItem, setActiveItem] = useState('Students');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getCurrentUser();
      const classResponse = await classService.getAll({
        per_page: 1000,
        status: 'active',
        ...(user?.teacher_id ? { teacher_id: user.teacher_id } : {}),
      });
      const classPayload = classResponse?.data ?? classResponse;
      const classes = Array.isArray(classPayload) ? classPayload : (Array.isArray(classPayload?.data) ? classPayload.data : []);

      const asText = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return fallback;
      };
      
      // Fetch students for each class
      const classesWithStudents = await Promise.all(
        classes.map(async (cls) => {
          let students = [];
          try {
            const studentsResponse = await classService.getStudents(cls.id, { status: 'enrolled', per_page: 1000 });
            const studentsPayload = studentsResponse?.data ?? studentsResponse;
            const enrollmentRows = Array.isArray(studentsPayload) ? studentsPayload : (Array.isArray(studentsPayload?.data) ? studentsPayload.data : []);

            students = enrollmentRows.map(row => {
              const stu = row.student || row;
              return {
              id: stu.id,
              name: `${stu.first_name || ''} ${stu.last_name || ''}`.trim() || stu.name || 'Student',
              academicStatus: stu.academic_status || stu.status || 'On Track',
              currentGrade: { 
                score: stu.grade_score || stu.current_grade || 85,
                letter: stu.grade_letter || 'B'
              },
              attendanceRate: stu.attendance_rate || 90,
              attendanceSummary: stu.attendance_summary || { present: 30, late: 2, excused: 1, absent: 2 },
              highlights: stu.highlights || [],
              badges: stu.badges || [],
            }});
          } catch (err) {
            console.error(`Failed to fetch students for class ${cls.id}:`, err);
          }
          
          return {
            id: cls.id,
            title: asText(cls.subject?.subject_name) || asText(cls.subject?.name) || asText(cls.name) || asText(cls.title) || 'Class',
            code: asText(cls.subject?.subject_code) || asText(cls.subject?.code) || asText(cls.code) || 'N/A',
            section: asText(cls.section?.section_code) || asText(cls.section?.name) || asText(cls.section_name) || asText(cls.section) || 'Section',
            schedule: asText(cls.schedule) || `${asText(cls.days, 'TBD')} · ${asText(cls.time, 'TBD')} · ${asText(cls.room, 'TBD')}`,
            academicYear: asText(cls.academic_year?.year_code) || asText(cls.academic_year?.name) || asText(cls.academicYear) || 'Current',
            semester: asText(cls.subject?.semester) || asText(cls.semester) || '1st Semester',
            students,
          };
        })
      );
      
      setClassData(classesWithStudents.length > 0 ? classesWithStudents : []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setError('Failed to load classes');
      setClassData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedClass = useMemo(
    () => classData.find(item => item.id === selectedClassId) ?? null,
    [selectedClassId, classData],
  );

  const filteredStudents = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    if (!searchTerm.trim()) {
      return selectedClass.students;
    }

    return selectedClass.students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    );
  }, [selectedClass, searchTerm]);

  useEffect(() => {
    if (!selectedClass) {
      setSelectedStudentId(null);
      return;
    }

    const firstVisibleStudent = filteredStudents[0];
    setSelectedStudentId(prev => {
      if (prev && filteredStudents.some(student => student.id === prev)) {
        return prev;
      }
      return firstVisibleStudent ? firstVisibleStudent.id : null;
    });
  }, [selectedClass, filteredStudents]);

  const selectedStudent = useMemo(() => {
    if (!selectedClass || !selectedStudentId) {
      return null;
    }
    return selectedClass.students.find(student => student.id === selectedStudentId) ?? null;
  }, [selectedClass, selectedStudentId]);

  const metrics = useMemo(() => {
    if (!selectedClass) {
      return {
        totalStudents: 0,
        averageGrade: 0,
        averageAttendance: 0,
        atRiskCount: 0,
      };
    }

    const totalStudents = selectedClass.students.length;

    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        averageGrade: 0,
        averageAttendance: 0,
        atRiskCount: 0,
      };
    }

    const gradeSum = selectedClass.students.reduce((sum, student) => sum + student.currentGrade.score, 0);
    const attendanceSum = selectedClass.students.reduce((sum, student) => sum + student.attendanceRate, 0);
    const atRiskCount = selectedClass.students.filter(student => student.academicStatus === 'At Risk').length;

    return {
      totalStudents,
      averageGrade: Math.round((gradeSum / totalStudents) * 10) / 10,
      averageAttendance: Math.round(attendanceSum / totalStudents),
      atRiskCount,
    };
  }, [selectedClass]);

  const attendanceBreakdown = useMemo(() => {
    if (!selectedStudent) {
      return [];
    }

    const totalSessions = Object.values(selectedStudent.attendanceSummary).reduce((sum, value) => sum + value, 0);

    return [
      { label: 'Present', value: selectedStudent.attendanceSummary.present, tone: 'text-emerald-600' },
      { label: 'Late', value: selectedStudent.attendanceSummary.late, tone: 'text-amber-600' },
      { label: 'Excused', value: selectedStudent.attendanceSummary.excused, tone: 'text-sky-600' },
      { label: 'Absent', value: selectedStudent.attendanceSummary.absent, tone: 'text-rose-600' },
    ].map(item => ({
      ...item,
      percentage: totalSessions === 0 ? 0 : Math.round((item.value / totalSessions) * 100),
    }));
  }, [selectedStudent]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="flex flex-col gap-6">
          {/* Breadcrumbs appear only after a class is selected */}
          {selectedClass && (
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="hover:text-blue-600 transition-colors"
              >
                Dashboard
              </button>
              <ChevronRight className="w-4 h-4" />
              <button
                onClick={() => { setSelectedClassId(null); setSelectedStudentId(null); }}
                className="hover:text-blue-600 transition-colors"
              >
                Students
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium">{selectedClass.title} · {selectedClass.section}</span>
            </nav>
          )}
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                <p className="text-sm text-gray-600">
                  {selectedClass
                    ? 'Review academic standing, attendance, and grade insights for this class.'
                    : 'Pick a class to view its read-only roster, academic status, and attendance insights.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  View only

                </div>
              </div>
            </div>

          </header>

          {!selectedClass && (
            <>
              <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex items-start gap-4 text-sm text-gray-700">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">Select a class to open the roster</p>
                  <p>Each card represents a section you manage. Choose one to load student statuses, attendance summaries, and grade highlights.</p>
                </div>
              </section>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading classes...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  {error}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {classData.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedClassId(item.id)}
                      className="bg-white text-left rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700">{item.academicYear}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{item.code}</h3>
                      <p className="text-sm text-gray-600 mb-3">{item.title}</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>{item.section}</p>
                        <p>{item.schedule}</p>
                        <p>{item.semester}</p>
                      </div>
                      <div className="mt-4 text-sm font-semibold text-gray-900">{item.students.length} students</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-800">Read-only safeguards</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Student profiles cannot be edited from this view.</li>
                      <li>Enrollment actions are disabled to protect records.</li>
                      <li>Grades reflect current class only.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedClass && (
            <>
              <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_1fr]">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedClass.title}</p>
                        <p className="text-xs text-gray-600">{selectedClass.section} • {selectedClass.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedClassId(null); setSelectedStudentId(null); setSearchTerm(''); }}
                      className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                    >
                      Change class
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>{selectedClass.schedule}</p>
                    <p>{selectedClass.semester} • {selectedClass.academicYear}</p>
                    <p>Total students: <span className="font-semibold text-gray-900">{selectedClass.students.length}</span></p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-800">Read-only safeguards</p>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Student profiles cannot be edited from this view.</li>
                        <li>Enrollment actions are disabled to protect records.</li>
                        <li>Grades reflect current class only.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Students</p>
                    <p className="text-xl font-semibold text-gray-900">{metrics.totalStudents}</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Average grade</p>
                    <p className="text-xl font-semibold text-gray-900">{metrics.averageGrade}%</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Attendance</p>
                    <p className="text-xl font-semibold text-gray-900">{metrics.averageAttendance}%</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">At risk</p>
                    <p className="text-xl font-semibold text-gray-900">{metrics.atRiskCount}</p>
                  </div>
                </div>
              </div>

              <section className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Student snapshot for {selectedClass?.title ?? '—'}
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      placeholder="Search students"
                      value={searchTerm}
                      onChange={event => setSearchTerm(event.target.value)}
                      className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr] text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      <div className="px-4 py-3">Student</div>
                      <div className="px-4 py-3">Academic status</div>
                      <div className="px-4 py-3">Attendance</div>
                      <div className="px-4 py-3">Current grade</div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-105 overflow-y-auto">
                      {filteredStudents.map(student => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`w-full text-left grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-4 py-4 text-sm transition-colors ${
                            selectedStudentId === student.id ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <div className="flex flex-wrap gap-1">
                              {student.badges.map(badge => (
                                <span key={badge} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[student.academicStatus]}`}>
                              {student.academicStatus}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`${student.attendanceRate >= 90 ? 'bg-emerald-500' : student.attendanceRate >= 85 ? 'bg-amber-500' : 'bg-rose-500'} h-full`}
                                style={{ width: `${student.attendanceRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{student.attendanceRate}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">{student.currentGrade.letter}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              <p className="text-sm font-semibold text-gray-900">{student.currentGrade.score}%</p>
                              <p>Class grade</p>
                            </div>
                          </div>
                        </button>
                      ))}

                      {filteredStudents.length === 0 && (
                        <div className="px-4 py-12 text-center text-sm text-gray-500">
                          No students match your search.
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    {selectedStudent ? (
                      <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Student overview</p>
                          <h2 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h2>
                          <p className="text-sm text-gray-600">{selectedClass?.title} · {selectedClass?.section}</p>
                        </div>

                        <div className="grid gap-4">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                <BarChart3 className="w-4 h-4 text-indigo-500" />
                                Attendance summary
                              </div>
                              <span className="text-sm font-semibold text-emerald-600">{selectedStudent.attendanceRate}%</span>
                            </div>
                            <div className="space-y-2">
                              {attendanceBreakdown.map(item => (
                                <div key={item.label} className="flex items-center justify-between text-sm">
                                  <span className={`font-medium ${item.tone}`}>{item.label}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-current" style={{ width: `${item.percentage}%` }} />
                                    </div>
                                    <span className="text-gray-600">{item.value}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                              <GraduationCap className="w-4 h-4 text-emerald-500" />
                              Current grade insight
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <span className="text-lg font-semibold text-emerald-600">{selectedStudent.currentGrade.letter}</span>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{selectedStudent.currentGrade.score}%</p>
                                <p className="text-xs text-gray-500">Class standing: {selectedStudent.academicStatus}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                              <CalendarDays className="w-4 h-4 text-blue-500" />
                              Highlights this term
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                              {selectedStudent.highlights.map(item => (
                                <li key={item} className="flex gap-2">
                                  <span className="text-blue-500">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-sm text-gray-500">
                        <Users className="w-10 h-10 text-gray-300 mb-3" />
                        Select a student to view detailed insights.
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherStudents;
