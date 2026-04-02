import '../../App.css';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import attendanceService from '../../service/attendanceService';
import classService from '../../service/classService';
import authService from '../../service/authService';
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
  Loader2,
  Save,
} from 'lucide-react';

function TeacherAttendance() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Attendance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Classes/subjects
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  // Selected date for marking attendance
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        classService.getStudents(selectedClassId),
        attendanceService.getByClassAndDate(selectedClassId, selectedDate)
      ]);

      const enrollmentRows = Array.isArray(studentsRes?.data)
        ? studentsRes.data
        : Array.isArray(studentsRes)
          ? studentsRes
          : [];

      const studentsData = enrollmentRows.map(row => {
        const s = row.student || row;
        return {
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Unknown',
        studentNumber: s.student_number || s.number || 'N/A',
        status: 'present', // default
      }});

      // Map existing attendance records
      const attendanceRecords = attendanceRes.data || attendanceRes || [];
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
      fetchAttendance();
    }
  }, [selectedClassId, selectedDate, fetchAttendance]);

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
      alert('Please select a class and date');
      return;
    }

    setSaving(true);
    try {
      const attendanceData = students.map(s => ({
        student_id: s.id,
        class_id: selectedClassId,
        date: selectedDate,
        status: s.status,
        remarks: s.remarks || '',
      }));

      await attendanceService.bulkSave(attendanceData);
      alert('Attendance saved successfully!');
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Mark all as present
  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
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
    <div className="flex min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      
      <main className="flex-1 p-8 ml-64">
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
                <div className="text-sm text-gray-500">
                  {attendanceSummary.total} students enrolled
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedClassId ? (
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
