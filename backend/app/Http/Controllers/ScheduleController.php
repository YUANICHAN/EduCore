<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Classes;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * Display a paginated listing of schedules
     */
    public function index(Request $request)
    {
        $query = Schedule::with(['class.subject', 'class.teacher', 'class.section']);
        
        // Filter by day
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }
        
        // Filter by class
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        
        // Filter by building
        if ($request->has('building')) {
            $query->where('building', $request->building);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'day_of_week');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder)->orderBy('time_start', 'asc');
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $schedules = $query->paginate($perPage);
        
        return response()->json($schedules);
    }

    /**
     * Store a newly created schedule
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'time_start' => 'required|date_format:H:i:s',
            'time_end' => 'required|date_format:H:i:s|after:time_start',
            'room_number' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:100',
        ]);

        // Check for schedule conflicts
        $conflict = $this->checkScheduleConflict($validated);
        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule conflict detected',
                'conflict' => $conflict
            ], 422);
        }

        $schedule = Schedule::create([
            'class_id' => $validated['class_id'],
            'day_of_week' => $validated['day_of_week'],
            'time_start' => $validated['time_start'],
            'time_end' => $validated['time_end'],
            'room_number' => $validated['room_number'] ?? null,
            'building' => $validated['building'] ?? null,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Schedule created successfully',
            'data' => $schedule->load(['class.subject', 'class.teacher', 'class.section'])
        ], 201);
    }

    /**
     * Display the specified schedule
     */
    public function show(Schedule $schedule)
    {
        return response()->json([
            'success' => true,
            'data' => $schedule->load(['class.subject', 'class.teacher', 'class.section'])
        ]);
    }

    /**
     * Update the specified schedule
     */
    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'class_id' => 'exists:classes,id',
            'day_of_week' => 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'time_start' => 'date_format:H:i:s',
            'time_end' => 'date_format:H:i:s|after:time_start',
            'room_number' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:100',
        ]);

        // Check for schedule conflicts (excluding current schedule)
        $checkData = array_merge($schedule->toArray(), $validated);
        $conflict = $this->checkScheduleConflict($checkData, $schedule->id);
        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule conflict detected',
                'conflict' => $conflict
            ], 422);
        }

        $schedule->update([
            'class_id' => $validated['class_id'] ?? $schedule->class_id,
            'day_of_week' => $validated['day_of_week'] ?? $schedule->day_of_week,
            'time_start' => $validated['time_start'] ?? $schedule->time_start,
            'time_end' => $validated['time_end'] ?? $schedule->time_end,
            'room_number' => array_key_exists('room_number', $validated) ? $validated['room_number'] : $schedule->room_number,
            'building' => array_key_exists('building', $validated) ? $validated['building'] : $schedule->building,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Schedule updated successfully',
            'data' => $schedule->load(['class.subject', 'class.teacher', 'class.section'])
        ]);
    }

    /**
     * Remove the specified schedule
     */
    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Schedule deleted successfully'
        ]);
    }

    /**
     * Get schedules for a specific section
     */
    public function bySection($sectionId, Request $request)
    {
        $query = Schedule::whereHas('class', function ($q) use ($sectionId) {
            $q->where('section_id', $sectionId)->where('status', 'active');
        })->with(['class.subject', 'class.teacher']);
        
        // Filter by day
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }
        
        $query->orderBy('day_of_week')->orderBy('time_start');
        
        $perPage = $request->get('per_page', 50);
        $schedules = $query->paginate($perPage);
        
        return response()->json($schedules);
    }

    /**
     * Get schedules for a specific teacher
     */
    public function byTeacher($teacherId, Request $request)
    {
        $query = Schedule::whereHas('class', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId)->where('status', 'active');
        })->with(['class.subject', 'class.section']);
        
        // Filter by day
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }
        
        $query->orderBy('day_of_week')->orderBy('time_start');
        
        $perPage = $request->get('per_page', 50);
        $schedules = $query->paginate($perPage);
        
        return response()->json($schedules);
    }

    /**
     * Check for schedule conflicts
     */
    private function checkScheduleConflict(array $data, $excludeId = null)
    {
        $classId = $data['class_id'] ?? null;
        if (!$classId) {
            return null;
        }

        $class = Classes::find($classId);
        if (!$class) return null;

        // Check room conflict
        if (!empty($data['room_number'])) {
            $roomConflict = Schedule::where('day_of_week', $data['day_of_week'])
                ->where('room_number', $data['room_number'])
                ->where(function ($q) use ($data) {
                    $q->whereBetween('time_start', [$data['time_start'], $data['time_end']])
                      ->orWhereBetween('time_end', [$data['time_start'], $data['time_end']])
                      ->orWhere(function ($q2) use ($data) {
                          $q2->where('time_start', '<=', $data['time_start'])
                             ->where('time_end', '>=', $data['time_end']);
                      });
                })
                ->when($excludeId, function ($q) use ($excludeId) {
                    $q->where('id', '!=', $excludeId);
                })
                ->with('class.subject')
                ->first();

            if ($roomConflict) {
                return [
                    'type' => 'room',
                    'message' => 'Room is already booked at this time',
                    'conflicting_schedule' => $roomConflict
                ];
            }
        }

        // Check teacher conflict
        $teacherConflict = Schedule::where('day_of_week', $data['day_of_week'])
            ->whereHas('class', function ($q) use ($class) {
                $q->where('teacher_id', $class->teacher_id);
            })
            ->where(function ($q) use ($data) {
                $q->whereBetween('time_start', [$data['time_start'], $data['time_end']])
                  ->orWhereBetween('time_end', [$data['time_start'], $data['time_end']])
                  ->orWhere(function ($q2) use ($data) {
                      $q2->where('time_start', '<=', $data['time_start'])
                         ->where('time_end', '>=', $data['time_end']);
                  });
            })
            ->when($excludeId, function ($q) use ($excludeId) {
                $q->where('id', '!=', $excludeId);
            })
            ->with('class.subject')
            ->first();

        if ($teacherConflict) {
            return [
                'type' => 'teacher',
                'message' => 'Teacher has another class at this time',
                'conflicting_schedule' => $teacherConflict
            ];
        }

        // Check section conflict
        $sectionConflict = Schedule::where('day_of_week', $data['day_of_week'])
            ->whereHas('class', function ($q) use ($class) {
                $q->where('section_id', $class->section_id);
            })
            ->where(function ($q) use ($data) {
                $q->whereBetween('time_start', [$data['time_start'], $data['time_end']])
                  ->orWhereBetween('time_end', [$data['time_start'], $data['time_end']])
                  ->orWhere(function ($q2) use ($data) {
                      $q2->where('time_start', '<=', $data['time_start'])
                         ->where('time_end', '>=', $data['time_end']);
                  });
            })
            ->when($excludeId, function ($q) use ($excludeId) {
                $q->where('id', '!=', $excludeId);
            })
            ->with('class.subject')
            ->first();

        if ($sectionConflict) {
            return [
                'type' => 'section',
                'message' => 'Section has another class at this time',
                'conflicting_schedule' => $sectionConflict
            ];
        }

        return null;
    }
}
