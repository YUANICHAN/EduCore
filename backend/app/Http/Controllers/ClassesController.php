<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ClassesController extends Controller
{
    /**
     * Display a paginated listing of classes
     */
    public function index(Request $request)
    {
        $query = Classes::with(['subject.program', 'teacher', 'section', 'academicYear', 'schedules']);
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('class_code', 'like', "%{$search}%")
                  ->orWhereHas('subject', function ($sq) use ($search) {
                      $sq->where('subject_name', 'like', "%{$search}%")
                         ->orWhere('subject_code', 'like', "%{$search}%");
                  });
            });
        }
        
        // Filter by subject
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        
        // Filter by teacher
        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        } elseif ($request->user() && $request->user()->role === 'teacher' && $request->user()->teacher_id) {
            // Default teachers to only their own classes when teacher_id filter is not provided.
            $query->where('teacher_id', $request->user()->teacher_id);
        }
        
        // Filter by section
        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }
        
        // Filter by academic year
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Optionally return only classes that already have an assigned teacher
        if ($request->boolean('assigned_only')) {
            $query->whereNotNull('teacher_id');
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'class_code');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Include counts
        $query->withCount('enrollments');
        $query->withCount([
            'enrollments as enrolled_students_count' => function ($q) {
                $q->where('status', 'enrolled');
            }
        ]);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $classes = $query->paginate($perPage);
        
        return response()->json($classes);
    }

    /**
     * Store a newly created class
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_code' => 'nullable|string|max:50|unique:classes,class_code',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'section_id' => 'required|exists:sections,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'schedule' => 'nullable|array',
            'capacity' => 'nullable|integer|min:1|max:100',
            'status' => 'required|in:active,completed,cancelled',
        ]);

        // Auto-generate class code if not provided
        if (empty($validated['class_code'])) {
            $validated['class_code'] = $this->generateClassCode($validated);
        }

        // Check for duplicate class (same subject, section, academic year)
        $exists = Classes::where('subject_id', $validated['subject_id'])
            ->where('section_id', $validated['section_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->exists();
        
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'A class for this subject already exists in this section for this academic year'
            ], 422);
        }

        $validated['enrolled_count'] = 0;
        $validated['capacity'] = $validated['capacity'] ?? 30;

        $class = Classes::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Class created successfully',
            'data' => $class->load(['subject', 'teacher', 'section', 'academicYear'])
        ], 201);
    }

    /**
     * Display the specified class
     */
    public function show(Classes $class)
    {
        return response()->json([
            'success' => true,
            'data' => $class
                ->load(['subject', 'teacher', 'section', 'academicYear', 'enrollments.student', 'schedules'])
                ->loadCount([
                    'enrollments',
                    'enrollments as enrolled_students_count' => function ($q) {
                        $q->where('status', 'enrolled');
                    }
                ])
        ]);
    }

    /**
     * Update the specified class
     */
    public function update(Request $request, Classes $class)
    {
        $validated = $request->validate([
            'class_code' => 'string|max:50|unique:classes,class_code,' . $class->id,
            'subject_id' => 'exists:subjects,id',
            'teacher_id' => 'exists:teachers,id',
            'section_id' => 'exists:sections,id',
            'academic_year_id' => 'exists:academic_years,id',
            'schedule' => 'nullable|array',
            'capacity' => 'nullable|integer|min:1|max:100',
            'status' => 'in:active,completed,cancelled',
        ]);

        $class->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Class updated successfully',
            'data' => $class->load(['subject', 'teacher', 'section', 'academicYear'])
        ]);
    }

    /**
     * Remove the specified class
     */
    public function destroy(Classes $class)
    {
        // Check for enrollments
        if ($class->enrollments()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete class with existing enrollments. Consider setting status to cancelled instead.'
            ], 422);
        }
        
        $class->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Class deleted successfully'
        ]);
    }

    /**
     * Get students enrolled in a class
     */
    public function students(Classes $class, Request $request)
    {
        $query = $class->enrollments()->with('student');
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%");
            });
        }
        
        $perPage = $request->get('per_page', 30);
        $students = $query->paginate($perPage);
        
        return response()->json($students);
    }

    /**
     * Export enrolled students in a class to an Excel-compatible file.
     */
    public function exportStudentsExcel(Classes $class)
    {
        $rows = $class->enrollments()
            ->with('student')
            ->where('status', 'enrolled')
            ->orderBy('created_at', 'asc')
            ->get();

        $escape = static function ($value): string {
            return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
        };

        $subjectCode = $class->subject?->subject_code ?? $class->class_code ?? 'CLASS';
        $sectionCode = $class->section?->section_code ?? 'SECTION';
        $timestamp = now()->format('Ymd_His');
        $filename = sprintf('%s_%s_students_%s.xls', $subjectCode, $sectionCode, $timestamp);

        $tableRows = '';
        foreach ($rows as $index => $enrollment) {
            $student = $enrollment->student;
            $fullName = trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')) ?: ($student?->name ?? 'N/A');

            $tableRows .= '<tr>'
                . '<td>' . $escape($index + 1) . '</td>'
                . '<td>' . $escape($student?->student_number ?? $student?->id ?? 'N/A') . '</td>'
                . '<td>' . $escape($fullName) . '</td>'
                . '<td>' . $escape($student?->email ?? 'N/A') . '</td>'
                . '<td>' . $escape($student?->phone ?? 'N/A') . '</td>'
                . '<td>' . $escape(ucfirst((string) ($enrollment->status ?? 'enrolled'))) . '</td>'
                . '</tr>';
        }

        if ($tableRows === '') {
            $tableRows = '<tr><td colspan="6">No enrolled students found.</td></tr>';
        }

        $content = '<html><head><meta charset="UTF-8"></head><body>'
            . '<h3>Class Student List</h3>'
            . '<p><strong>Class:</strong> ' . $escape($class->class_code ?? 'N/A') . '</p>'
            . '<p><strong>Subject:</strong> ' . $escape($class->subject?->subject_name ?? 'N/A') . '</p>'
            . '<p><strong>Section:</strong> ' . $escape($sectionCode) . '</p>'
            . '<table border="1" cellspacing="0" cellpadding="6">'
            . '<thead><tr>'
            . '<th>#</th><th>Student Number</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th>'
            . '</tr></thead>'
            . '<tbody>' . $tableRows . '</tbody>'
            . '</table>'
            . '</body></html>';

        return response($content, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'max-age=0, no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Get schedule for a class
     */
    public function schedule(Classes $class)
    {
        $schedules = $class->schedules()
            ->orderBy('day_of_week')
            ->orderBy('time_start')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    /**
     * Get attendance records for a class
     */
    public function attendance(Classes $class, Request $request)
    {
        $query = $class->attendance()->with('student');
        
        // Filter by date
        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        
        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', $request->to_date);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $query->orderBy('date', 'desc');
        
        $perPage = $request->get('per_page', 50);
        $attendance = $query->paginate($perPage);
        
        return response()->json($attendance);
    }

    /**
     * Get grades for a class
     */
    public function grades(Classes $class, Request $request)
    {
        $query = $class->grades()->with(['student', 'recorder']);
        
        // Filter by grading period
        if ($request->has('grading_period')) {
            $query->where('grading_period', $request->grading_period);
        }
        
        // Filter by component type
        if ($request->has('component_type')) {
            $query->where('component_type', $request->component_type);
        }
        
        $query->orderBy('student_id')->orderBy('date_recorded', 'desc');
        
        $perPage = $request->get('per_page', 50);
        $grades = $query->paginate($perPage);
        
        return response()->json($grades);
    }

    /**
     * Generate a unique class code
     */
    private function generateClassCode($data)
    {
        $subject = \App\Models\Subject::find($data['subject_id']);
        $section = \App\Models\Section::find($data['section_id']);
        
        $prefix = $subject ? substr($subject->subject_code, 0, 6) : 'CLS';
        $suffix = $section ? substr($section->section_code, 0, 4) : '';
        
        $baseCode = strtoupper($prefix . '-' . $suffix);
        $counter = 1;
        
        while (Classes::where('class_code', $baseCode . '-' . str_pad($counter, 2, '0', STR_PAD_LEFT))->exists()) {
            $counter++;
        }
        
        return $baseCode . '-' . str_pad($counter, 2, '0', STR_PAD_LEFT);
    }

    /**
     * Check for teacher schedule conflicts
     */
    public function checkTeacherConflicts(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'time_start' => 'required|date_format:H:i:s',
            'time_end' => 'required|date_format:H:i:s|after:time_start',
            'academic_year_id' => 'required|exists:academic_years,id',
            'exclude_class_id' => 'nullable|exists:classes,id',
        ]);

        $conflicts = $this->findTeacherConflicts(
            $validated['teacher_id'],
            $validated['day_of_week'],
            $validated['time_start'],
            $validated['time_end'],
            $validated['academic_year_id'],
            $validated['exclude_class_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'has_conflicts' => $conflicts->isNotEmpty(),
            'conflicts' => $conflicts
        ]);
    }

    /**
     * Check for section schedule conflicts
     */
    public function checkSectionConflicts(Request $request)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'time_start' => 'required|date_format:H:i:s',
            'time_end' => 'required|date_format:H:i:s|after:time_start',
            'academic_year_id' => 'required|exists:academic_years,id',
            'exclude_class_id' => 'nullable|exists:classes,id',
        ]);

        $conflicts = $this->findSectionConflicts(
            $validated['section_id'],
            $validated['day_of_week'],
            $validated['time_start'],
            $validated['time_end'],
            $validated['academic_year_id'],
            $validated['exclude_class_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'has_conflicts' => $conflicts->isNotEmpty(),
            'conflicts' => $conflicts
        ]);
    }

    /**
     * Check for room conflicts
     */
    public function checkRoomConflicts(Request $request)
    {
        $validated = $request->validate([
            'room_number' => 'required|string',
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'time_start' => 'required|date_format:H:i:s',
            'time_end' => 'required|date_format:H:i:s|after:time_start',
            'exclude_schedule_id' => 'nullable|exists:schedules,id',
        ]);

        $conflicts = Schedule::where('room_number', $validated['room_number'])
            ->where('day_of_week', $validated['day_of_week'])
            ->where(function ($query) use ($validated) {
                $query->where(function ($q) use ($validated) {
                    $q->where('time_start', '<', $validated['time_end'])
                      ->where('time_end', '>', $validated['time_start']);
                });
            })
            ->when($validated['exclude_schedule_id'] ?? null, function ($query, $excludeId) {
                return $query->where('id', '!=', $excludeId);
            })
            ->with(['class.subject', 'class.teacher', 'class.section'])
            ->get();

        return response()->json([
            'success' => true,
            'has_conflicts' => $conflicts->isNotEmpty(),
            'conflicts' => $conflicts
        ]);
    }

    /**
     * Find teacher schedule conflicts
     */
    private function findTeacherConflicts($teacherId, $dayOfWeek, $timeStart, $timeEnd, $academicYearId, $excludeClassId = null)
    {
        // Get all active classes for this teacher in the academic year
        $classIds = Classes::where('teacher_id', $teacherId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active')
            ->when($excludeClassId, function ($query, $excludeId) {
                return $query->where('id', '!=', $excludeId);
            })
            ->pluck('id');

        // Find conflicting schedules
        return Schedule::whereIn('class_id', $classIds)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($timeStart, $timeEnd) {
                $query->where(function ($q) use ($timeStart, $timeEnd) {
                    $q->where('time_start', '<', $timeEnd)
                      ->where('time_end', '>', $timeStart);
                });
            })
            ->with(['class.subject', 'class.section'])
            ->get();
    }

    /**
     * Find section schedule conflicts
     */
    private function findSectionConflicts($sectionId, $dayOfWeek, $timeStart, $timeEnd, $academicYearId, $excludeClassId = null)
    {
        // Get all active classes for this section in the academic year
        $classIds = Classes::where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active')
            ->when($excludeClassId, function ($query, $excludeId) {
                return $query->where('id', '!=', $excludeId);
            })
            ->pluck('id');

        // Find conflicting schedules
        return Schedule::whereIn('class_id', $classIds)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($timeStart, $timeEnd) {
                $query->where(function ($q) use ($timeStart, $timeEnd) {
                    $q->where('time_start', '<', $timeEnd)
                      ->where('time_end', '>', $timeStart);
                });
            })
            ->with(['class.subject', 'class.teacher'])
            ->get();
    }

    /**
     * Get teacher's available time slots for a day
     */
    public function teacherAvailability(Request $request, $teacherId)
    {
        $validated = $request->validate([
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        // Get all scheduled times for this teacher
        $classIds = Classes::where('teacher_id', $teacherId)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('status', 'active')
            ->pluck('id');

        $schedules = Schedule::whereIn('class_id', $classIds)
            ->where('day_of_week', $validated['day_of_week'])
            ->orderBy('time_start')
            ->get(['time_start', 'time_end', 'class_id'])
            ->map(function ($s) {
                return [
                    'start' => $s->time_start,
                    'end' => $s->time_end,
                    'class_id' => $s->class_id,
                ];
            });

        // Calculate available slots (assuming 7 AM to 9 PM school hours)
        $schoolStart = '07:00:00';
        $schoolEnd = '21:00:00';
        $availableSlots = [];
        $currentStart = $schoolStart;

        foreach ($schedules as $schedule) {
            if ($currentStart < $schedule['start']) {
                $availableSlots[] = [
                    'start' => $currentStart,
                    'end' => $schedule['start'],
                ];
            }
            $currentStart = max($currentStart, $schedule['end']);
        }

        if ($currentStart < $schoolEnd) {
            $availableSlots[] = [
                'start' => $currentStart,
                'end' => $schoolEnd,
            ];
        }

        return response()->json([
            'success' => true,
            'day_of_week' => $validated['day_of_week'],
            'scheduled' => $schedules,
            'available_slots' => $availableSlots,
        ]);
    }
}
