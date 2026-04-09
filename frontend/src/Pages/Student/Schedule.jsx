import '../../App.css';
import { useMemo, useState, useEffect, useCallback, Fragment } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { Calendar, Clock, MapPin, Bell, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import scheduleService from '../../service/scheduleService';

// Fallback schedule data for development/demo
const getFallbackSections = () => [
  {
    day: 'Monday',
    subject: 'Data Structures & Algorithms',
    code: 'CS 301',
    time: '08:00 AM - 09:30 AM',
    room: 'Room 402',
    teacher: 'Prof. Maria Santos',
  },
  {
    day: 'Monday',
    subject: 'Database Management Systems',
    code: 'CS 302',
    time: '10:00 AM - 11:30 AM',
    room: 'Lab 3',
    teacher: 'Prof. Juan Cruz',
  },
  {
    day: 'Wednesday',
    subject: 'Software Engineering',
    code: 'CS 303',
    time: '01:00 PM - 02:30 PM',
    room: 'Room 405',
    teacher: 'Prof. Ana Reyes',
  },
  {
    day: 'Thursday',
    subject: 'Computer Networks',
    code: 'CS 305',
    time: '03:00 PM - 04:30 PM',
    room: 'Room 210',
    teacher: 'Prof. Liza Dizon',
  },
  {
    day: 'Friday',
    subject: 'Filipino sa Iba\'t Ibang Disiplina',
    code: 'GE 101',
    time: '09:00 AM - 10:30 AM',
    room: 'Room 102',
    teacher: 'Prof. Carla Flores',
  },
];

function groupByDay(sections) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const map = days.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
  sections.forEach((cls) => {
    if (!map[cls.day]) map[cls.day] = [];
    map[cls.day].push(cls);
  });
  return days.map((day) => ({ day, classes: map[day] || [] }));
}

function Schedule() {
  const [activeItem, setActiveItem] = useState('Schedule');
  const [reminders, setReminders] = useState({});
  const [enrolledSections, setEnrolledSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleService.getAll();
      const schedules = response.data || response || [];

      const asText = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return fallback;
      };
      
      // Map API response to component format
      const mappedSections = schedules.map((schedule, index) => ({
        id: schedule.id || `${index}`,
        day: asText(schedule.day) || asText(schedule.day_of_week) || 'Monday',
        subject: asText(schedule.subject?.subject_name) || asText(schedule.subject?.name) || asText(schedule.subject_name) || asText(schedule.class?.subject?.subject_name) || asText(schedule.class?.subject?.name) || 'Unknown Subject',
        code: asText(schedule.subject?.subject_code) || asText(schedule.subject?.code) || asText(schedule.subject_code) || asText(schedule.class?.subject?.subject_code) || asText(schedule.class?.subject?.code) || 'N/A',
        time: asText(schedule.time_slot) || `${asText(schedule.start_time, '08:00 AM')} - ${asText(schedule.end_time, '09:30 AM')}`,
        room: asText(schedule.room) || asText(schedule.room_number) || 'TBA',
        teacher: schedule.teacher?.name 
          || (schedule.teacher?.first_name ? `Prof. ${schedule.teacher.first_name} ${schedule.teacher.last_name}` : null)
          || schedule.teacher_name 
          || 'TBA',
      }));
      
      setEnrolledSections(mappedSections.length > 0 ? mappedSections : getFallbackSections());
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError('Failed to load schedule');
      setEnrolledSections(getFallbackSections());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const week = useMemo(() => groupByDay(enrolledSections), [enrolledSections]);
  const classesThisWeek = enrolledSections.length;
  const remindersActive = Object.values(reminders).filter(Boolean).length;

  const nextClass = enrolledSections[0] || { subject: 'No classes', time: '-' };

  const timeSlots = useMemo(() => {
    const slots = [];
    const start = 7 * 60; // 7:00 AM
    const end = 17 * 60; // 5:00 PM
    for (let mins = start; mins <= end; mins += 30) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const label = `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
      slots.push({ label, minutes: mins });
    }
    return slots;
  }, []);

  const parseTimeToMinutes = (timePart) => {
    const trimmed = (timePart || '').trim();
    if (!trimmed) return null;

    // Accept both 12-hour times (e.g. 8:00 AM) and 24-hour times (e.g. 08:00)
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3] ? match[3].toUpperCase() : null;

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    if (meridiem) {
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }

    return hours * 60 + minutes;
  };

  const getTimeRangeMinutes = (range) => {
    const [startPart, endPart] = (range || '').split('-').map((s) => s.trim());
    const startMinutes = parseTimeToMinutes(startPart);
    const endMinutes = parseTimeToMinutes(endPart);

    if (startMinutes === null) return null;
    return {
      start: startMinutes,
      end: endMinutes !== null && endMinutes > startMinutes ? endMinutes : startMinutes + 30,
    };
  };

  const toggleReminder = (code) => {
    setReminders((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
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
            <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600 mt-1">Class timetable generated from your enrolled sections.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Classes This Week</p>
              <p className="text-2xl font-bold text-gray-900">{classesThisWeek}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reminders Active</p>
              <p className="text-2xl font-bold text-gray-900">{remindersActive}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Class</p>
              <p className="text-base font-semibold text-gray-900 leading-tight">{nextClass.subject}</p>
              <p className="text-xs text-gray-600">{nextClass.time}</p>
            </div>
          </div>
        </div>

        {/* Desktop / Tablet */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hidden md:block">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
            </div>
          </div>

          <div>
            <div className="w-full">
              <div className="grid w-full" style={{ gridTemplateColumns: `110px repeat(7, 1fr)` }}>
                {/* Header row */}
                <div className="bg-gray-100 border-r border-b border-gray-200 px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Time</div>
                {week.map((day) => (
                  <div
                    key={day.day}
                    className="bg-gray-100 border-r last:border-r-0 border-b border-gray-200 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide text-center"
                  >
                    {day.day}
                  </div>
                ))}

                {/* Time rows */}
                {timeSlots.map((slot, idx) => {
                  const isAlt = idx % 2 === 0;
                  return (
                    <Fragment key={slot.label}>
                      <div
                        className={`border-b border-r border-gray-200 px-3 py-4 text-xs font-medium text-gray-600 ${
                          isAlt ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {slot.label}
                      </div>
                      {week.map((day) => {
                        const classAtSlot = day.classes.find((cls) => {
                          const range = getTimeRangeMinutes(cls.time);
                          if (!range) return false;
                          return slot.minutes >= range.start && slot.minutes < range.end;
                        });
                        const cellKey = `${day.day}-${slot.label}`;
                        return (
                          <div
                            key={cellKey}
                            className={`border-b border-r last:border-r-0 border-gray-200 px-3 py-3 ${
                              isAlt ? 'bg-white' : 'bg-gray-50'
                            } min-h-17.5`}
                          >
                            {!classAtSlot ? (
                              <div className="h-full text-[11px] text-gray-300 text-center">—</div>
                            ) : (
                              (() => {
                                const range = getTimeRangeMinutes(classAtSlot.time);
                                const isStartSlot = range ? range.start === slot.minutes : true;

                                if (!isStartSlot) {
                                  return (
                                    <div className="h-full rounded-md border border-dashed border-blue-200 bg-blue-50/60" />
                                  );
                                }

                                return (
                                  <div
                                    key={`${day.day}-${slot.label}-${classAtSlot.id}-${classAtSlot.code}`}
                                    className="rounded-md border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-3"
                                  >
                                    <p className="text-sm font-semibold text-gray-900 leading-snug">{classAtSlot.subject}</p>
                                    <p className="text-xs text-gray-600">{classAtSlot.code}</p>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-2">
                                      <Clock className="w-3 h-3" />
                                      <span>{classAtSlot.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{classAtSlot.room}</span>
                                      <span className="text-gray-400">•</span>
                                      <span>{classAtSlot.teacher}</span>
                                    </div>
                                    <button
                                      onClick={() => toggleReminder(classAtSlot.code)}
                                      className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                        reminders[classAtSlot.code]
                                          ? 'bg-gray-900 text-white border-gray-900'
                                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                      }`}
                                    >
                                      <Bell className="w-3 h-3" />
                                      {reminders[classAtSlot.code] ? 'Reminder On' : 'Set Reminder'}
                                    </button>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-4">
          {week.map((day) => (
            <div key={day.day} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">{day.day}</p>
                <span className="text-xs text-gray-500">{day.classes.length} class{day.classes.length === 1 ? '' : 'es'}</span>
              </div>
              {day.classes.length === 0 ? (
                <p className="text-xs text-gray-400">No classes</p>
              ) : (
                <div className="space-y-3">
                  {day.classes.map((cls) => (
                    <div key={`${day.day}-${cls.id}-${cls.code}`} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{cls.subject}</p>
                      <p className="text-xs text-gray-600">{cls.code}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{cls.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{cls.room}</span>
                        <span className="text-gray-400">•</span>
                        <span>{cls.teacher}</span>
                      </div>
                      <button
                        onClick={() => toggleReminder(cls.code)}
                        className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                          reminders[cls.code]
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <Bell className="w-3 h-3" />
                        {reminders[cls.code] ? 'Reminder On' : 'Set Reminder'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Schedule;
