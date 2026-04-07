import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Calendar, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Sidebar from '../../Components/Admin/Sidebar.jsx';
import roomService from '../../service/roomService';
import buildingService from '../../service/buildingService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data;
}

function formatTime(value) {
  if (!value) return '';
  const text = String(value);
  return text.length >= 5 ? text.slice(0, 5) : text;
}

const classBadgeStyles = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
];

function getInitials(value) {
  if (!value) return 'NA';

  const text = String(value).trim();
  if (!text) return 'NA';

  const compact = text
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (compact.length === 0) return text.slice(0, 2).toUpperCase();
  if (compact.length === 1) return compact[0].slice(0, 2).toUpperCase();
  return `${compact[0][0] || ''}${compact[1][0] || ''}`.toUpperCase();
}

function getTeacherInitials(teacher) {
  if (!teacher) return 'NA';
  return getInitials(`${teacher.first_name || ''} ${teacher.last_name || ''}`.trim());
}

function getClassBadgeClass(index) {
  return classBadgeStyles[index % classBadgeStyles.length];
}

function getClassBadgeLabel(cls) {
  const source = cls?.class_code || cls?.subject?.subject_code || cls?.section?.section_code || `C${cls?.id || ''}`;
  const text = String(source).trim();
  if (!text) return 'CL';

  const normalized = text.replace(/[^a-z0-9]/gi, '');
  if (!normalized) return 'CL';

  if (/^[a-z]+\d+$/i.test(normalized)) {
    return `${normalized[0]}${normalized.replace(/\D/g, '').slice(0, 1)}`.toUpperCase();
  }

  return normalized.slice(0, 2).toUpperCase();
}

function getDayOptions() {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

function formatTimeForApi(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (!text) return '';
  return text.length === 5 ? `${text}:00` : text;
}

function getClassSchedules(cls) {
  return Array.isArray(cls?.schedules) ? cls.schedules : [];
}

function getScheduleCount(cls) {
  if (Number.isFinite(cls?.schedules_count)) {
    return Number(cls.schedules_count);
  }
  return getClassSchedules(cls).length;
}

function getScheduleLabel(schedule) {
  const day = schedule?.day_of_week || schedule?.day || 'Day';
  const start = formatTime(schedule?.time_start || schedule?.start_time);
  const end = formatTime(schedule?.time_end || schedule?.end_time);
  return `${day} ${start || '--:--'}-${end || '--:--'}`;
}

function getScheduleLocation(schedule) {
  return schedule?.room_number || schedule?.room || schedule?.building || '';
}

function compareRoomNumbers(a, b) {
  return String(a?.room_number || '').localeCompare(String(b?.room_number || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function getClassRoomSummary(cls) {
  const schedules = getClassSchedules(cls);
  if (schedules.length === 0) {
    return { primary: 'No room', secondary: '' };
  }

  const uniqueRooms = Array.from(new Set(
    schedules
      .map((schedule) => schedule?.room_number || schedule?.room)
      .filter(Boolean),
  ));

  const uniqueBuildings = Array.from(new Set(
    schedules
      .map((schedule) => schedule?.building)
      .filter(Boolean),
  ));

  const primary = uniqueRooms.length > 0
    ? (uniqueRooms.length > 1 ? `${uniqueRooms[0]} +${uniqueRooms.length - 1} more` : uniqueRooms[0])
    : (uniqueBuildings[0] || 'No room');

  const secondary = uniqueBuildings.length > 1
    ? `${uniqueBuildings[0]} +${uniqueBuildings.length - 1} more`
    : (uniqueBuildings[0] || '');

  return { primary, secondary };
}

function extractClassRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.classes)) return payload.classes;
  return [];
}

function extractPagination(payload, fallbackPerPage) {
  const currentPage = Number(payload?.current_page || payload?.meta?.current_page || 1);
  const total = Number(payload?.total || payload?.meta?.total || 0);
  const lastPage = Number(payload?.last_page || payload?.meta?.last_page || 1);
  const perPage = Number(payload?.per_page || payload?.meta?.per_page || fallbackPerPage || 25);

  return {
    currentPage,
    total,
    lastPage,
    perPage,
  };
}

function Class() {
  const [activeItem, setActiveItem] = useState('Classes');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);
  const [bulkAssigningSchedule, setBulkAssigningSchedule] = useState(false);
  const [bulkScheduleForm, setBulkScheduleForm] = useState({
    day_of_week: '',
    time_start: '',
    time_end: '',
    building_id: '',
    room_id: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleBuildingId, setScheduleBuildingId] = useState('');
  const [scheduleRoomId, setScheduleRoomId] = useState('');

  const [form, setForm] = useState({
    day: '',
    start_time: '',
    end_time: '',
    subject: '',
    teacher: '',
  });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(perPage),
        sort_by: 'id',
        sort_order: 'asc',
      });

      const term = search.trim();
      if (term) {
        params.set('search', term);
      }

      if (scheduleFilter === 'with-schedule') {
        params.set('has_schedule', '1');
      } else if (scheduleFilter === 'without-schedule') {
        params.set('has_schedule', '0');
      }

      const res = await apiRequest(`/classes?${params.toString()}`);
      const rows = extractClassRows(res);
      const pagination = extractPagination(res, perPage);

      setClasses(rows);
      setTotalRecords(pagination.total);
      setTotalPages(Math.max(1, pagination.lastPage));
    } catch (err) {
      setClasses([]);
      setTotalRecords(0);
      setTotalPages(1);
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search, scheduleFilter]);

  const fetchBuildingsAndRooms = useCallback(async () => {
    try {
      const [buildingsRes, roomsRes] = await Promise.all([
        buildingService.getAll({ per_page: 1000, sort_by: 'name', sort_order: 'asc' }),
        roomService.getAll({ per_page: 1000, sort_by: 'room_number', sort_order: 'asc' }),
      ]);

      setBuildings(Array.isArray(buildingsRes?.data) ? buildingsRes.data : []);
      setRooms(Array.isArray(roomsRes?.data) ? roomsRes.data : []);
    } catch {
      setBuildings([]);
      setRooms([]);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchBuildingsAndRooms();
  }, [fetchBuildingsAndRooms]);

  const visibleClasses = useMemo(() => classes, [classes]);

  const scheduleSelectedBuilding = useMemo(
    () => buildings.find((building) => String(building.id) === String(scheduleBuildingId)) || null,
    [buildings, scheduleBuildingId],
  );

  const scheduleAvailableRooms = useMemo(() => {
    if (!scheduleBuildingId) return [];
    return rooms
      .filter((room) => String(room.building_id || room.building_record?.id || '') === String(scheduleBuildingId))
      .sort(compareRoomNumbers);
  }, [rooms, scheduleBuildingId]);

  const scheduleSelectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(scheduleRoomId)) || null,
    [rooms, scheduleRoomId],
  );

  useEffect(() => {
    if (currentPage < 1) {
      setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageStart = totalRecords === 0 ? 0 : ((currentPage - 1) * perPage) + 1;
  const pageEnd = totalRecords === 0 ? 0 : Math.min(currentPage * perPage, totalRecords);

  const summaryStats = useMemo(() => {
    const subjects = new Set();
    const teachers = new Set();

    classes.forEach((cls) => {
      const subjectKey = cls?.subject?.subject_code || cls?.subject?.subject_name || cls?.subject_id || cls?.subject?.id;
      const teacherKey = cls?.teacher?.id || cls?.teacher_id || `${cls?.teacher?.first_name || ''} ${cls?.teacher?.last_name || ''}`.trim();

      if (subjectKey) subjects.add(String(subjectKey));
      if (teacherKey) teachers.add(String(teacherKey));
    });

    return {
      totalClasses: totalRecords,
      subjectsOffered: subjects.size,
      facultyMembers: teachers.size,
    };
  }, [classes, totalRecords]);

  const refreshSchedules = useCallback(async () => {
    if (!selectedClass) return;
    const res = await apiRequest(`/classes/${selectedClass.id}/schedule`);
    setSchedules(Array.isArray(res) ? res : (res?.data || []));
  }, [selectedClass]);

  const openScheduleModal = async (cls) => {
    setSelectedClass(cls);
    setShowModal(true);
    setSchedulesLoading(true);
    setEditingScheduleId(null);
    setScheduleBuildingId('');
    setScheduleRoomId('');
    setForm({
      day_of_week: '',
      time_start: '',
      time_end: '',
    });

    try {
      const res = await apiRequest(`/classes/${cls.id}/schedule`);
      const data = Array.isArray(res) ? res : (res?.data || []);
      setSchedules(data);
      if (data.length > 0) {
        const first = data[0];
        const matchedBuilding = buildings.find((building) => building.name === (first.building || '')) || null;
        const matchedRoom = rooms.find((room) => {
          const buildingMatch = matchedBuilding ? String(room.building_id || room.building_record?.id || '') === String(matchedBuilding.id) : true;
          return buildingMatch && String(room.room_number || '') === String(first.room_number || first.room || '');
        }) || null;

        setEditingScheduleId(first.id);
        setScheduleBuildingId(matchedBuilding?.id ? String(matchedBuilding.id) : '');
        setScheduleRoomId(matchedRoom?.id ? String(matchedRoom.id) : '');
        setForm({
          day_of_week: first.day_of_week || first.day || '',
          time_start: formatTime(first.time_start || first.start_time),
          time_end: formatTime(first.time_end || first.end_time),
        });
      }
    } catch (err) {
      setSchedules([]);
      await Swal.fire({
        icon: 'error',
        title: 'Failed to load schedules',
        text: err.message || 'Unable to fetch schedules.',
      });
    } finally {
      setSchedulesLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClass(null);
    setSchedules([]);
    setEditingScheduleId(null);
    setScheduleBuildingId('');
    setScheduleRoomId('');
    setForm({
      day_of_week: '',
      time_start: '',
      time_end: '',
    });
  };

  const startEdit = (schedule) => {
    const matchedBuilding = buildings.find((building) => building.name === (schedule.building || '')) || null;
    const matchedRoom = rooms.find((room) => {
      const buildingMatch = matchedBuilding ? String(room.building_id || room.building_record?.id || '') === String(matchedBuilding.id) : true;
      return buildingMatch && String(room.room_number || '') === String(schedule.room_number || schedule.room || '');
    }) || null;

    setEditingScheduleId(schedule.id);
    setScheduleBuildingId(matchedBuilding?.id ? String(matchedBuilding.id) : '');
    setScheduleRoomId(matchedRoom?.id ? String(matchedRoom.id) : '');
    setForm({
      day_of_week: schedule.day_of_week || schedule.day || '',
      time_start: formatTime(schedule.time_start || schedule.start_time),
      time_end: formatTime(schedule.time_end || schedule.end_time),
    });
  };

  const resetForm = () => {
    setEditingScheduleId(null);
    setForm({
      day_of_week: '',
      time_start: '',
      time_end: '',
    });
  };

  const handleSave = async () => {
    if (!selectedClass) return;

    if (!editingScheduleId) {
      await Swal.fire({
        icon: 'info',
        title: 'No schedule selected',
        text: 'Use Bulk Assign Schedule to create schedules, then edit them here.',
      });
      return;
    }

    if (!form.day_of_week || !form.time_start || !form.time_end) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Please fill in day, start time, and end time.',
      });
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/schedules/${editingScheduleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          class_id: selectedClass.id,
          day_of_week: form.day_of_week,
          time_start: formatTimeForApi(form.time_start),
          time_end: formatTimeForApi(form.time_end),
          room_number: scheduleSelectedRoom?.room_number || null,
          building: scheduleSelectedBuilding?.name || null,
        }),
      });

      await refreshSchedules();
      await Swal.fire({
        icon: 'success',
        title: 'Saved',
        timer: 1200,
        showConfirmButton: false,
      });
      resetForm();
      setScheduleBuildingId('');
      setScheduleRoomId('');
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Save failed',
        text: err.message || 'Unable to save schedule.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete schedule?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiRequest(`/schedules/${scheduleId}`, { method: 'DELETE' });
      await refreshSchedules();
      if (editingScheduleId === scheduleId) resetForm();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: err.message || 'Unable to delete schedule.',
      });
    }
  };

  const toggleClassSelection = (classId) => {
    setSelectedClassIds((prev) => (
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    ));
  };

  const selectAllFilteredClasses = () => {
    setSelectedClassIds(visibleClasses.map((cls) => cls.id));
  };

  const clearSelectedClasses = () => {
    setSelectedClassIds([]);
  };

  const openBulkScheduleModal = () => {
    if (selectedClassIds.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Select classes first',
        text: 'Choose one or more classes before assigning a schedule.',
      });
      return;
    }

    setBulkScheduleForm({
      day_of_week: '',
      time_start: '',
      time_end: '',
      building_id: '',
      room_id: '',
    });
    setShowBulkScheduleModal(true);
  };

  const bulkSelectedBuilding = useMemo(
    () => buildings.find((building) => String(building.id) === String(bulkScheduleForm.building_id)) || null,
    [buildings, bulkScheduleForm.building_id],
  );

  const bulkAvailableRooms = useMemo(() => {
    if (!bulkScheduleForm.building_id) return [];
    return rooms
      .filter((room) => String(room.building_id || room.building_record?.id || '') === String(bulkScheduleForm.building_id))
      .sort(compareRoomNumbers);
  }, [rooms, bulkScheduleForm.building_id]);

  const bulkSelectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(bulkScheduleForm.room_id)) || null,
    [rooms, bulkScheduleForm.room_id],
  );

  const handleBulkScheduleSave = async () => {
    if (selectedClassIds.length === 0) return;

    if (!bulkScheduleForm.day_of_week || !bulkScheduleForm.time_start || !bulkScheduleForm.time_end) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Please choose day, start time, and end time.',
      });
      return;
    }

    if (!bulkScheduleForm.building_id || !bulkScheduleForm.room_id) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing room details',
        text: 'Please select a building first, then choose a room from that building.',
      });
      return;
    }

    setBulkAssigningSchedule(true);
    try {
      const buildingName = bulkSelectedBuilding?.name || '';
      const roomNumber = bulkSelectedRoom?.room_number || '';

      await Promise.all(selectedClassIds.map((classId) => apiRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify({
          class_id: classId,
          day_of_week: bulkScheduleForm.day_of_week,
          time_start: formatTimeForApi(bulkScheduleForm.time_start),
          time_end: formatTimeForApi(bulkScheduleForm.time_end),
          room_number: roomNumber || null,
          building: buildingName || null,
        }),
      })));

      await fetchClasses();
      setShowBulkScheduleModal(false);
      clearSelectedClasses();
      await Swal.fire({
        icon: 'success',
        title: 'Schedules assigned',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Bulk assignment failed',
        text: err.message || 'Unable to assign schedules.',
      });
    } finally {
      setBulkAssigningSchedule(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
          <div className="px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Classes</h1>
                <p className="mt-1 text-sm text-slate-600">View and manage class schedules.</p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:max-w-3xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="w-full sm:max-w-md">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Search classes, subjects, teachers"
                        className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="min-w-48">
                    <select
                      value={scheduleFilter}
                      onChange={(e) => {
                        setScheduleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="all">All classes</option>
                      <option value="with-schedule">Has schedule</option>
                      <option value="without-schedule">No schedule</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredClasses}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Select filtered
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedClasses}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    onClick={openBulkScheduleModal}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Bulk Assign Schedule
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">Total classes</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{summaryStats.totalClasses}</div>
                <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  All active
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">Subjects offered</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{summaryStats.subjectsOffered}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-1">
                <div className="text-sm text-slate-500">Faculty members</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{summaryStats.facultyMembers}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-blue-600" />
              <p className="text-slate-600">Loading classes...</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">All Classes</h2>
                  <p className="text-xs text-slate-500">Manage schedules for each class record.</p>
                </div>
                <div className="text-sm text-slate-500">
                  Showing {pageStart}-{pageEnd} of {totalRecords} records
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Class</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Section</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Subject</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Schedule</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Room</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Teacher</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleClasses.map((cls, index) => (
                      <tr key={cls.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-4 align-top">
                          <input
                            type="checkbox"
                            checked={selectedClassIds.includes(cls.id)}
                            onChange={() => toggleClassSelection(cls.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select ${cls.class_code || `Class ${cls.id}`}`}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getClassBadgeClass(((currentPage - 1) * perPage) + index)}`}>
                              {getClassBadgeLabel(cls)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{cls.class_code || `Class #${cls.id}`}</div>
                              <div className="text-xs text-slate-500">{cls.section?.section_code || 'Assigned class'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="text-xs text-slate-500">{cls.section?.section_code || ''}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-medium text-slate-900">{cls.subject?.subject_name || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{cls.subject?.subject_code || ''}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="mb-1">
                            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                              {getScheduleCount(cls)} schedule{getScheduleCount(cls) === 1 ? '' : 's'}
                            </span>
                          </div>
                          {getClassSchedules(cls).length > 0 ? (
                            <div className="space-y-1">
                              {getClassSchedules(cls).slice(0, 2).map((schedule) => (
                                <div key={schedule.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                  <div className="text-sm font-medium text-slate-900">
                                    {getScheduleLabel(schedule)}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {getScheduleLocation(schedule) || 'No room'}
                                  </div>
                                </div>
                              ))}
                              {getClassSchedules(cls).length > 2 && (
                                <div className="text-xs text-slate-500">
                                  +{getClassSchedules(cls).length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              No schedule
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-medium text-slate-900">{getClassRoomSummary(cls).primary}</div>
                          {getClassRoomSummary(cls).secondary && (
                            <div className="text-xs text-slate-500">{getClassRoomSummary(cls).secondary}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {cls.teacher ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                                {getTeacherInitials(cls.teacher)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">
                                  {`${cls.teacher.first_name || ''} ${cls.teacher.last_name || ''}`.trim() || 'N/A'}
                                </div>
                                <div className="text-xs text-slate-500">Teacher assigned</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            {cls.status || 'active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openScheduleModal(cls)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Edit Schedule
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {classes.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Rows per page</span>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500"
                    >
                      {[10, 25, 50, 100].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {visibleClasses.length === 0 && (
                <div className="space-y-3 p-10 text-center text-slate-500">
                  <div>
                    {totalRecords === 0
                      ? 'No classes found in database.'
                      : 'No classes found on this page.'}
                  </div>
                  {totalRecords > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setScheduleFilter('all');
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Manage Schedule - {selectedClass.class_code || `Class #${selectedClass.id}`}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Edit day, start time, end time, room, subject, and teacher.
                </p>
              </div>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-5 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Existing Schedules</h3>
                  <span className="text-xs text-slate-500">Select a schedule to edit</span>
                </div>

                <div className="space-y-3">
                  {schedulesLoading ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-600" />
                      <p className="text-sm text-slate-600">Loading schedules...</p>
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                      No schedules yet.
                    </div>
                  ) : (
                    schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`rounded-xl border p-4 transition-colors ${
                          String(editingScheduleId) === String(schedule.id)
                            ? 'border-blue-200 bg-blue-50 ring-1 ring-blue-100'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-slate-900">{schedule.day_of_week || schedule.day}</div>
                              {String(editingScheduleId) === String(schedule.id) && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                  Editing
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {formatTime(schedule.time_start || schedule.start_time)} - {formatTime(schedule.time_end || schedule.end_time)}
                            </div>
                            <div className="text-sm text-slate-600">Room: {schedule.room_number || schedule.room || 'N/A'}</div>
                            <div className="text-sm text-slate-600">Building: {schedule.building || 'N/A'}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(schedule)}
                              className="rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(schedule.id)}
                              className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900">Edit Schedule</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Bulk assign schedules to create new records. This panel only edits existing schedules.
                  </p>
                </div>

                {!editingScheduleId ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                    No schedule selected. Choose a schedule from the list or use Bulk Assign Schedule to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Day</label>
                      <select
                        value={form.day_of_week}
                        onChange={(e) => setForm((prev) => ({ ...prev, day_of_week: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a day</option>
                        {getDayOptions().map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Start Time</label>
                        <input
                          type="time"
                          value={form.time_start}
                          onChange={(e) => setForm((prev) => ({ ...prev, time_start: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">End Time</label>
                        <input
                          type="time"
                          value={form.time_end}
                          onChange={(e) => setForm((prev) => ({ ...prev, time_end: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Building</label>
                      <select
                        value={scheduleBuildingId}
                        onChange={(e) => {
                          setScheduleBuildingId(e.target.value);
                          setScheduleRoomId('');
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a building</option>
                        {buildings.map((building) => (
                          <option key={building.id} value={building.id}>{building.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Room</label>
                      <select
                        value={scheduleRoomId}
                        onChange={(e) => setScheduleRoomId(e.target.value)}
                        disabled={!scheduleBuildingId}
                        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                          scheduleBuildingId ? 'bg-white text-slate-900' : 'cursor-not-allowed bg-slate-100 text-slate-400'
                        }`}
                      >
                        <option value="">{scheduleBuildingId ? 'Select a room' : 'Select a building first'}</option>
                        {scheduleAvailableRooms.map((room) => (
                          <option key={room.id} value={room.id}>{room.room_number}</option>
                        ))}
                      </select>
                      {scheduleBuildingId && scheduleAvailableRooms.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">No rooms available for this building.</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkScheduleModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Bulk Assign Schedule</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Apply the same schedule to {selectedClassIds.length} selected class{selectedClassIds.length === 1 ? '' : 'es'}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Day</label>
                  <select
                    value={bulkScheduleForm.day_of_week}
                    onChange={(e) => setBulkScheduleForm((prev) => ({ ...prev, day_of_week: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a day</option>
                    {getDayOptions().map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Building</label>
                  <select
                    value={bulkScheduleForm.building_id}
                    onChange={(e) => setBulkScheduleForm((prev) => ({
                      ...prev,
                      building_id: e.target.value,
                      room_id: '',
                    }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Start Time</label>
                  <input
                    type="time"
                    value={bulkScheduleForm.time_start}
                    onChange={(e) => setBulkScheduleForm((prev) => ({ ...prev, time_start: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">End Time</label>
                  <input
                    type="time"
                    value={bulkScheduleForm.time_end}
                    onChange={(e) => setBulkScheduleForm((prev) => ({ ...prev, time_end: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Room</label>
                <select
                  value={bulkScheduleForm.room_id}
                  onChange={(e) => setBulkScheduleForm((prev) => ({ ...prev, room_id: e.target.value }))}
                  disabled={!bulkScheduleForm.building_id}
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                    bulkScheduleForm.building_id ? 'bg-white text-slate-900' : 'cursor-not-allowed bg-slate-100 text-slate-400'
                  }`}
                >
                  <option value="">
                    {bulkScheduleForm.building_id ? 'Select a room' : 'Select a building first'}
                  </option>
                  {bulkAvailableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number}
                    </option>
                  ))}
                </select>
                {bulkScheduleForm.building_id && bulkAvailableRooms.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No rooms available for this building.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkScheduleModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkScheduleSave}
                  disabled={bulkAssigningSchedule}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkAssigningSchedule && <Loader2 className="h-4 w-4 animate-spin" />}
                  Assign to Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Class;