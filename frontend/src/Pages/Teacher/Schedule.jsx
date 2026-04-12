import '../../App.css';
import { useMemo, useState, useEffect, useCallback, Fragment } from 'react';
import Sidebar from '../../Components/Teacher/Sidebar.jsx';
import { Calendar, Clock, MapPin, Bell, Users, Loader2, AlertCircle } from 'lucide-react';
import scheduleService from '../../service/scheduleService';
import authService from '../../service/authService';

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

function groupByDay(entries) {
  const map = WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {});

  entries.forEach((entry) => {
    if (!map[entry.day]) map[entry.day] = [];
    map[entry.day].push(entry);
  });

  return WEEK_DAYS.map((day) => ({ day, classes: map[day] || [] }));
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

function TeacherSchedule() {
  const [activeItem, setActiveItem] = useState('Schedule');
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [reminders, setReminders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = authService.getCurrentUser();
      const response = user?.teacher_id
        ? await scheduleService.getByTeacher(user.teacher_id, { per_page: 1000 })
        : await scheduleService.getAll({ per_page: 1000 });

      const payload = response?.data ?? response;
      const schedules = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);

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

      const mappedEntries = schedules.map((schedule, index) => {
        const classRecord = schedule.class || {};
        const startTimeRaw = schedule.time_start || schedule.start_time;
        const endTimeRaw = schedule.time_end || schedule.end_time;
        const startTime = formatTimeLabel(startTimeRaw);
        const endTime = formatTimeLabel(endTimeRaw);

        return {
          id: schedule.id || `${index}`,
          classId: schedule.class_id || classRecord.id || null,
          day: normalizeDay(schedule.day_of_week || schedule.day),
          startMinutes: parseScheduleTimeToMinutes(startTimeRaw),
          endMinutes: parseScheduleTimeToMinutes(endTimeRaw),
          subject: asText(classRecord.subject?.subject_name)
            || asText(classRecord.subject?.name)
            || asText(schedule.subject?.subject_name)
            || asText(schedule.subject_name)
            || 'Unknown Subject',
          code: asText(classRecord.subject?.subject_code)
            || asText(classRecord.subject?.code)
            || asText(schedule.subject?.subject_code)
            || asText(schedule.subject_code)
            || 'N/A',
          section: asText(classRecord.section?.section_code)
            || asText(classRecord.section?.name)
            || asText(schedule.section?.section_code)
            || asText(schedule.section?.name)
            || 'Section N/A',
          time: `${startTime} - ${endTime}`,
          room: asText(schedule.room_number || schedule.room, 'TBA'),
          building: asText(schedule.building, ''),
          students: Number(
            schedule.students_count
            ?? classRecord.enrolled_students_count
            ?? classRecord.enrollments_count
            ?? classRecord.students_count
            ?? 0,
          ),
        };
      });

      setScheduleEntries(mappedEntries);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError('Failed to load schedule');
      setScheduleEntries([]);
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

  const week = useMemo(() => groupByDay(scheduleEntries), [scheduleEntries]);

  const uniqueClassMap = useMemo(() => {
    const map = new Map();
    scheduleEntries.forEach((entry) => {
      const key = entry.classId || entry.id;
      if (!map.has(key)) map.set(key, entry);
    });
    return map;
  }, [scheduleEntries]);

  const uniqueClasses = useMemo(() => Array.from(uniqueClassMap.values()), [uniqueClassMap]);
  const classesThisWeek = uniqueClasses.length;
  const remindersActive = Object.values(reminders).filter(Boolean).length;

  const nextClass = useMemo(() => {
    if (scheduleEntries.length === 0) {
      return { subject: 'No classes', time: '-', day: '' };
    }

    const nowDay = currentTime.getDay();
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const sortedEntries = [...scheduleEntries].sort((left, right) => {
      const leftDay = getDayIndex(left.day);
      const rightDay = getDayIndex(right.day);
      if (leftDay !== rightDay) return leftDay - rightDay;
      return (left.startMinutes ?? 0) - (right.startMinutes ?? 0);
    });

    const upcoming = sortedEntries.find((entry) => {
      const entryDay = getDayIndex(entry.day);
      if (entryDay < nowDay) return false;
      if (entryDay > nowDay) return true;
      if (entry.startMinutes === null || entry.startMinutes === undefined) return false;
      return entry.startMinutes >= nowMinutes;
    }) || sortedEntries[0];

    return upcoming || { subject: 'No classes', time: '-', day: '' };
  }, [currentTime, scheduleEntries]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const start = 7 * 60;
    const end = 22 * 60;

    for (let mins = start; mins <= end; mins += 30) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      slots.push({
        label: `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`,
        minutes: mins,
      });
    }

    return slots;
  }, []);

  const getTimeRangeMinutes = (range) => {
    const [startPart, endPart] = (range || '').split('-').map((s) => s.trim());
    const startMinutes = parseScheduleTimeToMinutes(startPart);
    const endMinutes = parseScheduleTimeToMinutes(endPart);

    if (startMinutes === null) return null;

    return {
      start: startMinutes,
      end: endMinutes !== null && endMinutes > startMinutes ? endMinutes : startMinutes + 30,
    };
  };

  const toggleReminder = (classKey) => {
    setReminders((prev) => ({
      ...prev,
      [classKey]: !prev[classKey],
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
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hidden md:block">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="w-full min-w-275">
                  <div className="grid w-full" style={{ gridTemplateColumns: '110px repeat(7, minmax(130px, 1fr))' }}>
                    <div className="bg-gray-100 border-r border-b border-gray-200 px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Time</div>
                    {week.map((day) => (
                      <div
                        key={day.day}
                        className="bg-gray-100 border-r last:border-r-0 border-b border-gray-200 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide text-center"
                      >
                        {day.day}
                      </div>
                    ))}

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

                            if (classesAtSlot.length === 0) {
                              return (
                                <div
                                  key={cellKey}
                                  className={`border-b border-r last:border-r-0 border-gray-200 px-3 py-3 relative ${
                                    isAlt ? 'bg-white' : 'bg-gray-50'
                                  } min-h-17.5`}
                                >
                                  <div className="h-full text-[11px] text-gray-300 text-center">-</div>
                                </div>
                              );
                            }

                            if (classAtSlotStart) {
                              const range = getTimeRangeMinutes(classAtSlotStart.time);
                              const durationMinutes = range ? (range.end - range.start) : 30;
                              const rowCount = Math.ceil(durationMinutes / 30);

                              return (
                                <div
                                  key={`${day.day}-${slot.label}-${classAtSlotStart.id}`}
                                  className="border-r last:border-r-0 border-gray-200 px-3 py-3 relative"
                                  style={{ gridRow: `span ${rowCount}` }}
                                >
                                  <div className="rounded-md border border-blue-200 bg-blue-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-3 h-full flex flex-col">
                                    <p className="text-sm font-semibold text-gray-900 leading-snug">{classAtSlotStart.subject}</p>
                                    <p className="text-xs text-gray-600">{classAtSlotStart.code} | {classAtSlotStart.section}</p>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-2">
                                      <Clock className="w-3 h-3" />
                                      <span>{classAtSlotStart.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{classAtSlotStart.building ? `${classAtSlotStart.room}, ${classAtSlotStart.building}` : classAtSlotStart.room}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                                      <Users className="w-3 h-3" />
                                      <span>{classAtSlotStart.students} students</span>
                                    </div>
                                    <button
                                      onClick={() => toggleReminder(classAtSlotStart.id)}
                                      className={`mt-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                        reminders[classAtSlotStart.id]
                                          ? 'bg-gray-900 text-white border-gray-900'
                                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                      }`}
                                    >
                                      <Bell className="w-3 h-3" />
                                      {reminders[classAtSlotStart.id] ? 'Reminder On' : 'Set Reminder'}
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

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
                          <p className="text-xs text-gray-600">{cls.code} | {cls.section}</p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-2">
                            <Clock className="w-3 h-3" />
                            <span>{cls.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{cls.building ? `${cls.room}, ${cls.building}` : cls.room}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                            <Users className="w-3 h-3" />
                            <span>{cls.students} students</span>
                          </div>
                          <button
                            onClick={() => toggleReminder(cls.id)}
                            className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                              reminders[cls.id]
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <Bell className="w-3 h-3" />
                            {reminders[cls.id] ? 'Reminder On' : 'Set Reminder'}
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

export default TeacherSchedule;
