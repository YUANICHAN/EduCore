import '../../App.css';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  Users,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import scheduleService from '../../service/scheduleService';
import authService from '../../service/authService';

// No fallback data - use real data only

function TeacherSchedule() {
  const [activeItem, setActiveItem] = useState('Schedule');
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedClass, setExpandedClass] = useState(null);
  const [reminders, setReminders] = useState({});
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTime, setReminderTime] = useState('15'); // minutes before
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getCurrentUser();
      const response = await scheduleService.getAll(
        user?.teacher_id ? { teacher_id: user.teacher_id, per_page: 1000 } : { per_page: 1000 }
      );
      const payload = response?.data ?? response;
      const schedules = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);

      const asText = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return fallback;
      };
      
      // Group schedules by day
      const dayMap = {};
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      schedules.forEach(schedule => {
        const dayName = schedule.day || schedule.day_of_week || 'Monday';
        if (!dayMap[dayName]) {
          dayMap[dayName] = {
            day: dayName,
            date: schedule.date || new Date().toISOString().split('T')[0],
            classes: []
          };
        }
        dayMap[dayName].classes.push({
          id: schedule.id,
          subject: asText(schedule.subject?.subject_name) || asText(schedule.subject?.name) || asText(schedule.class?.subject?.subject_name) || asText(schedule.class?.subject?.name) || asText(schedule.subject_name) || 'Unknown',
          code: asText(schedule.subject?.subject_code) || asText(schedule.subject?.code) || asText(schedule.class?.subject?.subject_code) || asText(schedule.class?.subject?.code) || asText(schedule.subject_code) || 'N/A',
          section: asText(schedule.section?.section_code) || asText(schedule.class?.section?.section_code) || asText(schedule.section?.name) || asText(schedule.class?.section?.name) || `Section ${asText(schedule.section, 'A')}`,
          time: asText(schedule.time_slot) || `${asText(schedule.time_start, '09:00')} - ${asText(schedule.time_end, '10:30')}`,
          room: asText(schedule.room) || asText(schedule.room_number) || 'TBA',
          building: asText(schedule.building) || 'Main Building',
          students: Number(schedule.students_count ?? schedule.class?.enrolled_students_count ?? schedule.class?.enrollments_count ?? schedule.class?.students_count ?? 0),
          reminders: false
        });
      });
      
      // Convert to array sorted by day
      const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const result = orderedDays
        .filter(day => dayMap[day])
        .map(day => dayMap[day]);
      
      setScheduleData(result.length > 0 ? result : []);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError('Failed to load schedule');
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Get current week
  const currentDate = new Date();
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

  const weekDays = scheduleData.map((day, idx) => ({
    ...day,
    weekDate: new Date(weekStart.getTime() + idx * 24 * 60 * 60 * 1000),
  }));

  const toggleReminder = (classId) => {
    setReminders(prev => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  const allClasses = scheduleData.flatMap(day => day.classes);
  const todayClasses = scheduleData[selectedDay]?.classes || [];

  const todayCount = allClasses.length;
  const weekClassCount = scheduleData.reduce((sum, day) => sum + day.classes.length, 0);
  const totalStudents = new Set(allClasses.map(c => c.students)).size;

  // Time slots for day view
  const timeSlots = [
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
  ];

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <main className="flex-1 h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
                <p className="text-sm text-gray-600">Your teaching timetable and class schedule</p>
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'day'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </header>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Classes This Week</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{weekClassCount}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Students</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Reminders Active</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{Object.values(reminders).filter(Boolean).length}</p>
            </div>
          </div>

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 min-w-full">
                  {/* Time column */}
                  <div className="bg-gray-50 border-r border-gray-200">
                    <div className="p-4 font-semibold text-gray-900 text-sm border-b border-gray-200 h-20 flex items-center">
                      Time
                    </div>
                  </div>

                  {/* Days */}
                  {weekDays.map((dayData, idx) => (
                    <div key={idx} className="border-r border-gray-200 last:border-r-0">
                      <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100 border-b border-gray-200">
                        <p className="font-semibold text-gray-900 text-sm">{dayData.day}</p>
                        <p className="text-xs text-gray-600 mt-1">{dayData.date}</p>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {dayData.classes.map(classItem => (
                          <div
                            key={classItem.id}
                            className="p-3 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer min-h-24"
                          >
                            <p className="font-semibold text-sm text-gray-900">{classItem.code}</p>
                            <p className="text-xs text-gray-600">{classItem.time}</p>
                            <p className="text-xs text-blue-600 mt-1">{classItem.room}</p>
                          </div>
                        ))}
                        {dayData.classes.length === 0 && (
                          <div className="p-4 text-center text-gray-400 text-xs min-h-24 flex items-center justify-center">
                            No classes
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <>
              {/* Day Selector */}
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                <button className="text-gray-500 hover:text-gray-700">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2 overflow-x-auto">
                  {weekDays.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDay(idx)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                        selectedDay === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <p className="text-sm font-semibold">{day.day}</p>
                      <p className="text-xs">{day.date}</p>
                    </button>
                  ))}
                </div>
                <button className="text-gray-500 hover:text-gray-700">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day Timeline */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {timeSlots.map((slot, slotIdx) => {
                    const slotClasses = todayClasses.filter(cls => cls.time.includes(slot.split(' ')[0]));
                    return (
                      <div key={slotIdx} className="flex">
                        <div className="w-24 bg-gray-50 border-r border-gray-200 p-3 font-medium text-sm text-gray-600 shrink-0">
                          {slot}
                        </div>
                        <div className="flex-1 p-3">
                          {slotClasses.length > 0 ? (
                            <div className="space-y-2">
                              {slotClasses.map(classItem => (
                                <div
                                  key={classItem.id}
                                  onClick={() => setExpandedClass(expandedClass?.id === classItem.id ? null : classItem)}
                                  className="bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold text-gray-900">{classItem.subject}</h3>
                                      <p className="text-sm text-gray-600">{classItem.code} • {classItem.section}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900">{classItem.time}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <MapPin className="w-4 h-4" />
                                      {classItem.room} • {classItem.building}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <Users className="w-4 h-4" />
                                      {classItem.students} students
                                    </div>
                                  </div>

                                  {expandedClass?.id === classItem.id && (
                                    <div className="border-t border-blue-200 pt-3 mt-3 space-y-3">
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-900">Room Details</p>
                                        <div className="bg-white rounded p-2 text-sm text-gray-700 space-y-1">
                                          <p>📍 {classItem.building}</p>
                                          <p>🚪 Room {classItem.room.split(' ')[1]}</p>
                                          <p>👥 Capacity: {classItem.students} students enrolled</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleReminder(classItem.id);
                                          }}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                            reminders[classItem.id]
                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                          }`}
                                        >
                                          <Bell className="w-4 h-4" />
                                          <span className="text-sm font-medium">
                                            {reminders[classItem.id] ? 'Reminder On' : 'Add Reminder'}
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">No classes scheduled</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Reminders Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Class Reminders</h2>
            </div>

            {Object.keys(reminders).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No reminders set. Click the reminder button on any class to add one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allClasses.map(classItem => (
                  reminders[classItem.id] && (
                    <div key={classItem.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div>
                        <p className="font-medium text-gray-900">{classItem.code} • {classItem.section}</p>
                        <p className="text-sm text-gray-600">{classItem.time} • {classItem.room}</p>
                      </div>
                      <button
                        onClick={() => toggleReminder(classItem.id)}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Classes This Week</h2>
            <div className="space-y-3">
              {scheduleData.map(day => (
                <div key={`${day.day}-${day.date || 'no-date'}`}>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{day.day}</p>
                  <div className="space-y-2 ml-4">
                    {day.classes.map(classItem => (
                      <div key={classItem.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{classItem.code} - {classItem.subject}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {classItem.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {classItem.room}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {classItem.students} students
                            </span>
                          </div>
                        </div>
                        {reminders[classItem.id] && (
                          <div className="text-amber-600">
                            <Bell className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherSchedule;
