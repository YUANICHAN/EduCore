import '../../App.css';
import { useMemo, useState, useEffect, useCallback, Fragment } from 'react';
import Sidebar from '../../Components/Student/Sidebar.jsx';
import { Calendar, Clock, MapPin, Bell, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import authService from '../../service/authService';
import studentService from '../../service/studentService';

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayIndex(dayValue) {
  const normalizedDay = String(dayValue || '').trim().toLowerCase();
  const index = WEEK_DAYS.findIndex((day) => day.toLowerCase() === normalizedDay);
  return index >= 0 ? index : 0;
}

function parseScheduleTimeToMinutes(timePart) {
  const trimmed = (timePart || '').trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[4] ? match[4].toUpperCase() : null;

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  if (meridiem) {
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

function groupByDay(sections) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const map = days.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
  sections.forEach((cls) => {
    if (!map[cls.day]) map[cls.day] = [];
    map[cls.day].push(cls);
  });
  return days.map((day) => ({ day, classes: map[day] || [] }));
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return 'TBA';

  const text = String(timeValue).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
  if (!match) return text;

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[4] ? match[4].toUpperCase() : null;

  if (meridiem) {
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  const displayMeridiem = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes} ${displayMeridiem}`;
}

function Schedule() {
  const [activeItem, setActiveItem] = useState('Schedule');
  const [reminders, setReminders] = useState({});
  const [enrolledSections, setEnrolledSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileResponse = await authService.getProfile();
      const profileUser = profileResponse?.data || profileResponse || {};
      const student = profileUser.student || profileUser;
      const studentId = student?.id || profileUser.student_id || profileUser.id;

      if (!studentId) {
        throw new Error('Student profile is missing an ID.');
      }

      const response = await studentService.getSchedule(studentId);
      const schedules = response?.data || response?.schedule || [];

      const asText = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return fallback;
      };

      const normalizeDay = (dayValue) => {
        const normalized = asText(dayValue, '').trim().toLowerCase();
        const dayMap = {
          sunday: 'Sunday',
          monday: 'Monday',
          tuesday: 'Tuesday',
          wednesday: 'Wednesday',
          thursday: 'Thursday',
          friday: 'Friday',
          saturday: 'Saturday',
        };
        return dayMap[normalized] || 'Monday';
      };

      const mappedSections = schedules.map((schedule, index) => {
        const classRecord = schedule.class || {};
        const startTime = formatTimeLabel(schedule.time_start || schedule.start_time);
        const endTime = formatTimeLabel(schedule.time_end || schedule.end_time);
        const startMinutes = parseScheduleTimeToMinutes(schedule.time_start || schedule.start_time);
        const endMinutes = parseScheduleTimeToMinutes(schedule.time_end || schedule.end_time);

        return {
          id: schedule.id || `${index}`,
          classId: schedule.class_id || classRecord.id || null,
          day: normalizeDay(schedule.day_of_week || schedule.day),
          startMinutes,
          endMinutes,
          subject: asText(classRecord.subject?.subject_name) || asText(classRecord.subject?.name) || asText(schedule.subject?.subject_name) || asText(schedule.subject_name) || 'Unknown Subject',
          code: asText(classRecord.subject?.subject_code) || asText(classRecord.subject?.code) || asText(schedule.subject?.subject_code) || asText(schedule.subject_code) || 'N/A',
          classCode: asText(classRecord.class_code, 'N/A'),
          time: `${startTime} - ${endTime}`,
          room: asText(schedule.room_number || schedule.room, 'TBA'),
          building: asText(schedule.building, ''),
          teacher: classRecord.teacher?.name
            || (classRecord.teacher?.first_name ? `Prof. ${classRecord.teacher.first_name} ${classRecord.teacher.last_name}` : null)
            || schedule.teacher?.name
            || (schedule.teacher?.first_name ? `Prof. ${schedule.teacher.first_name} ${schedule.teacher.last_name}` : null)
            || 'TBA',
        };
      });

      setEnrolledSections(mappedSections);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError('Failed to load schedule');
      setEnrolledSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => window.clearInterval(timerId);
  }, []);

  const week = useMemo(() => groupByDay(enrolledSections), [enrolledSections]);
  const classesThisWeek = enrolledSections.length;
  const remindersActive = Object.values(reminders).filter(Boolean).length;

  const nextClass = useMemo(() => {
    if (enrolledSections.length === 0) {
      return { subject: 'No classes', time: '-', day: '' };
    }

    const nowDay = currentTime.getDay();
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const sortedSections = [...enrolledSections].sort((left, right) => {
      const leftDay = getDayIndex(left.day);
      const rightDay = getDayIndex(right.day);
      if (leftDay !== rightDay) return leftDay - rightDay;
      return (left.startMinutes ?? 0) - (right.startMinutes ?? 0);
    });

    const upcoming = sortedSections.find((section) => {
      const sectionDay = getDayIndex(section.day);
      if (sectionDay < nowDay) return false;
      if (sectionDay > nowDay) return true;
      if (section.startMinutes === null || section.startMinutes === undefined) return false;
      return section.startMinutes >= nowMinutes;
    }) || sortedSections[0];

    return upcoming || { subject: 'No classes', time: '-', day: '' };
  }, [currentTime, enrolledSections]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const start = 7 * 60; // 7:00 AM
    const end = 22 * 60; // 10:00 PM
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
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[4] ? match[4].toUpperCase() : null;

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
              {nextClass.day ? <p className="text-xs text-gray-500">{nextClass.day}</p> : null}
              <p className="text-xs text-gray-600">{nextClass.time}</p>
            </div>
          </div>
        </div>

        {classesThisWeek === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No schedules assigned yet</h2>
            <p className="text-sm text-gray-600 mt-2">
              Your class schedule is still being prepared. Please check back later or contact your adviser.
            </p>
          </div>
        ) : (
          <>

        {/* Desktop / Tablet */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hidden md:block">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="w-full min-w-275">
              <div className="grid w-full" style={{ gridTemplateColumns: `110px repeat(7, minmax(130px, 1fr))` }}>
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
                        const cellKey = `${day.day}-${slot.label}`;
                        const classesAtSlot = day.classes.filter((cls) => {
                          const range = getTimeRangeMinutes(cls.time);
                          if (!range) return false;
                          return slot.minutes >= range.start && slot.minutes < range.end;
                        });

                        const classAtSlotStart = day.classes.find((cls) => {
                          const range = getTimeRangeMinutes(cls.time);
                          if (!range) return false;
                          return range.start === slot.minutes;
                        });

                        // If this is an empty slot
                        if (classesAtSlot.length === 0) {
                          return (
                            <div
                              key={cellKey}
                              className={`border-b border-r last:border-r-0 border-gray-200 px-3 py-3 relative ${
                                isAlt ? 'bg-white' : 'bg-gray-50'
                              } min-h-17.5`}
                            >
                              <div className="h-full text-[11px] text-gray-300 text-center">—</div>
                            </div>
                          );
                        }

                        // If this slot has a class starting here
                        if (classAtSlotStart) {
                          const range = getTimeRangeMinutes(classAtSlotStart.time);
                          const durationMinutes = range ? (range.end - range.start) : 30;
                          const rowCount = Math.ceil(durationMinutes / 30);
                          const heightPx = (rowCount * 70) - 4; // 70px per row minus border

                          return (
                            <div
                              key={`${day.day}-${slot.label}-${classAtSlotStart.id}`}
                              className="border-r last:border-r-0 border-gray-200 px-3 py-3 relative"
                              style={{ gridRow: `span ${rowCount}` }}
                            >
                              <div className="rounded-md border border-blue-200 bg-blue-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-3 h-full flex flex-col">
                                <p className="text-sm font-semibold text-gray-900 leading-snug">{classAtSlotStart.subject}</p>
                                <p className="text-xs text-gray-600">{classAtSlotStart.code}</p>
                                <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{classAtSlotStart.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{classAtSlotStart.building ? `${classAtSlotStart.room}, ${classAtSlotStart.building}` : classAtSlotStart.room}</span>
                                </div>
                                <div className="text-[11px] text-gray-600 mt-1">
                                  <span>Prof. {classAtSlotStart.teacher}</span>
                                </div>
                                <button
                                  onClick={() => toggleReminder(classAtSlotStart.code)}
                                  className={`mt-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                    reminders[classAtSlotStart.code]
                                      ? 'bg-gray-900 text-white border-gray-900'
                                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <Bell className="w-3 h-3" />
                                  {reminders[classAtSlotStart.code] ? 'Reminder On' : 'Set Reminder'}
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // This slot is covered by a spanning element above, don't render
                        return null;
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
                    <div key={`${day.day}-${cls.id}-${cls.code}`} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-sm font-semibold text-gray-900">{cls.subject}</p>
                      <p className="text-xs text-gray-600">{cls.code}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{cls.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{cls.building ? `${cls.room}, ${cls.building}` : cls.room}</span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        <span>Prof. {cls.teacher}</span>
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
          </>
        )}
      </div>
    </div>
  );
}

export default Schedule;
