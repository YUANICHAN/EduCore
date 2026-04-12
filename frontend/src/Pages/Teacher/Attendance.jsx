import '../../App.css';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import attendanceService from '../../service/attendanceService';
import classService from '../../service/classService';
import authService from '../../service/authService';
import Swal from 'sweetalert2';
import {
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Download,
  Printer,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Save,
} from 'lucide-react';

function TeacherAttendance() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Attendance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [attendanceEnabled, setAttendanceEnabled] = useState(true);

  // Classes/subjects
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  // Selected date for marking attendance
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedDateDay = useMemo(() => {
    if (!selectedDate) return '';
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDate]);

  const classHasScheduleOnSelectedDate = useMemo(() => {
    if (!selectedClass || !selectedDateDay) return true;

    const normalizeDayToken = (value) => {
      const token = String(value || '').trim().toLowerCase();
      const map = {
        mon: 'monday',
        monday: 'monday',
        tue: 'tuesday',
        tues: 'tuesday',
        tuesday: 'tuesday',
        wed: 'wednesday',
        weds: 'wednesday',
        wednesday: 'wednesday',
        thu: 'thursday',
        thur: 'thursday',
        thurs: 'thursday',
        thursday: 'thursday',
        fri: 'friday',
        friday: 'friday',
        sat: 'saturday',
        saturday: 'saturday',
        sun: 'sunday',
        sunday: 'sunday',
        m: 'monday',
        t: 'tuesday',
        w: 'wednesday',
        f: 'friday',
        s: 'saturday',
      };
      return map[token] || null;
    };

    const expandCompactPattern = (value) => {
      const compact = String(value || '').trim().toLowerCase();
      if (!/^[mtwhfsu]+$/.test(compact) || compact.length <= 1) return [];

      return compact
        .split('')
        .map((char) => normalizeDayToken(char))
        .filter(Boolean);
    };

    const listedDays = Array.isArray(selectedClass.scheduleDays)
      ? selectedClass.scheduleDays
      : [];

    const scheduleText = String(selectedClass.schedule || '');
    const inferredFullDays = scheduleText.match(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/gi) || [];
    const inferredShortDays = scheduleText.match(/\bMon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun\b/gi) || [];
    const compactTokens = scheduleText.match(/\b[MTWHFSU]{2,}\b/gi) || [];

    const expandedCompactDays = compactTokens.flatMap((token) => expandCompactPattern(token));

    const days = [...listedDays, ...inferredFullDays, ...inferredShortDays, ...expandedCompactDays]
      .map((d) => normalizeDayToken(d) || String(d).trim().toLowerCase())
      .filter(Boolean);

    if (days.length === 0) return true;
    return days.includes(selectedDateDay.toLowerCase());
  }, [selectedClass, selectedDateDay]);

  // Students with attendance records
  const [students, setStudents] = useState([]);

  // Attendance status options
  const statusOptions = ['present', 'absent', 'late', 'excused'];

  // Fetch teacher's classes
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getCurrentUser();
      const response = await classService.getAll({
        per_page: 1000,
        status: 'active',
        ...(user?.teacher_id ? { teacher_id: user.teacher_id } : {}),
      });

      const payload = response?.data ?? response;
      const classRows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);

      const asText = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return fallback;
      };

      const classesData = classRows.map(c => ({
        scheduleDays: Array.isArray(c.schedules)
          ? c.schedules
              .map((item) => asText(item?.day_of_week))
              .filter(Boolean)
          : [],
        id: c.id,
        code: asText(c.subject?.subject_code) || asText(c.subject_code) || asText(c.code) || 'N/A',
        name: asText(c.subject?.subject_name) || asText(c.subject_name) || asText(c.name) || 'Class',
        section: asText(c.section?.section_code) || asText(c.section_name) || asText(c.section) || 'N/A',
        schedule: asText(c.schedule) || (
          c.schedules?.[0]
            ? `${asText(c.schedules[0]?.day_of_week, 'TBD')} ${asText(c.schedules[0]?.time_start, '')}${c.schedules[0]?.time_end ? ` - ${asText(c.schedules[0]?.time_end)}` : ''}`.trim()
            : 'TBD'
        ),
        students: Number(c.enrolled_students_count ?? c.enrollments_count ?? c.students_count ?? c.enrolled_count ?? 0),
      }));
      
      setClasses(classesData);
    } catch (err) {
      console.error('Error fetching classes:', err);
      // Set empty array on error - no fallback
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students and attendance for selected class and date
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId || !selectedDate) return;

    setLoading(true);
    setAttendanceEnabled(true); // Reset to true before checking
    try {
      // Fetch the grading scheme for this class first
      const token = localStorage.getItem('auth_token');
      const gradingSchemeRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/classes/${selectedClassId}/grading-scheme`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      
      if (gradingSchemeRes.ok) {
        const gradingData = await gradingSchemeRes.json();
        const scheme = gradingData?.data || gradingData;
        const weights = scheme?.weights || {};
        const hiddenComponents = Array.isArray(scheme?.hidden_base_components) ? scheme.hidden_base_components : [];
        
        // Check if attendance weight is 0 or hidden
        const attendanceWeight = Number(weights?.attendance || 0);
        const isAttendanceHidden = hiddenComponents.includes('attendance');
        
        if (attendanceWeight === 0 || isAttendanceHidden) {
          setAttendanceEnabled(false);
          setStudents([]);
          setLoading(false);
          return;
        }
      }

      const [studentsRes, attendanceRes] = await Promise.all([
        classService.getStudents(selectedClassId, { per_page: 1000 }),
        attendanceService.getByClassAndDate(selectedClassId, selectedDate)
      ]);

      const studentsPayload = studentsRes?.data ?? studentsRes;
      const enrollmentRows = Array.isArray(studentsPayload)
        ? studentsPayload
        : Array.isArray(studentsPayload?.data)
          ? studentsPayload.data
          : [];

      const classEnrollmentRows = enrollmentRows.filter((row) => {
        if (!row?.class_id) return true;
        return Number(row.class_id) === Number(selectedClassId);
      });

      classEnrollmentRows.sort((left, right) => {
        const leftStudent = left.student || left;
        const rightStudent = right.student || right;

        const leftLast = String(leftStudent?.last_name || '').trim().toLowerCase();
        const rightLast = String(rightStudent?.last_name || '').trim().toLowerCase();
        if (leftLast !== rightLast) return leftLast.localeCompare(rightLast);

        const leftFirst = String(leftStudent?.first_name || '').trim().toLowerCase();
        const rightFirst = String(rightStudent?.first_name || '').trim().toLowerCase();
        return leftFirst.localeCompare(rightFirst);
      });

      const studentsData = classEnrollmentRows.map(row => {
        const s = row.student || row;
        return {
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Unknown',
        studentNumber: s.student_number || s.number || 'N/A',
        status: 'present', // default
      }});

      // Map existing attendance records
      const attendancePayload = attendanceRes?.attendance || attendanceRes?.data?.attendance || [];
      const attendanceRecords = Array.isArray(attendancePayload) ? attendancePayload : [];
      attendanceRecords.forEach(a => {
        const student = studentsData.find(s => s.id === a.student_id);
        if (student) {
          student.status = a.status || 'present';
          student.attendanceId = a.id;
          student.remarks = a.remarks || '';
        }
      });

      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      // Set empty array on error - no fallback
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) {
      if (classHasScheduleOnSelectedDate) {
        fetchAttendance();
      } else {
        setStudents([]);
      }
    }
  }, [selectedClassId, selectedDate, fetchAttendance, classHasScheduleOnSelectedDate]);

  // Handle attendance status change
  const handleStatusChange = (studentId, newStatus) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, status: newStatus } : s
    ));
  };

  // Handle remarks change
  const handleRemarksChange = (studentId, remarks) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, remarks } : s
    ));
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedDate) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing Selection',
        text: 'Please select a class and date before saving attendance.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const currentUser = authService.getCurrentUser();
    const recorderId = currentUser?.id || null;

    if (!recorderId) {
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Unable to identify the logged-in user for attendance recording.',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    setSaving(true);
    try {
      const attendanceData = {
        class_id: selectedClassId,
        date: selectedDate,
        recorded_by: recorderId,
        students: students.map((s) => ({
          student_id: s.id,
          status: s.status,
          remarks: s.remarks || '',
        })),
      };

      await attendanceService.bulkSave(attendanceData);
      await fetchAttendance();
      await Swal.fire({
        icon: 'success',
        title: 'Attendance Saved',
        text: 'Attendance has been saved and reloaded from the database.',
        confirmButtonColor: '#2563eb',
      });
    } catch (err) {
      console.error('Error saving attendance:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save attendance. Please try again.',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setSaving(false);
    }
  };

  // Mark all as present
  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
  };

  const handleBackToClassSelection = () => {
    setSelectedClassId(null);
    setStudents([]);
    setError(null);
  };

  // Calculate attendance summary
  const attendanceSummary = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const late = students.filter(s => s.status === 'late').length;
    const excused = students.filter(s => s.status === 'excused').length;
    const attendanceRate = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    return { total, present, absent, late, excused, attendanceRate };
  }, [students]);

  // Status badge styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'absent':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'late':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'excused':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'absent':
        return <XCircle className="w-4 h-4" />;
      case 'late':
        return <Clock className="w-4 h-4" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Teacher</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Attendance</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-600 mt-1">Mark and manage student attendance</p>
        </div>

        {/* Class and Date Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a class...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} - {cls.name} (Section {cls.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {selectedClass && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedClass.name}</span> • {selectedClass.schedule}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    {attendanceSummary.total} students enrolled
                  </div>
                  <button
                    onClick={handleBackToClassSelection}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedClassId ? (
          <>
            {!attendanceEnabled && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Attendance Tracking Disabled</p>
                    <p className="text-sm mt-1">
                      The admin has disabled attendance tracking for {selectedClass?.name || 'this class'}. Attendance weight is no longer counted in the grading scheme.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {attendanceEnabled && !classHasScheduleOnSelectedDate && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <p className="text-sm font-semibold">No class scheduled on this date.</p>
                <p className="text-sm mt-1">
                  {selectedClass?.name || 'This class'} is not scheduled for {selectedDateDay || 'the selected day'}. Please choose a date that matches the class schedule.
                </p>
              </div>
            )}

            {attendanceEnabled && classHasScheduleOnSelectedDate ? (
              <>
            {/* Attendance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{attendanceSummary.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{attendanceSummary.present}</div>
                    <div className="text-xs text-gray-500">Present</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <UserX className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-rose-600">{attendanceSummary.absent}</div>
                    <div className="text-xs text-gray-500">Absent</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{attendanceSummary.late}</div>
                    <div className="text-xs text-gray-500">Late</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{attendanceSummary.attendanceRate}%</div>
                    <div className="text-xs text-gray-500">Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleMarkAllPresent}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
              >
                Mark All Present
              </button>

              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Attendance List */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.studentNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {statusOptions.map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(student.id, status)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                                    student.status === status
                                      ? getStatusStyle(status)
                                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  {student.status === status && getStatusIcon(status)}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={student.remarks || ''}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              placeholder="Add remarks..."
                              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {students.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No students found for this class
                  </div>
                )}
              </div>
            )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Calendar className="w-14 h-14 text-amber-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No class for this date</h3>
                <p className="text-gray-600">Select another date that matches the class schedule to mark attendance.</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
            <p className="text-gray-600">Choose a class and date to mark attendance</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherAttendance;
